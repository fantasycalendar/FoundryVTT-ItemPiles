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
  import { get } from "svelte/store";

  const { application } = getContext('external');

  export let elementRoot;

  export let merchant;
  export let recipient;

  export let store = new MerchantStore(application, merchant, recipient);
  export let recipientStore = recipient ? new MerchantStore(application, recipient, merchant, { recipientPileData: store.pileData }) : false;

  onDestroy(() => {
    store.onDestroy();
  });

  let priceSelector = store.priceSelector;

  async function dropData(data) {

    if (!data.type) {
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    if (data.type !== "Item") {
      throw Helpers.custom_error("You must drop an item, not " + data.type.toLowerCase() + "!")
    }

    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if (SYSTEMS.DATA.ITEM_TRANSFORMER) {
      itemData = SYSTEMS.DATA.ITEM_TRANSFORMER(itemData);
    }

    const disallowedType = PileUtilities.isItemInvalid(merchant, item);
    if (disallowedType) {
      if (!game.user.isGM) {
        return Helpers.custom_warning(game.i18n.format("ITEM-PILES.Errors.DisallowedItemSell", { type: disallowedType }), true)
      }
      if (!hotkeyState.shiftDown) {
        const force = await Dialog.confirm({
          title: game.i18n.localize("ITEM-PILES.Dialogs.TypeWarning.Title"),
          content: `<p class="item-piles-dialog">${game.i18n.format("ITEM-PILES.Dialogs.TypeWarning.SellContent", { type: disallowedType })}</p>`,
          defaultYes: false
        });
        if (!force) {
          return false;
        }
      }
    }

    if (data.actorId) {
      return
    } else if (!game.user.isGM) {
      return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true);
    }

    return game.itempiles.API.addItems(merchant, [{
      item: itemData,
      quantity: 1
    }]);

  }

</script>

<svelte:options accessors={true}/>

<svelte:window on:click={() => { $priceSelector = ""; }}/>

<ApplicationShell bind:elementRoot>
  <DropZone callback={dropData} style="display: flex; flex-direction: column; height: 100%;">
    <MerchantTopBar {store}/>
    <div class="item-piles-flexrow item-pile-merchant-content">
      <MerchantLeftPane {store}/>
      <MerchantRightPane {store} {recipientStore}/>
    </div>
  </DropZone>
</ApplicationShell>


<style lang="scss">

  .hidden {
    display: none;
  }

  .item-pile-merchant-content {

    flex: 1;
    max-height: calc(100% - 53px);

  }


</style>