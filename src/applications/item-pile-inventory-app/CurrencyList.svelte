<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import DropCurrencyDialog from "../dialogs/drop-currency-dialog/drop-currency-dialog.js";
  import ListEntry from "./ListEntry.svelte";

  export let store;
  const currencies = store.currencies;
  const numItems = store.numItems;
  const numCurrencies = store.numCurrencies;
  const editQuantities = store.editQuantities;

  async function addCurrency() {
    const result = await DropCurrencyDialog.show(store.recipient, store.source);
    if (!result) return;
    if (!foundry.utils.isObjectEmpty(result.attributes)) {
      await game.itempiles.transferAttributes(store.recipient, store.source, result.attributes, { interactionId: store.interactionId })
    }
    if (result.items.length) {
      await game.itempiles.transferItems(store.recipient, store.source, result.items, { interactionId: store.interactionId })
    }
  }

</script>

<div>

  <div class="flexrow">
    {#if $numCurrencies > 0 || $numItems > 0}
      <h3>{localize("ITEM-PILES.Currencies")}:</h3>
    {/if}
    {#if store.recipient}
      <a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle"
         on:click={addCurrency}>
        <i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
      </a>
    {/if}
  </div>
  {#if $numCurrencies > 0 || editQuantities}
    <div>
      {#each $currencies as currency, index (currency.identifier)}
        <ListEntry {store} bind:entry={currency}/>
      {/each}
    </div>
  {/if}

</div>