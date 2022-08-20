<script>

  import Tabs from "../components/Tabs.svelte";
  import MerchantBuyTab from "./MerchantBuyTab.svelte";
  import MerchantSellTab from "./MerchantSellTab.svelte";
  import MerchantPopulateItemsTab from "./MerchantPopulateItemsTab.svelte";
  import { get } from "svelte/store";

  export let store;
  export let recipientStore;

  const currencies = recipientStore.allCurrencies;

  const merchantFlags = store.pileData;

  let sellHidden;
  let tabs;
  let activeTab;
  $: {
    sellHidden = $merchantFlags.purchaseOnly;
    tabs = [
      { value: 'buy', label: 'Buy Items' },
      { value: 'sell', label: 'Sell Items', hidden: !recipientStore || sellHidden },
      { value: 'tables', label: 'Populate Items', hidden: !game.user.isGM },
    ];

    activeTab = activeTab || tabs[0].value;
  }

</script>

<div class="merchant-right-pane item-piles-flexcol">

  <Tabs style="flex: 0 1 auto; font-size: 1.1rem; justify-content: flex-start;"
        bind:tabs="{tabs}"
        bind:activeTab={activeTab}
        separateElements
        underscore
  />

  <div class="merchant-tabbed-center" style="flex:1;">

    {#if activeTab === "buy"}
      <MerchantBuyTab {store}/>
    {:else if activeTab === "sell"}
      <MerchantSellTab store={recipientStore}/>
    {:else if activeTab === "tables"}
      <MerchantPopulateItemsTab {store}/>
    {/if}

  </div>

  <div class="item-piles-flexrow item-piles-currency-list">

    {#each $currencies as currency (currency.identifier)}

      <div class="item-piles-flexrow item-piles-item-row" style="flex:0 1 auto; margin: 0.5rem 0.25rem;">

        <div class="item-piles-img-container">
          <img class="item-piles-img" src="{get(currency.img)}"/>
        </div>

        <div class="item-piles-name item-piles-text" style="flex:0 1 auto;">
          <div class="item-piles-name-container">
            {#if currency.abbreviation}
              {currency.abbreviation.replace("{#}", get(currency.quantity))}
            {:else}
              {get(currency.name)} (x{get(currency.quantity)})
            {/if}
          </div>
        </div>

      </div>

    {/each}

  </div>

</div>


<style lang="scss">

  .merchant-right-pane {
    flex: 1;
    max-height: 100%;
    overflow: hidden;
    padding-left: 0.25rem;
  }

  .merchant-tabbed-center {
    max-height: calc(100% - 36px);
    overflow-y: scroll;
    overflow-x: hidden;
  }

  .item-piles-currency-list {
    justify-content: center;
    align-content: flex-end;
    flex: 0;
  }

</style>