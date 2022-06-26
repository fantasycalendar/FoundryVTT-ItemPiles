<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import ListEntry from "./ListEntry.svelte";

  export let store;
  const items = store.items;
  const numItems = store.numItems;

</script>

<div>

  {#if $numItems > 0}
    <div class="flexrow"><h3>{localize("ITEM-PILES.Items")}:</h3></div>

    {#each $items as item (item.identifier)}
      <ListEntry {store} bind:entry={item}/>
    {/each}

  {/if}

</div>