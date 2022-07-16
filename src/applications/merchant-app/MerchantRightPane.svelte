<script>

  import Tabs from "../components/Tabs.svelte";
  import MerchantBuyTab from "./MerchantBuyTab.svelte";

  export let store;

  let tabs = [
    { value: 'buy', label: 'Items For Sale' },
    { value: 'sell', label: 'Sell Items', hidden: !store.recipient },
  ];
  let activeTab = tabs[0].value;

</script>

<div class="merchant-right-pane">

  <!--<Tabs style="flex: 0 1 auto; font-size: 1.1rem; justify-content: flex-start;"
        tabs="{tabs}"
        bind:activeTab={activeTab}
        separateElements
        underscore
  />-->

  <h2>For Sale</h2>

  <MerchantBuyTab {store}/>

</div>


<style lang="scss">

  .merchant-right-pane {
    flex: 1;
    max-height: 100%;
    overflow-y: scroll;
  }

</style>