<script>
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import { get, writable } from "svelte/store";
  import { onDestroy, tick } from "svelte";
  import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
  import CustomDialog from "../components/CustomDialog.svelte";
  import ItemEntry from "./ItemEntry.svelte";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { getSetting } from "../../helpers/helpers";
  import SETTINGS from "../../constants/settings";

  export let store;

  let tables = writable(getTables());
  let timesToRoll = "1d10";
  let selectedTables = writable(
    get(store.pileData).tablesForPopulate ?? [
      { id: tables?.[0]?.id ?? 0, timesToRoll },
    ]
  );

  let timesRolled = "";
  let keepRolled = false;

  let itemStore = store.items;

  let currentItems = [];

  $: {
    currentItems = $itemStore;
    currentItems.sort((a, b) => {
      return a.name < b.name ? -1 : 1;
    });
  }

  $: {
    const pileData = get(store.pileData);
    pileData.tablesForPopulate = $selectedTables.filter((t) =>
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

    return tables.map((table) => ({ name: table.name, id: table.id }));
  }

  async function rollItems(tableId, timesToRoll) {
    const table = game.tables.get(tableId);
    if (!table) return;
    await table.reset();
    await table.normalize();
    const roll = new Roll(timesToRoll ?? 1).evaluate({ async: false });
    if (!keepRolled) {
      itemsRolled.set([]);
    }
    timesRolled = roll.total;
    if (roll.total <= 0) {
      return;
    }
    await table.reset();
    // empty formula fixed by "normalize"
    const tableDraw = await table.drawMany(timesRolled, { displayChat: false });
    itemsRolled.update((items) => {
      tableDraw.results.forEach((result) => {
        const rollData = result.data;
        const existingItem = items.find(
          (item) => item.resultId === rollData.resultId
        );
        if (existingItem) {
          existingItem.quantity++;
        } else {
          items.push({
            ...rollData,
            quantity: 1,
          });
        }
      });
      items.sort((a, b) => {
        return a.text < b.text ? -1 : 1;
      });
      tick().then(async () => {
        for (const i of items) {
          const item = await getItem(i);
          const prices = game.itempiles.API.getPricesForItem(item, {
            seller: store.actor,
          });
          i.price = prices[0]?.free ? localize("ITEM-PILES.Merchant.ItemFree") : prices[0]?.priceString;
        }
        itemsRolled.set(items);
      }, 0);
      return items;
    });
  }

  async function rollAll() {
    const tkr = keepRolled;
    if (!keepRolled) {
      itemsRolled.set([]);
    }
    keepRolled = true;
    for (const table of $selectedTables) {
      await rollItems(table.id, table.timesToRoll);
    }
    timesRolled = $itemsRolled.reduce((total, item) => {
      return (total += item.quantity);
    }, 0);
    keepRolled = tkr;
  }

  async function getItem(itemToGet) {
    let item;
    if (itemToGet.collection === "Item") {
      item = game.items.get(itemToGet.resultId);
    } else {
      const compendium = game.packs.get(itemToGet.collection);
      if (compendium) {
        item = await compendium.getDocument(itemToGet.resultId);
      }
    }
    return item;
  }

  async function addItem(itemToAdd) {
    let item = await getItem(itemToAdd);
    if (item) {
      await game.itempiles.API.addItems(store.actor, [
        { item, quantity: itemToAdd.quantity },
      ]);
    }
    removeItem(itemToAdd);
  }

  function removeItem(itemToRemove) {
    itemsRolled.update((items) => {
      const existingItemIndex = items.findIndex(
        (item) => item.resultId === itemToRemove.resultId
      );
      items.splice(existingItemIndex, 1);
      return items;
    });
  }

  async function addAllItems() {
    const itemsToAdd = get(itemsRolled);
    const items = [];
    for (const itemToAdd of itemsToAdd) {
      let item = await getItem(itemToAdd);
      items.push({ item, quantity: itemToAdd.quantity });
    }
    await game.itempiles.API.addItems(store.actor, items);
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

  async function previewItem(item) {
    (await getItem(item))?.sheet?.render(true);
  }

  async function removeAddedItem(itemToRemove) {
    await game.itempiles.API.removeItems(store.actor, [itemToRemove.item]);
  }

  function addTable() {
    selectedTables.update((tabs) => {
      tabs.push({ id: tables?.[0]?.id ?? tabs.length, timesToRoll });
      return tabs;
    });
  }

  function removeTable(tableId) {
    selectedTables.update((tabs) => {
      return tabs.filter((t) => t.id != tableId);
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
</script>

<div>
  <div
    class="item-piles-flexcol"
    style="margin-bottom: 1rem; padding:0.25rem; gap: 0.25rem"
  >

    <div class="item-piles-grid">

      <div>
        Table Name
      </div>

      <div>
        Times to roll
      </div>

      <div>
        <small>
          <a class="item-piles-clickable" on:click={addTable}>Add Table</a>
        </small>
      </div>

    </div>

    {#each $selectedTables as selectedTable (selectedTable.id)}
      <div class="item-piles-grid">
        <select bind:value={selectedTable.id} style="height:30px;">
          {#each $tables.filter((table) => !get(selectedTables)
            .map((t) => t.id)
            .includes(table.id) || selectedTable.id == table.id) as table (table.id)}
            <option value={table.id}>{table.name}</option>
          {/each}
          {#if !$tables.length}
            <option value="">
              {localize("ITEM-PILES.Merchant.NoRollTables")}
            </option>
          {/if}
        </select>

        <input
          type="text"
          bind:value={selectedTable.timesToRoll}
          placeholder="2d6+4"
          style="height: 30px; padding: 0 0.5rem; width:100%;"
        />

        <button
          class="item-piles-header-button"
          on:click={(_) =>
            rollItems(selectedTable.id, selectedTable.timesToRoll)}
          disabled={!$tables.length}
        >
          {localize("Roll")}
        </button>

        {#if $selectedTables.length > 1}
          <button
            style="padding: 0; text-align: center;"
            class="item-piles-rolled-item-button item-piles-header-button item-piles-remove-button"
            on:click={() => removeTable(selectedTable.id)}
            title={localize("ITEM-PILES.Merchant.RemoveItem")}
            disabled={$selectedTables.length <= 1}
          >
            <i class="fas fa-trash"/>
          </button>
        {/if}
      </div>
    {/each}

    {#if $selectedTables.length > 1}
      <div class="item-piles-flexrow">
        <div style="flex:1; display: flex; justify-content: flex-end;">
          <button
            style="padding: 0 1rem; width:84px;"
            on:click={rollAll}
            disabled={!$tables.length}
          >
            {localize("Roll all")}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <div class="item-piles-flexrow" style="margin-top:1rem;">
    <div style="margin-right:0.5rem;">
      <div style="margin-bottom:0.5rem" class="fix-height-checkbox">
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
        <button class="item-piles-button" on:click={() => clearAllItems()}>
          <i class="fas fa-trash"/>
          {localize("ITEM-PILES.Merchant.ClearAllItems")}
        </button>
      {/if}
    </div>

    <div>
      <div class="item-piles-flexrow item-piles-roll-header">
        <label>
          {localize(
            timesRolled && $itemsRolled.length
              ? "ITEM-PILES.Merchant.RolledTimes"
              : "ITEM-PILES.Merchant.ClickRoll",
            { rolls: timesRolled }
          )}
        </label>

        <div class="item-piles-flexrow item-piles-keep-rolled">
          <label>{localize("ITEM-PILES.Merchant.KeepRolled")}</label>
          <input type="checkbox" bind:checked={keepRolled}/>
        </div>
      </div>

      {#if $itemsRolled.length}
        {#each $itemsRolled as item (item.resultId)}
          <div
            class="item-piles-flexrow item-piles-item-row item-piles-even-color"
          >
            <button
              class="item-piles-rolled-item-button"
              on:click={() => addItem(item)}
              title={localize("ITEM-PILES.Merchant.AddItem")}
            >
              <i class="fas fa-arrow-left"/>
            </button>

            <div class="item-piles-img-container">
              <img class="item-piles-img" src={item.img}/>
            </div>

            <div class="item-piles-name">
              <div class="item-piles-name-container">
                <a
                  class="item-piles-clickable"
                  on:click={(_) => previewItem(item)}>{item.text}</a
                >
              </div>
            </div>

            <div class="item-piles-quantity-container">
              {#if item.price}
                <small style="white-space: nowrap;">{item.price}</small>
                <i
                  class="fas fa-times"
                  style="color: #555; font-size: 0.75rem; opacity: 0.75;"
                />
              {/if}
              <div class="item-piles-quantity-input-container">
                <input
                  class="item-piles-quantity"
                  type="number"
                  min="0"
                  bind:value={item.quantity}
                />
              </div>
            </div>

            <button
              class="item-piles-rolled-item-button"
              style="color:red;"
              on:click={() => removeItem(item)}
              title={localize("ITEM-PILES.Merchant.RemoveItem")}
            >
              <i class="fas fa-trash"/>
            </button>
          </div>
        {/each}

        <button class="item-piles-button" on:click={() => addAllItems()}>
          {localize("ITEM-PILES.Merchant.AddAll")}
          <i class="fas fa-arrow-left"/>
        </button>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">

  .item-piles-grid {
    display: grid;
    grid-template-columns: 1fr 100px 50px min-content;
    column-gap: 5px;
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
    margin-top: 0.5rem;

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

