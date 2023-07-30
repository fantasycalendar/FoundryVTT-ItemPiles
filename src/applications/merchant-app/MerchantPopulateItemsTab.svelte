<script>
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import { get, writable } from "svelte/store";
  import { onDestroy } from "svelte";
  import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
  import CustomDialog from "../components/CustomDialog.svelte";
  import ItemEntry from "./ItemEntry.svelte";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { getSetting } from "../../helpers/helpers";
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import SETTINGS from "../../constants/settings";
  import CustomCategoryInput from "../components/CustomCategoryInput.svelte";

  export let store;

  let tables = writable(getTables());

  let populationTables = writable((get(store.pileData).tablesForPopulate ?? [])
    .map(t => {
      return {
        id: t.id,
        addAll: t.addAll ?? false,
        open: false,
        timesToRoll: t.timesToRoll ?? "1d4",
        items: t.items ?? {},
        customCategory: t.customCategory ?? "",
      };
    }));

  let timesRolled = "";
  let keepRolled = false;

  let itemStore = store.items;

  $: currentItems = $itemStore.sort((a, b) => {
    return a.item.name < b.item.name ? -1 : 1;
  }).filter(item => !item.isService);

  $: currentServices = $itemStore.sort((a, b) => {
    return a.item.name < b.item.name ? -1 : 1;
  }).filter(item => item.isService);

  $: {
    debounceSave($populationTables, $tables)
  }

  const debounceSave = foundry.utils.debounce((popTables, actualTables) => {
    const pileData = foundry.utils.deepClone(get(store.pileData));
    pileData.tablesForPopulate = popTables
      .filter((t) => actualTables[t.id])
      .map((t) => ({
        id: t.id, addAll: t.addAll, items: t.items, timesToRoll: t.timesToRoll, customCategory: t.customCategory
      }));
    PileUtilities.updateItemPileData(store.actor, pileData);
  }, 200);

  let selectableTables = [];
  let selectedTable = "";
  $: {
    selectableTables = Object.entries($tables).filter(entry => !$populationTables.some(table => table.id === entry[0]));
    const tableSet = new Set(selectableTables.map(e => e[0]));
    selectedTable = tableSet.has(selectedTable) ? selectedTable : tableSet.first();
  }

  let itemsRolled = writable([]);

  function recurseThroughFoldersForTables(folderId) {
    const folder = game.folders.find(f => f.type === "RollTable" && f.id === folderId);
    let folders = [folder.id];
    for (const child of folder.children) {
      folders = folders.concat(recurseThroughFoldersForTables(child.folder.id))
    }
    return folders;
  }

  function getTables() {
    let tables = Array.from(game.tables);
    const folderId = getSetting(SETTINGS.POPULATION_TABLES_FOLDER);
    if (
      folderId !== "root" && game.folders.find((f) => f.type === "RollTable" && f.id === folderId)
    ) {
      const folderIds = recurseThroughFoldersForTables(folderId)
      tables = tables.filter((t) => folderIds.includes(t.folder?.id));
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

  async function rollAllTables() {
    if (!keepRolled) {
      itemsRolled.set([]);
    }
    for (const table of $populationTables) {
      table.open = false;
      await evaluateTable(table, true);
    }
    timesRolled = $itemsRolled.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }

  async function evaluateTable(table, keepRolledItems) {

    const rollableTable = game.tables.get(table.id);
    if (!rollableTable) return;

    if (!keepRolledItems) {
      itemsRolled.set([]);
    }

    const newItems = await PileUtilities.rollMerchantTables({ tableData: [table] });

    const processedItems = newItems.map(itemData => {
      const prices = game.itempiles.API.getPricesForItem(itemData.item, {
        seller: store.actor,
      });
      itemData.price = prices[0]?.free ? localize("ITEM-PILES.Merchant.ItemFree") : prices[0]?.priceString;
      return itemData;
    });

    itemsRolled.update((items) => {
      processedItems.forEach((newItem) => {
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

  async function addItem(itemToAdd) {
    await game.itempiles.API.addItems(store.actor, [itemToAdd].map(entry => ({
      item: entry.item,
      quantity: entry.quantity,
      flags: entry.flags
    })));
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
    const itemsToAdd = get(itemsRolled).map(entry => ({
      item: entry.item,
      quantity: entry.quantity,
      flags: entry.flags
    }));
    await game.itempiles.API.addItems(store.actor, itemsToAdd);
    itemsRolled.set([]);
  }

  async function clearAllItems(services = false) {
    const localization = services ? "Services" : "Items";
    const doContinue = await TJSDialog.confirm({
      title: "Item Piles - " + localize(`ITEM-PILES.Dialogs.ClearAll${localization}.Title`),
      content: {
        class: CustomDialog,
        props: {
          icon: "fas fa-exclamation-triangle",
          content: localize(`ITEM-PILES.Dialogs.ClearAll${localization}.Content`),
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
    await game.itempiles.API.removeItems(store.actor, game.itempiles.API.getActorItems(store.actor)
      .filter(item => {
        const itemFlags = PileUtilities.getItemFlagData(item);
        return services === itemFlags.isService && !itemFlags.keepOnMerchant && !itemFlags.keepIfZero;
      }));
  }

  async function previewItem(itemData) {
    itemData.item?.sheet?.render(true);
  }

  async function removeAddedItem(itemToRemove) {
    store.actor.deleteEmbeddedDocuments("Item", [itemToRemove.item.id]);
  }

  function addTable() {
    populationTables.update((tabs) => {
      tabs.push({
        id: selectedTable,
        addAll: false,
        open: false,
        timesToRoll: "1d4-1",
        customCategory: "",
        items: {}
      });
      return tabs;
    });
  }

  async function removeTable(tableId) {

    const table = get(tables)[tableId];

    const doContinue = await TJSDialog.confirm({
      title: "Item Piles - " + game.i18n.localize("ITEM-PILES.Dialogs.RemoveMerchantTable.Title"),
      content: {
        class: CustomDialog,
        props: {
          header: game.i18n.localize("ITEM-PILES.Dialogs.RemoveMerchantTable.Title"),
          content: game.i18n.format("ITEM-PILES.Dialogs.RemoveMerchantTable.Content", { table_name: table.name }),
          icon: "fas fa-exclamation-triangle"
        }
      },
      modal: true,
      draggable: false,
      rejectClose: false,
      defaultYes: true,
      options: {
        height: "auto"
      }
    });

    if (!doContinue) return;

    populationTables.update((tabs) => {
      return tabs.filter((t) => t.id !== tableId);
    });
  }

  let createId = Hooks.on("createRollTable", () => {
    tables.set(getTables());
  });
  let deleteId = Hooks.on("deleteRollTable", () => {
    tables.update(() => {
      const newTables = getTables();
      populationTables.update(values => values.filter((t) => newTables[t.id]));
      return newTables;
    });
  });

  onDestroy(() => {
    Hooks.off("createRollTable", createId);
    Hooks.off("deleteRollTable", deleteId);
  });

</script>

<div class="item-piles-flexrow" style="height:100%;">
	<div style="margin-right:0.5rem; max-width: 50%; max-height:100%; overflow-y:scroll;">
		{#if !(currentItems.length + currentServices.length)}
			<div class="item-piles-populate-header">
				{localize("ITEM-PILES.Merchant.BuyNoItems")}
			</div>
		{/if}

		{#if currentServices.length}
			<div class="item-piles-populate-header">
				{localize("ITEM-PILES.Merchant.CurrentServices")}
			</div>
		{/if}

		{#each currentServices as item (item.id)}
			<div
				class="item-piles-flexrow item-piles-item-row item-piles-even-color"
			>
				<ItemEntry {item}>
					<button
						slot="right"
						class="item-piles-rolled-item-button"
						style="color:red;"
						on:click={() => removeAddedItem(item)}
						data-fast-tooltip={localize("ITEM-PILES.Merchant.RemoveItem")}
					>
						<i class="fas fa-trash"/>
					</button>
				</ItemEntry>
			</div>
		{/each}

		{#if currentServices.length}
			<button class="item-piles-button" style="margin:5px 0;" on:click={() => clearAllItems(true)}>
				<i class="fas fa-trash"/>
				{localize("ITEM-PILES.Merchant.ClearAllServices")}
			</button>
		{/if}

		{#if currentItems.length}
			<div class="item-piles-populate-header">
				{localize("ITEM-PILES.Merchant.CurrentItems")}
			</div>
		{/if}

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
						data-fast-tooltip={localize("ITEM-PILES.Merchant.RemoveItem")}
					>
						<i class="fas fa-trash"/>
					</button>
				</ItemEntry>
			</div>
		{/each}

		{#if currentItems.length}
			<button class="item-piles-button" style="margin:5px 0;" on:click={() => clearAllItems()}>
				<i class="fas fa-trash"/>
				{localize("ITEM-PILES.Merchant.ClearAllItems")}
			</button>
		{/if}
	</div>

	<div style="padding-right:0.25rem; max-width: 50%; max-height:100%; overflow-y:scroll;">

		<div class="item-piles-populate-header">
			<span style="flex:1 0 auto;">{localize("ITEM-PILES.Merchant.RollableTables")}</span>
			<button on:click={() => { rollAllTables() }}
							style="height: 20px; line-height: inherit; font-size: 0.75rem; flex:1 0 auto; margin:0;">
				<i class="fas fa-dice-d20"></i> {localize("ITEM-PILES.Merchant.RollAllTables")}
			</button>
		</div>

		{#each $populationTables as table}
			<div class="item-piles-item-row item-piles-even-color"
					 style="min-height: 28px; padding: 3px 3px 3px 5px;">
				<div class="item-piles-flexrow" style="align-items: center;">
					<div style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">
						<strong style="max-width:100%; word-break: break-all;">{$tables[table.id].name}</strong>
					</div>
					<button class="item-piles-rolled-item-button"
									on:click={() => { removeTable(table.id) }}
									data-fast-tooltip={localize("ITEM-PILES.Merchant.ToolTipRemoveTable")}
									data-fast-tooltip-direction={TooltipManager.TOOLTIP_DIRECTIONS.UP}
					>
						<i class="fas fa-trash" style="color:#de0e0e;"></i>
					</button>
					<button class="item-piles-rolled-item-button"
									on:click={() => { table.open = !table.open; }}
									data-fast-tooltip={localize("ITEM-PILES.Merchant.TooltipConfigureTable")}
									data-fast-tooltip-direction={TooltipManager.TOOLTIP_DIRECTIONS.UP}
					>
						<i class="fas fa-cog"></i>
					</button>
					<button class="item-piles-rolled-item-button"
									on:click={() => { table.open = false; evaluateTable(table, keepRolled); }}
									data-fast-tooltip={localize("ITEM-PILES.Merchant.TooltipRollTable")}
									data-fast-tooltip-direction={TooltipManager.TOOLTIP_DIRECTIONS.UP}
									style="margin-right:0;">
						<i class="fas fa-dice-d20"></i>
					</button>
				</div>
				{#if table.open}
					<div class="item-piles-flexcol" style="margin-top:5px;"
							 transition:slide={{ duration: 200, easing: quintOut }}>
						<div class="item-piles-flexrow" style="align-items: center; margin-bottom: 0.25rem;">
							<label
								style="margin-right:5px;">{localize("ITEM-PILES.Merchant.TableCustomCategory")}</label>
							<CustomCategoryInput bind:value={table.customCategory}/>
						</div>
						<div class="item-piles-flexrow">
							<div class="item-piles-flexrow" style="align-items: center; flex:0 1 auto; min-height:26px;">
								<label style="flex:0 1 auto; margin-right:5px;"
											 for={"table-id-"+table.id}>{localize("ITEM-PILES.Merchant.TableAddAllItems")}</label>
								<input style="width:15px; height:15px; margin:0; flex:0;" id={"table-id-"+table.id}
											 bind:checked={table.addAll}
											 on:change={() => {
                           if(!table.addAll) return;
                           table.items = Object.fromEntries($tables[table.id].items.map(item => [item.id, "1d4"]));
                         }}
											 type="checkbox"/>
							</div>
							{#if !table.addAll}
								<div class="item-piles-flexrow item-piles-item-row" style="align-items: center; flex:1;">
									<label
										style="margin-right:5px; text-align: right;">{localize("ITEM-PILES.Merchant.TableTimesToRoll")}</label>
									<input type="text" placeholder="2d6+4" bind:value={table.timesToRoll}
												 style="height:20px; margin: 3px; max-width: 50px; font-size: 0.75rem;"
									/>
								</div>
							{/if}
						</div>
						{#if table.addAll}
							{#each $tables[table.id].items as item (item.id)}
								<div class="item-piles-flexrow item-piles-item-row item-piles-odd-color">
									<div class="item-piles-img-container">
										<img class="item-piles-img" src={item.img}/>
									</div>

									<div class="item-piles-name item-piles-text">
										<div class="item-piles-name-container">
											<a class="item-piles-clickable" on:click={() => previewItem(item)}>{item.text}</a>
										</div>
									</div>

									<div class="item-piles-quantity-container" style="flex:0 1 75px;">
										<div class="item-piles-quantity-input-container">
											<input
												class="item-piles-quantity"
												type="text"
												value={(table?.items?.[item.id] ?? "1d4")}
												on:change={(event) => {
                            table.items[item.id] = event.target.value;
                          }}
											/>
										</div>
									</div>

								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/each}

		<div class="item-piles-flexrow" style="margin-top: 0.5rem; flex-wrap:nowrap;">

			<select bind:value={selectedTable} style="max-width: calc(100% - 81px);">
				{#each selectableTables as [tableId, table] (tableId)}
					<option value={tableId}>{table.name}</option>
				{/each}
				{#if foundry.utils.isEmpty($tables)}
					<option value="">
						{localize("ITEM-PILES.Merchant.NoRollTables")}
					</option>
				{/if}
			</select>

			<button class="item-piles-button" on:click={() => addTable()} style="max-width:80px; min-width:80px;">
				{localize("ITEM-PILES.Merchant.AddTable")}
			</button>

		</div>

		<hr style="margin:5px 0;"/>

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
				<input bind:checked={keepRolled} type="checkbox"/>
			</div>
		</div>

		{#if $itemsRolled.length}
			{#each $itemsRolled as item (item.documentId)}
				<div
					class="item-piles-flexrow item-piles-item-row item-piles-even-color"
				>
					<button
						class="item-piles-rolled-item-button"
						on:click={() => addItem(item)}
						data-fast-tooltip={localize("ITEM-PILES.Merchant.AddItem")}
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
						data-fast-tooltip={localize("ITEM-PILES.Merchant.RemoveItem")}
					>
						<i class="fas fa-trash"/>
					</button>
				</div>
			{/each}

			<div class="item-piles-flexrow" style="margin:5px 0;">

				<button class="item-piles-button" on:click={() => addAllItems()}>
					{localize("ITEM-PILES.Merchant.AddAll")}
					<i class="fas fa-arrow-left"/>
				</button>

				<button class="item-piles-button"
								style="color:red; max-width:30px;"
								on:click={() => { $itemsRolled = []; }}
								data-fast-tooltip={localize("ITEM-PILES.Merchant.ToolTipRemoveAllRolledItems")}>
					<i class="fas fa-trash"/>
				</button>

			</div>
		{/if}

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
    flex: 1 0 auto;
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

