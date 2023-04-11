<script>
  import { fade } from 'svelte/transition';

  export let data;

  let item = data.item;
  let index = data.index;
  let columns = data.columns;

  const itemName = item.name;
  const itemImage = item.img;

  const store = item.store;
  const itemStore = item.itemDocument;
  const pileData = store.pileData;
  const displayQuantityStore = item.displayQuantity;
  const quantityStore = item.quantity;
  const itemFlagDataStore = item.itemFlagData;

  $: itemFlagData = $itemFlagDataStore;
  $: displayQuantity = $displayQuantityStore;
  $: quantity = $quantityStore;
  $: editQuantity = $quantityStore;
  let showEditQuantity = false;

  const displayControlButtons = store.actor.isOwner;
  const displayBuyButton = !!store.recipient;

</script>

<div class="item-piles-flexrow item-piles-item-row"
		 class:item-piles-child-even-color={index%2===0}
		 class:item-piles-child-odd-color={index%2===1}
		 class:merchant-item-hidden={itemFlagData.hidden}
		 style="flex: 1 0 auto;">

	{#each columns as column}
		{#if column?.data}
			<svelte:component this={column.component} {item} data={column.data}/>
		{:else}
			<svelte:component this={column.component} {item}/>
		{/if}
	{/each}

</div>


<style lang="scss">

  .item-piles-item-row {
    margin: 0;
    overflow: visible;
    display: contents;

    & > * {
      padding: 0 10px;
      text-align: center;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
    }

    &.merchant-item-hidden > * {
      font-style: italic;
      opacity: 0.5;
    }

    .item-piles-text {
      font-size: inherit;
    }

    .item-piles-img-container {
      min-width: 20px;
      max-height: 20px;
      margin: 2px;
      flex: 1 0 auto;

      overflow: hidden;
      border-radius: 4px;
      border: 1px solid black;
      align-self: center;
    }

    .item-piles-name-container {
      line-height: 1.6;
    }

  }

</style>
