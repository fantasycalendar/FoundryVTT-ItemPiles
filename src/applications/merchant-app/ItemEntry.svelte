<script>
  export let item;

  const itemName = item.name;
  const itemImage = item.img;
  const itemRarityColor = item.rarityColor;

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
  let showEditQuantity = false;

  const displayControlButtons = store.actor.isOwner;
  const displayBuyButton = !!store.recipient;

</script>

<div
	class="item-piles-img-container"
	class:not-for-sale={itemFlagData.notForSale || !quantity}
>
	<img class="item-piles-img" src={$itemImage}/>
</div>

<div class="item-piles-name item-piles-text">
	<div class="item-piles-name-container">
		<span style="color: {$itemRarityColor || 'inherit'};">
			{#if $pileData.canInspectItems || game.user.isGM}
				<a class="item-piles-clickable" on:click={() => { item.preview() }}>
					{$itemName}
				</a>
			{:else}
				{$itemName}
			{/if}
		</span>
		{#if displayQuantity && item.canStack}
			{#if infiniteQuantity}
				<span class="item-piles-small-text">(∞)</span>
			{:else if !showEditQuantity}
        <span
					class="item-piles-small-text"
					class:item-piles-clickable-link={game.user.isGM}
					on:click={() => {
            if (game.user.isGM) showEditQuantity = true;
          }}>(x{quantity})</span
				>
			{/if}
		{/if}
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

