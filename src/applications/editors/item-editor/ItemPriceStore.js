import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
import { writable, get } from "svelte/store";
import CONSTANTS from "../../../constants/constants.js";
import * as PileUtilities from "../../../helpers/pile-utilities.js";

const existingStores = new Map();

export default class ItemPriceStore {
  
  static make(item) {
    if (existingStores.has(item.id)) {
      return existingStores.get(item.id);
    }
    return new this(item);
  }
  
  constructor(item) {
    
    this.item = item;
    this.itemDoc = new TJSDocument(this.item);
    
    this.price = writable(0);
    
    const data = PileUtilities.getItemFlagData(this.item);
    
    data.prices.forEach(group => {
      group.forEach(price => {
        if (!price.id) {
          price.id = randomID();
        }
      });
    });
    
    this.data = writable(data);
    
    this.itemDoc.subscribe((item, changes) => {
      const { data } = changes;
      if (hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
        const newData = getProperty(data, CONSTANTS.FLAGS.ITEM);
        const oldData = get(this.data);
        this.data.set(foundry.utils.mergeObject(oldData, newData));
      }
      this.price.set(getProperty(this.item.toObject(), game.itempiles.API.ITEM_PRICE_ATTRIBUTE));
    });
    
  }
  
  removeGroup(groupIndex) {
    const data = get(this.data);
    data.prices.splice(groupIndex, 1);
    this.data.set(data);
  }
  
  export() {
    return {
      data: {
        [game.itempiles.API.ITEM_PRICE_ATTRIBUTE]: get(this.price),
      },
      flags: get(this.data)
    };
  }
  
}