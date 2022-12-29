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

  const { application } = getContext('external');

  export let elementRoot;
  export let actor;
  export let recipient;

  export let store = new VaultStore(application, actor, recipient);

  const currencies = store.currencies;
  const pileDataStore = store.pileData;
  const gridDataStore = store.gridData;
  const items = store.gridItems;

  $: pileData = $pileDataStore;
  $: gridData = $gridDataStore;

  const dragPosition = writable({});
  let hoveredItem = "aaaaaaaa";
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

    if (!store.hasSimilarItem(itemData) && !vaultExpander) {

      if (!gridData?.freeSpaces) {
        Helpers.custom_warning(`This vault is full!`, true)
        return false;
      }

      const flags = PileUtilities.getItemFlagData(itemData);
      setProperty(flags, "x", x);
      setProperty(flags, "y", y);
      setProperty(itemData, CONSTANTS.FLAGS.ITEM, flags);

    }

    return PrivateAPI._dropData(canvas, data, { target: store.actor });

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
      TJSContextMenu.create({
        x: event.detail.x,
        y: event.detail.y,
        zIndex: 1000000000000,
        items: [
          {
            icon: 'fas fa-hand', label: "Take", onclick: () => {
              console.log('wat');
            }
          },
          {
            icon: 'fas fa-eye', label: "Inspect", onclick: () => {
              event.detail.item.item.preview();
            }
          }
        ],
        transitionOptions: { duration: 0 }
      })
    })
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <main in:fade={{duration: 500}}>

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

    <div class="item-piles-flexrow" style="margin-top: 0.25rem; align-items: center;">
      <span style="text-align: right; visibility: {showItemName ? 'visible' : 'hidden'};" out:fade={{duration:250}}>{hoveredItem}</span>
    </div>

    <div class="item-piles-flexrow" style="margin-top: 0.25rem;">

      {#if gridData.canWithdraw}
        <button type="button" class="item-piles-small-button">Withdraw</button>
      {/if}

      {#if gridData.canDeposit}
        <button type="button" class="item-piles-small-button">Deposit</button>
      {/if}

      <CurrencyList {currencies} options={{ reverse: true, abbreviation: false, imgSize: 18 }}/>

    </div>

  </main>

</ApplicationShell>

<style lang="scss">

  main {
    z-index: 0;
  }

</style>
