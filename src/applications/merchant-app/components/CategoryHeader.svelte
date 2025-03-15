<script>

	import SliderInput from "../../components/SliderInput.svelte";
	import { localize } from "#runtime/util/i18n";

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
	const columns = store.itemColumns;

	$: colSpan = $editPrices ? $columns.length + 1 : 1;
	$: type = category.type === "custom" ? category.label.toLowerCase() : category.type;

</script>

<div class="merchant-item-group-type item-piles-flexrow" style="grid-column: 1/{colSpan};">
	<h3>{localize(category.label)}</h3>
	{#if $editPrices}
		<div class="price-header" style="font-size: 0.75rem;">
			{#if $priceModifiersPerType[type]}
				{localize("ITEM-PILES.Merchant.Override")}:
				<input type="checkbox" bind:checked={$priceModifiersPerType[type].override}>
				<SliderInput bind:value={$priceModifiersPerType[type].buyPriceModifier}/>
			{/if}
		</div>
		<div style="flex: 0 1 auto">
			{#if $priceModifiersPerType[type]}
				<i class="fas fa-times item-piles-clickable-red"
				   on:click={() => { store.removeOverrideTypePrice(type) }}></i>
			{:else}
				<i class="fas fa-plus item-piles-clickable-green"
				   on:click={() => { store.addOverrideTypePrice(type) }}></i>
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
      flex: 1 0 auto;
    }

    .price-header {
      flex: 0 1 calc(50% - 10px);
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
