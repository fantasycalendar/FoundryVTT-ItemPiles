<script>

  import MerchantBuyTab from "./MerchantBuyTab.svelte";
  import MerchantSellTab from "./MerchantSellTab.svelte";
  import MerchantPopulateItemsTab from "./MerchantPopulateItemsTab.svelte";
  import CurrencyList from "../components/CurrencyList.svelte";
  import { writable } from "svelte/store";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let store;
  export let recipientStore;
  export let activeTab;

  const currencies = recipientStore?.allCurrencies || writable([]);
  let categories = store.categories;

  let closed = store.closed;

</script>

<div class="merchant-right-pane item-piles-flexcol">

  <div class="merchant-tabbed-center"
       style="flex: 1; max-height: calc(100% - {recipientStore && $currencies.length ? '34px' : '0px'})">

    {#if $closed && !game.user.isGM}
      <div style="display: grid; place-items: center; height:100%;">
        <span>{localize("ITEM-PILES.Merchant.MerchantClosed")}</span>
      </div>
    {:else if $activeTab === "buy"}
      <MerchantBuyTab {store} categoryFilter={(category) => { return !category.service }}/>
    {:else if $activeTab === "services" }
      <MerchantBuyTab {store} categoryFilter={(category) => { return category.service }}/>
    {:else if $activeTab === "sell"}
      <MerchantSellTab store={recipientStore}/>
    {:else if $activeTab === "tables"}
      <MerchantPopulateItemsTab {store}/>
    {/if}

  </div>


  {#if recipientStore}
    <div class="item-piles-flexrow merchant-bottom-row">
      <div style="flex: 0 1 auto;">
        {localize("ITEM-PILES.Merchant.ShoppingAs", { actorName: recipientStore.actor.name })}
      </div>
      {#if $currencies.length}
        <CurrencyList {currencies} options={{ imgSize: 18, reverse: true }} class="item-piles-currency-list"/>
      {/if}
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

  .merchant-bottom-row {
    flex: 0 1 auto;
    align-items: center;
    margin-top: 0.5rem;
  }

</style>
