<script>

  import SliderInput from "../components/SliderInput.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let store;
  export let category;

  const pileData = store.pileData;
  const searchStore = store.search;
  const visibleItemsStore = store.visibleItems;
  const itemsPerCategoryStore = store.itemsPerCategory;
  const categoryStore = store.categories;
  const priceModifiersPerType = store.priceModifiersPerType;
  const itemCategoriesStore = store.itemCategories;
  const typeFilterStore = store.typeFilter;
  const editPrices = store.editPrices;

</script>

<div class="merchant-item-group-type item-piles-flexrow">
	{#if !$editPrices}
		<h3>{localize(category.label)}</h3>
	{:else}
		<div class="price-header" style="font-size: 0.75rem;">
			{#if $priceModifiersPerType[category.type]}
				{localize("ITEM-PILES.Merchant.Override")}:
				<input type="checkbox" bind:checked={$priceModifiersPerType[category.type].override}>
				<SliderInput bind:value={$priceModifiersPerType[category.type].buyPriceModifier}/>
			{/if}
		</div>
		<div style="flex: 0 1 auto">
			{#if $priceModifiersPerType[category.type]}
				<i class="fas fa-times item-piles-clickable-red"
					 on:click={() => { store.removeOverrideTypePrice(category.type) }}></i>
			{:else}
				<i class="fas fa-plus item-piles-clickable-green"
					 on:click={() => { store.addOverrideTypePrice(category.type) }}></i>
			{/if}
		</div>
	{/if}
</div>


<style lang="scss">

  .merchant-item-group-type {
    align-items: center;
    height: 1.5rem;
    margin-top: 10px;
    margin-bottom: 5px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);

    h3 {
      margin: 0;
    }

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
</style>
