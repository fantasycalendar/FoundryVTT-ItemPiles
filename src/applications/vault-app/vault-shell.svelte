<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import Grid from '../components/Grid/Grid.svelte';

  import * as SharingUtilities from "../../helpers/sharing-utilities.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import PrivateAPI from "../../API/private-api.js";
  import { VaultStore } from "../../stores/vault-store.js";
  import VaultItemEntry from './VaultItemEntry.svelte';
  import { get, writable } from 'svelte/store';

  import CurrencyList from '../components/CurrencyList.svelte';
  import DropZone from '../components/DropZone.svelte';
  import CONSTANTS from '../../constants/constants.js';
  import { snapOnMove } from '../components/Grid/grid-utils';
  import * as Helpers from "../../helpers/helpers.js";

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
            on:hover={hoverOverItem}
            on:leave={hoverLeaveItem}
            let:item
      >
        <VaultItemEntry entry={item}/>
      </Grid>

    </DropZone>

    <CurrencyList {currencies} options={{ reverse: true, abbreviation: false }}>
      <a class="item-piles-flexrow item-piles-item-row" style="flex: 0 1 20px;">
        <i class="fas fa-hand-holding-usd"></i>
      </a>
    </CurrencyList>

  </main>

</ApplicationShell>

<style lang="scss">

  main {
    z-index: 0;
  }

</style>
