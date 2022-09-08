<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { fade } from 'svelte/transition';
  import PriceSelector from "../components/PriceSelector.svelte";

  export let item;

  const store = item.store;
  const itemName = item.name;
  const itemImage = item.img;

  const pileData = store.pileData;
  const displayQuantityStore = item.displayQuantity;
  const quantityStore = item.quantity;
  const itemFlagDataStore = item.itemFlagData;

  $: itemFlagData = $itemFlagDataStore;
  $: displayQuantity = $displayQuantityStore;
  $: quantity = $quantityStore;
  $: editQuantity = $quantityStore;
  let showEditQuantity = false;

  const displayBuyButton = !!store.recipient;

  function previewItem(item) {
    item = store.actor.items.get(item.id);
    if (game.user.isGM || item.data.permission[game.user.id] === 3) {
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

  <div class="item-piles-img-container"
       class:not-for-sale={!quantity || itemFlagData.cantBeSoldToMerchants}>
    <img class="item-piles-img" src="{$itemImage}"/>
  </div>

  <div class="item-piles-name item-piles-text">
    <div class="item-piles-name-container">
      {#if $pileData.canInspectItems || game.user.isGM}
        <a class="item-piles-clickable" on:click={previewItem(item)}>{$itemName}</a>
      {:else}
        {$itemName}
      {/if}
      {#if displayQuantity}
        {#if itemFlagData.infiniteQuantity}
          <span class="item-piles-small-text">(∞)</span>
        {:else if !showEditQuantity}
          <span class="item-piles-small-text" class:item-piles-clickable-link={game.user.isGM}
                on:click={() => { if(game.user.isGM) showEditQuantity = true; }}>(x{quantity})</span>
        {/if}
      {/if}
      {#if showEditQuantity}
        <div class="item-piles-quantity-container" style="flex:0 1 50px;">
          <div class="item-piles-quantity-input-container">
            <input class="item-piles-quantity" type="text" bind:value="{editQuantity}" autofocus
                   on:change={() => { showEditQuantity = false; item.updateQuantity(editQuantity); }}
                   on:keydown={(evt) => { if(evt.key === "Enter") showEditQuantity = false; }}/>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <PriceSelector {item}/>

  <div class="item-piles-flexrow sidebar-buttons">
    {#if displayBuyButton}
      <span
        class:item-piles-clickable-link={quantity > 0 && !itemFlagData.cantBeSoldToMerchants}
        class:item-piles-clickable-link-disabled={quantity <= 0 || itemFlagData.cantBeSoldToMerchants}
        on:click={() => {
              if((quantity <= 0 || itemFlagData.cantBeSoldToMerchants)) return;
              store.tradeItem(item, true)
            }}>
        <i class="fas fa-hand-holding-usd"></i>
        {localize("ITEM-PILES.Merchant.Sell")}
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