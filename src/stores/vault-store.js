import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import CONSTANTS from "../constants/constants.js";
import { PileItem } from "./pile-item.js";
import * as Utilities from "../helpers/utilities.js";
import PrivateAPI from "../API/private-api.js";
import ItemPileSocket from "../socket.js";
import DropItemDialog from "../applications/dialogs/drop-item-dialog/drop-item-dialog.js";
import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import CustomDialog from "../applications/components/CustomDialog.svelte";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as helpers from "../helpers/helpers.js";
import { SYSTEMS } from "../systems.js";

export class VaultStore extends ItemPileStore {

  get searchDelay() {
    return 50;
  }

  get ItemClass() {
    return VaultItem;
  }

  setupStores() {
    super.setupStores();
    this.gridData = writable({});
    this.gridItems = writable([]);
    this.validGridItems = writable([]);

    this.logSearch = writable("");
    this.vaultLog = writable([]);
    this.visibleLogItems = writable(18);

    this.highlightedGridItems = writable([]);
    this.vaultExpanderItems = writable([]);
    this.refreshGridDebounce = foundry.utils.debounce(() => {
      this.refreshGrid();
    }, this.searchDelay);
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    this.refreshGrid();
    this.subscribeTo(this.pileData, () => {
      this.refreshGridDebounce();
      this.processLogEntries();
    });

    this.subscribeTo(this.document, () => {
      const { data } = this.document.updateOptions;
      if (hasProperty(data, CONSTANTS.FLAGS.LOG)) {
        this.processLogEntries();
      }
    });

    this.subscribeTo(this.logSearch, this.filterLogEntries.bind(this));

    this.processLogEntries();
  }

  processLogEntries() {

    const pileData = get(this.pileData);
    const logEntries = PileUtilities.getActorVaultLog(this.actor);

    logEntries.map(log => {

      let instigator = log.actor || "Unknown character";
      if (pileData.vaultLogType === "user_actor") {
        instigator = game.i18n.format("ITEM-PILES.Vault.LogUserActor", {
          actor_name: log.actor || "Unknown character",
          user_name: game.users.get(log.user)?.name ?? "unknown user",
        })
      } else if (pileData.vaultLogType === "user") {
        instigator = game.users.get(log.user)?.name ?? "unknown user";
      }

      const quantity = Math.abs(log.qty) > 1
        ? game.i18n.format("ITEM-PILES.Vault.LogQuantity", { quantity: Math.abs(log.qty) })
        : "";

      if (!log.action) {
        log.action = log.qty > 0 ? "deposited" : "withdrew";
      }

      const action = log.action === "withdrew" || log.action === "deposited"
        ? game.i18n.localize("ITEM-PILES.Vault." + (log.action.slice(0, 1).toUpperCase() + log.action.slice(1)))
        : log.action;

      log.text = game.i18n.format("ITEM-PILES.Vault.LogEntry", {
        instigator,
        action: `<span>${action}</span>`,
        quantity: quantity,
        item_name: `<strong>${log.name}</strong>`,
      })
      log.visible = true;

    });

    this.vaultLog.set(logEntries);

    this.filterLogEntries()

  }

  filterLogEntries() {
    const search = get(this.logSearch).toLowerCase();
    const regex = new RegExp(search, "g");
    this.vaultLog.update((logs) => {
      for (let log of logs) {
        log.visible = log.text.toLowerCase().search(regex) !== -1;
      }
      return logs;
    })
  }

  refreshFreeSpaces() {
    const pileData = get(this.pileData);
    this.gridData.update(() => {

      const vaultAccess = pileData.vaultAccess.filter(access => {
        return fromUuidSync(access.uuid)?.isOwner;
      });

      const access = vaultAccess.reduce((acc, access) => {
        acc.canOrganize = acc.canOrganize || access.organize;
        acc.canWithdrawItems = (acc.canWithdrawItems || access.items.withdraw) && this.recipient;
        acc.canDepositItems = (acc.canDepositItems || access.items.deposit) && this.recipient;
        acc.canWithdrawCurrencies = (acc.canWithdrawCurrencies || access.currencies.withdraw) && this.recipient;
        acc.canDepositCurrencies = (acc.canDepositCurrencies || access.currencies.deposit) && this.recipient;
        return acc;
      }, {
        canOrganize: this.actor.isOwner,
        canWithdrawItems: this.actor.isOwner && this.recipient,
        canDepositItems: this.actor.isOwner && this.recipient,
        canWithdrawCurrencies: this.actor.isOwner && this.recipient,
        canDepositCurrencies: this.actor.isOwner && this.recipient
      });

      return {
        ...PileUtilities.getVaultGridData(this.actor, pileData),
        ...access,
        canEditCurrencies: game.user.isGM,
        fullAccess: game.user.isGM || Object.values(access).every(Boolean),
        gridSize: 40,
        gap: 4
      }
    })
  }

  canItemsFitWithout(itemToCompare) {

    const pileData = get(this.pileData);
    const items = get(this.validGridItems);
    const vaultExpanders = get(this.vaultExpanderItems);

    const expansions = vaultExpanders.reduce((acc, item) => {
      if (item === itemToCompare) return acc;
      acc.cols += get(item.itemFlagData).addsCols * get(item.quantity);
      acc.rows += get(item.itemFlagData).addsRows * get(item.quantity);
      return acc;
    }, {
      cols: pileData.baseExpansionCols ?? 0,
      rows: pileData.baseExpansionRows ?? 0
    });

    const enabledCols = Math.min(pileData.cols, expansions.cols);
    const enabledRows = Math.min(pileData.rows, expansions.rows);

    const enabledSpaces = enabledCols * enabledRows;

    return enabledSpaces - items.length;

  }

  updateGrid(items) {

    if (!items.length) return;

    const itemsToUpdate = items.map(item => {
      const transform = get(item.transform);
      return {
        _id: item.id,
        [CONSTANTS.FLAGS.ITEM + ".x"]: transform.x,
        [CONSTANTS.FLAGS.ITEM + ".y"]: transform.y
      }
    });

    helpers.debug("itemsToUpdate", itemsToUpdate);

    const actorUuid = Utilities.getUuid(this.actor);
    if (this.actor.isOwner) {
      return PrivateAPI._commitActorChanges(actorUuid, {
        itemsToUpdate,
      });
    }

    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMMIT_ACTOR_CHANGES, actorUuid, {
      itemsToUpdate,
    });
  }

  refreshItems() {
    super.refreshItems();
    const pileData = get(this.pileData);
    this.validGridItems.set(get(this.allItems).filter(item => {
      const itemFlagData = get(item.itemFlagData);
      return (!pileData.vaultExpansion || !itemFlagData.vaultExpander) && !item.isCurrency;
    }));
    this.highlightedGridItems.set(get(this.items).filter(item => {
      const itemFlagData = get(item.itemFlagData);
      return !pileData.vaultExpansion || !itemFlagData.vaultExpander;
    }).map(item => item.id));
    this.vaultExpanderItems.set(get(this.allItems).filter(item => {
      const itemFlagData = get(item.itemFlagData);
      return !pileData.vaultExpansion || itemFlagData.vaultExpander;
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
    const search = get(this.search)
    const highlightedItems = get(this.highlightedGridItems);
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
            id: item.id,
            transform: item.transform,
            highlight: search && highlightedItems.includes(item.id),
            item,
          });
        }
        return item?.id ?? null;
      });
    });

    helpers.debug("grid", grid);

    helpers.debug("existingItems", existingItems);

    helpers.debug("allItems", allItems);

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
                id: item.id,
                transform: item.transform,
                highlight: search && highlightedItems.includes(item.id),
                item
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
    this.style = writable({});
  }

  setupSubscriptions() {
    super.setupSubscriptions();
    let setup = false;
    this.subscribeTo(this.itemDocument, () => {
      this.style.set(SYSTEMS.DATA?.VAULT_STYLES ? SYSTEMS.DATA?.VAULT_STYLES.filter(style => {
        return getProperty(this.item, style.path) === style.value;
      }).reduce((acc, style) => {
        return foundry.utils.mergeObject(acc, style.styling);
      }, {}) : {});
    });
    this.subscribeTo(this.itemFlagData, (data) => {
      if (setup) {
        helpers.debug("itemFlagData", data);
      }
      this.transform.set({
        x: data.x, y: data.y, w: data.width ?? 1, h: data.height ?? 1
      });
    });
    this.subscribeTo(this.transform, (transform) => {
      if (setup) {
        helpers.debug("transform", transform);
      }
      this.x = transform.x;
      this.y = transform.y;
    });
    this.subscribeTo(this.quantity, () => {
      const itemFlagData = get(this.itemFlagData);
      if (!itemFlagData.vaultExpander) return;
      this.store.refreshFreeSpaces();
      this.store.refreshGridDebounce();
    })
    setup = true;
  }

  async take() {

    const pileData = get(this.store.pileData);
    const itemFlagData = get(this.itemFlagData);

    if (pileData.vaultExpansion && itemFlagData.vaultExpander) {
      const slotsLeft = this.store.canItemsFitWithout(this);
      if (slotsLeft < 0) {
        return TJSDialog.prompt({
          title: "Item Piles", content: {
            class: CustomDialog, props: {
              header: game.i18n.localize("ITEM-PILES.Dialogs.CantRemoveVaultExpander.Title"),
              content: game.i18n.format("ITEM-PILES.Dialogs.CantRemoveVaultExpander.Content", {
                num_items: Math.abs(slotsLeft)
              })
            }
          },
          modal: true
        });
      }
    }

    let quantity = get(this.quantity);
    if (quantity > 1) {
      quantity = await DropItemDialog.show(this.item, this.store.actor, {
        localizationTitle: "WithdrawItem"
      });
    }
    return game.itempiles.API.transferItems(this.store.actor, this.store.recipient, [{
      _id: this.id,
      quantity
    }], { interactionId: this.store.interactionId });
  }

}
