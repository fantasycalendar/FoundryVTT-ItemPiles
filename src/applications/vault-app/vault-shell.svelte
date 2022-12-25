<script>
  import { getContext, onDestroy } from 'svelte';
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

  const { application } = getContext('external');

  export let elementRoot;
  export let actor;
  export let recipient;

  export let store = new VaultStore(application, actor, recipient);

  const currencies = store.currencies;
  const pileDataStore = store.pileData;
  const gridStore = store.grid;

  const gap = 4;

  $: pileData = $pileDataStore;

  const dragPosition = writable({});

  async function onDropData(data, event) {

    if(data.type !== "Item") return false;

    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    const flags = PileUtilities.getItemFlagData(itemData);

    const { x, y } = get(dragPosition);

    dragPosition.set({
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      active: false,
    });

    setProperty(flags, "x", x);
    setProperty(flags, "y", y);

    setProperty(itemData, CONSTANTS.FLAGS.ITEM, flags);

    await game.itempiles.API.addItems(store.actor, [itemData]);

  }

  async function onDragOver(event) {
    dragPosition.set({
      x: Math.min(Math.floor(event.offsetX/(pileData.gridSize+gap)), pileData.enabledColumns-1),
      y: Math.min(Math.floor(event.offsetY/(pileData.gridSize+gap)), pileData.enabledRows-1),
      w: 1,
      h: 1,
      active: true
    })
  }

  onDestroy(() => {
    store.onDestroy();
  });

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <main in:fade={{duration: 500}}>
    
    <DropZone callback={onDropData} on:dragover={onDragOver}>

      <Grid bind:items={$gridStore}
            options={{
              gridSize: pileData.gridSize,
              cols: pileData.columns,
              rows: pileData.rows,
              enabledCols: pileData.enabledColumns,
              enabledRows: pileData.enabledRows,
              bounds: true,
              gap,
              class: "item-piles-grid-background",
              activeClass: "item-piles-grid-item-active",
              previewClass: "item-piles-grid-item-preview",
              collisionClass: "item-piles-grid-item-collision",
              backgroundGrid: true
            }}
            dropGhost={$dragPosition}
            on:change={(event) => store.updateGrid(event.detail.items)}
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
