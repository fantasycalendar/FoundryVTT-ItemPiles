import { get, writable } from "svelte/store";
import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
import { PileItem } from "./pile-item.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";
import TradeMerchantItemDialog from "../applications/dialogs/trade-merchant-item-dialog/trade-merchant-item-dialog.js";
import { isResponsibleGM } from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import ItemPileStore from "./item-pile-store.js";
import CustomColumn from "../applications/merchant-app/CustomColumn.svelte";
import ItemEntry from "../applications/merchant-app/ItemEntry.svelte";
import QuantityColumn from "../applications/merchant-app/QuantityColumn.svelte";
import PriceSelector from "../applications/components/PriceSelector.svelte";
import EntryButtons from "../applications/merchant-app/EntryButtons.svelte";
import SETTINGS from "../constants/settings.js";

export default class MerchantStore extends ItemPileStore {

  constructor(...args) {
    super(...args);
    this.services = writable({});
    this.editPrices = writable(false);
    this.typeFilter = writable("all");
    this.sortType = writable(0);
    this.priceModifiersPerType = writable({});
    this.priceModifiersForActor = writable({});
    this.priceSelector = writable("");
    this.closed = writable(false);
    this.itemColumns = writable([]);
    this.sortTypes = writable([]);
    this.inverseSort = writable(false);
    this.isMerchant = false;
  }

  setupStores() {
    super.setupStores();
    this.services.set({});
    this.editPrices.set(false);
    this.typeFilter.set("all");
    this.sortType.set(0);
    this.priceModifiersPerType.set({});
    this.priceModifiersForActor.set({});
    this.priceSelector.set("");
    this.closed.set(false);
    this.itemColumns.set([]);
    this.sortTypes.set([]);
    this.inverseSort.set(false);
    this.isMerchant = false;
  }

  get ItemClass() {
    return PileMerchantItem;
  }

  getActorImage() {
    const pileData = get(this.pileData);
    return pileData?.merchantImage || this.actor.img;
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.subscribeTo(this.pileData, (pileData) => {
      this.updatePriceModifiers();
      this.updateOpenCloseStatus();
      this.isMerchant = PileUtilities.isItemPileMerchant(this.actor, pileData);

      const customColumns = foundry.utils.deepClone(pileData.merchantColumns)
        .map(column => ({
          label: localize(column.label),
          component: CustomColumn,
          data: column,
          sortMethod: (a, b, inverse) => {
            const path = column.path;
            const AProp = getProperty(b.item, path);
            const BProp = getProperty(a.item, path);
            if (!column?.mapping?.[AProp] || !column?.mapping?.[BProp]) {
              return (AProp > BProp ? 1 : -1) * (inverse ? -1 : 1);
            }
            const keys = Object.keys(column.mapping);
            return (keys.indexOf(AProp) - keys.indexOf(BProp)) * (inverse ? -1 : 1);
          }
        }));

      const columns = [
        {
          label: "Type",
          component: ItemEntry
        },
        {
          label: "Quantity",
          component: QuantityColumn,
          sortMethod: (a, b, inverse) => {
            return (get(b.quantity) - get(a.quantity)) * (inverse ? -1 : 1);
          }
        },
        ...customColumns,
        {
          label: "Price",
          component: PriceSelector,
          sortMethod: (a, b, inverse) => {
            const APrice = get(a.prices).find(price => price.primary);
            const BPrice = get(b.prices).find(price => price.primary);
            if (!APrice) return 1;
            if (!BPrice) return -1;
            return (BPrice.totalCost - APrice.totalCost) * (inverse ? -1 : 1);
          }
        },
        {
          label: false,
          component: EntryButtons
        }
      ];

      this.itemColumns.set(columns);

      const sortTypes = columns.filter(col => col.label);

      sortTypes.splice(1, 0, { label: "Name" });

      this.sortTypes.set(sortTypes)

    });
    if (this.recipientDocument) {
      this.subscribeTo(this.recipientPileData, () => {
        this.updatePriceModifiers();
      });
      this.subscribeTo(this.recipientDocument, () => {
        this.refreshItemPrices();
      })
    }

    this.subscribeTo(this.typeFilter, (val) => {
      this.refreshItems()
    });
    this.subscribeTo(this.sortType, (val) => {
      this.refreshItems();
    })
    this.subscribeTo(this.inverseSort, (val) => {
      this.refreshItems();
    })
  }

  refreshItemPrices() {
    get(this.allItems).forEach(item => {
      item.refreshPriceData();
    });
  }

  visibleItemFilterFunction(entry, actorIsMerchant, pileData, recipientPileData) {
    const itemFlagData = get(entry.itemFlagData) ?? {};
    const itemIsFree = get(entry.prices)?.free ?? false;
    return !entry.isCurrency
      && (game.user.isGM || !actorIsMerchant || !itemFlagData?.hidden)
      && (
        actorIsMerchant
          ? !(pileData?.hideItemsWithZeroCost && itemIsFree)
          : !(recipientPileData?.hideItemsWithZeroCost && itemIsFree)
      );
  }

  itemSortFunction(a, b) {
    const sortType = get(this.sortType);
    const inverse = get(this.inverseSort);
    if (sortType <= 1) {
      return super.itemSortFunction(a, b, inverse);
    }
    const selectedSortType = get(this.sortTypes)[sortType];
    return selectedSortType?.sortMethod(a, b, inverse, selectedSortType);
  }

  createItem(item) {
    if (PileUtilities.isItemInvalid(this.actor, item)) return;
    const items = get(this.allItems);
    const itemClass = new this.ItemClass(this, item);
    itemClass.refreshPriceData();
    items.push(itemClass);
    this.allItems.set(items);
    this.refreshItems();
  }

  deleteItem(item) {
    if (PileUtilities.isItemInvalid(this.actor, item)) return;
    const items = get(this.allItems);
    const pileItem = items.find(pileItem => pileItem.id === item.id);
    if (!pileItem) return;
    pileItem.unsubscribe();
    items.splice(items.indexOf(pileItem), 1);
    this.allItems.set(items);
    this.refreshItems();
  }

  updatePriceModifiers() {
    let pileData = get(this.pileData);
    if (pileData.itemTypePriceModifiers) {
      this.priceModifiersPerType.set((pileData.itemTypePriceModifiers ?? {}).reduce((acc, priceData) => {
        acc[priceData.category.toLowerCase() || priceData.type] = priceData;
        return acc;
      }, {}));
    }
    if (this.recipient && pileData.actorPriceModifiers) {
      const actorSpecificModifiers = pileData.actorPriceModifiers?.find(data => data.actorUuid === this.recipientUuid);
      if (actorSpecificModifiers) {
        this.priceModifiersForActor.set(actorSpecificModifiers);
      }
    }
  }

  addOverrideTypePrice(type) {
    const pileData = get(this.pileData);
    const custom = Object.keys(CONFIG.Item.typeLabels).indexOf(type) === -1;
    pileData.itemTypePriceModifiers.push({
      category: custom ? type : "",
      type: custom ? "custom" : type,
      override: false,
      buyPriceModifier: 1,
      sellPriceModifier: 1
    })
    this.pileData.set(pileData);
  }

  removeOverrideTypePrice(type) {
    const pileData = get(this.pileData);
    const priceMods = pileData.itemTypePriceModifiers;
    const typeEntry = priceMods.find(entry => entry.type === type);
    priceMods.splice(priceMods.indexOf(typeEntry), 1);
    this.pileData.set(pileData);
  }

  async update() {
    const pileData = get(this.pileData);
    const priceModPerType = get(this.priceModifiersPerType);
    pileData.itemTypePriceModifiers = Object.values(priceModPerType);
    await PileUtilities.updateItemPileData(this.actor, pileData);
    Helpers.custom_notify(localize("ITEM-PILES.Notifications.UpdateMerchantSuccess"));
  }

  tradeItem(pileItem, selling) {
    if (get(pileItem.itemFlagData).notForSale && !game.user.isGM) return;
    TradeMerchantItemDialog.show(
      pileItem,
      this.actor,
      this.recipient,
      { selling }
    );
  }

  async updateOpenCloseStatus() {
    const pileData = get(this.pileData);
    if (pileData.openTimes.status === "auto") {
      if (game.modules.get('foundryvtt-simple-calendar')?.active && pileData.openTimes.enabled) {
        let isClosed = false;
        const openTimes = pileData.openTimes.open;
        const closeTimes = pileData.openTimes.close;
        const timestamp = window.SimpleCalendar.api.timestampToDate(window.SimpleCalendar.api.timestamp());

        const openingTime = Number(openTimes.hour.toString() + "." + openTimes.minute.toString());
        const closingTime = Number(closeTimes.hour.toString() + "." + closeTimes.minute.toString());
        const currentTime = Number(timestamp.hour.toString() + "." + timestamp.minute.toString());

        isClosed = openingTime > closingTime
          ? !(currentTime >= openingTime || currentTime <= closingTime)  // Is the store open over midnight?
          : !(currentTime >= openingTime && currentTime <= closingTime); // or is the store open during normal daylight hours?

        const currentWeekday = window.SimpleCalendar.api.getCurrentWeekday();

        isClosed = isClosed || (pileData.closedDays ?? []).includes(currentWeekday.name);

        const currentDate = window.SimpleCalendar.api.currentDateTime();
        const notes = window.SimpleCalendar.api.getNotesForDay(currentDate.year, currentDate.month, currentDate.day);
        const categories = new Set(notes.map(note => getProperty(note, "flags.foundryvtt-simple-calendar.noteData.categories") ?? []).deepFlatten());

        isClosed = isClosed || categories.intersection(new Set(pileData.closedHolidays ?? [])).size > 0;

        this.closed.set(isClosed);

      } else if (isResponsibleGM()) {
        pileData.openTimes.status = "open";
        await PileUtilities.updateItemPileData(this.actor, pileData);
      }

    } else if (!pileData.openTimes.status.startsWith("auto")) {

      this.closed.set(pileData.openTimes.status === "closed");

    }
  }

  async setOpenStatus(status) {
    const pileData = get(this.pileData);
    pileData.openTimes.status = status;
    await PileUtilities.updateItemPileData(this.actor, pileData);
  }

}

class PileMerchantItem extends PileItem {

  setupStores(item) {
    super.setupStores(item);
    this.prices = writable([]);
    this.displayQuantity = writable(false);
    this.selectedPriceGroup = writable(-1);
    this.quantityToBuy = writable(1);
    this.quantityForPrice = writable(1);
    this.infiniteQuantity = writable(false);
    this.isService = false;
  }

  setupSubscriptions() {
    let setup = false;
    super.setupSubscriptions();
    this.subscribeTo(this.store.pileData, () => {
      if (!setup) return;
      this.refreshPriceData();
      this.refreshDisplayQuantity();
    });
    if (this.store.recipient) {
      this.subscribeTo(this.store.recipientPileData, () => {
        if (!setup) return
        this.refreshPriceData();
        this.refreshDisplayQuantity();
      });
    }
    this.subscribeTo(this.store.priceModifiersPerType, () => {
      if (!setup) return;
      this.refreshPriceData();
    });
    this.subscribeTo(this.quantityToBuy, () => {
      if (!setup) return;
      this.refreshPriceData();
    });
    this.subscribeTo(this.itemDocument, () => {
      if (!setup) return;
      this.refreshPriceData();
      this.store.refreshItems();
    });
    this.subscribeTo(this.store.typeFilter, this.filter.bind(this));
    this.subscribeTo(this.itemFlagData, () => {
      if (!setup) return;
      this.refreshPriceData();
      this.refreshDisplayQuantity();
    });
    this.refreshDisplayQuantity();
    setup = true;
  }

  refreshDisplayQuantity() {

    const pileData = get(this.store.pileData);
    const itemFlagData = get(this.itemFlagData);
    const isMerchant = PileUtilities.isItemPileMerchant(this.store.actor, pileData)

    const merchantDisplayQuantity = pileData.displayQuantity;
    const itemFlagDataQuantity = itemFlagData.displayQuantity;

    const itemInfiniteQuantity = {
      "default": pileData.infiniteQuantity,
      "yes": true,
      "no": false
    }[isMerchant ? (itemFlagData.infiniteQuantity ?? "default") : "no"];

    this.infiniteQuantity.set(itemInfiniteQuantity)

    if (itemFlagDataQuantity === "always") {
      return this.displayQuantity.set(true);
    }

    const itemDisplayQuantity = {
      "default": merchantDisplayQuantity === "yes",
      "yes": true,
      "no": false
    }[itemFlagDataQuantity ?? "default"];

    if (merchantDisplayQuantity.startsWith("always")) {
      return this.displayQuantity.set(merchantDisplayQuantity.endsWith("yes"));
    }

    this.displayQuantity.set(itemDisplayQuantity);

  }

  refreshPriceData() {

    const quantityToBuy = get(this.quantityToBuy);
    const itemFlagData = get(this.itemFlagData);
    const sellerFlagData = get(this.store.pileData);
    const buyerFlagData = get(this.store.recipientPileData);
    const priceData = PileUtilities.getPriceData({
      item: this.item,
      seller: this.store.actor,
      buyer: this.store.recipient,
      sellerFlagData,
      buyerFlagData,
      itemFlagData,
      quantity: quantityToBuy
    });

    let selectedPriceGroup = get(this.selectedPriceGroup);
    if (selectedPriceGroup === -1) {
      selectedPriceGroup = Math.max(0, priceData.findIndex(price => price.maxQuantity));
      this.selectedPriceGroup.set(selectedPriceGroup)
    }

    this.prices.set(priceData);

    this.quantityForPrice.set(
      game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE
        ? getProperty(this.item, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE) ?? 1
        : 1
    );

  }

  filter() {
    const name = get(this.name).trim();
    const type = get(this.category).type;
    const search = get(this.store.search).trim();
    const typeFilter = get(this.store.typeFilter);
    const searchFiltered = !name.toLowerCase().includes(search.toLowerCase());
    const typeFiltered = typeFilter !== "all" && typeFilter.toLowerCase() !== type.toLowerCase();
    this.filtered.set(searchFiltered || typeFiltered);
  }

  async updateItemFlagData() {
    const itemFlagData = get(this.itemFlagData);
    await PileUtilities.updateItemData(this.item, { flags: itemFlagData });
  }

  updateQuantity(quantity) {
    const pileFlagData = get(this.store.pileData);
    const itemFlagData = get(this.itemFlagData);
    const roll = new Roll(quantity).evaluate({ async: false });
    this.quantity.set(roll.total);
    const baseData = {};
    if (itemFlagData.isService || pileFlagData.keepZeroQuantity || itemFlagData.keepZeroQuantity) {
      baseData[CONSTANTS.FLAGS.ITEM + ".notForSale"] = roll.total <= 0;
    }
    return this.item.update(Utilities.setItemQuantity(baseData, roll.total));
  }

}
