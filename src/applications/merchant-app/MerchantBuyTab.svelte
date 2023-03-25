<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import MerchantItemBuyEntry from "./MerchantItemBuyEntry.svelte";
  import CategoryHeader from "./CategoryHeader.svelte";

  export let store;
  export let categoryFilter;

  const pileData = store.pileData;
  const searchStore = store.search;
  const visibleItemsStore = store.visibleItems;
  const itemsPerCategoryStore = store.itemsPerCategory;
  const categoryStore = store.categories;
  const priceModifiersPerType = store.priceModifiersPerType;
  const itemCategoriesStore = store.itemCategories;
  const typeFilterStore = store.typeFilter;
  const editPrices = store.editPrices;

  $: categoryDropDown = $itemCategoriesStore.filter(category => categoryFilter(category));
  $: categories = $categoryStore.filter(category => categoryFilter(category));

  let columns = [];
  $: {
    const customColumns = foundry.utils.deepClone($pileData.merchantColumns);
    columns = [
      {
        component: CategoryHeader
      },
      {
        label: "Quantity",
        path: "quantity"
      },
      ...customColumns,
			{
        type: "Price",
        path: "price"
      },
      {}
    ]
    console.log(columns);
  }

</script>
<div class="item-piles-flexrow">
	<input bind:value={$searchStore} placeholder="Type to search..." type="text">
	{#if categoryDropDown.length > 1}
		<select style="flex:0 1 auto; margin-left: 0.4rem; height: 26px;" bind:value={$typeFilterStore}>
			<option value="all">{localize("ITEM-PILES.Merchant.AllTypes")}</option>
			{#each categoryDropDown as category (category.type)}
				<option value={category.type}>{localize(category.label)}</option>
			{/each}
		</select>
	{/if}
</div>

<div class="item-piles-items-list" style="grid-template-columns: repeat({columns.length}, auto);">
	{#each categories as category, index (category.type)}

		<div class="item-piles-item-list-header">
			{#each columns as column}
				{#if column?.component}
					<svelte:component this={column.component} {store} {category}/>
				{:else if column.label && index === 0}
					<div class="item-piles-small-text item-piles-merchant-other-label">
						{column.label}
					</div>
				{:else}
					<div></div>
				{/if}
			{/each}
		</div>
		{#each $itemsPerCategoryStore[category.type].items as item, itemIndex (item.id)}
			<MerchantItemBuyEntry {item} index={itemIndex}/>
		{/each}

	{/each}
</div>

{#if !$categoryStore.length}

	<div style="height: calc(100% - 51px);" class="item-piles-flexcol align-center-col">

    <span class="align-center-row" style="font-size:1.25rem; opacity: 0.8;">
      {#if $visibleItemsStore.length}
        {localize("ITEM-PILES.Merchant.NoMatchFound")}
      {:else}
        {localize("ITEM-PILES.Merchant.NoItemsForSale")}
      {/if}
    </span>

	</div>

{/if}

<style lang="scss">

  .item-piles-items-list {
    overflow: visible;
    padding-right: 10px;
    display: grid;
    align-items: center;
  }

  .item-piles-item-list-header {
    display: contents;

    & > * {
      height: 1.5rem;
      margin-top: 10px;
      margin-bottom: 5px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
			padding: 0 5px;
    }
  }

  .item-piles-merchant-other-label {
    display: flex;
    align-items: center;
		justify-content: center;
  }

</style>
