<script>

  import CurrencyListEntry from "./CurrencyListEntry.svelte";

  export let currencies;
  export let options = {
    reverse: false,
    abbreviations: true
  };

</script>

<div class="item-piles-flexrow{options.reverse ? '-reverse' : ''} item-piles-currency-list">

  {#each $currencies as currency (currency.identifier)}
    <CurrencyListEntry {currency} {options}/>
  {/each}

  <slot/>

</div>
