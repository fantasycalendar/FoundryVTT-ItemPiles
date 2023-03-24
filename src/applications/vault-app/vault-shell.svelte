<script>
  import CONSTANTS from '../../constants/constants.js';

  import { getContext, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { TJSContextMenu } from "@typhonjs-fvtt/svelte-standard/application";
  import { get, writable } from 'svelte/store';
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  import ItemPileInventoryApp from "../item-pile-inventory-app/item-pile-inventory-app.js";
  import VaultApp from "./vault-app.js";

  import Grid from '../components/Grid/Grid.svelte';
  import CurrencyList from '../components/CurrencyList.svelte';
  import DropZone from '../components/DropZone.svelte';
  import VaultItemEntry from './VaultItemEntry.svelte';

  import { snapOnMove } from '../components/Grid/grid-utils';
  import * as Helpers from "../../helpers/helpers.js";

  import { VaultStore } from "../../stores/vault-store.js";
  import Tabs from "../components/Tabs.svelte";
  import VaultExpanderEntry from "./VaultExpanderEntry.svelte";
  import vault from "../item-pile-config/settings/vault.svelte";
  import { FloatingElement } from "../components/FloatingElement/FloatingElement.js";
  import { isCoordinateWithinPosition } from "../../helpers/helpers.js";

  const { application } = getContext('#external');

  export let elementRoot;
  export let actor;
  export let recipient;

  export let store = VaultStore.make(application, actor, recipient);

  const currencies = store.allCurrencies;
  const pileDataStore = store.pileData;
  const gridDataStore = store.gridData;
  const gridItems = store.gridItems;
  const vaultExpanderItems = store.vaultExpanderItems;
  const searchStore = store.search;
  const logSearchStore = store.logSearch;
  const vaultLog = store.vaultLog;
  const visibleLogItems = store.visibleLogItems;
  const recipientDocument = store.recipientDocument;
  const pileCurrencies = store.pileCurrencies;
  const dragPositionStore = store.dragPosition;

  $: pileData = $pileDataStore;
  $: gridData = $gridDataStore;

  const floatingElementPositionStore = FloatingElement.positionStore;
  let element;

  function onDragOverEvent(event){
    onDragOver(event.clientX, event.clientY);
	}

  $: {
    if($floatingElementPositionStore){
      onDragOver($floatingElementPositionStore?.x + 20, $floatingElementPositionStore?.y + 20);
    }else{
      onDragLeave();
		}
  }

  async function onDragOver(clientX, clientY) {
    const rect = element.getBoundingClientRect();
    if(FloatingElement.id === application.id || !isCoordinateWithinPosition(clientX, clientY, rect)) {
      return onDragLeave();
    }
    const x = (clientX - rect.left) - (gridData.gridSize / 2); //x position within the element.
    const y = (clientY - rect.top) - (gridData.gridSize / 2);  //y position within the element.
    dragPositionStore.set({
      ...snapOnMove(x, y, { w: 1, h: 1 }, { ...gridData }),
      w: 1,
      h: 1,
      active: true
    });
  }

  async function onDragLeave() {
    dragPositionStore.set({ x: 0, y: 0, w: 1, h: 1, active: false, });
  }

  onDestroy(() => {
    store.onDestroy();
  });

  function doubleClickItem(event) {
    if (!gridData.canWithdrawItems) return;
    event.detail.item.item.take();
  }

  function rightClickItem(event) {
    setTimeout(() => {

      const contextMenu = []

      if (gridData.canWithdrawItems) {
        contextMenu.push({
          icon: 'fas fa-hand', label: "Take", onPress: () => {
            event.detail.item.item.take();
          }
        });
      }

      const quantity = get(event.detail.item.item.quantity);
      const freeSpacesAfterSplit = gridData.freeSpaces;

      if((gridData.canDepositItems || game.user.isGM) && event.detail.item.item.canStack && quantity > 1 && freeSpacesAfterSplit) {
        contextMenu.push({
          icon: 'fas fa-object-ungroup', label: "Split", onPress: () => {
            beginSplitItem(event)
          }
        });
      }

      if (pileData.canInspectItems || game.user.isGM) {
        contextMenu.push({
          icon: 'fas fa-eye', label: "Inspect", onPress: () => {
            event.detail.item.item.preview();
          }
        });
      }

      Hooks.call(CONSTANTS.HOOKS.PILE.PRE_RIGHT_CLICK_ITEM, event.detail.item.item.item, contextMenu, actor, store.recipient);

      if (!contextMenu.length) return;

      TJSContextMenu.create({
        x: event.detail.x,
        y: event.detail.y,
        zIndex: 1000000000000,
        transitionOptions: { duration: 0 },
        items: contextMenu
      })
    })
  }

  function beginSplitItem(event){

    const { item, splitStart, x, y } = event.detail;

    FloatingElement.create({
      id: application.id,
      x,
      y,
      style: {
        width: gridData.gridSize + "px",
        height: gridData.gridSize + "px",
        opacity: 0.7,
      },
      component: VaultItemEntry,
      componentData: { entry: item }
    });

    splitStart({
			pageX: x,
			pageY: y,
			offsetX: Math.floor(gridData.gridSize / 2),
			offsetY: Math.floor(gridData.gridSize / 2)
		});

	}

  function itemBeginDrag(event){
    const { x, y, item } = event.detail;
    FloatingElement.create({
			id: application.id,
      x,
      y,
      style: {
        width: gridData.gridSize + "px",
        height: gridData.gridSize + "px",
				opacity: 0.7,
			},
      component: VaultItemEntry,
			componentData: { entry: item }
    })
	}

  function itemStopDrag(event){

    if(!FloatingElement.id) return;

    FloatingElement.destroy();

    if(event.detail.cancelled) return;

    const { item, outOfBounds, x, y, gridX, gridY, splitting } = event.detail;

    if(splitting){
      if(outOfBounds) return;
      item.item.split(gridX, gridY);
      return;
		}

    if(!outOfBounds) return;

    const hitApps = Object.values(ui.windows)
			.sort((a, b) => b.position.zIndex - a.position.zIndex)
			.filter(app => {
				return (app instanceof ActorSheet || app instanceof ItemPileInventoryApp || app instanceof VaultApp)
					&& isCoordinateWithinPosition(x, y, app.element[0].getBoundingClientRect());
			});

    let dropData = {
      type: "Item",
      uuid: item.item.item.uuid
		}
    if(hitApps.length){
      if(hitApps[0] === application) return;
      dropData.target = hitApps[0].actor;
      if(hitApps[0] instanceof VaultApp){
        return hitApps[0].store.onDropData(dropData);
      }
		}else{
      const mouse = canvas.app.renderer.plugins.interaction.mouse;
      const position = mouse.getLocalPosition(canvas.app.stage);
      dropData.x = position.x;
      dropData.y = position.y;
		}

		Hooks.call("dropCanvasData", canvas, dropData);

  }

  function itemMove(event){
    const { x, y } = event.detail;
    if(!FloatingElement.id) return;
    FloatingElement.positionStore.set({ x, y });
	}

  let activeTab = writable("vault");

  const applicationHeight = application.position.stores.height;
  const applicationWidth = application.position.stores.width;
  const applicationLeft = application.position.stores.left;
  const defaultWidth = get(application.position.stores.width);

  $: {
    if ($activeTab === "vault" && $applicationWidth) {
      application.position.stores.width.set(defaultWidth);
    }
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<main class="item-piles-flexcol" bind:this={store.mainContainer} in:fade={{duration: 500}}>

		{#if gridData.fullAccess && (pileData.vaultExpansion || pileData.logVaultActions)}
			<Tabs bind:activeTab={$activeTab} tabs={[
        {
          value: "vault",
          label: "ITEM-PILES.Vault.VaultTab",
          icon: "fas fa-vault",
        },
        {
          value: "expanders",
          label: "ITEM-PILES.Vault.ExpandersTab",
          icon: "fas fa-maximize",
          hidden: !pileData.vaultExpansion || !gridData.fullAccess
        },
        {
          value: "log",
          label: "ITEM-PILES.Vault.LogTab",
          icon: "fas fa-note-sticky",
          hidden: !pileData.logVaultActions || !gridData.fullAccess
        }
      ]} style="flex: 0 1 auto; margin-bottom: 0.5rem; padding-bottom: 0.5rem;"/>
		{/if}

		{#if $activeTab === "vault"}

			<div class="form-group item-piles-flexrow item-piles-bottom-divider"
					 style="margin: 0.25rem 0; align-items: center; flex: 0 1 auto;">
				<label style="flex:0 1 auto; margin-right: 5px;">Search:</label>
				<input type="text" bind:value={$searchStore}>
			</div>

			<DropZone callback={(data) => store.onDropData(data)} overCallback={onDragOverEvent} leaveCallback={onDragLeave}
								style="display: flex; flex: 1; justify-content: center; align-items: center;">

				<Grid bind:items={$gridItems}
							bind:gridContainer={element}
							options={{
              ...gridData,
              class: "item-piles-grid-background",
              activeClass: "item-piles-grid-item-active",
              previewClass: "item-piles-grid-item-preview",
              collisionClass: "item-piles-grid-item-collision",
              hoverClass: "item-piles-grid-item-hover",
              highlightClass: "item-piles-grid-item-highlight",
              dimClass: "item-piles-grid-item-dim",
              backgroundGrid: true,
              highlightItems: !!$searchStore
            }}
							dropGhost={$dragPositionStore}
							on:change={(event) => store.updateGrid(event.detail.items)}
							on:itembegindrag={itemBeginDrag}
							on:itemstopdrag={itemStopDrag}
							on:itemmove={itemMove}
							on:rightclick={rightClickItem}
							on:doubleclick={doubleClickItem}
							let:item
				>
					<VaultItemEntry entry={item}/>
				</Grid>

			</DropZone>

			{#if $recipientDocument?.name}
				<div class="item-piles-flexrow item-piles-top-divider" style="flex: 0 1 auto; align-items: center;">
          <span>
            <a on:click={() => {
              const [appPosition, actorPosition] = Helpers.getApplicationPositions(application, store.recipient.sheet);
              application.position.stores.left.set(appPosition.left);
              application.position.stores.top.set(appPosition.top);
              store.recipient.sheet.render(true, actorPosition);
            }}>
              <i class="fa-solid fa-suitcase"></i>
							{localize("ITEM-PILES.Vault.ViewingAs", { actor_name: $recipientDocument.name })}
            </a>
          </span>
					{#if $pileCurrencies.length && (gridData.canDepositCurrencies || gridData.canWithdrawCurrencies)}
						<div style="flex:0 1 auto; justify-self: flex-end; display: flex; justify-content: flex-end;">
							{#if gridData.canWithdrawCurrencies}
								<button type="button" class="item-piles-small-button" on:click={() => store.withdrawCurrency()}>
									{localize("ITEM-PILES.Vault.Withdraw")}
								</button>
							{/if}
							{#if gridData.canDepositCurrencies}
								<button type="button" class="item-piles-small-button" on:click={() => store.depositCurrency()}>
									{localize("ITEM-PILES.Vault.Deposit")}
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			{#if $pileCurrencies.length}
				<div class="item-piles-flexrow" style="margin-top: 0.25rem; flex:0 1 auto;">

					<CurrencyList {currencies}
												options={{ abbreviations: false, imgSize: 18, abbreviateNumbers: true, reverse: true }}
												style="align-items: center;">
						{#if gridData.canEditCurrencies}
							<a style="order: -1; display:flex; margin-left: 0.25rem;" on:click={() => store.addCurrency()}>
								<i class="fas fa-cog"></i>
							</a>
						{/if}
					</CurrencyList>

				</div>
			{/if}

		{/if}

		{#if $activeTab === "expanders"}

			<DropZone callback={(data, event) => { store.onDropData(data, event, true) }}
								style="display: flex; flex-direction: column; flex:1;">

				<div style="text-align: center;" class="item-piles-bottom-divider">
					{@html localize("ITEM-PILES.Vault." + (
            gridData.totalSpaces === gridData.enabledSpaces
              ? "CapacityFull"
              : (gridData.enabledSpaces ? "CapacityLeft" : "NeedsCapacity")), {
            total_capacity: `<strong>${gridData.totalSpaces}</strong>`,
            capacity: `<strong>${gridData.enabledSpaces}</strong>`,
          })}
				</div>

				<div class="item-piles-items-list">

					{#each $vaultExpanderItems as item (item.id)}
						<VaultExpanderEntry {store} bind:item={item}/>
					{/each}

				</div>

				{#if !$vaultExpanderItems.length}
					<div style="flex: 1 0 auto; display: flex; align-items: center; place-content: center;">
						<i>Drag and drop items to expand spaces</i>
					</div>
				{/if}

			</DropZone>

		{/if}

		{#if $activeTab === "log"}

			<div class="form-group item-piles-flexrow item-piles-bottom-divider"
					 style="margin: 0.25rem 0; align-items: center; flex: 0 1 auto;">
				<label style="flex:0 1 auto; margin-right: 5px;">Log search:</label>
				<input type="text" bind:value={$logSearchStore}>
			</div>

			<div class="item-piles-vault-log"
					 style="max-height: {$applicationHeight-130}px; overflow-y: scroll; font-size: 0.75rem; padding-right: 0.5rem;">

				{#each $vaultLog.slice(0, $visibleLogItems).filter(log => log.visible) as log, index (index)}
					<div
						class:item-piles-log-deposit={log.action === "deposited" || (!log.action && log.qty > 0)}
						class:item-piles-log-withdrawal={log.action === "withdrew" || (!log.action && log.qty < 0)}
						class:item-piles-log-other={log.action && log.action !== "deposited" && log.action !== "withdrew"}
					>
						{@html log.text} - {Helpers.timeSince(log.date)} ago
					</div>
				{/each}

				{#if $vaultLog.length > $visibleLogItems}
					<div class="item-piles-top-divider" style="text-align: center;">
						<a on:click={() => { $visibleLogItems += 20; }}><i>Load more transactions ({$visibleLogItems}
							/ {$vaultLog.length})...</i></a>
					</div>
				{/if}

			</div>

		{/if}

	</main>

</ApplicationShell>

<style lang="scss">

  main {
    z-index: 0;
  }

</style>
