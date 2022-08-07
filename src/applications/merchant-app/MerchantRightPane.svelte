<script>

  import Tabs from "../components/Tabs.svelte";
  import MerchantBuyTab from "./MerchantBuyTab.svelte";
  import MerchantSellTab from "./MerchantSellTab.svelte";

  export let store;
  export let recipientStore;

  let tabs = [
    { value: 'buy', label: 'Buy Items' },
    { value: 'sell', label: 'Sell Items', hidden: !recipientStore },
  ];
  let activeTab = tabs[0].value;

</script>

<div class="merchant-right-pane">

  <Tabs style="flex: 0 1 auto; font-size: 1.1rem; justify-content: flex-start;"
        tabs="{tabs}"
        bind:activeTab={activeTab}
        separateElements
        underscore
  />

  {#if activeTab === "buy"}
    <MerchantBuyTab {store}/>
  {:else}
    <MerchantSellTab store={recipientStore}/>
  {/if}

</div>


<style lang="scss">

  .merchant-right-pane {
    flex: 1;
    max-height: 100%;
    overflow-y: scroll;
    padding-left: 0.25rem;
  }

</style>