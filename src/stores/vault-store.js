import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import CONSTANTS from "../constants/constants.js";
import { PileItem } from "./pile-item.js";
import * as Utilities from "../helpers/utilities.js";
import PrivateAPI from "../API/private-api.js";
import ItemPileSocket from "../socket.js";

export class VaultStore extends ItemPileStore {

  get ItemClass() {
    return VaultItem;
  }

  setupStores() {
    super.setupStores();
    this.gridData = writable({});
    this.gridItems = writable([]);
    this.validGridItems = writable([]);
    this.refreshGridDebounce = foundry.utils.debounce(() => {
      this.refreshGrid();
    }, 150);
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.refreshGrid();
    this.subscribeTo(this.pileData, () => {
      this.refreshGridDebounce();
    });
  }

  refreshFreeSpaces() {
    const pileData = get(this.pileData);
    const items = get(this.validGridItems);

    this.gridData.update(() => {

      let enabledCols = pileData.cols;
      let enabledRows = pileData.rows;

      if (pileData.vaultExpansion) {
        const bags = get(this.items).filter(item => {
          const itemFlagData = get(item.itemFlagData);
          return itemFlagData.vaultExpander;
        });

        const expansions = bags.reduce((acc, item) => {
          acc.cols += get(item.itemFlagData).addsCols * get(item.quantity);
          acc.rows += get(item.itemFlagData).addsRows * get(item.quantity);
          return acc;
        }, {
          cols: pileData.baseExpansionCols ?? 0,
          rows: pileData.baseExpansionRows ?? 0
        });

        enabledCols = expansions.cols;
        enabledRows = expansions.rows;
      }

      enabledCols = Math.min(enabledCols, pileData.cols);
      enabledRows = Math.min(enabledRows, pileData.rows);

      const vaultAccess = pileData.vaultAccess.filter(access => {
        const doc = fromUuidSync(access.uuid);
        return doc?.isOwner;
      });

      const access = vaultAccess.reduce((acc, access) => {
        acc.canOrganize = acc.canOrganize || access.organize;
        acc.canWithdrawItems = acc.canWithdrawItems || access.items.withdraw;
        acc.canDepositItems = acc.canDepositItems || access.items.deposit;
        acc.canWithdrawCurrencies = acc.canWithdrawCurrencies || access.currencies.withdraw;
        acc.canDepositCurrencies = acc.canDepositCurrencies || access.currencies.deposit;
        return acc;
      }, {
        canOrganize: this.actor.isOwner,
        canWithdrawItems: this.actor.isOwner,
        canDepositItems: this.actor.isOwner,
        canWithdrawCurrencies: this.actor.isOwner,
        canDepositCurrencies: this.actor.isOwner
      })

      return {
        freeSpaces: Math.max(0, (enabledCols * enabledRows) - items.length),
        enabledCols: enabledCols,
        enabledRows: enabledRows,
        cols: pileData.cols,
        rows: pileData.rows,
        gridSize: pileData.gridSize,
        ...access,
        gap: 4
      }
    })
  }

  updateGrid(items) {

    const itemsToUpdate = items.map(item => {
      const transform = get(item.transform);
      return {
        _id: item.id,
        [CONSTANTS.FLAGS.ITEM + ".x"]: transform.x,
        [CONSTANTS.FLAGS.ITEM + ".y"]: transform.y
      }
    });

    if (!itemsToUpdate.length) return;

    const actorUuid = Utilities.getUuid(this.actor);
    if (this.actor.isOwner) {
      return PrivateAPI._commitActorChanges(actorUuid, {
        itemsToUpdate,
      })
    }

    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMMIT_ACTOR_CHANGES, actorUuid, {
      itemsToUpdate,
    });
  }

  refreshItems() {
    super.refreshItems();
    this.validGridItems.set(get(this.items).filter(item => {
      const itemFlagData = get(item.itemFlagData);
      return !itemFlagData.vaultExpander;
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
    this.refreshFreeSpaces();
    this.gridItems.set(this.placeItemsOnGrid());
  }

  placeItemsOnGrid() {
    const gridData = get(this.gridData);
    const allItems = [...get(this.validGridItems)];
    const existingItems = [];

    const grid = Array.from(Array(gridData.enabledCols).keys()).map((_, x) => {
      return Array.from(Array(gridData.enabledRows).keys()).map((_, y) => {
        const item = allItems.find(item => {
          return item.x === x && item.y === y
        });
        if (item) {
          allItems.splice(allItems.indexOf(item), 1);
          existingItems.push({
            id: item.id, transform: item.transform, item
          });
        }
        return item?.id ?? null;
      });
    });

    const itemsToUpdate = allItems
      .map(item => {
        for (let x = 0; x < gridData.enabledCols; x++) {
          for (let y = 0; y < gridData.enabledRows; y++) {
            if (!grid[x][y]) {
              grid[x][y] = item.id;
              item.transform.update(trans => {
                trans.x = x;
                trans.y = y;
                return trans;
              });
              return {
                id: item.id, transform: item.transform, item
              };
            }
          }
        }
      })
      .filter(Boolean)

    this.updateGrid(itemsToUpdate)

    return itemsToUpdate.concat(existingItems);

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
    });
    this.subscribeTo(this.quantity, () => {
      const itemFlagData = get(this.itemFlagData);
      if (!itemFlagData.vaultExpander) return;
      this.store.refreshFreeSpaces();
      this.store.refreshGridDebounce();
    })
  }

}
