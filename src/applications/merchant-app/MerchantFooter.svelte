<script>

	import CurrencyList from "../components/CurrencyList.svelte";
	import { localize } from "#runtime/util/i18n";
	import { onDestroy } from "svelte";
	import { writable } from "svelte/store";
	import * as PileUtilities from "../../helpers/pile-utilities.js";

	export let store;
	export let recipientStore;

	let recipientDocument = writable({});
	const currencies = writable([]);
	$: recipientDocument = recipientStore?.document;
	$: refreshCurrencies($recipientDocument);

	const entries = new Map();

	function getEntry(identifier) {
		if (!entries.has(identifier)) {
			entries.set(identifier, {
				identifier,
				name: writable(""),
				img: writable(""),
				abbreviation: writable(""),
				quantity: writable(0),
				tooltip: writable(""),
				isSecondaryCurrency: false
			});
		}
		return entries.get(identifier);
	}

	function refreshCurrencies() {
		const actor = recipientStore?.actor;
		if (!actor) return currencies.set([]);
		currencies.set(PileUtilities.getHeldCurrencyBreakdown(actor).map(currency => {
			const entry = getEntry(`currency-${currency.index}`);
			const sources = currency.sources.map(source => `${foundry.utils.escapeHTML(source.name)}: ${source.quantity}`);
			entry.name.set(currency.name);
			entry.img.set(currency.img);
			entry.abbreviation.set(currency.abbreviation);
			entry.quantity.set(currency.quantity);
			entry.tooltip.set([foundry.utils.escapeHTML(currency.name), ...sources].join("<br>"));
			entry.isSecondaryCurrency = !!currency.secondary;
			return entry;
		}));
	}

	const itemHookIds = ["createItem", "updateItem", "deleteItem"].map(hook => {
		return [hook, Hooks.on(hook, (item) => {
			if (item.parent === recipientStore?.actor) refreshCurrencies();
		})];
	});
	onDestroy(() => itemHookIds.forEach(([hook, id]) => Hooks.off(hook, id)));

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
		              options={{ abbreviations: $merchantCurrencies.length === 1, imgSize: 18, abbreviateNumbers: $merchantCurrencies.length > 1  }}
		              class="item-piles-currency-list"/>
	</div>
{/if}

<style>
    .merchant-bottom-row {
        flex: 0 0 auto;
        align-items: center;
        min-height: 31px;
    }
</style>
