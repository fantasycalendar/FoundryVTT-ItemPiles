<script>

  import Tabs from "../components/Tabs.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import SliderInput from "../components/SliderInput.svelte";
  import TextEditorDialog from "../dialogs/text-editor-dialog/text-editor-dialog.js";
  import { get } from "svelte/store";

  export let store;
  export let activeTab;

  const merchantImg = store.img;
  const pileDataStore = store.pileData;
  const editPrices = store.editPrices;

  let tabs = [];
  let description;
  let activeSidebarTab = false;
  $: description = $pileDataStore.description;
  $: {
    tabs = [
      {
        value: 'description',
        label: 'ITEM-PILES.Merchant.Description',
        hidden: !game.user.isGM && description
      },
      { value: 'settings', label: 'ITEM-PILES.Merchant.Settings', hidden: !game.user.isGM },
    ];
    activeSidebarTab = activeSidebarTab || tabs.find(tab => !tab.hidden)?.value;
  }

  function showDescriptionEditor() {
    return TextEditorDialog.show(description, { id: "item-pile-text-editor-" + store.actor.id }).then((result) => {
      description = result || "";
      store.update();
    });
  }

</script>

<div class="merchant-left-pane item-piles-flexcol">

  <div class="merchant-img">
    <img src="{ $merchantImg }">
  </div>

  {#if activeSidebarTab}

    <div class="item-piles-flexcol item-piles-top-divider">

      <Tabs style="flex: 0 1 auto;" {tabs} bind:activeTab={activeSidebarTab}/>

      <section class="tab-body item-piles-sections">

        {#if activeSidebarTab === 'description'}
          <div class="tab merchant-description">
            {@html description || ""}
            {#if description || (!description && game.user.isGM)}
              <button type="button"
                      style="flex:1;"
                      on:click={() => { showDescriptionEditor() }}
              >{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescription")}</button>
            {/if}
          </div>
        {/if}

        {#if activeSidebarTab === 'settings'}
          <div class="tab merchant-settings">

            <div class="setting-container item-piles-config-container">

              <div class="form-group">
                <label style="flex:3;">
                  <span>{localize("ITEM-PILES.Merchant.EditTypePrices")}</span>
                  <p>{localize("ITEM-PILES.Merchant.EditTypePricesExplanation")}</p>
                </label>
                <input type="checkbox" bind:checked={$editPrices}/>
              </div>

              <div class="form-group">
                <label style="flex:3;">
                  <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PurchaseOnly")}</span>
                  <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PurchaseOnlyExplanation")}</p>
                </label>
                <input type="checkbox" bind:checked={$pileDataStore.purchaseOnly}/>
              </div>

              <div class="form-group">
                <label style="flex:3;">
                  <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItems")}</span>
                  <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItemsExplanation")}</p>
                </label>
                <input type="checkbox" bind:checked={$pileDataStore.hideNewItems}/>
              </div>

              <div class="form-group slider-group item-piles-flexcol">
                <label>
                  {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.BuyPriceModifier")}
                </label>
                <SliderInput bind:value={$pileDataStore.buyPriceModifier}/>
              </div>

              <div class="form-group slider-group item-piles-flexcol">
                <label>
                  {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}
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

  {/if}

</div>

<style lang="scss">

  .merchant-left-pane {

    flex: 0 1 35%;
    padding-right: 0.25rem;
    margin-right: 0.25rem;
    border-right: 1px solid rgba(0, 0, 0, 0.5);
    max-height: 100%;
    max-width: 300px;
    min-width: 250px;
    overflow-y: hidden;

    section {
      padding: 0.25rem;
    }

    .merchant-img {
      position: relative;
      flex: 0 1 auto;
      border-radius: 5px;

      img {
        width: 100%;
        height: auto;
        border: 0;
        border-radius: 3px;
        z-index: 1;
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
      height: calc(100% - 37px);


      .setting-container {
        overflow: hidden auto;
        top: 0;
        bottom: 37px;
        position: absolute;
        padding: 0 0.25rem;

        .form-group {
          clear: both;
          display: flex;
          flex-wrap: wrap;
          margin: 3px 0;

          &.item-piles-flexcol {
            align-items: flex-start;
          }
        }
      }

      .update-button {
        position: absolute;
        bottom: -37px;
      }

    }

  }

</style>