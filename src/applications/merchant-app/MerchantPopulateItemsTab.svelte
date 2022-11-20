<script>
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import { get, writable } from "svelte/store";
  import { onDestroy } from "svelte";
  import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
  import CustomDialog from "../components/CustomDialog.svelte";
  import ItemEntry from "./ItemEntry.svelte";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { getSetting } from "../../helpers/helpers";
  import SETTINGS from "../../constants/settings";

  export let store;

  let tables = writable(getTables());
  let timesToRoll = "1d10";

  console.log(get(tables));

  let populationTables = writable(get(store.pileData).tablesForPopulate ?? []);

  let timesRolled = "";
  let keepRolled = false;

  let itemStore = store.items;

  $: currentItems = $itemStore.sort((a, b) => {
    return a.item.name < b.item.name ? -1 : 1;
  });

  $: {
    const pileData = get(store.pileData);
    pileData.tablesForPopulate = $populationTables.filter((t) =>
      game.tables.get(t.id)
    );
    PileUtilities.updateItemPileData(store.actor, pileData);
  }

  let itemsRolled = writable([]);

  function getTables() {
    let tables = Array.from(game.tables);
    const folderId = getSetting(SETTINGS.POPULATION_TABLES_FOLDER);
    if (
      folderId !== "root" && game.folders.find((f) => f.type === "RollTable" && f.id === folderId)
    ) {
      tables = tables.filter((t) => t.folder?.id === folderId);
    }

    const mappedTables = {};
    for (const table of tables) {
      mappedTables[table.id] = {
        name: table.name,
        items: Array.from(table.collections.results)
      }
    }
    return mappedTables;
  }

  async function rollItems(tableId, timesToRoll) {
    const table = game.tables.get(tableId);
    if (!table) return;
    await table.reset();
    await table.normalize();
    const roll = new Roll((timesToRoll ?? 1).toString()).evaluate({ async: false });
    if (!keepRolled) {
      itemsRolled.set([]);
    }
    timesRolled = roll.total;
    if (roll.total <= 0) {
      return;
    }

    const newItems = (await game.itempiles.API.rollItemTable(table, { timesToRoll: timesRolled }))
      .map(itemData => {
        const prices = game.itempiles.API.getPricesForItem(itemData.item, {
          seller: store.actor,
        });
        itemData.price = prices[0]?.free ? localize("ITEM-PILES.Merchant.ItemFree") : prices[0]?.priceString;
        return itemData;
      });

    itemsRolled.update((items) => {
      newItems.forEach((newItem) => {
        const existingItem = items.find(
          (item) => item.documentId === newItem.documentId
        );
        if (existingItem) {
          existingItem.quantity++;
        } else {
          items.push({
            ...newItem
          });
        }
      });
      items.sort((a, b) => {
        return a.text < b.text ? -1 : 1;
      });
      return items;
    });
  }

  async function rollAll() {
    const tkr = keepRolled;
    if (!keepRolled) {
      itemsRolled.set([]);
    }
    keepRolled = true;
    for (const table of $populationTables) {
      await rollItems(table.id, table.timesToRoll);
    }
    timesRolled = $itemsRolled.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
    keepRolled = tkr;
  }

  async function getItem(itemToGet) {
    let item;
    if (itemToGet.documentCollection === "Item") {
      item = game.items.get(itemToGet.documentId);
    } else {
      const compendium = game.packs.get(itemToGet.documentCollection);
      if (compendium) {
        item = await compendium.getDocument(itemToGet.documentId);
      }
    }
    return item;
  }

  async function addItem(itemToAdd) {
    await game.itempiles.API.addItems(store.actor, [itemToAdd]);
    removeItem(itemToAdd);
  }

  function removeItem(itemToRemove) {
    itemsRolled.update((items) => {
      const existingItemIndex = items.findIndex(
        (item) => item.documentId === itemToRemove.documentId
      );
      items.splice(existingItemIndex, 1);
      return items;
    });
  }

  async function addAllItems() {
    const itemsToAdd = get(itemsRolled);
    await game.itempiles.API.addItems(store.actor, itemsToAdd);
    itemsRolled.set([]);
  }

  async function clearAllItems() {
    const doContinue = await TJSDialog.confirm({
      title: localize("ITEM-PILES.Dialogs.ClearAllItems.Title"),
      content: {
        class: CustomDialog,
        props: {
          icon: "fas fa-exclamation-triangle",
          content: localize("ITEM-PILES.Dialogs.ClearAllItems.Content"),
        },
      },
      modal: true,
      draggable: false,
      options: {
        height: "auto",
        headerButtonNoClose: true,
      },
    });
    if (!doContinue) return false;
    const items = game.itempiles.API.getActorItems(store.actor);
    await game.itempiles.API.removeItems(store.actor, items);
  }

  async function previewItem(itemData) {
    itemData.item?.sheet?.render(true);
  }

  async function removeAddedItem(itemToRemove) {
    await game.itempiles.API.removeItems(store.actor, [itemToRemove.item]);
  }

  function addTable() {
    populationTables.update((tabs) => {
      tabs.push({ id: selectedTable, addAll: false });
      return tabs;
    });
  }

  function removeTable(tableId) {
    populationTables.update((tabs) => {
      return tabs.filter((t) => t.id !== tableId);
    });
  }

  let createId = Hooks.on("createRollTable", () => {
    tables.set(getTables());
  });
  let deleteId = Hooks.on("deleteRollTable", () => {
    tables.set(getTables());
  });

  onDestroy(() => {
    Hooks.off("createRollTable", createId);
    Hooks.off("deleteRollTable", deleteId);
  });

  let selectedTable = Object.keys(get(tables))[0] ?? "";

</script>

<div>

  <div class="item-piles-flexrow">
    <div style="margin-right:0.5rem;">
      <div class="item-piles-populate-header">
        {localize(
          currentItems.length
            ? "ITEM-PILES.Merchant.CurrentItems"
            : "ITEM-PILES.Merchant.BuyNoItems"
        )}
      </div>

      {#each currentItems as item (item.id)}
        <div
          class="item-piles-flexrow item-piles-item-row item-piles-even-color"
        >
          <ItemEntry {item}>
            <button
              slot="right"
              class="item-piles-rolled-item-button"
              style="color:red;"
              on:click={() => removeAddedItem(item)}
              title={localize("ITEM-PILES.Merchant.RemoveItem")}
            >
              <i class="fas fa-trash"/>
            </button>
          </ItemEntry>
        </div>
      {/each}

      {#if currentItems.length}
        <button class="item-piles-button" style="margin-top:0.5rem" on:click={() => clearAllItems()}>
          <i class="fas fa-trash"/>
          {localize("ITEM-PILES.Merchant.ClearAllItems")}
        </button>
      {/if}
    </div>

    <div style="padding-right:0.25rem;">

      <div class="item-piles-populate-header">
        <span style="flex:1 0 auto;">{localize("ITEM-PILES.Merchant.RollableTables")}</span>
        <button style="height: 20px; line-height: inherit; font-size: 0.75rem; flex:1 0 auto; margin:0;">
          <i class="fas fa-dice-d20"></i> Roll All Tables
        </button>
      </div>

      {#each $populationTables as table}
        <div class="item-piles-flexrow item-piles-item-row item-piles-even-color"
             style="min-height: 28px; padding-left: 5px;">
          <div>
            {$tables[table.id].name}
          </div>
          <button class="item-piles-rolled-item-button">
            <i class="fas fa-cog"></i>
          </button>
          <button class="item-piles-rolled-item-button">
            <i class="fas fa-dice-d20"></i>
          </button>
        </div>
      {/each}

      <div class="item-piles-flexrow" style="margin-top: 0.5rem;">

        <select bind:value={selectedTable} style="flex:1 0 auto;">
          {#each Object.entries($tables) as [tableId, table] (tableId)}
            <option value={tableId}>{table.name}</option>
          {/each}
          {#if foundry.utils.isEmpty($tables)}
            <option value="">
              {localize("ITEM-PILES.Merchant.NoRollTables")}
            </option>
          {/if}
        </select>

        <button class="item-piles-button" on:click={() => addTable()}>
          {localize("ITEM-PILES.Merchant.AddTable")}
        </button>

      </div>

      <hr style="margin:0.5rem 0;"/>

      <div class="item-piles-populate-header">
        <span style="flex:1 0 auto;">
          {localize(timesRolled ? "ITEM-PILES.Merchant.RolledTimes" : "ITEM-PILES.Merchant.ClickRoll", { rolls: timesRolled })}
        </span>
      </div>

    </div>
  </div>
</div>

<style lang="scss">

  .item-piles-populate {

    &-header {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: 5px;
      align-items: center;
      min-height: 20px;
      margin: 0.125rem 0 0.5rem 0;
    }
  }

  .item-piles-roll-header {
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .item-piles-keep-rolled {
    align-items: center;
    justify-content: flex-end;
    font-size: 0.75rem;
    text-align: right;
    flex: 0 1 auto;

    input {
      height: 14px;
    }
  }

  .item-piles-name {
    flex: 1 0 40%;
  }

  .item-piles-quantity-container {
    flex: 0 1 50px;
    gap: 4px;
  }

  .item-piles-button {
    height: 27px;
    line-height: inherit;

    /* alignt icons */
    flex-direction: row;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
  }

  .item-piles-rolled-item-button {
    min-height: 22px;
    min-width: 22px;
    margin: 2px;
    font-size: 0.65rem;
    padding: 0.25rem;
    flex: 0;
    line-height: inherit;

    i {
      margin: 0;
    }
  }

  .fix-height-checkbox {
    height: 20px;
  }

  .item-piles-header-button {
    min-width: 30px;
    height: 30px;
    text-align: center;
    padding: 0;
    margin: 0;
  }

  .item-piles-remove-button {
    font-size: 0.75rem;
    width: 30px;
    height: 30px;
    align-items: center;
    display: flex;
    justify-content: center;

    color: red;

    &[disabled] {
      color: gray;
    }
  }

  .item-piles-quantity-input-container {
    min-width: 40px;
  }
</style>

