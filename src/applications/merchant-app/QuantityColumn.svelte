<script>

  export let item;

  console.log(item);

  const store = item.store;
  const displayQuantityStore = item.displayQuantity;
  const infiniteQuantityStore = item.infiniteQuantity;
  const quantityStore = item.quantity;

  let showEditQuantity = false;

</script>

<div>
	{#if $displayQuantityStore && item.canStack}
		{#if $infiniteQuantityStore}
			<span>(∞)</span>
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
    height: 100%;
  }
</style>
