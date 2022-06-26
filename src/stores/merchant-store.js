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
      console.log(get(item.itemFlagData))
      return true;
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
      priceModifier: pileData.priceModifier,
      sellModifier: pileData.sellModifier
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
    Helpers.custom_notify("Item Pile successfully updated.");
  }

}

class PileMerchantItem extends PileItem {

  setupStores(item) {
    super.setupStores(item);
    this.itemFlagData = writable({});
    this.prices = writable([]);
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.subscribeTo(this.store.pileData,() => {
      this.refreshPriceData();
    });
    this.subscribeTo(this.store.priceModifiersPerType,() => {
      this.refreshPriceData();
    });
    this.subscribeTo(this.itemDocument,() => {
      const { data } = this.itemDocument.updateOptions;
      if(hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
        this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
        this.refreshPriceData();
      }
    });
    this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
  }

  refreshPriceData(){
    let priceData = [];
    const pileData = get(this.store.pileData);
    const itemFlagData = get(this.itemFlagData);

    let { priceModifier, sellModifier, itemTypePriceModifiers, actorPriceModifiers } = pileData;

    const itemTypePriceModifier = itemTypePriceModifiers.find(priceData => priceData.type === this.type);
    if (itemTypePriceModifier) {
      priceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.priceModifier : priceModifier * itemTypePriceModifier.priceModifier;
      sellModifier = itemTypePriceModifier.override ? itemTypePriceModifier.sellModifier : sellModifier * itemTypePriceModifier.sellModifier;
    }

    if (this.store.recipient) {
      const actorSpecificModifiers = actorPriceModifiers?.find(data => data.actorUuid === this.store.recipientUuid);
      if (actorSpecificModifiers) {
        priceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.priceModifier : priceModifier * actorSpecificModifiers.priceModifier;
        sellModifier = actorSpecificModifiers.override ? actorSpecificModifiers.sellModifier : sellModifier * actorSpecificModifiers.sellModifier;
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
            price.cost = Math.floor(price.cost * priceModifier);
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
        cost: Math.floor(cost * priceModifier)
      }];
    }

    this.prices.set(priceData);
  }

}