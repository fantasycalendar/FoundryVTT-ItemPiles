<script>

	import { localize } from '#runtime/util/i18n';
	import ListEntry from "./ListEntry.svelte";

	export let store;
	const currencies = store.currencies;
	const numItems = store.numItems;
	const numCurrencies = store.numCurrencies;
	const editQuantities = store.editQuantities;

</script>

<div>

	<div class="item-piles-flexrow">
		{#if $numCurrencies > 0}
			<h3>{localize("ITEM-PILES.Currencies")}:</h3>
		{/if}
		<a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle"
		   on:click={() => store.addCurrency(store.recipient)}>
			<i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
		</a>
	</div>
	{#if $numCurrencies > 0}
		<div>
			{#each $currencies as currency, index (currency.identifier)}
				<ListEntry {store} bind:entry={currency} currency/>
			{/each}
		</div>
	{/if}

</div>
