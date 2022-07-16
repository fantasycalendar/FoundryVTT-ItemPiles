<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { getContext } from "svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { get, writable } from "svelte/store";
  import SliderInput from "../../components/SliderInput.svelte";
  import * as PileUtilities from "../../../helpers/pile-utilities.js";
  import * as Helpers from "../../../helpers/helpers.js";
  import PriceSelector from "../../components/PriceSelector.svelte";

  const { application } = getContext('external');

  export let item;
  export let merchant;
  export let seller;
  export let settings;
  export let elementRoot;
  export let store = item.store;

  const itemName = item.name;
  const itemImg = item.img;
  const itemFlagData = item.itemFlagData;
  const quantityToBuy = item.quantityToBuy;
  const itemMaxQuantityStore = item.quantity;
  const prices = item.prices;

  const pileData = PileUtilities.getActorFlagData(merchant);

  const selectedPriceGroup = item.selectedPriceGroup;
  let currentQuantityToBuy;
  $: {
    $selectedPriceGroup;
    currentQuantityToBuy = 1;
    $quantityToBuy = 1;
  }

  $: selectedPrice = $prices[$selectedPriceGroup];
  $: maxMerchantItemQuantity = pileData.infiniteQuantity ? Infinity : $itemMaxQuantityStore;
  $: maxItemQuantity = selectedPrice.maxQuantity;
  $: maxItemPurchaseQuantity = Math.min(maxItemQuantity, maxMerchantItemQuantity);

  function submit() {
    game.itempiles.tradeItems(item.item, seller, merchant, {
      paymentIndex: get(selectedPriceGroup),
      quantity: get(quantityToBuy),
      interactionId: store.interactionId
    });
    application.options.resolve();
    application.close();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <div>

    <div style="display: grid; grid-template-columns: 1fr 0.75fr; margin-bottom: 0.5rem;">
      <div style="display:flex; align-items: center; font-size:1rem; grid-row: 1;">
        <div class="item-piles-img-container" style="margin-right: 0.25rem;">
          <img class="item-piles-img" src={itemImg}/>
        </div>
        <span>{itemName}</span>
      </div>

      <div
          style="display:flex; justify-content:flex-end; align-items: center; grid-row: 1 / span 2; text-align: right;">
        {#if !maxItemQuantity}
          <label>You cannot afford this</label>
        {:else}
          <div style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 0.5rem;">
            <small>Quantity</small>
            <small style="font-style:italic;">
              (Max {maxItemPurchaseQuantity})
            </small>
          </div>
          <input style="max-width: 40px;" type="number" bind:value={currentQuantityToBuy} on:change={(evt) => {
            $quantityToBuy = Math.max(1, Math.min(currentQuantityToBuy, maxItemPurchaseQuantity));
            currentQuantityToBuy = $quantityToBuy;
          }}/>
        {/if}
      </div>
      <div style="margin-left: 0.25rem; margin-top: 0.25rem;">
        <PriceSelector {item} standalone/>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: auto auto;" class="item-piles-bottom-divider">

      <strong class="item-piles-bottom-divider" style="margin-bottom:0.25rem; padding-bottom:0.25rem;">
        You pay:
      </strong>

      <strong class="item-piles-bottom-divider item-piles-text-right"
              style="margin-bottom:0.25rem; padding-bottom:0.25rem;">
        You receive:
      </strong>

      <div>
        {#each selectedPrice.finalPrices as price}
          {#if price.quantity}
            <div style="display:flex; align-items: center;">
              <div class="item-piles-img-container" style="margin-right: 0.25rem;">
                <img class="item-piles-img" src={price.img}/>
              </div>
              <span>{price.quantity} {price.name}</span>
            </div>
          {/if}
        {/each}
      </div>

      <div style="display:flex; flex-direction: column; align-items: flex-end;">
        <div style="display:flex; align-items: center;">
          <span>{$quantityToBuy > 1 ? $quantityToBuy + " " : ""}{itemName}</span>
          <div class="item-piles-img-container" style="margin-left: 0.25rem;">
            <img class="item-piles-img" src={itemImg}/>
          </div>
        </div>
        {#if selectedPrice.changeBack.length}
          <span class="item-piles-small-text item-piles-text-right" style="margin-right: 0.25rem; margin-top: 0.5rem;">
            Change:
          </span>
          {#each selectedPrice.changeBack as change}
            {#if change.quantity}
              <div style="display:flex; align-items: center;">
                <span>{change.quantity} {change.name}</span>
                <div class="item-piles-img-container" style="margin-left: 0.25rem;">
                  <img class="item-piles-img" src={change.img}/>
                </div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>

    </div>

    <footer class="sheet-footer flexrow" style="margin-top: 1rem;">
      <button type="button" disabled={!maxItemPurchaseQuantity} on:click|once={ () => { submit() } }>
        <i class="fas fa-shopping-cart"></i>
        {settings?.button ?? localize("ITEM-PILES.Applications.BuyItem.BuyItem")}
      </button>

      <button type="button" on:click|once={() => { application.close() }}>
        <i class="fas fa-times"></i>
        {localize("Cancel")}
      </button>
    </footer>

  </div>

</ApplicationShell>

<style lang="scss">

  .highlight {
    box-shadow: inset 0 0 13px 5px rgba(255, 117, 0, 0.73);
  }

</style>