<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import ListEntry from "./ListEntry.svelte";

  export let store;
  const itemStore = store.items;

</script>

<div>

  <div class="flexrow"><h3>{localize("ITEM-PILES.Items")}:</h3></div>

  {#each $itemStore as item (item.identifier)}
    <ListEntry {store} bind:entry={item}/>
  {/each}

</div>