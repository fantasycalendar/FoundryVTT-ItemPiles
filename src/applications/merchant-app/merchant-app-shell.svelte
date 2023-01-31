<script>
  import { getContext, onDestroy } from 'svelte';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import MerchantStore from "../../stores/merchant-store.js";
  import * as Helpers from "../../helpers/helpers.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { hotkeyState } from "../../hotkeys.js";
  import DropZone from "../components/DropZone.svelte";
  import { SYSTEMS } from "../../systems.js";
  import MerchantLeftPane from "./MerchantLeftPane.svelte";
  import MerchantRightPane from "./MerchantRightPane.svelte";
  import MerchantTopBar from "./MerchantTopBar.svelte";
  import Tabs from "../components/Tabs.svelte";
  import { get, writable } from "svelte/store";

  const { application } = getContext('external');

  export let elementRoot;

  export let merchant;
  export let recipient;

  export let store = new MerchantStore(application, merchant, recipient);
  export let recipientStore = recipient ? new MerchantStore(application, recipient, merchant, { recipientPileData: store.pileData }) : false;

  let pileData = store.pileData;
  let closedStore = store.closed;

  onDestroy(() => {
    store.onDestroy();
  });

  let priceSelector = store.priceSelector;
  let categories = store.categories;
  let visibleItems = store.visibleItems;

  async function dropData(data) {

    if (!game.user.isGM) return;

    if (!data.type) {
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    if (data.type !== "Item") {
      throw Helpers.custom_error("You must drop an item, not " + data.type.toLowerCase() + "!")
    }

    const item = await Item.implementation.fromDropData(data);
    const validItem = await PileUtilities.checkItemType(merchant, item, {
      errorText: "ITEM-PILES.Errors.DisallowedItemTrade",
      warningTitle: "ITEM-PILES.Dialogs.TypeWarning.Title",
      warningContent: "ITEM-PILES.Dialogs.TypeWarning.TradeContent"
    });
    if (!validItem) return;

    return game.itempiles.API.addItems(merchant, [{
      item: validItem,
      quantity: 1
    }]);

  }

  const activeTab = writable("buy");

  let tabs;
  $: {
    const hasItems = $visibleItems.some(item => !get(item.category).service)
    const hasServices = $visibleItems.some(item => get(item.category).service)
    const canSell = !$pileData.purchaseOnly && recipientStore;
    const showBuy = hasItems || (!hasItems && !hasServices && !canSell)
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
		<Tabs style="flex: 0 1 auto; font-size: 1.1rem; justify-content: flex-start;"
					bind:tabs="{tabs}"
					bind:activeTab={$activeTab}
					separateElements
					underscore
		/>
		<div class="item-piles-flexrow item-pile-merchant-content">
			{#if $activeTab !== "tables"}
				<MerchantLeftPane {store}/>
			{/if}
			<MerchantRightPane {store} {recipientStore} {activeTab}/>
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
