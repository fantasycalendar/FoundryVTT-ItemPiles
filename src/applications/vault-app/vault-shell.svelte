<script>
  import CONSTANTS from '../../constants/constants.js';

  import { getContext, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { TJSContextMenu } from "@typhonjs-fvtt/svelte-standard/application";
  import { get, writable } from 'svelte/store';

  import Grid from '../components/Grid/Grid.svelte';
  import CurrencyList from '../components/CurrencyList.svelte';
  import DropZone from '../components/DropZone.svelte';
  import VaultItemEntry from './VaultItemEntry.svelte';

  import { snapOnMove } from '../components/Grid/grid-utils';
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import * as Helpers from "../../helpers/helpers.js";
  import PrivateAPI from "../../API/private-api.js";

  import { VaultStore } from "../../stores/vault-store.js";
  import DropCurrencyDialog from "../dialogs/drop-currency-dialog/drop-currency-dialog.js";

  const { application } = getContext('external');

  export let elementRoot;
  export let actor;
  export let recipient;

  export let store = new VaultStore(application, actor, recipient);

  const currencies = store.allCurrencies;
  const pileDataStore = store.pileData;
  const gridDataStore = store.gridData;
  const items = store.gridItems;

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

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <main in:fade={{duration: 500}}>

    <div class="item-piles-flexrow" style="align-items: center; margin-bottom: 0.25rem;">
      <span style="font-size: 1.5rem;">Vault</span>
      {#if store.recipient}
        <div class="item-piles-flexcol" style="text-align: right; flex: 1 0 auto;">
          <i>Viewing as {store.recipient.name}</i>
        </div>
      {/if}
    </div>

    <DropZone callback={onDropData} overCallback={onDragOver} leaveCallback={onDragLeave}>

      <Grid bind:items={$items}
            bind:gridContainer={element}
            options={{
              ...gridData,
              class: "item-piles-grid-background",
              activeClass: "item-piles-grid-item-active",
              previewClass: "item-piles-grid-item-preview",
              collisionClass: "item-piles-grid-item-collision",
              hoverClass: "item-piles-grid-item-hover",
              backgroundGrid: true
            }}
            dropGhost={$dragPosition}
            on:change={(event) => store.updateGrid(event.detail.items)}
            on:rightclick={rightClickItem}
            on:hover={hoverOverItem}
            on:leave={hoverLeaveItem}
            let:item
      >
        <VaultItemEntry entry={item}/>
      </Grid>

    </DropZone>

    <div class="item-piles-flexrow" style="margin-top: 0.25rem;">

      {#if gridData.canWithdrawCurrencies}
        <button type="button" class="item-piles-small-button">Withdraw</button>
      {/if}

      {#if gridData.canDepositCurrencies}
        <button type="button" class="item-piles-small-button">Deposit</button>
      {/if}

      <CurrencyList {currencies} options={{ reverse: true, abbreviation: false, imgSize: 18 }}
                    style="align-items: center;">
        {#if gridData.canEditCurrencies}
          <a style="order:-1; display:flex; margin-left: 0.25rem;" on:click={() => store.addCurrency()}>
            <i class="fas fa-cog"></i>
          </a>
        {/if}
      </CurrencyList>

    </div>

  </main>

</ApplicationShell>

<style lang="scss">

  main {
    z-index: 0;
  }

</style>
