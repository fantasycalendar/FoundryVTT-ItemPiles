<script>

  import MerchantBuyTab from "./MerchantBuyTab.svelte";
  import MerchantSellTab from "./MerchantSellTab.svelte";
  import MerchantPopulateItemsTab from "./MerchantPopulateItemsTab.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import RecipientFooter from "./RecipientFooter.svelte";
  import { writable } from "svelte/store";

  export let store;
  export let recipientStore;
  export let activeTab;

  let categories = store.categories;

  let closed = store.closed;

  const currencies = recipientStore?.allCurrencies || writable([]);

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
		<RecipientFooter {recipientStore}/>
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

</style>
