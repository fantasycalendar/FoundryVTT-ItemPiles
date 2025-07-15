<script>

	import QuantityColumn from "./QuantityColumn.svelte";

	export let item;
	export let showQuantity = false;

	const itemNameStore = item.name;
	const itemImage = item.img;
	const itemRarityColor = item.rarityColor;
	const itemQuantityForPrice = item.quantityForPrice;

	const store = item.store;
	const pileData = store.pileData;
	const quantityStore = item.quantity;
	const itemFlagDataStore = item.itemFlagData;

	$: itemName = $itemNameStore + ($itemQuantityForPrice > 1 ? ` (${$itemQuantityForPrice})` : "");

</script>

<div class="item-piles-merchant-item-container"
     class:merchant-item-hidden={$itemFlagDataStore.hidden}>

	<div
		class="item-piles-img-container"
		class:not-for-sale={$itemFlagDataStore.notForSale || !$quantityStore}
		data-fast-tooltip={$itemFlagDataStore.notForSale ? "Not for sale" : ""}
	>
		<img class="item-piles-img" src={$itemImage}/>
	</div>

	<div class="item-piles-name item-piles-text">
		<div class="item-piles-name-container">
			<span style="color: {$itemRarityColor || 'inherit'};">
				{#if $pileData.canInspectItems || store.userHasAuthority}
					<a class="item-piles-clickable" on:click={() => { item.preview() }}>
						{itemName}
					</a>
				{:else}
					{itemName}
				{/if}
			</span>
		</div>
	</div>

	{#if showQuantity}
		<div class="item-piles-quantity-container">
			<QuantityColumn {item} showX/>
		</div>
	{/if}

	<slot name="right"/>

</div>


<style lang="scss">

  .item-piles-merchant-item-container {
    display: flex;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .merchant-item-hidden > * {
    font-style: italic;
    opacity: 0.5;
  }

  .item-piles-name {
    flex: 0 1 auto;
  }

  .item-piles-quantity-container {
    flex: 1;
  }

</style>
