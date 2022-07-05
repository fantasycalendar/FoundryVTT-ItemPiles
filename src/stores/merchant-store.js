import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
import { PileItem } from "./pile-item.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";
import { canActorAffordItem, getItemCosts } from "../helpers/pile-utilities.js";
import * as Utilities from "../helpers/utilities.js";

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
  
  get ItemClass() {
    return PileMerchantItem;
  }
  
  setupSubscriptions() {
    super.setupSubscriptions();
    this.pileData.subscribe(() => {
      this.updatePriceModifiers();
    });
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
  
  deleteItem(item) {
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
  
}

class PileMerchantItem extends PileItem {
  
  setupStores(item) {
    super.setupStores(item);
    this.itemFlagData = writable({});
    this.prices = writable([]);
    this.displayQuantity = writable(false);
    this.selectedPriceGroup = writable(-1);
  }
  
  setupSubscriptions() {
    super.setupSubscriptions();
    this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
    this.subscribeTo(this.store.pileData, () => {
      this.refreshPriceData();
      this.refreshDisplayQuantity();
    });
    this.subscribeTo(this.store.priceModifiersPerType, () => {
      this.refreshPriceData();
    });
    this.subscribeTo(this.itemDocument, () => {
      const { data } = this.itemDocument.updateOptions;
      if (hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
        this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
        this.refreshDisplayQuantity();
      }
      if (hasProperty(data, CONSTANTS.FLAGS.ITEM + ".prices")) {
        this.refreshPriceData();
      }
    });
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
    
    let selectedPriceGroup = get(this.selectedPriceGroup);
    const pileData = get(this.store.pileData);
    const itemFlagData = get(this.itemFlagData);
    
    if (itemFlagData.free) {
      this.prices.set([]);
      return;
    }
    
    let { buyPriceModifier, itemTypePriceModifiers, actorPriceModifiers } = pileData;
    
    const itemTypePriceModifier = itemTypePriceModifiers.find(priceData => priceData.type === this.type);
    if (itemTypePriceModifier) {
      buyPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.buyPriceModifier : buyPriceModifier * itemTypePriceModifier.buyPriceModifier;
    }
    
    if (this.store.recipient && actorPriceModifiers) {
      const actorSpecificModifiers = actorPriceModifiers?.find(data => data.actorUuid === this.store.recipientUuid);
      if (actorSpecificModifiers) {
        buyPriceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.buyPriceModifier : buyPriceModifier * actorSpecificModifiers.buyPriceModifier;
      }
    }
    
    const currencyList = PileUtilities.getActorCurrencyList(this.store.source);
    const currencies = PileUtilities.getActorCurrencies(this.store.source, { currencyList, getAll: true });
    const priceData = PileUtilities.getItemCosts(this.item, itemFlagData, buyPriceModifier, currencies);
    
    if (this.store.recipient) {
      
      const recipientCurrencies = PileUtilities.getActorCurrencies(this.store.recipient, { currencyList });
      const totalCurrencies = recipientCurrencies.map(currency => currency.quantity * currency.exchangeRate).reduce((acc, num) => acc + num, 0);
      
      for (const priceGroup of priceData) {
        if (priceGroup.totalCost !== undefined && totalCurrencies >= priceGroup.totalCost) {
          priceGroup.canAfford = true;
        } else {
          priceGroup.canAfford = priceGroup.prices.filter(price => {
            if (price.type === "attribute") {
              const attributeQuantity = Number(getProperty(this.store.recipient.data, price.data.path));
              if (!attributeQuantity || attributeQuantity < price.cost) {
                return false;
              }
            } else {
              const foundItem = Utilities.findSimilarItem(this.store.recipient.items, price.data.item);
              if (!foundItem || Utilities.getItemQuantity(foundItem) < price.cost) {
                return false;
              }
            }
            return true;
          }).length === priceGroup.prices.length;
        }
      }
    }
    
    const affordIndex = Math.max(0, priceData.findIndex(priceGroup => priceGroup.canAfford));
    selectedPriceGroup = selectedPriceGroup !== -1 ? selectedPriceGroup : affordIndex;
    this.selectedPriceGroup.set(selectedPriceGroup > priceData.length ? affordIndex : selectedPriceGroup);
    this.prices.set(priceData);
    
  }
  
  filter() {
    const search = get(this.store.search);
    this.filtered.set(!this.name.toLowerCase().includes(search.toLowerCase()));
  }
  
  async updateItemFlagData() {
    const itemFlagData = get(this.itemFlagData);
    await PileUtilities.updateItemData(this.item, itemFlagData);
  }
  
}