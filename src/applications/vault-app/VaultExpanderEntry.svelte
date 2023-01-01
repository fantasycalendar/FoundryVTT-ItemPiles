<script>

    import { fade } from 'svelte/transition';
    import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

    export let store;
    export let item;

    const name = item.name;
    const img = item.img;
    const quantity = item.quantity;
    const itemFlagData = item.itemFlagData;
    const pileData = store.pileData;

    const editQuantities = store.editQuantities;

</script>

<div class="item-piles-flexrow item-piles-item-row item-piles-even-color">

  <div class="item-piles-img-container">
    <img class="item-piles-img" src="{$img}"/>
  </div>

  <div class="item-piles-name">
    <div class="item-piles-name-container">
      <p>{$name}</p>
      {#if !editQuantities && item.canStack}
        <span class="item-piles-small-text">(x{$quantity})</span>
      {/if}
      <span class="item-piles-small-text">
        {($itemFlagData.addsCols ? localize("ITEM-PILES.Vault.ExpandsCols", { cols: $itemFlagData.addsCols }) : "")
        + ($itemFlagData.addsCols && $itemFlagData.addsRows ? ", " : "") +
        ($itemFlagData.addsRows ? localize("ITEM-PILES.Vault.ExpandsRows", { rows: $itemFlagData.addsRows }) : "")}
      </span>
    </div>
  </div>

  {#if item.canStack}

    <div class="item-piles-quantity-container" style="flex:2.5;">

      {#if editQuantities}

        <div class="item-piles-quantity-input-container">
          <input class="item-piles-quantity" type="number" min="0" bind:value="{$quantity}"
                 draggable="true" on:dragstart|stopPropagation|preventDefault/>
        </div>

      {/if}

    </div>

  {/if}

  {#if !editQuantities}

    <button
      on:click={() => { item.take() }}
      class="item-piles-item-take-button"
      type="button"
      disabled={!$quantity}>
      {localize("ITEM-PILES.Inspect.Take")}
    </button>

  {/if}


</div>

<style lang="scss">

  .item-piles-item-row .item-piles-name {
    flex: 1 0 auto;
  }

</style>
