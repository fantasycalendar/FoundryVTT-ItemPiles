<script>
  import CONSTANTS from '../../constants/constants.js';

  import { getContext, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { TJSContextMenu } from "@typhonjs-fvtt/svelte-standard/application";
  import { get, writable } from 'svelte/store';
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  import Grid from '../components/Grid/Grid.svelte';
  import CurrencyList from '../components/CurrencyList.svelte';
  import DropZone from '../components/DropZone.svelte';
  import VaultItemEntry from './VaultItemEntry.svelte';

  import { snapOnMove } from '../components/Grid/grid-utils';
  import * as Helpers from "../../helpers/helpers.js";
  import PrivateAPI from "../../API/private-api.js";

  import { VaultStore } from "../../stores/vault-store.js";
  import Tabs from "../components/Tabs.svelte";
  import VaultExpanderEntry from "./VaultExpanderEntry.svelte";
  import vault from "../item-pile-config/settings/vault.svelte";

  const { application } = getContext('external');

  export let elementRoot;
  export let actor;
  export let recipient;

  export let store = new VaultStore(application, actor, recipient);

  const currencies = store.allCurrencies;
  const pileDataStore = store.pileData;
  const gridDataStore = store.gridData;
  const gridItems = store.gridItems;
  const vaultExpanderItems = store.vaultExpanderItems;
  const searchStore = store.search;
  const logSearchStore = store.logSearch;
  const vaultLog = store.vaultLog;
  const visibleLogItems = store.visibleLogItems;

  $: pileData = $pileDataStore;
  $: gridData = $gridDataStore;

  const dragPosition = writable({});
  let element;

  async function onDropData(data, event, isExpander) {

    const { x, y } = get(dragPosition);
    dragPosition.set({ x: 0, y: 0, w: 1, h: 1, active: false, });

    if (data.type !== "Item") {
      Helpers.custom_warning(`You can't drop documents of type "${data.type}" into this Item Piles vault!`, true)
      return false;
    }

    const item = await Item.implementation.fromDropData(data);

    const itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    const source = (data.uuid ? fromUuidSync(data.uuid) : false)?.parent ?? false;
    const target = store.actor;

    if (source === target) {
      Helpers.custom_warning(`You can't drop items into the vault that originate from the vault!`, true)
      return false;
    }

    if(!source && !game.user.isGM){
      Helpers.custom_warning(`Only GMs can drop items from the sidebar!`, true)
      return false;
    }

    const vaultExpander = getProperty(itemData, CONSTANTS.FLAGS.ITEM + ".vaultExpander");

    if (isExpander && !vaultExpander) {
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.VaultItemNotExpander"), true)
      return false;
    }

    if (!store.hasSimilarItem(itemData) && !vaultExpander && !gridData?.freeSpaces) {
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.VaultFull"), true)
      return false;
    }

    return PrivateAPI._depositItem({
      source,
      target,
      itemData: {
        item: itemData, quantity: 1
      },
      gridPosition: { x, y }
    });

  }

  async function onDragOver(event) {
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) - (gridData.gridSize / 2); //x position within the element.
    const y = (event.clientY - rect.top) - (gridData.gridSize / 2);  //y position within the element.
    dragPosition.set({
      ...snapOnMove(x, y, { w: 1, h: 1 }, { ...gridData }),
      w: 1,
      h: 1,
      active: true
    });
  }

  async function onDragLeave() {
    dragPosition.set({ x: 0, y: 0, w: 1, h: 1, active: false, });
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
          icon: 'fas fa-hand', label: "Take", onclick: () => {
            event.detail.item.item.take();
          }
        });
      }

      if (pileData.canInspectItems || game.user.isGM) {
        contextMenu.push({
          icon: 'fas fa-eye', label: "Inspect", onclick: () => {
            event.detail.item.item.preview();
          }
        });
      }

      Hooks.call(CONSTANTS.HOOKS.PILE.PRE_RIGHT_CLICK_ITEM, event.detail.item.item.item, contextMenu, actor, recipient);

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

  let activeTab = writable("vault");

  const applicationHeight = application.position.stores.height;
  const applicationWidth = application.position.stores.width;
  const applicationLeft = application.position.stores.left;
  const defaultWidth = get(application.position.stores.width);

  $: {
    if($activeTab === "vault" && $applicationWidth){
      application.position.stores.width.set(defaultWidth);
    }
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <main in:fade={{duration: 500}} class="item-piles-flexcol">

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

      <DropZone callback={onDropData} overCallback={onDragOver} leaveCallback={onDragLeave}
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
              dropGhost={$dragPosition}
              on:change={(event) => store.updateGrid(event.detail.items)}
              on:rightclick={rightClickItem}
              on:doubleclick={doubleClickItem}
              let:item
        >
          <VaultItemEntry entry={item}/>
        </Grid>

      </DropZone>

      {#if store.recipient && (gridData.canWithdrawCurrencies || gridData.canDepositCurrencies)}
        <div class="item-piles-flexrow item-piles-top-divider" style="flex: 0 1 auto; align-items: center;">
          <span>
            <a on:click={() => {
              const [appPosition, actorPosition] = Helpers.getApplicationPositions(application, store.recipient.sheet);
              application.position.stores.left.set(appPosition.left);
              application.position.stores.top.set(appPosition.top);
              store.recipient.sheet.render(true, actorPosition);
            }}>
              <i class="fa-solid fa-suitcase"></i>
              {localize("ITEM-PILES.Vault.ViewingAs", { actor_name: store.recipient.name })}
            </a>
          </span>
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
        </div>
      {/if}

      <div class="item-piles-flexrow" style="margin-top: 0.25rem; flex:0 1 auto;">

        <CurrencyList {currencies}
                      options={{ abbreviation: false, imgSize: 18, abbreviateNumbers: true, reverse: true }}
                      style="align-items: center;">
          {#if gridData.canEditCurrencies}
            <a style="order: -1; display:flex; margin-left: 0.25rem;" on:click={() => store.addCurrency()}>
              <i class="fas fa-cog"></i>
            </a>
          {/if}
        </CurrencyList>

      </div>

    {/if}

    {#if $activeTab === "expanders"}

      <DropZone callback={(data, event) => { onDropData(data, event, true) }}
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
            <a on:click={() => { $visibleLogItems += 20; }}><i>Load more transactions ({$visibleLogItems} / {$vaultLog.length})...</i></a>
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
