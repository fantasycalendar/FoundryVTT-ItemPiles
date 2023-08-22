<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import MerchantItemEntry from "./MerchantItemEntry.svelte";
  import CategoryHeader from "./CategoryHeader.svelte";
  import { get } from "svelte/store";

  export let store;
  export let noItemsLabel = "ITEM-PILES.Merchant.NoItemsForSale";
  export let services = false;

  const pileData = store.pileData;
  const searchStore = store.search;
  const visibleItemsStore = store.visibleItems;
  const itemsStore = store.items;
  const itemsPerCategoryStore = store.itemsPerCategory;
  const categoryStore = store.categories;
  const priceModifiersPerType = store.priceModifiersPerType;
  const itemCategoriesStore = store.itemCategories;
  const typeFilterStore = store.typeFilter;
  const sortTypesStore = store.sortTypes;
  const sortTypeStore = store.sortType;
  const inverseSortStore = store.inverseSort;
  const editPrices = store.editPrices;
  const itemColumns = store.itemColumns;

  $: categoryDropDown = $itemCategoriesStore.filter(category => category.service === services);
  $: categories = $categoryStore.filter(category => category.service === services);
  $: items = $itemsStore.filter(item => Boolean(get(item.itemFlagData)?.isService) === services)
  $: visibleItems = $visibleItemsStore.filter(item => Boolean(get(item.itemFlagData)?.isService) === services)

  let columns = [];
  $: {
    columns = [
      {
        label: "Name",
        component: CategoryHeader
      },
      ...$itemColumns.slice(1)
    ]
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
	<select bind:value={$sortTypeStore} style="flex:0 1 auto; margin-left: 0.4rem; height: 26px;">
		{#each $sortTypesStore as column, index}
			<option value={index}>Sort by: {localize(column.label)}</option>
		{/each}
	</select>
</div>

<div class="item-piles-items-list" style="grid-template-columns: auto repeat({columns.length-1}, max-content);">

	{#if $sortTypeStore === 0 || $editPrices}

		{#each categories as category, index (category.type)}

			<div class="item-piles-item-list-header">
				{#each columns as column, columnIndex}
					{#if columnIndex === 0}
						<CategoryHeader {store} {category}/>
					{:else if column.label && columnIndex > 0 && index === 0 && !$editPrices}
						<div class="item-piles-small-text">
							<a on:click={() => {
              $inverseSortStore = $sortTypeStore === columnIndex+1 ? !$inverseSortStore : false;
              $sortTypeStore = columnIndex+1;
						}}>
								{@html column.label}
								<i class="fas"
									 class:fa-chevron-down={!$inverseSortStore && $sortTypeStore === columnIndex+1}
									 class:fa-chevron-up={$inverseSortStore && $sortTypeStore === columnIndex+1}
								></i>
							</a>
						</div>
					{:else if !$editPrices}
						<div></div>
					{/if}
				{/each}
			</div>
			{#each $itemsPerCategoryStore[category.type].items as item, itemIndex (item.id)}
				<MerchantItemEntry {item} index={itemIndex} columns={$itemColumns}/>
			{/each}

		{/each}

	{:else}

		<div class="item-piles-item-list-header">
			{#each columns as column, columnIndex}
				{#if column.label}
					<div class="item-piles-small-text" class:item-piles-merchant-first-label={!columnIndex}>
						<a on:click={() => {
              $inverseSortStore = $sortTypeStore === columnIndex + 1 ? !$inverseSortStore : false;
              $sortTypeStore = columnIndex + 1;
						}}>
							{@html column.label}
							<i class="fas"
								 class:fa-chevron-down={!$inverseSortStore && $sortTypeStore === columnIndex+1}
								 class:fa-chevron-up={$inverseSortStore && $sortTypeStore === columnIndex+1}
							></i>
						</a>
					</div>
				{:else}
					<div></div>
				{/if}
			{/each}
		</div>
		{#each items as item, itemIndex (item.id)}
			<MerchantItemEntry {item} index={itemIndex} columns={$itemColumns}/>
		{/each}

	{/if}

	{#if !$categoryStore.length}

		<div style="height: calc(100% - 51px);" class="item-piles-flexcol align-center-col">

    <span class="align-center-row" style="font-size:1.25rem; opacity: 0.8;">
      {#if visibleItems.length}
        {localize("ITEM-PILES.Merchant.NoMatchFound")}
      {:else}
        {localize(noItemsLabel)}
      {/if}
    </span>

		</div>

	{/if}

</div>

<style lang="scss">

  .item-piles-items-list {
    display: grid;
    overflow-y: scroll;
    padding-right: 5px;
    align-items: center;
    height: calc(100% - 31px);
    margin-top: 5px;
    align-content: flex-start;
  }

  .item-piles-item-list-header {
    display: contents;

    & > * {
      height: 1.5rem;
      margin-top: 10px;
      margin-bottom: 5px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .item-piles-merchant-first-label {
    justify-content: flex-start;
  }

</style>
