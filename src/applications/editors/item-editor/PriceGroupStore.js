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

    this.data = writable(PileUtilities.getItemFlagData(this.item));

    this.itemDoc.subscribe((item, changes) => {
      const { data } = changes;
      if (hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
        const newData = getProperty(data, CONSTANTS.FLAGS.ITEM);
        const oldData = get(this.data);
        this.data.set(foundry.utils.mergeObject(oldData, newData));
      }
    });

  }

  export() {
    return get(this.data);
  }

}