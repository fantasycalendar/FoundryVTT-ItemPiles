<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import { fade } from 'svelte/transition';
  import MerchantItemEntry from "./MerchantItemEntry.svelte";

  export let store;

  const searchStore = store.search;
  const itemsPerCategoryStore = store.itemsPerCategory;
  const categoryStore = store.categories;
  const priceModifiersPerType = store.priceModifiersPerType;

  $: editPrices = false;

</script>

{#each $categoryStore as category, index (category.type)}
  <div in:fade|local={{duration: 150}}>
    <h3 class="merchant-item-group-type item-piles-flexrow">
      <div>
        {localize(category.label)}
      </div>
    </h3>

    <div class="item-piles-items-list">
      {#each $itemsPerCategoryStore[category.type] as item (item.id)}
        <MerchantItemEntry {store} {item} selling/>
      {/each}
    </div>
  </div>
{/each}

{#if !$categoryStore.length}

  <div style="height: 100%;" class="item-piles-flexcol align-center-col">

    <span class="align-center-row" style="font-size:1.25rem; opacity: 0.8; text-align: center;">
      {localize("ITEM-PILES.Merchant.NoItemsToSell")}
    </span>

  </div>

{/if}

<style lang="scss">

  .merchant-item-group-type {
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    margin-top: 10px;
    padding-right: 10px;

    .price-header {
      flex: 0 1 250px;
      padding-right: 10px;
      justify-content: center;
      display: flex;
      align-items: center;

      input[type="checkbox"] {
        height: 15px;
      }
    }
  }

  .item-piles-items-list {
    overflow: visible;
    padding-right: 10px;
  }

</style>