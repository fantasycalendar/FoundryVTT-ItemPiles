<script>
  import { fade } from 'svelte/transition';
  import ItemEditor from "../editors/item-editor/item-editor.js";

  export let store;
  export let item;

  const pileData = store.pileData;
  const priceSelector = store.priceSelector;
  const prices = item.prices;
  const displayQuantity = item.displayQuantity;
  const quantity = item.quantity;
  const selectedPriceGroup = item.selectedPriceGroup;
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

<svelte:window on:click={() => { $priceSelector = ""; }}/>

<div class="flexrow item-piles-item-row item-piles-odd-color"
     class:merchant-item-hidden={itemFlagData.hidden}
     transition:fade={{duration: 250}}
     style="flex: 1 0 auto;">

  <div class="item-piles-img-container" class:not-for-sale={itemFlagData.notForSale || !$quantity}>
    <img class="item-piles-img" src="{item.img}"/>
  </div>

  <div class="item-piles-name item-piles-text">
    <div class="item-piles-name-container">
      {#if $pileData.canInspectItems || game.user.isGM}
        <a class="item-piles-clickable" on:click={previewItem(item)}>{item.name}</a>
      {:else}
        {item.name}
      {/if}
      {#if $displayQuantity && $quantity}
        <span class="item-piles-small-text">
          {#if itemFlagData.infiniteQuantity}
            (∞)
          {:else}
            (x{$quantity})
          {/if}
        </span>
      {/if}
    </div>
  </div>

  <div class="flexrow price-container" on:click|stopPropagation>
    {#if itemFlagData.free}
      <small>Free</small>
    {:else}
      <small
          class:item-piles-clickable-link={$prices.length > 1}
          class:multiple-prices={$prices.length > 1}
          class:cant-afford={!$prices[$selectedPriceGroup].canAfford}
          on:click={() => { $priceSelector = $priceSelector === item.id ? "" : item.id; }}
      >
        {$prices[$selectedPriceGroup].string}
      </small>
      {#if $priceSelector === item.id}
        <div class="price-list">
          {#each $prices as priceGroup, index (index)}
            <div class="price-group" class:selected={$selectedPriceGroup === index}>
              {#each priceGroup.prices as price}
                <div class="price-group-container"
                     on:click={() => {
                       if(priceGroup.canAfford){
                         $selectedPriceGroup = index;
                         $priceSelector = "";
                       }
                     }}
                     class:cant-afford={!priceGroup.canAfford}>
                  <div class="item-piles-img-container" class:not-for-sale={!priceGroup.canAfford}>
                    <img class="item-piles-img" src="{price.img}"/>
                  </div>
                  <div class="item-piles-name item-piles-text">
                    {price.cost} {price.name}
                  </div>
                </div>
              {/each}
            </div>
          {/each}
        </div>
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

    .price-container {
      flex: 0 1 100px;
      align-items: center;
      position: relative;

      .cant-afford {
        opacity: 0.5;
      }
    }

    .multiple-prices::before,
    .multiple-prices::after {
      content: '';
      position: absolute;
      top: -0.5rem;
      left: -0.65rem;
      border-color: transparent;
      border-style: solid;
    }

    .multiple-prices::after {
      border-width: 0.4rem;
      border-right-color: #cf5234;
      transform: rotate(45deg);
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
    }

    .item-piles-name-container {
      line-height: 1.6;
    }

  }

  .price-list {
    top: 25px;
    left: -5px;
    position: absolute;
    z-index: 900;
    font-size: 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    overflow: hidden;
    background-color: #e6e6d5;
    box-shadow: 0 6px 9px -1px rgba(0, 0, 0, 0.5);

    .price-group {

      cursor: pointer;
      user-select: none;

      &.selected {
        background-color: #f2f2e1;
      }

      &:hover {
        background-color: #ffffed;
      }

      .price-group-container {
        display: flex;
        align-items: center;

        padding: 0 4px 0 2px;

        &:first-child {
          padding-top: 2px;
        }

        &:last-child {
          padding-bottom: 2px;
        }

        .item-piles-img-container {
          min-height: 18px;
          min-width: 18px;
          max-width: 18px;
          max-height: 18px;
          margin: 1px;
        }
      }

      &:not(:last-child) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.5);
      }
    }
  }

</style>