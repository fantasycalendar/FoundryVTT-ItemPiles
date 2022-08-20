import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
import { PileItem } from "./pile-item.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";
import TradeMerchantItemDialog from "../applications/dialogs/trade-merchant-item-dialog/trade-merchant-item-dialog.js";

export default class MerchantStore extends ItemPileStore {
  
  setupStores() {
    super.setupStores();
    this.editPrices = writable(false);
    this.itemsPerCategory = writable({});
    this.categories = writable([]);
    this.itemCategories = writable([]);
    this.typeFilter = writable("all")
    this.priceModifiersPerType = writable({});
    this.priceModifiersForActor = writable({});
    this.priceSelector = writable("");
  }
  
  get ItemClass() {
    return PileMerchantItem;
  }
  
  setupSubscriptions() {
    super.setupSubscriptions();
    this.subscribeTo(this.pileData, () => {
      this.updatePriceModifiers();
    });
    if (this.recipientDocument) {
      this.subscribeTo(this.recipientPileData, () => {
        this.updatePriceModifiers();
      });
      this.subscribeTo(this.recipientDocument, () => {
        this.refreshItemPrices();
      })
    }
    this.subscribeTo(this.typeFilter, () => {
      this.refreshItems();
    })
  }
  
  refreshItems() {
    super.refreshItems();
    const items = get(this.items).filter(item => {
      return game.user.isGM || !get(item.itemFlagData).hidden;
    });
    this.itemCategories.set(Array.from(new Set(get(this.allItems).filter(entry => !entry.isCurrency).map(item => item.type))).map(type => ({
      label: localize(CONFIG.Item.typeLabels[type]), type
    })));
    const itemsPerCategory = items.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {});
    this.itemsPerCategory.set(itemsPerCategory);
    let categories = Object.keys(itemsPerCategory);
    categories.sort()
    this.categories.set(categories.map(type => {
      return {
        label: localize(CONFIG.Item.typeLabels[type]), type
      }
    }));
  }
  
  refreshItemPrices() {
    get(this.allItems).forEach(item => {
      item.refreshPriceData();
    });
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
    this.priceModifiersPerType.set(pileData.itemTypePriceModifiers.reduce((acc, priceData) => {
      acc[priceData.type] = priceData;
      return acc;
    }, {}));
    if (this.recipient && pileData.actorPriceModifiers) {
      const actorSpecificModifiers = pileData.actorPriceModifiers?.find(data => data.actorUuid === this.recipientUuid);
      if (actorSpecificModifiers) {
        this.priceModifiersForActor.set(actorSpecificModifiers);
      }
    }
  }
  
  addOverrideTypePrice(type) {
    const pileData = get(this.pileData);
    pileData.itemTypePriceModifiers.push({
      type: type,
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
  
}

class PileMerchantItem extends PileItem {
  
  setupStores(item) {
    super.setupStores(item);
    this.itemFlagData = writable({});
    this.prices = writable({});
    this.displayQuantity = writable(false);
    this.selectedPriceGroup = writable(-1);
    this.quantityToBuy = writable(1);
  }
  
  setupSubscriptions() {
    let setup = false;
    super.setupSubscriptions();
    this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
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
      const { data } = this.itemDocument.updateOptions;
      if (hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
        this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
        this.refreshDisplayQuantity();
      }
      if (hasProperty(data, CONSTANTS.FLAGS.ITEM + ".prices")) {
        this.refreshPriceData();
      }
      if (hasProperty(data, game.itempiles.ITEM_PRICE_ATTRIBUTE)) {
        this.refreshPriceData();
      }
    });
    setup = true;
    this.refreshDisplayQuantity();
    this.subscribeTo(this.store.typeFilter, this.filter.bind(this));
  }
  
  refreshDisplayQuantity() {
    
    const merchantDisplayQuantity = get(this.store.pileData).displayQuantity;
    
    const itemFlagDataQuantity = get(this.itemFlagData).displayQuantity;
    
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
    
    this.displayQuantity.set(itemDisplayQuantity)
  }
  
  refreshPriceData() {
    
    const quantityToBuy = get(this.quantityToBuy);
    const itemFlagData = get(this.itemFlagData);
    const sellerFlagData = get(this.store.pileData);
    const buyerFlagData = get(this.store.recipientPileData);
    const priceData = PileUtilities.getItemPrices(this.item, {
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
    
  }
  
  filter() {
    const name = get(this.name);
    const search = get(this.store.search);
    const searchFiltered = !name.toLowerCase().includes(search.toLowerCase());
    const typeFilter = get(this.store.typeFilter);
    const typeFiltered = typeFilter !== "all" && typeFilter.toLowerCase() !== this.type.toLowerCase();
    this.filtered.set(searchFiltered || typeFiltered);
  }
  
  async updateItemFlagData() {
    const itemFlagData = get(this.itemFlagData);
    await PileUtilities.updateItemData(this.item, { flags: itemFlagData });
  }
  
}