<script>

  import CurrencyListEntry from "./CurrencyListEntry.svelte";

  export let currencies;
  export let options = {};

  $: primary = $currencies.filter(currency => !currency.isSecondaryCurrency);
  $: secondary = $currencies.filter(currency => currency.isSecondaryCurrency);

  options = foundry.utils.mergeObject({
    reverse: false,
    abbreviations: false,
    abbreviateNumbers: false,
    imgSize: 24
  }, options)

</script>

<div class="item-piles-flexrow item-piles-currency-list" style={$$props.style}>

	{#each primary as currency (currency.identifier)}
		<CurrencyListEntry {currency} {options}/>
	{/each}

	{#if secondary.length}

		<div class="item-piles-vertical-divider"></div>

		{#each secondary as currency (currency.identifier)}
			<CurrencyListEntry {currency} {options}/>
		{/each}
	{/if}

	<slot/>

</div>

<style lang="scss">
  .item-piles-vertical-divider {
    min-height: 1rem;
    flex: 0;
    margin: 2px 0.25rem 2px 0;
    min-width: 1px;
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
