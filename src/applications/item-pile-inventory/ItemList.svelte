<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import ItemEntry from "./ItemEntry.svelte";

  export let store;

  const items = store.items;

</script>

<div>

  {#if !!$items.length}

    <div class="flexrow"><h3>{localize("ITEM-PILES.Items")}:</h3></div>

    {#each $items as item (item.id)}
      {#if item.visible}
        <ItemEntry {store} {item}/>
      {/if}
    {/each}

  {/if}

</div>


<style lang="scss">

  .item-piles-items-list {
    max-height: 500px;
    overflow-y: scroll;
    display: block;
    padding-right: 5px;

    .item-pile-shadow {

      position: absolute;
      width: calc(100% - 1rem);
      height: 50px;
      z-index: 25;
      pointer-events: none;
      border-radius: 5px;

      &.scroll-shadow-top {
        box-shadow: inset 0px 22px 15px -14px rgba(0, 0, 0, 0.5);
      }

    }

    .item-piles-change-actor-select {
      display: none;
    }

    .item-piles-add-currency {
      margin-right: 5px;
      flex: 0 1 auto;
      vertical-align: middle;
    }

  }

</style>