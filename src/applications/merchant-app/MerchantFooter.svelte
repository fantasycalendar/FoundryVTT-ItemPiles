<script>

	import CurrencyList from "../components/CurrencyList.svelte";
	import { localize } from "#runtime/util/i18n";
	import { writable } from "svelte/store";

	export let store;
	export let recipientStore;

	let recipientDocument = writable({});
	let currencies = writable([]);
	$: {
		recipientDocument = recipientStore?.document;
		currencies = recipientStore?.allCurrencies;
	}
	const merchantCurrencies = store?.allCurrencies;
	const merchantPileData = store.pileData;

</script>

{#if recipientStore}
	<div class="item-piles-flexrow merchant-bottom-row">
		<div style="flex: 0 1 auto;">
			{localize("ITEM-PILES.Merchant.ShoppingAs", { actorName: $recipientDocument.name })}
		</div>
		<CurrencyList {currencies}
		              options={{ abbreviations: $currencies.length === 1, imgSize: 18, abbreviateNumbers: $currencies.length > 1 }}
		              class="item-piles-currency-list"/>
	</div>
{:else if game.user.isGM && !$merchantPileData.infiniteCurrencies}
	<div class="item-piles-flexrow merchant-bottom-row">
		<div style="flex: 0 1 auto;">
			<a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle"
			   on:click={() => store.addCurrency()}>
				<i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
			</a>
		</div>
		<CurrencyList currencies={merchantCurrencies}
		              options={{ abbreviations: $currencies.length === 1, imgSize: 18, abbreviateNumbers: $merchantCurrencies.length > 1  }}
		              class="item-piles-currency-list"/>
	</div>
{/if}

<style>
    .merchant-bottom-row {
        flex: 0 1 auto;
        align-items: center;
        height: 31px;
    }
</style>
