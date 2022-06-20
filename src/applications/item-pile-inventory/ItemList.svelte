<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import ListEntry from "./ListEntry.svelte";

  export let store;
  const itemStore = store.items;
  const numItemsStore = store.numItems;

  $: items = $itemStore;

</script>

<div>

  {#if $numItemsStore > 0}

    <div class="flexrow"><h3>{localize("ITEM-PILES.Items")}:</h3></div>

    {#each items as item (`${item.name}-${item.type}`)}
      {#if item.visible}
        <ListEntry {store} data={item}/>
      {/if}
    {/each}

  {/if}

</div>