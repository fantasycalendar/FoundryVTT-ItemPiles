import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
import { PileItem } from "./pile-item.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";

export default class MerchantStore extends ItemPileStore {

  setupStores(){
    super.setupStores();
    this.editPrices = writable(false);
    this.itemsPerCategory = writable({});
    this.categories = writable([]);
    this.priceModifiersPerType = writable({});
    this.priceModifiersForActor = writable({});
  }

  get ItemClass(){
    return PileMerchantItem;
  }

  setupSubscriptions(){
    super.setupSubscriptions();
    this.pileData.subscribe((val) => {
      this.updatePriceModifiers();
    });
    this.updatePriceModifiers();
  }

  refreshItems() {
    super.refreshItems();
    const items = get(this.items).filter(item => {
      return game.user.isGM || !get(item.itemFlagData).hidden;
    });
    const itemsPerCategory = items.reduce((acc, item) => {
      if(!acc[item.type]){
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

  updatePriceModifiers(){
    const pileData = get(this.pileData);
    this.priceModifiersPerType.set(pileData.itemTypePriceModifiers.reduce((acc, priceData) => {
      acc[priceData.type] = priceData;
      return acc;
    }, {}));
    if(this.recipient) {
      const actorSpecificModifiers = pileData.actorPriceModifiers?.find(data => data.actorUuid === this.recipientUuid);
      if (actorSpecificModifiers) {
        this.priceModifiersForActor.set(actorSpecificModifiers);
      }
    }
  }

  addOverrideTypePrice(type){
    const pileData = get(this.pileData);
    pileData.itemTypePriceModifiers.push({
      type: type,
      override: false,
      buyPriceModifier: 1,
      sellPriceModifier: 1
    })
    this.pileData.set(pileData);
  }

  removeOverrideTypePrice(type){
    const pileData = get(this.pileData);
    const priceMods = pileData.itemTypePriceModifiers;
    const typeEntry = priceMods.find(entry => entry.type === type);
    priceMods.splice(priceMods.indexOf(typeEntry), 1);
    this.pileData.set(pileData);
  }

  async update(){
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
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
    this.subscribeTo(this.store.pileData,() => {
      this.refreshPriceData();
      this.refreshDisplayQuantity();
    });
    this.subscribeTo(this.store.priceModifiersPerType,() => {
      this.refreshPriceData();
    });
    this.subscribeTo(this.itemDocument,() => {
      const { data } = this.itemDocument.updateOptions;
      if(hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
        this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
        this.refreshDisplayQuantity();
      }
      if(hasProperty(data, CONSTANTS.FLAGS.ITEM+".prices")) {
        this.refreshPriceData();
      }
    });
  }

  refreshDisplayQuantity(){

    const merchantDisplayQuantity = get(this.store.pileData).displayQuantity;

    const itemFlagDataQuantity = get(this.itemFlagData).displayQuantity;

    if(itemFlagDataQuantity === "always"){
      return this.displayQuantity.set(true);
    }

    const itemDisplayQuantity = {
      "default": merchantDisplayQuantity === "yes",
      "yes": true,
      "no": false
    }[itemFlagDataQuantity ?? "default"];

    if(merchantDisplayQuantity.startsWith("always")){
      return this.displayQuantity.set(merchantDisplayQuantity.endsWith("yes"));
    }

    this.displayQuantity.set(itemDisplayQuantity)
  }

  refreshPriceData(){

    let priceData = [];
    const pileData = get(this.store.pileData);
    const itemFlagData = get(this.itemFlagData);

    let { buyPriceModifier, sellPriceModifier, itemTypePriceModifiers, actorPriceModifiers } = pileData;

    const itemTypePriceModifier = itemTypePriceModifiers.find(priceData => priceData.type === this.type);
    if (itemTypePriceModifier) {
      buyPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.buyPriceModifier : buyPriceModifier * itemTypePriceModifier.buyPriceModifier;
      sellPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.sellPriceModifier : sellPriceModifier * itemTypePriceModifier.sellPriceModifier;
    }

    if (this.store.recipient) {
      const actorSpecificModifiers = actorPriceModifiers?.find(data => data.actorUuid === this.store.recipientUuid);
      if (actorSpecificModifiers) {
        buyPriceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.buyPriceModifier : buyPriceModifier * actorSpecificModifiers.buyPriceModifier;
        sellPriceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.sellPriceModifier : sellPriceModifier * actorSpecificModifiers.sellPriceModifier;
      }
    }

    let currencyList = PileUtilities.getActorCurrencyData(this.store.source);
    const primaryCurrency = currencyList.attributes.find(attribute => attribute.primary)
      ?? currencyList.items.find(item => item.primary);

    if (itemFlagData.enabled) {
      if (itemFlagData.prices.length) {
        priceData = itemFlagData.prices.map(price => {
          price.originalCost = price.cost;
          if (!price.static) {
            price.cost = Math.round(price.cost * buyPriceModifier);
          }
          return price;
        });
      } else if (itemFlagData.free) {
        priceData = [];
      }
    }else{
      const cost = getProperty(this.item.toObject(), game.itempiles.ITEM_PRICE_ATTRIBUTE);
      priceData = [{
        ...primaryCurrency,
        originalCost: cost,
        cost: Math.round(cost * buyPriceModifier)
      }];
    }

    this.prices.set(priceData);
  }

  async updateItemFlagData(){
    const itemFlagData = get(this.itemFlagData);
    await PileUtilities.updateItemData(this.item, itemFlagData);
  }

}