<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import AttributeEntry from "./AttributeEntry.svelte";

  export let store;
  const attributeStore = store.attributes;

  let attributes;
  let hasAttributes;

  $: {
    attributes = $attributeStore;
    hasAttributes = !!attributes.length;
  }

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

  {#if hasAttributes}

    <div>
      {#each attributes as attribute, index (attribute.path)}
        {#if attribute.visible}
          <AttributeEntry {store} {attribute}/>
        {/if}
      {/each}
    </div>

  {/if}

</div>