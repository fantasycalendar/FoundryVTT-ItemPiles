<script>

	import MerchantItemTab from "./MerchantItemTab.svelte";
	import MerchantPopulateItemsTab from "./MerchantPopulateItemsTab.svelte";
	import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
	import MerchantFooter from "./MerchantFooter.svelte";
	import { writable } from "svelte/store";
	import MerchantActivityLog from "./MerchantActivityLog.svelte";

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
			<MerchantItemTab {store} noItemsLabel="ITEM-PILES.Merchant.NoItemsForSale"/>
		{:else if $activeTab === "services" }
			<MerchantItemTab {store} services={true}/>
		{:else if $activeTab === "sell"}
			<MerchantItemTab store={recipientStore} noItemsLabel="ITEM-PILES.Merchant.NoItemsToSell"/>
		{:else if $activeTab === "tables"}
			<MerchantPopulateItemsTab {store}/>
		{:else if $activeTab === "log"}
			<MerchantActivityLog {store}/>
		{/if}

	</div>

	<MerchantFooter {recipientStore} {store}/>

</div>


<style lang="scss">

  .merchant-right-pane {
    flex: 1;
    max-height: 100%;
    overflow: hidden;
    padding-left: 0.25rem;
  }

  .merchant-tabbed-center {
    overflow: hidden;
  }

</style>
