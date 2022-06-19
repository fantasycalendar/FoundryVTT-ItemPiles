<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import ItemEntry from "./ItemEntry.svelte";

  export let store;
  const itemStore = store.items;

  let hasItems;
  let items;

  $: {
    items = $itemStore;
    hasItems = !!items.length;
  }

</script>

<div>

  {#if hasItems}

    <div class="flexrow"><h3>{localize("ITEM-PILES.Items")}:</h3></div>

    {#each items as item (item.id)}
      {#if item.visible}
        <ItemEntry {store} {item}/>
      {/if}
    {/each}

  {/if}

</div>