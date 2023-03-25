<script>
  import { fade } from 'svelte/transition';
  import PriceSelector from "../components/PriceSelector.svelte";
  import ItemEntry from "./ItemEntry.svelte";
  import EntryButtons from "./EntryButtons.svelte";
  import QuantityColumn from "./QuantityColumn.svelte";

  export let item;
  export let index;

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

  let columns = [];
  $: {
    const customColumns = foundry.utils.deepClone($pileData.merchantColumns);
    columns = [{
      label: false,
      component: ItemEntry
    }, ...customColumns.map(column => {
      if (column.path === "price") {
        column.component = PriceSelector;
      } else if (column.path === "quantity") {
        column.component = QuantityColumn;
      }
      return column;
    }), {
      label: false,
      component: EntryButtons
    }]
  }

</script>

<div class="item-piles-flexrow item-piles-item-row"
		 class:item-piles-child-even-color={index%2===0}
		 class:item-piles-child-odd-color={index%2===1}
		 class:merchant-item-hidden={itemFlagData.hidden}
		 style="flex: 1 0 auto;"
		 transition:fade|local={{duration: 250}}>

	{#each columns as column}

		{#if column?.component}
			<svelte:component this={column.component} {item}/>
		{:else}
			<div><span>{getProperty($itemStore, column.path)}</span></div>
		{/if}

	{/each}


</div>


<style lang="scss">


  :global(.item-piles-child-even-color > *) {
    background-color: var(--item-piles-even-color);
  }

  :global(.item-piles-child-odd-color > *) {
    background-color: var(--item-piles-odd-color);
  }

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

    &.merchant-item-hidden {
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
