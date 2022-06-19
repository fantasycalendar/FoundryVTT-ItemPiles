<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import CurrencyEntry from "./CurrencyEntry.svelte";
  import ItemEntry from "./ItemEntry.svelte";

  export let store;
  const attributeStore = store.attributes;
  const itemStore = store.itemCurrencies;

  let attributes;
  let itemCurrencies;
  let hasCurrencies;

  $: attributes = $attributeStore;
  $: itemCurrencies = $itemStore;
  $: hasCurrencies = !!attributes.length && !!itemCurrencies.length;

</script>

<div>

  <div class="flexrow">
    <h3>{localize("ITEM-PILES.Currencies")}:</h3>
    {#if store.recipientActor}
      <!--<a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle"
         on:click={addCurrency}>
        <i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
      </a>-->
      <a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle">
        <i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
      </a>
    {/if}
  </div>
  {#if !hasCurrencies}
    <div>
      {#each attributes as attribute, index (attribute.path)}
        {#if attribute.visible}
          <CurrencyEntry {store} {attribute}/>
        {/if}
      {/each}
      {#each itemCurrencies as item, index (item.id)}
        {#if item.visible}
          <ItemEntry {store} {item}/>
        {/if}
      {/each}
    </div>
  {/if}

</div>