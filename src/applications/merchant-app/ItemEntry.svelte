<script>
  export let item;

  const itemNameStore = item.name;
  const itemImage = item.img;
  const itemRarityColor = item.rarityColor;
  const itemQuantityForPrice = item.quantityForPrice;

  const store = item.store;
  const pileData = store.pileData;
  const displayQuantityStore = item.displayQuantity;
  const infiniteQuantityStore = item.infiniteQuantity;
  const quantityStore = item.quantity;
  const itemFlagDataStore = item.itemFlagData;

  $: itemFlagData = $itemFlagDataStore;
  $: displayQuantity = $displayQuantityStore;
  $: infiniteQuantity = $infiniteQuantityStore;

  $: quantity = $quantityStore;
  $: editQuantity = $quantityStore;
  $: itemName = $itemNameStore + ($itemQuantityForPrice > 1 ? ` (${$itemQuantityForPrice})` : "");
  let showEditQuantity = false;

  const displayControlButtons = store.actor.isOwner;
  const displayBuyButton = !!store.recipient;

</script>

<div class="item-piles-merchant-item-container"
		 class:merchant-item-hidden={itemFlagData.hidden}>

	<div
		class="item-piles-img-container"
		class:not-for-sale={itemFlagData.notForSale || !quantity}
		data-tooltip={itemFlagData.notForSale ? "Not for sale" : ""}
	>
		<img class="item-piles-img" src={$itemImage}/>
	</div>

	<div class="item-piles-name item-piles-text">
		<div class="item-piles-name-container">
		<span style="color: {$itemRarityColor || 'inherit'};">
			{#if $pileData.canInspectItems || game.user.isGM}
				<a class="item-piles-clickable" on:click={() => { item.preview() }}>
					{itemName}
				</a>
			{:else}
				{itemName}
			{/if}
		</span>
			{#if showEditQuantity}
				<div class="item-piles-quantity-container" style="flex:0 1 50px;">
					<div class="item-piles-quantity-input-container">
						<input
							class="item-piles-quantity"
							type="text"
							bind:value={editQuantity}
							autofocus
							on:change={() => {
              showEditQuantity = false;
              item.updateQuantity(editQuantity);
            }}
							on:keydown={(evt) => {
              if (evt.key === "Enter") showEditQuantity = false;
            }}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>

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

</style>
