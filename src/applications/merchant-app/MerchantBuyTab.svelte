<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import { fade } from 'svelte/transition';
  import SliderInput from "../components/SliderInput.svelte";
  import MerchantItemEntry from "./MerchantItemEntry.svelte";

  export let store;

  const searchStore = store.search;
  const itemsPerCategoryStore = store.itemsPerCategory;
  const categoryStore = store.categories;
  const priceModifiersPerType = store.priceModifiersPerType;
  const itemCategoriesStore = store.itemCategories;
  const typeFilterStore = store.typeFilter;

  $: editPrices = false && !!store.recipient;

</script>

<div>

  <div class="item-piles-flexrow">
    <input type="text" bind:value={$searchStore} placeholder="Type to search...">
    <select style="flex:0 1 auto; margin-left: 0.4rem; height: 26px;" bind:value={$typeFilterStore}>
      <option value="all">{localize("All")}</option>
      {#each $itemCategoriesStore as category (category.type)}
        <option value={category.type}>{category.label}</option>
      {/each}
    </select>
  </div>

  {#each $categoryStore as category, index (category.type)}
    <div transition:fade|local={{duration: 150}}>
      <h3 class="merchant-item-group-type item-piles-flexrow">
        <div>
          {localize(category.label)}
        </div>
        <div class="price-header">
          {#if editPrices}
            {#if $priceModifiersPerType[category.type]}
              Override:
              <input type="checkbox" bind:checked={$priceModifiersPerType[category.type].override}>
              <SliderInput bind:value={$priceModifiersPerType[category.type].buyPriceModifier}/>
            {/if}
          {/if}
        </div>
        <div style="flex: 0 1 auto">
          {#if editPrices}
            {#if $priceModifiersPerType[category.type]}
              <i class="fas fa-times item-piles-clickable-red"
                 on:click={() => { store.removeOverrideTypePrice(category.type) }}></i>
            {:else}
              <i class="fas fa-plus item-piles-clickable-green"
                 on:click={() => { store.addOverrideTypePrice(category.type) }}></i>
            {/if}
          {/if}
        </div>
      </h3>

      <div class="item-piles-items-list">
        {#each $itemsPerCategoryStore[category.type] as item (item.id)}
          <MerchantItemEntry {store} {item}/>
        {/each}
      </div>
    </div>
  {/each}

</div>

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