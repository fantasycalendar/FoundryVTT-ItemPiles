import { writable, get } from 'svelte/store';
import * as Utilities from "../../../helpers/utilities.js";
import CONSTANTS from "../../../constants/constants.js";
import * as Helpers from "../../../helpers/helpers.js";
import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

export default class CurrencyStore {
  
  constructor(data) {
    this.currencies = writable(data.map((entry, index) => {
      return {
        ...entry,
        index,
        id: entry.data?.path ?? entry.data?._id ?? randomID()
      }
    }));
  }

  setPrimary(index) {
    const currencies = get(this.currencies);
    currencies.forEach((entry, entryIndex) => {
      entry.primary = entryIndex === index;
    });
    this.currencies.set(currencies);
  }

  sortCurrencies(){
    const currencies = get(this.currencies);
    currencies.sort((a, b) => {
      return b.exchangeRate - a.exchangeRate;
    });
    this.currencies.set(currencies);
  }

  addAttribute(){
    const currencies = get(this.currencies);
    this.currencies.set([...currencies, {
      type: "attribute",
      name: "New Attribute",
      img: "",
      abbreviation: "{#}N",
      data: {
        path: ""
      },
      primary: !currencies.length,
      exchangeRate: 1
    }]);
    this.sortCurrencies();
  }

  async addItem(data){

    let uuid = false;
    if(data.pack){
      uuid = "Compendium" + data.pack + "." + data.id;
    }

    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    let currencies = get(this.currencies);

    const itemCurrencies = currencies.map(entry => entry.data?.item ?? {});
    const foundItem = Utilities.findSimilarItem(itemCurrencies, itemData);

    if(foundItem) {
      const index = itemCurrencies.indexOf(foundItem);
      currencies[index].data = {
        uuid,
        item: itemData
      }
      Helpers.custom_notify(`Updated item data for ${localize(currencies[index].name)} (item name ${itemData.name})`)
    }else {
      currencies = [...currencies, {
        type: "item",
        name: itemData.name,
        img: itemData.img,
        abbreviation: "{#} " + itemData.name,
        data: {
          uuid,
          item: itemData
        },
        primary: !currencies.length,
        exchangeRate: 1
      }];
    }

    this.currencies.set(currencies);
    this.sortCurrencies();
  }

  async editItem(index){
    const currencies = get(this.currencies);
    const data = currencies[index].data;
    let item;
    if(data.uuid){
      item = await fromUuid(data.uuid);
    } else {
      let itemData = data.itemData;
      if (itemData._id) delete itemData._id;
      if (itemData.permission) delete itemData._id;
      const items = Array.from(game.items);
      item = Utilities.findSimilarItem(items, itemData);
      if (!item) {
        setProperty(itemData, CONSTANTS.FLAGS.TEMPORARY_ITEM, true);
        item = await Item.implementation.create(itemData);
        Helpers.custom_notify(`An item has been created for ${item.name} - drag and drop it into the list to update the stored item data`)
      }
    }
    item.sheet.render(true);
  }

  removeEntry(index){
    const currencies = get(this.currencies);
    currencies.splice(index, 1);
    this.currencies.set(currencies);
  }
  
  export() {
    return get(this.currencies);
  }
  
}