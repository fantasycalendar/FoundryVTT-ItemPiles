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
  import { writable } from "svelte/store";

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
      item: validItem.toObject(),
      quantity: 1
    }]);

  }

  const activeTab = writable("buy");

  let sellHidden;
  let tabs;
  $: {
    sellHidden = $pileData.purchaseOnly;
    tabs = [
      {
        value: 'buy',
        label: game.i18n.localize('ITEM-PILES.Merchant.BuyItems')
      },
      {
        value: 'sell',
        label: game.i18n.localize('ITEM-PILES.Merchant.SellItems'),
        hidden: !recipientStore || sellHidden
      },
      {
        value: 'tables',
        label: game.i18n.localize('ITEM-PILES.Merchant.PopulateItems'),
        hidden: !game.user.isGM
      },
    ];
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