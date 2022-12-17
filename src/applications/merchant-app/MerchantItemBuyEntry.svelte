<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { fade } from 'svelte/transition';
  import ItemEditor from "../editors/item-editor/item-editor.js";
  import PriceSelector from "../components/PriceSelector.svelte";
  import ItemEntry from "./ItemEntry.svelte";

  export let item;

  const itemName = item.name;
  const itemImage = item.img;

  const store = item.store;
  const pileData = store.pileData;
  const displayQuantityStore = item.displayQuantity;
  const quantityStore = item.quantity;
  const itemFlagDataStore = item.itemFlagData;

  $: itemFlagData = $itemFlagDataStore;
  $: displayQuantity = $displayQuantityStore;
  $: quantity = $quantityStore;
  $: editQuantity = $quantityStore;
  let showEditQuantity = false;

  const displayControlButtons = store.actor.isOwner;
  const displayBuyButton = !!store.recipient;

  function previewItem(item) {
    item = store.actor.items.get(item.id);
    if (game.user.isGM || item.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass()
    const sheet = new cls(item, { editable: false })
    return sheet._render(true);
  }

</script>

<div class="item-piles-flexrow item-piles-item-row item-piles-odd-color"
     class:merchant-item-hidden={itemFlagData.hidden}
     transition:fade|local={{duration: 250}}
     style="flex: 1 0 auto;">

  <ItemEntry {item}/>

  <PriceSelector {item}/>

  <div class="item-piles-flexrow sidebar-buttons">
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
      <span
        class:item-piles-clickable-link={!itemFlagData.notForSale || game.user.isGM}
        class:item-piles-clickable-link-disabled={quantity <= 0 || (itemFlagData.notForSale && !game.user.isGM)}
        class:buy-button={displayControlButtons}
        on:click={() => {
              if(quantity <= 0 || (itemFlagData.notForSale && !game.user.isGM)) return;
              store.tradeItem(item)
            }}>
        <i class="fas fa-shopping-cart"></i>
        {#if !displayControlButtons} {localize("ITEM-PILES.Merchant.Buy")}{/if}
      </span>
    {/if}
  </div>

</div>


<style lang="scss">

  .item-piles-item-row {
    margin: 0;
    overflow: visible;

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

    &.merchant-item-hidden {
      font-style: italic;
      opacity: 0.5;
    }

    .item-piles-text {
      font-size: inherit;
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
    }

    .item-piles-name-container {
      line-height: 1.6;
    }

  }

</style>
