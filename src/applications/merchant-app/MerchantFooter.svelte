<script>

  import CurrencyList from "../components/CurrencyList.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let store;
  export let recipientStore;

  const recipientDocument = recipientStore?.document;
  const currencies = recipientStore?.allCurrencies;
  const merchantCurrencies = store?.allCurrencies;
  const merchantPileData = store.pileData;
  const merchantDocument = store.document;

</script>

<div class="item-piles-flexrow merchant-bottom-row">

	{#if recipientStore}
		<div style="flex: 0 1 auto;">
			{localize("ITEM-PILES.Merchant.ShoppingAs", { actorName: $recipientDocument.name })}
		</div>
		{#if $currencies.length}
			<CurrencyList {currencies}
										options={{ abbreviations: false, imgSize: 18, abbreviateNumbers: true }}
										class="item-piles-currency-list"/>
		{/if}
	{:else if game.user.isGM && $merchantPileData.infiniteCurrencies}
		<div style="flex: 0 1 auto;">
			<a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle"
				 on:click={() => store.addCurrency()}>
				<i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
			</a>
		</div>
		<CurrencyList currencies={merchantCurrencies}
									options={{ abbreviations: false, imgSize: 18, abbreviateNumbers: true }}
									class="item-piles-currency-list"/>
	{/if}

</div>

<style>
    .merchant-bottom-row {
        flex: 0 1 auto;
        align-items: center;
        height: 31px;
    }
</style>
