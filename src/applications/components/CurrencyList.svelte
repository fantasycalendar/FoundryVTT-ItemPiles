<script>

  import CurrencyListEntry from "./CurrencyListEntry.svelte";

  export let currencies;
  export let options = {};

  options = foundry.utils.mergeObject({
    reverse: false,
    abbreviations: false,
    abbreviateNumbers: false,
    imgSize: 24
  }, options)

</script>

<div class="item-piles-flexrow item-piles-currency-list" style={$$props.style}>

	{#each $currencies as currency (currency.identifier)}
		<CurrencyListEntry {currency} {options}/>
	{/each}

	<slot/>

</div>
