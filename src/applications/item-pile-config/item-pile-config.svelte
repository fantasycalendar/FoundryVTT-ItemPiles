<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import FilePicker from "../components/FilePicker.svelte";

  import CONSTANTS from "../../constants/constants.js";
  import * as SharingUtilities from "../../helpers/sharing-utilities.js";
  import * as Helpers from "../../helpers/helpers.js";

  import PriceModifiersEditor from "../editors/price-modifiers-editor/price-modifiers-editor.js";
  import CurrenciesEditor from "../editors/currencies-editor/currencies-editor.js";
  import ItemFiltersEditor from "../editors/item-filters-editor/item-filters-editor.js";

  import Tabs from "../components/Tabs.svelte";
  import SETTINGS from "../../constants/settings.js";
  import PileAPI from "../../API/api.js";
  import SliderInput from "../components/SliderInput.svelte";
  import ItemTypePriceModifiersEditor
    from "../editors/item-type-price-modifiers-editor/item-type-price-modifiers-editor.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";

  const { application } = getContext('external');

  export let elementRoot;
  export let pileActor;

  let form;

  let pileData = PileUtilities.getActorFlagData(pileActor);
  let deleteWhenEmptySetting = localize(Helpers.getSetting(SETTINGS.DELETE_EMPTY_PILES) ? "Yes" : "No");

  let hasOverrideCurrencies = typeof pileData?.overrideCurrencies === "object";
  let hasOverrideItemFilters = typeof pileData?.overrideItemFilters === "object";

  $: {
    if (!hasOverrideCurrencies) {
      pileData.overrideCurrencies = false;
    }
  }
  $: {
    if (!hasOverrideItemFilters) {
      pileData.overrideItemFilters = false;
    }
  }

  async function updateSettings() {

    let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

    const data = foundry.utils.mergeObject(defaults, pileData);

    data.deleteWhenEmpty = {
      "default": "default",
      "true": true,
      "false": false
    }[data.deleteWhenEmpty];

    PileAPI.updateItemPile(pileActor, data);

    application.close();
  }

  async function showCurrenciesEditor() {
    pileData.overrideCurrencies = pileData?.overrideCurrencies || game.itempiles.CURRENCIES;
    return CurrenciesEditor.show(
      pileData.overrideCurrencies,
      { id: `currencies-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.CurrenciesEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.overrideCurrencies = result;
    });
  }

  async function showItemFiltersEditor() {
    pileData.overrideItemFilters = pileData?.overrideItemFilters || game.itempiles.ITEM_FILTERS;
    return ItemFiltersEditor.show(
      pileData.overrideItemFilters,
      { id: `item-filters-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.FilterEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.overrideItemFilters = result;
    });
  }

  async function showItemTypePriceModifiers() {
    const data = pileData.itemTypePriceModifiers || [];
    return ItemTypePriceModifiersEditor.show(
      data,
      { id: `item-type-price-modifier-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.itemTypePriceModifiers = result || [];
    });
  }

  async function showActorPriceModifiers() {
    const data = pileData.actorPriceModifiers || [];
    return PriceModifiersEditor.show(
      data,
      { id: `price-modifier-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.PriceModifiersEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.actorPriceModifiers = result || [];
    });
  }

  async function resetSharingData() {
    return new Dialog({
      id: `sharing-dialog-item-pile-config-${pileActor.id}`,
      title: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
      content: Helpers.dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Content") }),
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Confirm"),
          callback: () => {
            SharingUtilities.clearItemPileSharingData(pileActor);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No")
        }
      },
      default: "cancel"
    }).render(true);
  }

  function requestSubmit() {
    form.requestSubmit();
  }

  let tabs = [
    { value: "mainsettings", label: "ITEM-PILES.Applications.ItemPileConfig.Main.Title", highlight: !pileData.enabled },
    { value: "merchant", label: "ITEM-PILES.Applications.ItemPileConfig.Merchant.Title" },
    { value: "othersettings", label: "ITEM-PILES.Applications.ItemPileConfig.Other.Title" },
  ];

  let activeTab = "mainsettings";

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete=off
        class="item-piles-config-container">

    <Tabs bind:activeTab bind:tabs/>

    <section class="tab-body">

      {#if activeTab === 'mainsettings'}

        <div class="tab flex">

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EnabledPile")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EnabledPileExplanation")}</p>
            </label>

            <span class="item-piles-flexrow" style="max-width: 100px; justify-content: flex-end; align-items:center;">
          {#if !pileData.enabled}
            <div style="flex:0 1 auto; margin-right: 1rem;" class="blob"><i class="fas fa-exclamation"></i></div>
          {/if}
              <span style="flex:0 1 auto;"><input type="checkbox" bind:checked={pileData.enabled}/></span>
        </span>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.Distance")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.GridUnits")}</p>
            </label>
            <input style="flex:4;" type="number" placeholder="Infinity" bind:value={pileData.distance}/>
          </div>

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.InspectItems")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.InspectItemsExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.canInspectItems}/>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmpty")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyExplanation")}</p>
            </label>
            <select style="flex:4;" bind:value={pileData.deleteWhenEmpty}>
              <option
                  value="default">{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyDefault")}
                ({localize(deleteWhenEmptySetting)})
              </option>
              <option value="true">{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyYes")}</option>
              <option value="false">{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyNo")}</option>
            </select>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescription")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescriptionExplanation")}</p>
            </label>
          </div>
          <div class="form-group">
            <button type="button" style="flex:4;">
              {localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescription")}
            </button>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrencies")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrenciesExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={hasOverrideCurrencies}/>
          </div>

          <div class="form-group">
            <button type="button" on:click={() => { showCurrenciesEditor() }}
                    disabled={!hasOverrideCurrencies} style="flex:4;">
              {localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideCurrencies")}
            </button>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFilters")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFiltersExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={hasOverrideItemFilters}/>
          </div>

          <div class="form-group">
            <button type="button" on:click={() => { showItemFiltersEditor() }}
                    disabled={!hasOverrideItemFilters} style="flex:4;">
              {localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideItemFilters")}
            </button>
          </div>

        </div>
      {/if}

      {#if activeTab === "merchant"}

        <div class="tab flex">

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.Enabled")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.EnabledExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.isMerchant}/>
          </div>

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteQuantity")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteQuantityExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.infiniteQuantity}/>
          </div>

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteCurrency")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteCurrencyExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.infiniteCurrencies}/>
          </div>

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantity")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityExplanation")}</p>
            </label>
            <div class="break"></div>
            <select style="flex:4;" bind:value={pileData.displayQuantity}>
              <option value="yes">
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityYes")}
              </option>
              <option value="no">
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityNo")}
              </option>
              <option value="alwaysyes">
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityYesAlways")}
              </option>
              <option value="alwaysno">
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityNoAlways")}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PurchaseOnly")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PurchaseOnlyExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.purchaseOnly}/>
          </div>

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItems")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItemsExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.hideNewItems}/>
          </div>

          <div class="form-group slider-group">
            <label style="flex:3;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PriceModifierTitle")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PriceModifierExplanation")}</p>
            </label>
          </div>

          <div class="form-group slider-group">
            <label style="flex:3;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.BuyPriceModifier")}</span>
            </label>
            <SliderInput style="flex:4;" bind:value={pileData.buyPriceModifier}/>
          </div>

          <div class="form-group slider-group">
            <label style="flex:3;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}</span>
            </label>
            <SliderInput style="flex:4;" bind:value={pileData.sellPriceModifier}/>
          </div>

          <div class="form-group">
            <div class="item-piles-flexcol">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ItemTypeModifier")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ItemTypeModifiersExplanation")}</p>
              </label>
              <button type="button" on:click={() => { showItemTypePriceModifiers() }}>
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ConfigureItemTypePriceModifiers")}
              </button>
            </div>
          </div>

          <div class="form-group">
            <div class="item-piles-flexcol">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ActorPriceModifiers")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ActorPriceModifiersExplanation")}</p>
              </label>
              <button type="button" on:click={() => { showActorPriceModifiers() }}>
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ConfigureActorPriceModifiers")}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimes")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimesExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.openTimes.enabled}/>
          </div>

          <div class="form-group item-piles-open-times-container"
               class:item-piles-disabled={!pileData.openTimes.enabled}>
            <div class="item-piles-flexcol" style="margin-right:1rem">
              <label class="item-piles-text-center">
                Open Time:
              </label>
              <div class="item-piles-flexrow">
                <input type="number" style="text-align: right;" disabled="{!pileData.openTimes.enabled}"
                       bind:value="{pileData.openTimes.open.hour}"/>
                <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
                <input type="number" disabled="{!pileData.openTimes.enabled}"
                       bind:value="{pileData.openTimes.open.minute}"/>
              </div>
            </div>
            <div class="item-piles-flexcol">
              <label class="item-piles-text-center">
                Close Time:
              </label>
              <div class="item-piles-flexrow">
                <input type="number" style="text-align: right;" disabled="{!pileData.openTimes.enabled}"
                       bind:value="{pileData.openTimes.close.hour}"/>
                <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
                <input type="number" disabled="{!pileData.openTimes.enabled}"
                       bind:value="{pileData.openTimes.close.minute}"/>
              </div>
            </div>
          </div>
        </div>

      {/if}

      {#if activeTab === 'othersettings'}

        <div class="tab othersettings flex item-piles-grow" class:active={activeTab === 'othersettings'}
             data-group="primary" data-tab="othersettings">

          <details class="item-piles-collapsible item-piles-clickable">

            <summary>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.Title")}</summary>

            <strong class="display-one-warning"
                    style="display:none;">{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOneContainerWarning")}</strong>

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOne")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOneExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.displayOne}/>
            </div>

            <div class="item-pile-display-one-settings">

              <div class="form-group">
                <label>
                  <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemName")}</span>
                  <p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemNameExplanation")}</p>
                </label>
                <input type="checkbox" bind:checked={pileData.showItemName}/>
              </div>

              <div class="form-group">
                <label>
                  <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.OverrideScale")}</span>
                </label>
                <input type="checkbox" bind:checked={pileData.overrideSingleItemScale}/>
              </div>

              <div class="form-group" class:item-piles-disabled={!pileData.overrideSingleItemScale}>
                <label style="flex:3;">
                  <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.Scale")}</span>
                </label>
                <input style="flex:3;" type="range" min="0.2" step="0.1" max="3" class="item-piles-scaleRange"
                       disabled="{!pileData.overrideSingleItemScale}" bind:value="{pileData.singleItemScale}"/>
                <input style="flex:0.5; margin-left:1rem;" type="number" step="0.1" class="item-piles-scaleInput"
                       disabled="{!pileData.overrideSingleItemScale}" bind:value="{pileData.singleItemScale}"/>
              </div>

            </div>

          </details>

          <details class="item-piles-collapsible item-piles-clickable">

            <summary>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.Title")}</summary>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.IsContainer")}</label>
              <input type="checkbox" bind:checked={pileData.isContainer}/>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.Closed")}</label>
              <input type="checkbox" bind:checked={pileData.closed}/>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.Locked")}</label>
              <input type="checkbox" bind:checked={pileData.locked}/>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.ClosedImagePath")}</label>
              <div class="form-fields">
                <FilePicker type="imagevideo" bind:value={pileData.closedImage} placeholder="path/image.png"/>
              </div>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.OpenedImagePath")}</label>
              <div class="form-fields">
                <FilePicker type="imagevideo" bind:value={pileData.openedImage} placeholder="path/image.png"/>
              </div>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.EmptyImagePath")}</label>
              <div class="form-fields">
                <FilePicker type="imagevideo" bind:value={pileData.emptyImage} placeholder="path/image.png"/>
              </div>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.LockedImagePath")}</label>
              <div class="form-fields">
                <FilePicker type="imagevideo" bind:value={pileData.lockedImage} placeholder="path/image.png"/>
              </div>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.CloseSoundPath")}</label>
              <div class="form-fields">
                <FilePicker type="audio" bind:value={pileData.closeSound} placeholder="path/sound.wav"/>
              </div>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.OpenSoundPath")}</label>
              <div class="form-fields">
                <FilePicker type="audio" bind:value={pileData.openSound} placeholder="path/sound.wav"/>
              </div>
            </div>

            <div class="form-group">
              <label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.LockedSoundPath")}</label>
              <div class="form-fields">
                <FilePicker type="audio" bind:value={pileData.lockedSound} placeholder="path/sound.wav"/>
              </div>
            </div>

          </details>

          <details class="item-piles-collapsible item-piles-clickable">

            <summary>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.Title")}</summary>

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabled")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabledExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.shareItemsEnabled}/>
            </div>

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabled")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabledExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.shareCurrenciesEnabled}/>
            </div>

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabled")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabledExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.takeAllEnabled}/>
            </div>

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabled")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabledExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.splitAllEnabled}/>
            </div>

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayers")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayersExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.activePlayers}/>
            </div>

            <div class="form-group">
              <label style="flex:4;">
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingDataExplanation")}</p>
              </label>
            </div>

            <div class="form-group">
              <button type="button" class="item-piles-config-reset-sharing-data" style="flex:4;"
                      on:click={() => { resetSharingData() }}>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}</button>
            </div>

          </details>

        </div>

      {/if}

    </section>

    <footer>
      <button type="button" on:click|once={requestSubmit}>
        <i class="far fa-save"></i>
        {localize("ITEM-PILES.Applications.ItemPileConfig.Update")}
      </button>
    </footer>

  </form>

</ApplicationShell>