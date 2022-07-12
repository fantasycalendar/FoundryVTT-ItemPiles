import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
import { PileItem } from "./pile-item.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";
import BuyItemDialog from "../applications/dialogs/buy-item-dialog/buy-item-dialog.js";

export default class MerchantStore extends ItemPileStore {
  
  setupStores() {
    super.setupStores();
    this.editPrices = writable(false);
    this.itemsPerCategory = writable({});
    this.categories = writable([]);
    this.priceModifiersPerType = writable({});
    this.priceModifiersForActor = writable({});
    this.priceSelector = writable("");
  }
  
  static notifyChanges(event, actor, ...args) {
    const store = this.getStore(actor);
    if (store) {
      if (actor === store.recipient) {
        store['refreshItemPrices']();
      } else {
        store[event](...args);
      }
    }
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
      this.subscribeTo(this.recipientDocument, () => {
        this.refreshItemPrices();
      });
    }
  }
  
  refreshItems() {
    super.refreshItems();
    const items = get(this.items).filter(item => {
      return game.user.isGM || !get(item.itemFlagData).hidden;
    });
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
    if (PileUtilities.isItemInvalid(this.source, item)) return;
    const items = get(this.allItems);
    const itemClass = new this.ItemClass(this, item);
    itemClass.refreshPriceData();
    items.push(itemClass);
    this.allItems.set(items);
    this.refreshItems();
  }
  
  deleteItem(item) {
    if (PileUtilities.isItemInvalid(this.source, item)) return;
    const items = get(this.allItems);
    const pileItem = items.find(pileItem => pileItem.id === item.id);
    pileItem.unsubscribe();
    items.splice(items.indexOf(pileItem), 1);
    this.allItems.set(items);
    this.refreshItems();
  }
  
  updatePriceModifiers() {
    const pileData = get(this.pileData);
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
    await PileUtilities.updateItemPileData(this.source, pileData);
    Helpers.custom_notify(localize("ITEM-PILES.Notifications.UpdateMerchantSuccess"));
  }
  
  buyItem(pileItem) {
    BuyItemDialog.show(pileItem, this.source, this.recipient);
    //PrivateAPI._buyItem(pileItem.item, this.source, this.recipient, { paymentOptions: priceGroup });
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
    });
    setup = true;
    this.refreshDisplayQuantity();
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
    const pileFlagData = get(this.store.pileData);
    const priceData = PileUtilities.getItemPrices(this.item, {
      owner: this.store.source,
      buyer: this.store.recipient,
      pileFlagData,
      itemFlagData,
      quantity: quantityToBuy
    });
    
    let selectedPriceGroup = get(this.selectedPriceGroup);
    if (selectedPriceGroup === -1) {
      selectedPriceGroup = Math.max(0, priceData.findIndex(price => price.maxPurchase));
      this.selectedPriceGroup.set(selectedPriceGroup)
    }
    
    this.prices.set(priceData);
    
  }
  
  filter() {
    const search = get(this.store.search);
    this.filtered.set(!this.name.toLowerCase().includes(search.toLowerCase()));
  }
  
  async updateItemFlagData() {
    const itemFlagData = get(this.itemFlagData);
    await PileUtilities.updateItemData(this.item, { flags: itemFlagData });
  }
  
}