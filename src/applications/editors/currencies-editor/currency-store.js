import { writable, get } from 'svelte/store';
import * as Utilities from "../../../helpers/utilities.js";
import CONSTANTS from "../../../constants/constants.js";

export default class CurrencyStore {
  
  constructor(data) {
    this.currencies = writable(data.map((entry, index) => {
      return {
        ...entry,
        index,
        id: entry.data?.path ?? entry.data?._id ?? randomID()
      }
    }));
    console.log(get(this.currencies))
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

  async editItem(index){
    const currencies = get(this.currencies);
    const itemData = currencies[index].data;
    if(itemData._id) delete itemData._id;
    if(itemData.permission) delete itemData._id;
    const items = Array.from(game.items);
    let item = Utilities.findSimilarItem(items, itemData);
    if(!item) {
      setProperty(itemData, CONSTANTS.FLAGS.TEMPORARY_ITEM, true);
      item = await Item.implementation.create(itemData);
    }
    item.sheet.render(true);
  }
  
  export() {
    return get(this.currencies);
  }
  
}