import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import CONSTANTS from "../constants/constants.js";
import { PileItem } from "./pile-item.js";

export class VaultStore extends ItemPileStore {

  get ItemClass() {
    return VaultItem;
  }

  setupStores() {
    super.setupStores();
    this.grid = writable([]);
    this.gridItems = writable([]);
    this.freeSpaces = Infinity;
    this.refreshGridDebounce = foundry.utils.debounce(() => {
      this.refreshGrid();
    }, 150);
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.refreshGrid();
    this.subscribeTo(this.pileData, () => {
      this.refreshFreeSpaces();
    });
    this.subscribeTo(this.items, () => {
      this.refreshFreeSpaces();
    });
  }

  refreshFreeSpaces() {
    const pileData = get(this.pileData);
    const items = get(this.items);
    const cols = Math.min(pileData.cols, pileData.enabledCols);
    const rows = Math.min(pileData.rows, pileData.enabledRows);
    this.freeSpaces = (cols * rows) - items.length;
  }

  updateGrid(items) {
    const updates = items.map(item => {
      const transform = get(item.transform);
      return {
        _id: item.id,
        [CONSTANTS.FLAGS.ITEM + ".x"]: transform.x,
        [CONSTANTS.FLAGS.ITEM + ".y"]: transform.y
      }
    });
    return this.actor.updateEmbeddedDocuments("Item", updates);
  }

  refreshItems() {
    super.refreshItems();
    this.gridItems.set(get(this.items).filter(item => {
      const itemFlagData = get(item.itemFlagData);
      return !itemFlagData.vaultBag;
    }));
    this.refreshGridDebounce();
  }

  createItem(...args) {
    super.createItem(...args);
    this.refreshGrid();
  }

  deleteItem(...args) {
    super.deleteItem(...args);
    this.refreshGrid();
  }

  refreshGrid() {
    this.grid.set(this.placeItemsOnGrid());
  }

  placeItemsOnGrid() {
    const pileData = get(this.pileData);
    const columns = Math.min(pileData.cols, pileData.enabledCols);
    const rows = Math.min(pileData.rows, pileData.enabledRows);
    const allItems = [...get(this.gridItems)];
    const existingItems = [];

    const grid = Array.from(Array(columns).keys()).map((_, x) => {
      return Array.from(Array(rows).keys()).map((_, y) => {
        const item = allItems.find(item => {
          return item.x === x && item.y === y
        });
        if (item) {
          allItems.splice(allItems.indexOf(item), 1);
          existingItems.push({
            id: item.id, transform: item.transform, item
          })
        }
        return item?.id ?? null;
      });
    });

    return allItems
      .map(item => {
        for (let x = 0; x < columns; x++) {
          for (let y = 0; y < rows; y++) {
            if (!grid[x][y]) {
              grid[x][y] = item.id;
              item.transform.update(trans => {
                trans.x = x;
                trans.y = y;
                return trans;
              })
              return {
                id: item.id, transform: item.transform, item
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
    this.transform = writable({
      x: 0, y: 0, w: 1, h: 1
    });
    this.x = 0;
    this.y = 0;
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.subscribeTo(this.itemFlagData, (data) => {
      this.transform.set({
        x: data.x, y: data.y, w: data.width ?? 1, h: data.height ?? 1
      });
    });
    this.subscribeTo(this.transform, (transform) => {
      this.x = transform.x;
      this.y = transform.y;
    })
  }

}
