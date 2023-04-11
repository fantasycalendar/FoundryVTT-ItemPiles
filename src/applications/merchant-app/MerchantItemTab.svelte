<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import MerchantItemEntry from "./MerchantItemEntry.svelte";
  import CategoryHeader from "./CategoryHeader.svelte";
  import { get, writable } from "svelte/store";
  import { VirtualScroll } from "svelte-virtual-scroll-list";
  import MerchantItemListHeader from "./MerchantItemListHeader.svelte";

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

  let itemListStore = writable([])
  let header = false;
  $: {
    $sortTypeStore;
    $editPrices;
    itemListStore.update(itemList => {
      itemList = [];
      header = false;
      if ($sortTypeStore === 0 || $editPrices) {
        let first = true;
        for (const category of categories) {
          itemList.push({
            id: category.type,
            component: MerchantItemListHeader,
            category,
            columns,
            store,
            first
          })
          first = false;
          $itemsPerCategoryStore[category.type].items.forEach((item, index) => {
            itemList.push({
              id: item.id,
              component: MerchantItemEntry,
              item,
              index,
              columns: $itemColumns
            })
          });
        }
      } else {
        header = {
          id: randomID(),
          component: MerchantItemListHeader,
          category: false,
          columns,
          store,
          first: true,
        }
        items.forEach((item, index) => {
          itemList.push({
            id: item.id,
            component: MerchantItemEntry,
            item,
            index,
            columns: $itemColumns
          })
        });
      }
      return itemList;
    })
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

<div class="item-piles-items-list" style="--grid-template-columns: auto repeat({columns.length-1}, max-content);">

	<VirtualScroll
		data={$itemListStore}
		key="id"
		let:data
	>
		<div slot="header" class="item-piles-list-header">
			{#if header}
				<svelte:component data={header} this={header.component}/>
			{/if}
		</div>
		<svelte:component {data} this={data.component}/>
	</VirtualScroll>

</div>

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

<style lang="scss">

  .item-piles-items-list {
    overflow-y: scroll;
    padding-right: 10px;
    display: grid;
    align-items: center;
    max-height: calc(100% - 31px);
    margin-top: 5px;
  }

  :global(.item-piles-items-list > div) {
    display: grid !important;
    grid-template-columns: var(--grid-template-columns);
  }

  :global(.item-piles-items-list > div > div) {
    display: contents;
  }

  .item-piles-items-list :global(.virtual-scroll-item), .item-piles-list-header {
    display: contents;
  }

  :global(.virtual-scroll-item) {
    padding: 2px;
    margin-right: 5px;
    border-radius: 4px;
  }

  :global(.item-piles-items-list .virtual-scroll-item:nth-child(even) .item-piles-flexrow > div) {
    background-color: var(--item-piles-even-color);
  }

  :global(.item-piles-items-list .virtual-scroll-item:nth-child(odd) .item-piles-flexrow > div) {
    background-color: var(--item-piles-odd-color);
  }

  .item-piles-merchant-first-label {
    justify-content: flex-start;
  }

</style>
