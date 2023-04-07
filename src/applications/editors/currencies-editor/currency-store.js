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
    this.currencies.update(currencies => {
      currencies.forEach((entry, entryIndex) => {
        entry.primary = entryIndex === index;
      });
      return currencies;
    });
  }

  sortCurrencies() {
    this.currencies.update(currencies => {
      currencies.sort((a, b) => {
        return b.exchangeRate - a.exchangeRate;
      });
      return currencies;
    });
  }

  addAttribute() {
    this.currencies.update(currencies => {
      currencies.push({
        type: "attribute",
        name: "New Attribute",
        img: "",
        abbreviation: "{#}N",
        data: {
          path: ""
        },
        primary: !currencies.length,
        exchangeRate: 1
      });
      return currencies;
    });
  }

  async addItem(data) {

    let uuid = false;
    if (data.pack) {
      uuid = "Compendium" + data.pack + "." + data.id;
    }

    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    this.currencies.update(currencies => {
      const itemCurrencies = currencies.map(entry => entry.data?.item ?? {});
      const foundItem = Utilities.findSimilarItem(itemCurrencies, itemData);
      if (foundItem) {
        const index = itemCurrencies.indexOf(foundItem);
        currencies[index].data = {
          uuid,
          item: itemData
        }
        Helpers.custom_notify(`Updated item data for ${localize(currencies[index].name)} (item name ${itemData.name})`)
      } else {
        currencies.push({
          id: randomID(),
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
        });
      }
      return currencies;
    });
  }

  async editItem(index) {
    const currencies = get(this.currencies);
    const data = currencies[index].data;
    let item;
    if (data.uuid) {
      item = await fromUuid(data.uuid);
    } else {
      let itemData = data.item;
      if (itemData._id) delete itemData._id;
      if (itemData.ownership) delete itemData.ownership;
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

  removeEntry(index) {
    this.currencies.update(currencies => {
      currencies.splice(index, 1);
      return currencies;
    })
  }

  export() {
    return get(this.currencies);
  }

}
