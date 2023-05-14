<script>

  export let item;

  const store = item.store;
  const displayQuantityStore = item.displayQuantity;
  const infiniteQuantityStore = item.infiniteQuantity;
  const quantityStore = item.quantity;

  let showEditQuantity = false;
  $: editQuantity = $quantityStore;

</script>

<div>
	{#if $displayQuantityStore && item.canStack}
		{#if $infiniteQuantityStore}
			<span>∞</span>
		{:else if showEditQuantity}
			<input
				style="height: 18px; max-width: 35px;"
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
		{:else if !showEditQuantity}
        <span
					class:item-piles-clickable-link={game.user.isGM}
					on:click={() => {
            if (game.user.isGM) showEditQuantity = true;
          }}>{$quantityStore}</span
				>
		{/if}
	{/if}
</div>

<style lang="scss">
  div {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 10px;
    text-align: center;
    min-height: 28px;
    height: 100%;
  }
</style>
