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
  import ActorPicker from "../components/ActorPicker.svelte";

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

  $: pileData = $pileDataStore;
  $: gridData = $gridDataStore;

  const dragPosition = writable({});
  let hoveredItem = "";
  let element;

  async function onDropData(data) {

    const { x, y } = get(dragPosition);
    dragPosition.set({ x: 0, y: 0, w: 1, h: 1, active: false, });

    if (data.type !== "Item") {
      Helpers.custom_warning(`You can't drop documents of type "${data.type}" into this Item Piles vault!`, true)
      return false;
    }

    const item = await Item.implementation.fromDropData(data);

    if (item.parent === store.actor) {
      Helpers.custom_warning(`You can't drop items into the vault that originate from the vault!`, true)
      return false;
    }

    const itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    const vaultExpander = getProperty(itemData, CONSTANTS.FLAGS.ITEM + ".vaultExpander");

    if (!store.hasSimilarItem(itemData) && !vaultExpander && !gridData?.freeSpaces) {
      Helpers.custom_warning(`This vault is full!`, true)
      return false;
    }

    return PrivateAPI._dropData(canvas, data, { target: store.actor, gridPosition: { x, y } });

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

  let showItemName = false;
  let timer = false;

  function hoverOverItem(event) {
    clearTimeout(timer);
    showItemName = true;
    hoveredItem = get(event.detail.item.item.name);
  }

  function hoverLeaveItem() {
    timer = setTimeout(() => {
      showItemName = false;
    }, 250);
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

      const items = []

      if (gridData.canWithdrawItems) {
        items.push({
          icon: 'fas fa-hand', label: "Take", onclick: () => {
            event.detail.item.item.take();
          }
        });
      }

      if (pileData.canInspectItems || game.user.isGM) {
        items.push({
          icon: 'fas fa-eye', label: "Inspect", onclick: () => {
            event.detail.item.item.preview();
          }
        });
      }

      if (!items.length) return;

      TJSContextMenu.create({
        x: event.detail.x,
        y: event.detail.y,
        zIndex: 1000000000000,
        transitionOptions: { duration: 0 },
        items
      })
    })
  }

  let tabs = [];
  $: {
    tabs = [
      {
        value: "vault",
        label: "ITEM-PILES.Vault.VaultTab"
      },
      {
        value: "expanders",
        label: "ITEM-PILES.Vault.ExpandersTab"
      }
    ]
  }

  let activeTab = "vault";

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <main in:fade={{duration: 500}} class="item-piles-flexcol">

    <Tabs bind:activeTab bind:tabs
          style="font-size: 1.25rem; flex: 0 1 auto; margin-bottom: 0.25rem; padding-bottom: 0.25rem;"/>

    {#if activeTab === "vault"}

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
              on:hover={hoverOverItem}
              on:leave={hoverLeaveItem}
              on:doubleclick={doubleClickItem}
              let:item
        >
          <VaultItemEntry entry={item}/>
        </Grid>

      </DropZone>

      <div class="item-piles-flexrow" style="margin-top: 0.5rem; min-height: 17px; flex: 0 1 auto;">
        <div>
          {#if showItemName}
            <i out:fade={{ duration:100 }}>{hoveredItem}</i>
          {/if}
        </div>
        <div style="flex:1; justify-self: flex-end; display: flex; justify-content: flex-end;">
          {#if gridData.canWithdrawCurrencies}
            <button type="button" class="item-piles-small-button">
              {localize("ITEM-PILES.Vault.Withdraw")}
            </button>
          {/if}
          {#if gridData.canDepositCurrencies}
            <button type="button" class="item-piles-small-button">
              {localize("ITEM-PILES.Vault.Deposit")}
            </button>
          {/if}
        </div>
      </div>

      <div class="item-piles-flexrow" style="margin-top: 0.25rem; flex:0 1 auto;">

        <CurrencyList {currencies}
                      options={{ reverse: true, abbreviation: false, imgSize: 18, abbreviateNumbers: true }}
                      style="align-items: center;">
          {#if gridData.canEditCurrencies}
            <a style="order:-1; display:flex; margin-left: 0.25rem;" on:click={() => store.addCurrency()}>
              <i class="fas fa-cog"></i>
            </a>
          {/if}
        </CurrencyList>

      </div>

    {/if}

    {#if activeTab === "expanders"}

      <DropZone callback={onDropData} style="flex:1;">

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

      </DropZone>

    {/if}

  </main>

</ApplicationShell>

<style lang="scss">

  main {
    z-index: 0;
  }

</style>
