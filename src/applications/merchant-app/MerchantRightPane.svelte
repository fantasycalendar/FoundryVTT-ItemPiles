<script>

  import Tabs from "../components/Tabs.svelte";
  import MerchantBuyTab from "./MerchantBuyTab.svelte";
  import MerchantSellTab from "./MerchantSellTab.svelte";
  import MerchantPopulateItemsTab from "./MerchantPopulateItemsTab.svelte";
  import { writable } from "svelte/store";
  import MerchantCurrencyColumn from "./MerchantCurrencyColumn.svelte";

  export let store;
  export let recipientStore;

  const currencies = recipientStore?.allCurrencies || writable([]);

  const merchantFlags = store.pileData;

  let sellHidden;
  let tabs;
  let activeTab = "buy"
  $: {
    sellHidden = $merchantFlags.purchaseOnly;
    tabs = [
      { value: 'buy', label: 'Buy Items' },
      { value: 'sell', label: 'Sell Items', hidden: !recipientStore || sellHidden },
      { value: 'tables', label: 'Populate Items', hidden: !game.user.isGM },
    ];
  }

</script>

<div class="merchant-right-pane item-piles-flexcol">

  <Tabs style="flex: 0 1 auto; font-size: 1.1rem; justify-content: flex-start;"
        bind:tabs="{tabs}"
        bind:activeTab={activeTab}
        separateElements
        underscore
  />

  <div class="merchant-tabbed-center"
       style="flex:1; calc(100% - {recipientStore && $currencies.length ? '36px' : '0px'})">

    {#if activeTab === "buy"}
      <MerchantBuyTab {store}/>
    {:else if activeTab === "sell"}
      <MerchantSellTab store={recipientStore}/>
    {:else if activeTab === "tables"}
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