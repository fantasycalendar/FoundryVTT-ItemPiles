<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import DropCurrencyDialog from "../drop-currency-dialog/drop-currency-dialog.js";
  import ListEntry from "./ListEntry.svelte";

  export let store;
  const attributeStore = store.attributes;
  const itemStore = store.itemCurrencies;
  const numCurrenciesStore = store.numCurrencies;

  async function addCurrency() {
    const result = await DropCurrencyDialog.show(store.recipientActor, store.pileActor);
    if (!result) return;
    if (!foundry.utils.isObjectEmpty(result.attributes)) {
      await game.itempiles.transferAttributes(store.recipientActor, store.pileActor, result.attributes, { interactionId: store.interactionId })
    }
    if (result.items.length) {
      await game.itempiles.transferItems(store.recipientActor, store.pileActor, result.items, { interactionId: store.interactionId })
    }
  }

  let entries;

  $: {
    entries = $attributeStore.map(attribute => ({
      identifier: attribute.path,
      data: attribute
    })).concat($itemStore.map(item => ({
      identifier: `${item.name}-${item.type}`,
      data: item
    })))
  }

</script>

<div>

  <div class="flexrow">
    <h3>{localize("ITEM-PILES.Currencies")}:</h3>
    {#if store.recipientActor}
      <a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle"
         on:click={addCurrency}>
        <i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
      </a>
    {/if}
  </div>
  {#if $numCurrenciesStore > 0}
    <div>
      {#each entries as entry, index (entry.identifier)}
        {#if entry.data.visible}
          <ListEntry {store} bind:data={entry.data}/>
        {/if}
      {/each}
    </div>
  {/if}

</div>