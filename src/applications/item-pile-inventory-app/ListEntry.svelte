<script>

  import { fade } from 'svelte/transition';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { get } from "svelte/store";

  export let store;
  export let entry;

  const name = entry.name;
  const img = entry.img;
  const quantityLeft = entry.quantityLeft;
  const quantity = entry.quantity;
  const currentQuantity = entry.currentQuantity;
  const pileData = store.pileData;

  $: canInspectItems = entry.id && $pileData.canInspectItems;

  function previewItem() {
    if (!canInspectItems) return;
    const item = store.actor.items.get(entry.id);
    if (!item) return;
    if (game.user.isGM || item.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass()
    const sheet = new cls(item, { editable: false })
    return sheet._render(true);
  }

  const editQuantities = store.editQuantities;

</script>

<div class="item-piles-flexrow item-piles-item-row item-piles-even-color" transition:fade={{duration: 250}}
     class:item-piles-disabled={!editQuantities && !$quantityLeft}>

  <div class="item-piles-img-container">
    <img class="item-piles-img" src="{$img}"/>
  </div>

  <div class="item-piles-name">
    <div class="item-piles-name-container">
      <p class:item-piles-clickable-link="{canInspectItems}" on:click={previewItem}>{$name}</p>
      {#if !editQuantities}
        <span class="item-piles-small-text">(x{$quantity})</span>
      {/if}
    </div>
  </div>

  <div class="item-piles-quantity-container" style="flex:2.5;">

    {#if editQuantities}

      <div class="item-piles-quantity-input-container">
        <input class="item-piles-quantity" type="number" min="0" bind:value="{$quantity}"/>
      </div>

    {:else}

      {#if $quantityLeft}
        <div class="item-piles-quantity-input-container">
          <input class="item-piles-quantity" type="number" min="1" bind:value="{$currentQuantity}"
                 max="{$quantity}" disabled="{!$quantity}"/>

          <span class="item-piles-input-divider" class:item-piles-text-right={!store.recipient}>
             / {$quantityLeft}
          </span>
        </div>
      {:else}
        <span>
          {localize(`ITEM-PILES.Inspect.${entry.toShare ? "NoShareLeft" : "NoneLeft"}`)}
        </span>
      {/if}
    {/if}

  </div>

  {#if !editQuantities}

    <button
      on:click={() => { entry.take() }}
      class="item-piles-item-take-button"
      type="button"
      disabled={!$quantityLeft}>
      {localize("ITEM-PILES.Inspect.Take")}
    </button>

  {/if}

</div>

<style lang="scss">

</style>