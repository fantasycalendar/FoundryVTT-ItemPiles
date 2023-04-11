<script>

  import CategoryHeader from "./CategoryHeader.svelte";

  export let data;

  let store = data.store;
  let columns = data.columns;
  let category = data.category;
  let first = data.first;

  const sortTypeStore = store.sortType;
  const inverseSortStore = store.inverseSort;
  const editPrices = store.editPrices;

</script>

<div class="item-piles-item-list-header">
	{#each columns as column, columnIndex}
		{#if columnIndex === 0 && category}
			<CategoryHeader {store} {category}/>
		{:else if column.label && (columnIndex > 0 || !category) && first && !$editPrices}
			<div class="item-piles-small-text">
				<a on:click={() => {
              $inverseSortStore = $sortTypeStore === columnIndex+1 ? !$inverseSortStore : false;
              $sortTypeStore = columnIndex+1;
						}}>
					{column.label}
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

<style lang="scss">

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

      &:not(:first-child) {
        justify-content: center;
      }
    }
  }

</style>
