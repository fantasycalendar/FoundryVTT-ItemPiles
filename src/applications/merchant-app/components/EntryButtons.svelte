<script>

	import ItemEditor from "../../item-editor/item-editor.js";
	import { localize } from "#runtime/util/i18n";

	export let item;

	const quantity = item.quantity;
	const store = item.store;
	const isMerchant = store.isMerchant;

	const itemFlagDataStore = item.itemFlagData;

	const hasRecipient = !!item.store.recipient;

</script>

<div class="item-piles-flexrow sidebar-buttons">
	{#if store.userHasAuthority && isMerchant}
		{#if game.user.isGM}
        <span class="item-piles-clickable-link" on:click={() => { ItemEditor.show(item.item); }}>
          <i class="fas fa-cog"></i>
        </span>
		{/if}
		<span class="item-piles-clickable-link"
		      data-tooltip="{localize('ITEM-PILES.Merchant.' + ($itemFlagDataStore.hidden ? 'SetVisible' : 'SetHidden'))}"
		      on:click={() => { item.toggleProperty("hidden"); }}>
        <i class="fas" class:fa-eye={!$itemFlagDataStore.hidden} class:fa-eye-slash={$itemFlagDataStore.hidden}></i>
      </span>
		<span class="item-piles-clickable-link"
		      data-tooltip="{localize('ITEM-PILES.Merchant.' + ($itemFlagDataStore.notForSale ? 'SetForSale' : 'SetNotForSale'))}"
		      on:click={() => { item.toggleProperty("notForSale"); }}>
        <i class="fas" class:fa-store={!$itemFlagDataStore.notForSale}
           class:fa-store-slash={$itemFlagDataStore.notForSale}></i>
      </span>
		{#if store.recipient}
		<span class="item-piles-clickable-link" data-tooltip="{localize('ITEM-PILES.Inspect.Take')}"
		      on:click={() => { item.take(); }}>
        <i class="fas fa-hand"></i>
    </span>
		{/if}
	{/if}
	{#if hasRecipient}
		{#if isMerchant}
      <span
	      class:item-piles-clickable-link={!$itemFlagDataStore.notForSale || store.userHasAuthority}
	      class:item-piles-clickable-link-disabled={$quantity <= 0 || ($itemFlagDataStore.notForSale && !store.userHasAuthority)}
	      class:buy-button={store.userHasAuthority}
	      on:click={() => {
              if($quantity <= 0 || ($itemFlagDataStore.notForSale && !store.userHasAuthority)) return;
              store.tradeItem(item)
            }}>
        <i class="fas fa-shopping-cart"></i>
	      {#if !store.userHasAuthority || hasRecipient} {localize("ITEM-PILES.Merchant.Buy")}{/if}
      </span>
		{:else}
      <span
	      style="margin-left: 0.25rem;"
	      class:item-piles-clickable-link={$quantity > 0 && !$itemFlagDataStore.cantBeSoldToMerchants}
	      class:item-piles-clickable-link-disabled={$quantity <= 0 || $itemFlagDataStore.cantBeSoldToMerchants}
	      on:click={() => {
              if(($quantity <= 0 || $itemFlagDataStore.cantBeSoldToMerchants)) return;
              store.tradeItem(item, true)
            }}>
        <i class="fas fa-hand-holding-usd"></i> {localize("ITEM-PILES.Merchant.Sell")}
      </span>
		{/if}
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
  }

</style>
