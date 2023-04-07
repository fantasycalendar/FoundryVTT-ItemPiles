<script>

  import CurrencyList from "../components/CurrencyList.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let recipientStore;

  const recipientDocument = recipientStore.document;
  const currencies = recipientStore.allCurrencies;

</script>

<div class="item-piles-flexrow merchant-bottom-row">
	<div style="flex: 0 1 auto;">
		{localize("ITEM-PILES.Merchant.ShoppingAs", { actorName: $recipientDocument.name })}
	</div>
	{#if $currencies.length}
		<CurrencyList {currencies} options={{ imgSize: 18, reverse: true, abbreviations: true }}
									class="item-piles-currency-list"/>
	{/if}
</div>

<style>
    .merchant-bottom-row {
        flex: 0 1 auto;
        align-items: center;
    }
</style>
