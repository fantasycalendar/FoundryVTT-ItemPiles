<script>

  export let item;

  const itemName = item.name;
  const itemImage = item.img;

  const itemFlagDataStore = item.itemFlagData;

  const displayControlButtons = item.store.actor.isOwner;
  const displayBuyButton = !!item.store.recipient;

</script>

<div class="item-piles-flexrow sidebar-buttons">
	{#if displayControlButtons}
		{#if game.user.isGM}
        <span class="item-piles-clickable-link" on:click={() => { ItemEditor.show(item.item); }}>
          <i class="fas fa-cog"></i>
        </span>
		{/if}
		<span class="item-piles-clickable-link"
					on:click={() => { $itemFlagDataStore.hidden = !$itemFlagDataStore.hidden; item.updateItemFlagData(); }}>
        <i class="fas" class:fa-eye={!$itemFlagDataStore.hidden} class:fa-eye-slash={$itemFlagDataStore.hidden}></i>
      </span>
		<span class="item-piles-clickable-link"
					on:click={() => { $itemFlagDataStore.notForSale = !$itemFlagDataStore.notForSale; item.updateItemFlagData(); }}>
        <i class="fas" class:fa-store={!$itemFlagDataStore.notForSale}
					 class:fa-store-slash={$itemFlagDataStore.notForSale}></i>
      </span>
	{/if}
	{#if displayBuyButton}
      <span
				class:item-piles-clickable-link={!$itemFlagDataStore.notForSale || game.user.isGM}
				class:item-piles-clickable-link-disabled={quantity <= 0 || ($itemFlagDataStore.notForSale && !game.user.isGM)}
				class:buy-button={displayControlButtons}
				on:click={() => {
              if(quantity <= 0 || ($itemFlagDataStore.notForSale && !game.user.isGM)) return;
              store.tradeItem(item)
            }}>
        <i class="fas fa-shopping-cart"></i>
				{#if !displayControlButtons} {localize("ITEM-PILES.Merchant.Buy")}{/if}
      </span>
	{/if}
</div>

<style lang="scss">


  .sidebar-buttons {
    flex: 0 1 auto;
    align-items: center;
    justify-content: flex-end;
    text-align: right;
    height: 100%;
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;

    & > span {
      flex: 0 1 auto;
      margin-right: 0.25rem;
      min-width: 17.5px;
    }

    .buy-button {
      padding-left: 0.25rem;
      border-left: 1px solid rgba(0, 0, 0, 0.5)
    }

    .disabled-buy-button {
      opacity: 0.5;
    }
  }

</style>
