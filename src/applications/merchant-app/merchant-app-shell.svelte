<script>
  import { getContext, onDestroy } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { fade } from 'svelte/transition';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import Tabs from "../components/Tabs.svelte";
  import SliderInput from "../components/SliderInput.svelte";
  import MerchantStore from "../../stores/merchant-store.js";
  import MerchantItemEntry from "./MerchantItemEntry.svelte";
  import * as Helpers from "../../helpers/helpers.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { hotkeyState } from "../../hotkeys.js";
  import DropZone from "../components/DropZone.svelte";
  import PrivateAPI from "../../API/private-api.js";

  const { application } = getContext('external');

  export let elementRoot;

  export let merchant;
  export let buyer;

  export let store = new MerchantStore(application, merchant, buyer);

  onDestroy(() => {
    store.onDestroy();
  });

  let searchStore = store.search;
  let itemsPerCategoryStore = store.itemsPerCategory;
  let categoryStore = store.categories;
  let priceModifiersPerType = store.priceModifiersPerType;
  let editPrices = !buyer;
  const pileDataStore = store.pileData;

  const merchantName = store.name;
  const merchantImg = store.img;

  $: pileData = $pileDataStore;

  function getOpenTimes() {
    let open = pileData.openTimes.open;
    let close = pileData.openTimes.close;
    open = `${open.hour.toString().padStart(2, "0")}:${open.minute.toString().padStart(2, "0")}`;
    close = `${close.hour.toString().padStart(2, "0")}:${close.minute.toString().padStart(2, "0")}`;
    return `${open} - ${close}`;
  }

  async function dropData(data) {

    if (!data.type) {
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    if (data.type !== "Item") {
      throw Helpers.custom_error("You must drop an item, not " + data.type.toLowerCase() + "!")
    }

    let item = await Item.implementation.fromDropData(data);

    const disallowedType = PileUtilities.isItemInvalid(merchant, item);
    if (disallowedType) {
      if (!game.user.isGM) {
        return Helpers.custom_warning(game.i18n.format("ITEM-PILES.Errors.DisallowedItemSell", { type: disallowedType }), true)
      }
      if (!hotkeyState.shiftDown) {
        const force = await Dialog.confirm({
          title: game.i18n.localize("ITEM-PILES.Dialogs.SellTypeWarning.Title"),
          content: `<p class="item-piles-dialog">${game.i18n.format("ITEM-PILES.Dialogs.SellTypeWarning.Content", { type: disallowedType })}</p>`,
          defaultYes: false
        });
        if (!force) {
          return false;
        }
      }
    }

    PrivateAPI._sellItem(item, merchant, buyer ?? false);

  }

  let activeSidebarTab = "description";

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <DropZone callback={dropData} style="display: flex; flex-direction: column; height: 100%;">
    <div class="flexrow merchant-top-bar item-piles-bottom-divider">
      <div class="merchant-name">{ $merchantName }</div>
      {#if pileData.openTimes.enabled}
        <div class="opening-hours flexcol">
          <span>Opening hours</span>
          <span style="font-style: italic;">{getOpenTimes()}</span>
        </div>
      {/if}
    </div>

    <div class="flexrow item-pile-merchant-content">

      <div class="merchant-left-pane flexcol">

        <div class="merchant-img">
          <img src="{ $merchantImg }">
        </div>

        <div class="flexcol item-piles-top-divider">

          <Tabs style="flex: 0 1 auto;" tabs="{[
            { value: 'description', label: 'Description' },
            { value: 'settings', label: 'Settings', hidden: !game.user.isGM },
          ]}" bind:activeTab={activeSidebarTab}/>

          <section class="tab-body item-piles-sections">

            {#if activeSidebarTab === 'description'}
              <div class="tab merchant-description">
                <div>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                  et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip
                  ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore
                  eu
                  fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
                  deserunt mollit anim id est laborum.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                  et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip
                  ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore
                  eu
                  fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
                  deserunt mollit anim id est laborum.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                  et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip
                  ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore
                  eu
                  fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
                  deserunt mollit anim id est laborum.
                </div>
              </div>
            {/if}

            {#if activeSidebarTab === 'settings'}
              <div class="tab merchant-settings">
                <div class="setting-container">

                  <div class="form-group slider-group">
                    <label style="flex:3;">
                      {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.BuyPriceModifier")}<br>
                    </label>
                    <SliderInput style="flex:4;" bind:value={$pileDataStore.buyPriceModifier}/>
                  </div>

                  <div class="form-group slider-group">
                    <label style="flex:3;">
                      {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}<br>
                    </label>
                    <SliderInput style="flex:4;" bind:value={$pileDataStore.sellPriceModifier}/>
                  </div>


                </div>

                <button type="button" class="update-button" on:click={() => { store.update(); }}>
                  <i class="fas fa-download"></i> Update
                </button>
              </div>
            {/if}

          </section>

        </div>

      </div>

      <div class="merchant-right-pane">
        <h2 style="flex: 0; border:0;">For sale</h2>
        <input type="text" bind:value={$searchStore}>
        {#each $categoryStore as category, index (category.type)}
          <div transition:fade={{duration: 150}}>
            <h3 class="merchant-item-group-type flexrow">
              <div>
                {localize(category.label)}
              </div>
              <div class="price-header">
                {#if editPrices}
                  {#if $priceModifiersPerType[category.type]}
                    Override:
                    <input type="checkbox" bind:checked={$priceModifiersPerType[category.type].override}>
                    <SliderInput bind:value={$priceModifiersPerType[category.type].buyPriceModifier}/>
                  {/if}
                {/if}
              </div>
              <div style="flex: 0 1 auto">
                {#if editPrices}
                  {#if $priceModifiersPerType[category.type]}
                    <i class="fas fa-times item-piles-clickable-red"
                       on:click={() => { store.removeOverrideTypePrice(category.type) }}></i>
                  {:else}
                    <i class="fas fa-plus item-piles-clickable-green"
                       on:click={() => { store.addOverrideTypePrice(category.type) }}></i>
                  {/if}
                {/if}
              </div>
            </h3>

            <div class="item-piles-items-list">
              {#each $itemsPerCategoryStore[category.type] as item (item.id)}
                <MerchantItemEntry {store} {item}/>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </DropZone>
</ApplicationShell>


<style lang="scss">

  .hidden {
    display: none;
  }

  .merchant-top-bar {

    flex: 0 1 auto;

    .opening-hours {
      text-align: right;
      flex: 0 1 auto;
    }

    .merchant-name {
      font-size: 2em;
    }

  }

  .item-pile-merchant-content {

    flex: 1;
    max-height: calc(100% - 53px);

    .merchant-left-pane {

      flex: 0 1 35%;
      padding-right: 0.25rem;
      margin-right: 0.25rem;
      border-right: 1px solid rgba(0, 0, 0, 0.5);
      max-height: 100%;
      max-width: 300px;
      min-width: 250px;
      overflow-y: scroll;

      section {
        padding: 0.25rem;
        margin-top: 0.5rem;
      }

      .merchant-img {
        flex: 0 1 auto;
        border-radius: 5px;
        margin-bottom: 5px;

        img {
          width: 100%;
          height: auto;
          border: 0;
          border-radius: 3px;
        }
      }

      .merchant-description {
        position: relative;
        height: 100%;
        padding: 0.25rem;

        div {
          overflow: hidden auto;
          top: 0;
          bottom: 0;
          position: absolute;
          word-break: break-word;
        }
      }

      .merchant-settings {
        position: relative;
        height: 100%;

        .setting-container {
          overflow: hidden auto;
          top: 0;
          bottom: 37px;
          position: absolute;
        }

        .update-button {
          position: absolute;
          bottom: 0;
        }

      }

    }

    .merchant-right-pane {
      flex: 1;
      max-height: 100%;

      overflow-y: scroll;

      .merchant-item-group-type {
        border-bottom: 1px solid rgba(0, 0, 0, 0.2);
        margin-top: 10px;
        padding-right: 10px;

        .price-header {
          flex: 0 1 250px;
          padding-right: 10px;
          justify-content: center;
          display: flex;
          align-items: center;

          input[type="checkbox"] {
            height: 15px;
          }
        }
      }

      .item-piles-items-list {
        overflow: visible;
        padding-right: 10px;
      }
    }
  }


</style>