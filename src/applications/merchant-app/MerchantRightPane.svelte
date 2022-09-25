<script>

  import MerchantBuyTab from "./MerchantBuyTab.svelte";
  import MerchantSellTab from "./MerchantSellTab.svelte";
  import MerchantPopulateItemsTab from "./MerchantPopulateItemsTab.svelte";
  import { writable } from "svelte/store";
  import MerchantCurrencyColumn from "./MerchantCurrencyColumn.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let store;
  export let recipientStore;
  export let activeTab;

  const currencies = recipientStore?.allCurrencies || writable([]);

  let closed = store.closed;

</script>

<div class="merchant-right-pane item-piles-flexcol">

  <div class="merchant-tabbed-center"
       style="flex: 1; max-height: calc(100% - {recipientStore && $currencies.length ? '46px' : '0px'})">

    {#if $closed && !game.user.isGM}
      <div style="display: grid; place-items: center; height:100%;">
        <span>{localize("ITEM-PILES.Merchant.MerchantClosed")}</span>
      </div>
    {:else if $activeTab === "buy"}
      <MerchantBuyTab {store}/>
    {:else if $activeTab === "sell"}
      <MerchantSellTab store={recipientStore}/>
    {:else if $activeTab === "tables"}
      <MerchantPopulateItemsTab {store}/>
    {/if}

  </div>


  {#if recipientStore && $currencies.length}
    <div class="item-piles-flexrow item-piles-currency-list">
      {#each $currencies as currency (currency.identifier)}
        <MerchantCurrencyColumn {currency}/>
      {/each}
    </div>
  {/if}

</div>


<style lang="scss">

  .merchant-right-pane {
    flex: 1;
    max-height: 100%;
    overflow: hidden;
    padding-left: 0.25rem;
  }

  .merchant-tabbed-center {
    overflow-y: scroll;
    overflow-x: hidden;
  }

  .item-piles-currency-list {
    justify-content: center;
    align-content: flex-end;
    flex: 0;
  }

</style>