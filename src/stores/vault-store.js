import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";
import { isResponsibleGM } from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import { PileItem } from "./pile-item.js";

export class VaultStore extends ItemPileStore {

  get ItemClass() {
    return VaultItem;
  }

  setupStores() {
    super.setupStores();
    this.grid = writable([]);
    this.refreshGridDebounce = foundry.utils.debounce(() => {
      this.refreshGrid();
    }, 250);
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.refreshGrid();
  }

  updateGrid(items){
    const updates = items.map(item => ({
      _id: item.id,
      [CONSTANTS.FLAGS.ITEM + ".x"]: item.x,
      [CONSTANTS.FLAGS.ITEM + ".y"]: item.y
    }));
    this.actor.updateEmbeddedDocuments("Item", updates);
  }

  refreshItems(){
    super.refreshItems();
    this.refreshGridDebounce();
  }

  createItem(...args){
    super.createItem(...args);
    this.refreshGrid();
  }

  deleteItem(...args){
    super.deleteItem(...args);
    this.refreshGrid();
  }

  refreshGrid(){
    this.grid.set(this.placeItemsOnGrid());
  }

  placeItemsOnGrid(){
    const pileData = get(this.pileData);
    const columns = Math.min(pileData.columns, pileData.enabledColumns);
    const rows = Math.min(pileData.rows, pileData.enabledRows);
    const allItems = [...get(this.allItems)];
    const existingItems = [];

    const grid = Array.from(Array(columns).keys()).map((_, x) => {
      return Array.from(Array(rows).keys()).map((_, y) => {
        const item = allItems.find(item => {
          return item.x === x && item.y === y
        });
        if(item){
          allItems.splice(allItems.indexOf(item), 1);
          existingItems.push({
            id: item.id, x, y, w: 1, h: 1, resizable: false, item
          })
        }
        return item?.id ?? null;
      });
    });

    return allItems
      .map(item => {
        for(let x = 0; x < columns; x++){
          for(let y = 0; y < rows; y++){
            if(!grid[x][y]){
              grid[x][y] = item.id;
              return {
                id: item.id, x, y, w: 1, h: 1, resizable: false, item
              };
            }
          }
        }
      })
      .filter(Boolean)
      .concat(existingItems);

  }

}

export class VaultItem extends PileItem {

  setupStores(item) {
    super.setupStores(item);
    this.x = get(this.itemFlagData).x;
    this.y = get(this.itemFlagData).y;
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    let setup = false;
    this.subscribeTo(this.itemFlagData, (data) => {
      if(!setup) return;
      this.x = data.x;
      this.y = data.y;
    });
    setup = true;
  }
  
}