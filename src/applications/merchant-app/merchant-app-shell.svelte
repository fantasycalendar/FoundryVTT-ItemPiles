<script>
	import { getContext, onDestroy } from 'svelte';
	import { ApplicationShell } from '#runtime/svelte/component/application';
	import MerchantStore from "../../stores/merchant-store.js";
	import * as Helpers from "../../helpers/helpers.js";
	import * as PileUtilities from "../../helpers/pile-utilities.js";
	import DropZone from "../components/DropZone.svelte";
	import MerchantLeftPane from "./MerchantLeftPane.svelte";
	import MerchantRightPane from "./MerchantRightPane.svelte";
	import MerchantTopBar from "./MerchantTopBar.svelte";
	import Tabs from "../components/Tabs.svelte";
	import { get, writable } from "svelte/store";
	import PrivateAPI from "../../API/private-api.js";

	const { application } = getContext('#external');

	export let elementRoot;

	export let merchant;
	export let recipient;

	export let store = MerchantStore.make(application, merchant, recipient);
	export let recipientStore = recipient ? MerchantStore.make(application, recipient, merchant, { recipientPileData: store.pileData }) : false;

	let pileData = store.pileData;

	onDestroy(() => {
		store.onDestroy();
		if (recipientStore) recipientStore.onDestroy();
	});

	let priceSelector = store.priceSelector;
	let visibleItems = store.visibleItems;

	async function dropData(data) {

		if (data.type === "Actor") {
			const newRecipient = data.uuid ? (await fromUuid(data.uuid)) : game.actors.get(data.id);
			this.updateRecipient(newRecipient);
			if (recipientStore) {
				return recipientStore.updateSource(newRecipient);
			}
			recipientStore = MerchantStore.make(application, newRecipient, merchant, { recipientPileData: store.pileData });
			return;
		}

		return store.onDrop(data);

	}

	const activeTab = writable("buy");

	let tabs;
	$: {
		const hasItems = $visibleItems.some(item => !get(item.category).service)
		const hasServices = $visibleItems.some(item => get(item.category).service)
		const canSell = !$pileData.purchaseOnly && recipientStore;
		const showBuy = hasItems || !hasServices
		tabs = [
			{
				value: 'buy',
				label: game.i18n.localize('ITEM-PILES.Merchant.BuyItems'),
				hidden: !showBuy
			},
			{
				value: 'services',
				label: game.i18n.localize('ITEM-PILES.Merchant.BuyServices'),
				hidden: !hasServices
			},
			{
				value: 'sell',
				label: game.i18n.localize('ITEM-PILES.Merchant.SellItems'),
				hidden: !canSell
			},
			{
				value: 'tables',
				label: game.i18n.localize('ITEM-PILES.Merchant.PopulateItems'),
				hidden: !game.user.isGM
			},
			{
				value: 'log',
				label: game.i18n.localize('ITEM-PILES.Merchant.Log'),
				hidden: !merchant.isOwner || !$pileData.logMerchantActivity
			},
		];
		if (tabs.find(tab => tab.value === $activeTab).hidden) {
			$activeTab = tabs.find(tab => !tab.hidden).value;
		}
	}

</script>

<svelte:options accessors={true}/>

<svelte:window on:click={() => { $priceSelector = ""; }}/>

<ApplicationShell bind:elementRoot>
	<DropZone callback={dropData} style="display: flex; flex-direction: column; height: 100%;">
		<MerchantTopBar {store}/>
		<Tabs bind:activeTab={$activeTab}
		      bind:tabs="{tabs}"
		      separateElements
		      style="flex: 0 1 auto; font-size: 1.1rem; justify-content: flex-start;"
		      underscore
		/>
		<div class="item-piles-flexrow item-pile-merchant-content">
			{#if $activeTab !== "tables"}
				<MerchantLeftPane {store}/>
			{/if}
			<MerchantRightPane {activeTab} {recipientStore} {store}/>
		</div>
	</DropZone>
</ApplicationShell>


<style lang="scss">

  .hidden {
    display: none;
  }

  .item-pile-merchant-content {

    flex: 1;
    max-height: calc(100% - 84px);

  }


</style>
