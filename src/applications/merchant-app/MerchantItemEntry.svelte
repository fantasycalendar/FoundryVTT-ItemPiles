<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { fade } from 'svelte/transition';
  import ItemEditor from "../editors/item-editor/item-editor.js";

  export let store;
  export let item;

  const pileData = store.pileData;
  const prices = item.prices;
  const displayQuantity = item.displayQuantity;
  const quantity = item.quantity;
  const itemFlagDataStore = item.itemFlagData;

  $: itemFlagData = $itemFlagDataStore;

  const displayControlButtons = store.source.isOwner;
  const displayBuyButton = !!store.recipient;

  function previewItem(item) {
    item = store.source.items.get(item.id);
    if (game.user.isGM || item.data.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass()
    const sheet = new cls(item, { editable: false })
    return sheet._render(true);
  }

</script>

<div class="flexrow item-piles-item-row item-piles-odd-color"
     class:merchant-item-hidden={itemFlagData.hidden}
     transition:fade={{duration: 250}}
     style="flex: 1 0 auto;">

  <div class="item-piles-img-container" class:not-for-sale={itemFlagData.notForSale}>
    <img class="item-piles-img" src="{item.img}"/>
  </div>

  <div class="item-piles-name item-piles-text">
    <div class="item-piles-name-container">
      {#if $pileData.canInspectItems || game.user.isGM}
        <a class="item-piles-clickable" on:click={previewItem(item)}>{item.name}</a>
      {:else}
        {item.name}
      {/if}
      {#if $displayQuantity}
        <span class="item-piles-small-text">(x{$quantity})</span>
      {/if}
    </div>
  </div>


  <div class="flexrow price-container">
    {#if itemFlagData.free}
      <small>Free</small>
    {:else}
      <img src="{$prices[0].img}" title="{localize($prices[0].name)}"
           style=" border-radius: 4px; max-height:20px; max-width: 20px; margin-right: 5px;">
      {#if $prices.length > 1}
        <small><a>{$prices[0].cost}*</a></small>
      {:else}
        <small><a>{$prices[0].cost}</a></small>
      {/if}
    {/if}
  </div>

  <div class="flexrow sidebar-buttons">
    {#if displayControlButtons}
      {#if game.user.isGM}
        <span class="item-piles-clickable-link" on:click={() => { ItemEditor.show(item.item); }}>
          <i class="fas fa-cog"></i>
        </span>
      {/if}
      <span class="item-piles-clickable-link"
            on:click={() => { itemFlagData.hidden = !itemFlagData.hidden; item.updateItemFlagData(); }}>
        <i class="fas" class:fa-eye={!itemFlagData.hidden} class:fa-eye-slash={itemFlagData.hidden}></i>
      </span>
      <span class="item-piles-clickable-link"
            on:click={() => { itemFlagData.notForSale = !itemFlagData.notForSale; item.updateItemFlagData(); }}>
        <i class="fas" class:fa-store={!itemFlagData.notForSale} class:fa-store-slash={itemFlagData.notForSale}></i>
      </span>
    {/if}
    {#if displayBuyButton}
      <span class:item-piles-clickable-link={!itemFlagData.notForSale || game.user.isGM}
            class:item-piles-clickable-link-disabled={itemFlagData.notForSale && !game.user.isGM}
            class:buy-button={displayControlButtons}
            on:click={() => {}}>
        <i class="fas fa-shopping-cart"></i>
        {#if !displayControlButtons} Buy{/if}
      </span>
    {/if}
  </div>

</div>


<style lang="scss">

  .item-piles-item-row {
    margin: 0;

    .sidebar-buttons {
      flex: 0 1 auto;
      align-items: center;
      justify-content: flex-end;
      text-align: right;

      & > span {
        flex: 0 1 auto;
        margin-right: 0.25rem;
        min-width: 17.5px;
      }

      .buy-button {
        padding-left: 0.25rem;
        border-left: 1px solid rgba(0, 0, 0, 0.5)
      }

      .disabled-buy-button {
        opacity: 0.5;
      }
    }

    .price-container {
      flex: 0 1 100px;
      align-items: center;
    }

    &.merchant-item-hidden {
      font-style: italic;
      opacity: 0.5;
    }

    .item-piles-text {
      font-size: inherit;
      padding-left: 0.25rem;
    }

    .item-piles-img-container {
      min-width: 20px;
      max-height: 20px;
      margin: 2px;
      flex: 1 0 auto;

      overflow: hidden;
      border-radius: 4px;
      border: 1px solid black;
      align-self: center;

      &.not-for-sale {
        position: relative;

        &::before {
          position: absolute;
          content: "";
          left: -10px;
          top: calc(50% - 2px);
          right: -10px;
          border-top: 4px solid red;

          -webkit-transform: rotate(-45deg);
          -moz-transform: rotate(-45deg);
          -ms-transform: rotate(-45deg);
          -o-transform: rotate(-45deg);
          transform: rotate(-45deg);
        }
      }

      .item-piles-img {
        border: 0;
        width: auto;
        height: 100%;
        transition: transform 150ms;

        &:hover {
          transform: scale(1.125, 1.125);
        }
      }
    }

    .item-piles-name-container {
      line-height: 1.6;
    }

  }

</style>