<script>
  import { getContext, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import Grid from '../components/Grid/Grid.svelte';
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { VaultStore } from "../../stores/vault-store.js";
  import VaultItemEntry from './VaultItemEntry.svelte';
  import { get, writable } from 'svelte/store';

  import CurrencyList from '../components/CurrencyList.svelte';
  import DropZone from '../components/DropZone.svelte';
  import CONSTANTS from '../../constants/constants.js';
  import { snapOnMove } from '../components/Grid/grid-utils';
  import * as Helpers from "../../helpers/helpers.js";
  import { TJSContextMenu } from "@typhonjs-fvtt/svelte-standard/application";

  const { application } = getContext('external');

  export let elementRoot;
  export let actor;
  export let recipient;

  export let store = new VaultStore(application, actor, recipient);

  const currencies = store.currencies;
  const pileDataStore = store.pileData;
  const items = store.grid;

  const gap = 4;

  $: pileData = $pileDataStore;

  const dragPosition = writable({});
  let hoveredItem = "";
  let element;

  async function onDropData(data) {

    if (data.type !== "Item") {
      Helpers.custom_warning(`You can't drop documents of type "${data.type}" into this Item Piles vault!`)
      return false;
    }

    if (!store.freeSpaces) {
      Helpers.custom_warning(`This vault is full!`)
      return false;
    }

    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    const flags = PileUtilities.getItemFlagData(itemData);

    const { x, y } = get(dragPosition);

    dragPosition.set({ x: 0, y: 0, w: 1, h: 1, active: false, });

    setProperty(flags, "x", x);
    setProperty(flags, "y", y);

    setProperty(itemData, CONSTANTS.FLAGS.ITEM, flags);

    await game.itempiles.API.addItems(store.actor, [itemData]);

  }

  async function onDragOver(event) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left; //x position within the element.
    const y = event.clientY - rect.top;  //y position within the element.
    dragPosition.set({
      ...snapOnMove(x, y, { w: 1, h: 1 }, { ...pileData, gap }),
      w: 1,
      h: 1,
      active: true
    });
  }

  async function onDragLeave() {
    dragPosition.set({ x: 0, y: 0, w: 1, h: 1, active: false, });
  }

  let showItemName = false;

  function hoverOverItem(event) {
    showItemName = true;
    hoveredItem = get(event.detail.item.item.name);
  }

  function hoverLeaveItem(event) {
    showItemName = false;
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

    <div class="item-piles-flexrow" style="margin-bottom: 0.25rem; align-items: center;">
      <span style="font-size:1.25rem;">Vault</span>
      {#if showItemName}
        <span style="text-align: right;" transition:fade={{duration:100}}>{hoveredItem}</span>
      {/if}
    </div>

    <DropZone callback={onDropData} overCallback={onDragOver} leaveCallback={onDragLeave}>

      <Grid bind:items={$items}
            bind:gridContainer={element}
            options={{
              ...pileData,
              bounds: true,
              gap,
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

    <div class="item-piles-flexrow" style="margin-top: 0.5rem;">

      <button type="button" class="item-piles-small-button">Withdraw</button>

      <button type="button" class="item-piles-small-button">Deposit</button>

      <CurrencyList {currencies} options={{ reverse: true, abbreviation: false, imgSize: 18 }}/>

    </div>

  </main>

</ApplicationShell>

<style lang="scss">

  main {
    z-index: 0;
  }

</style>
