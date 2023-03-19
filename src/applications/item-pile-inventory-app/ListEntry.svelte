<script>

  import { fade } from 'svelte/transition';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { get } from "svelte/store";

  export let store;
  export let entry;

  const name = entry.name;
  const img = entry.img;
  const rarityColor = entry.rarityColor;
  const quantityLeft = entry.quantityLeft;
  const quantity = entry.quantity;
  const currentQuantity = entry.currentQuantity;
  const pileData = store.pileData;

  $: canInspectItems = entry.id && $pileData.canInspectItems;

  const editQuantities = store.editQuantities;

  function dragStart(event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: "Item",
      uuid: entry.item.uuid
    }));
  }

</script>

<div class="item-piles-flexrow item-piles-item-row item-piles-even-color"
     transition:fade={{duration: 250}}
     draggable={!!entry.id}
     on:dragstart={(event) => { dragStart(event) }}
     class:item-piles-disabled={!$editQuantities && !$quantityLeft}>

  <div class="item-piles-img-container">
    <img class="item-piles-img" src="{$img}"/>
  </div>

  <div class="item-piles-name">
    <div class="item-piles-name-container">
      <p class:item-piles-clickable-link="{canInspectItems}"
				 on:click={() => { entry.preview() }}
				 style="color: {$rarityColor || 'inherit'};"
			>
				{$name}
			</p>
      {#if !$editQuantities && entry.canStack}
        <span class="item-piles-small-text">(x{$quantity})</span>
      {/if}
    </div>
  </div>

  {#if entry.canStack || !entry.id}

    <div class="item-piles-quantity-container" style="flex:2.5;">

      {#if $editQuantities}

        <div class="item-piles-quantity-input-container">
          <input class="item-piles-quantity" type="number" min="0" bind:value="{$quantity}"
                 draggable="true" on:dragstart|stopPropagation|preventDefault/>
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

  {/if}

  {#if !$editQuantities}

    <button
      on:click={() => { entry.take() }}
      class="item-piles-item-take-button"
      type="button"
      disabled={!$quantityLeft}>
      {localize("ITEM-PILES.Inspect.Take")}
    </button>

  {:else if !entry.canStack && !entry.isCurrency}

    <button
      on:click={() => { entry.remove() }}
      class="item-piles-item-take-button"
      type="button"
      disabled={!$quantityLeft}>
      {localize("Remove")}
    </button>

  {/if}


</div>

<style lang="scss">

</style>
