<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import FilePicker from "../components/FilePicker.svelte";

  import CONSTANTS from "../../constants/constants.js";
  import * as SharingUtilities from "../../helpers/sharing-utilities.js";
  import * as Helpers from "../../helpers/helpers.js";

  import PriceModifiersEditor from "../editors/price-modifiers-editor/price-modifiers-editor.js";
  import CurrenciesEditor from "../editors/currencies/currencies-editor.js";
  import ItemFiltersEditor from "../editors/item-filters/item-filters-editor.js";

  import Tabs from "../components/Tabs.svelte";
  import SETTINGS from "../../constants/settings.js";
  import PileAPI from "../../api.js";

  const { application } = getContext('external');

  export let pileActor;
  export let pileData;

  let deleteWhenEmptySetting = localize(Helpers.getSetting(SETTINGS.DELETE_EMPTY_PILES) ? "Yes" : "No");

  let form;

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
    return CurrenciesEditor.show(pileData.overrideCurrencies, { id: `currencies-item-pile-config-${pileActor.id}` })
      .then((result) => {
        pileData.overrideCurrencies = result;
      });
  }

  async function showItemFiltersEditor() {
    pileData.overrideItemFilters = pileData?.overrideItemFilters || game.itempiles.ITEM_FILTERS;
    return ItemFiltersEditor.show(pileData.overrideItemFilters, { id: `item-filters-item-pile-config-${pileActor.id}` })
      .then((result) => {
        pileData.overrideItemFilters = result;
      });
  }

  async function showActorPriceOverrides() {
    const data = pileData.overridePriceModifiers || [];
    return PriceModifiersEditor.show(data, { id: `price-modifier-item-pile-config-${pileActor.id}` })
      .then((result) => {
        pileData.overridePriceModifiers = result;
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

  let activeTab = "mainsettings";

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete=off
      class="item-piles-config-container">

  <Tabs bind:activeTab tabs={[
    { value: "mainsettings", label: localize("ITEM-PILES.Applications.ItemPileConfig.Main.Title"), highlight: !pileData.enabled },
    { value: "othersettings", label: localize("ITEM-PILES.Applications.ItemPileConfig.Other.Title") },
  ]}/>

  <section class="tab-body">

    <div class="tab mainsettings flex" class:active={activeTab === 'mainsettings'} data-group="primary"
         data-tab="mainsettings">

      <div class="form-group">
        <label>
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.EnabledPile")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EnabledPileExplanation")}</p>
        </label>

        <span class="flexrow" style="max-width: 100px; justify-content: flex-end; align-items:center;">
          {#if !pileData.enabled}
            <div style="flex:0 1 auto; margin-right: 1rem;" class="blob"><i class="fas fa-exclamation"></i></div>
          {/if}
          <span style="flex:0 1 auto;"><input type="checkbox" bind:checked={pileData.enabled}/></span>
        </span>
      </div>

      <div class="form-group">
        <label style="flex:4;">
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.Distance")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.GridUnits")}</p>
        </label>
        <input style="flex:4;" type="number" placeholder="Infinity" bind:value={pileData.distance}/>
      </div>

      <div class="form-group">
        <label>
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.InspectItems")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.InspectItemsExplanation")}</p>
        </label>
        <input type="checkbox" bind:checked={pileData.canInspectItems}/>
      </div>

      <div class="form-group">
        <label style="flex:4;">
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmpty")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyExplanation")}</p>
        </label>
        <select style="flex:4;" bind:value={pileData.deleteWhenEmpty}>
          <option
              value="default">{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyDefault")}
            ({deleteWhenEmptySetting})
          </option>
          <option value="true">{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyYes")}</option>
          <option value="false">{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyNo")}</option>
        </select>
      </div>

      <div class="form-group">
        <label style="flex:4;">
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.Macro")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.MacroExplanation")}</p>
        </label>
        <input style="flex:4;" type="text"
               placeholder={localize("ITEM-PILES.Applications.ItemPileConfig.Main.MacroPlaceholder")}
               bind:value="{pileData.macro}"/>
      </div>

      <div class="form-group">
        <label style="flex:4;">
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrencies")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrenciesExplanation")}</p>
        </label><br>
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
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFilters")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFiltersExplanation")}</p>
        </label><br>
        <input type="checkbox" bind:checked={hasOverrideItemFilters}/>
      </div>

      <div class="form-group">
        <button type="button" on:click={() => { showItemFiltersEditor() }}
                disabled={!hasOverrideItemFilters} style="flex:4;">
          {localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideItemFilters")}
        </button>
      </div>

    </div>

    <div class="tab othersettings flex item-piles-grow" class:active={activeTab === 'othersettings'}
         data-group="primary" data-tab="othersettings">

      <details class="item-piles-collapsible item-piles-clickable">

        <summary>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.Title")}</summary>

        <strong class="display-one-warning"
                style="display:none;">{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOneContainerWarning")}</strong>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOne")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOneExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={pileData.displayOne}/>
        </div>

        <div class="item-pile-display-one-settings">

          <div class="form-group">
            <label>
              {localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemName")}<br>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemNameExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.showItemName}/>
          </div>

          <div class="form-group">
            <label>
              {localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.OverrideScale")}<br>
            </label>
            <input type="checkbox" bind:checked={pileData.overrideSingleItemScale}/>
          </div>

          <div class="form-group" class:item-piles-disabled={!pileData.overrideSingleItemScale}>
            <label style="flex:3;">
              {localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.Scale")}<br>
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
            {localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabled")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabledExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={pileData.shareItemsEnabled}/>
        </div>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabled")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabledExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={pileData.shareCurrenciesEnabled}/>
        </div>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabled")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabledExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={pileData.takeAllEnabled}/>
        </div>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabled")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabledExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={pileData.splitAllEnabled}/>
        </div>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayers")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayersExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={pileData.activePlayers}/>
        </div>

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingDataExplanation")}</p>
          </label>
        </div>

        <div class="form-group">
          <button type="button" class="item-piles-config-reset-sharing-data" style="flex:4;"
                  on:click={() => { resetSharingData() }}>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}</button>
        </div>

      </details>

      <details class="item-piles-collapsible item-piles-clickable">

        <summary>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.Title")}</summary>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.Enabled")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.EnabledExplanation")}</p>
          </label>
          <input type="checkbox" class="item-piles-config-merchant-enabled" bind:checked={pileData.isMerchant}/>
        </div>

        <div class="form-group">
          <label style="flex:3;">
            {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PriceModifier")}<br>
          </label>
          <input style="flex:3;" type="range" min="0" step="1" max="200" bind:value="{pileData.priceModifier}"/>
          <input style="flex:0.5; margin-left:1rem;" type="number" min="0" step="1" required
                 bind:value="{pileData.priceModifier}"/>
        </div>

        <div class="form-group">
          <label style="flex:3;">
            {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellModifier")}<br>
          </label>
          <input style="flex:3;" type="range" min="0" step="1" max="200" bind:value="{pileData.sellModifier}"/>
          <input style="flex:0.5; margin-left:1rem;" type="number" min="0" step="1" required
                 bind:value="{pileData.sellModifier}"/>
        </div>

        <div class="form-group">
          <div class="flexcol">
            <label>
              {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ActorPriceModifiers")}<br>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ActorPriceModifiersExplanation")}</p>
            </label>
            <button type="button" on:click={() => { showActorPriceOverrides() }}>
              {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ConfigureActorPriceModifiers")}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimes")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimesExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={pileData.openTimes.enabled}/>
        </div>

        <div class="form-group item-piles-open-times-container" class:item-piles-disabled={!pileData.openTimes.enabled}>
          <div class="flexcol" style="margin-right:1rem">
            <label class="item-piles-text-center">
              Open Time:
            </label>
            <div class="flexrow">
              <input type="number" style="text-align: right;" disabled="{!pileData.openTimes.enabled}"
                     bind:value="{pileData.openTimes.open.hour}"/>
              <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
              <input type="number" disabled="{!pileData.openTimes.enabled}"
                     bind:value="{pileData.openTimes.open.minute}"/>
            </div>
          </div>
          <div class="flexcol">
            <label class="item-piles-text-center">
              Close Time:
            </label>
            <div class="flexrow">
              <input type="number" style="text-align: right;" disabled="{!pileData.openTimes.enabled}"
                     bind:value="{pileData.openTimes.close.hour}"/>
              <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
              <input type="number" disabled="{!pileData.openTimes.enabled}"
                     bind:value="{pileData.openTimes.close.minute}"/>
            </div>
          </div>
        </div>

      </details>

    </div>

  </section>

  <footer>
    <button type="button" on:click|once={requestSubmit}>
      <i class="far fa-save"></i>
      {localize("ITEM-PILES.Applications.ItemPileConfig.Update")}
    </button>
  </footer>

</form>

<style lang="scss">

  form {

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    height: calc(100%);
    max-height: calc(100%);

    nav {
      margin-bottom: 0.25rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid var(--color-border-light-primary, #b5b3a4);
    }

    .form-group {
      border-radius: 5px;
      margin: 0.2rem 0;
    }

    section {
      padding: 0.25rem;
      height: calc(100% - 70px);
      max-height: calc(100% - 70px);
      overflow-y: auto;
    }

    p {
      flex: 0;
      line-height: 14px;
      font-size: var(--font-size-12);
      color: var(--color-text-dark-secondary);
      padding-right: 1rem;
      margin-top: 0;
      overflow-y: hidden;
    }

    footer {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-border-light-primary, #b5b3a4);
    }
  }


  .item-piles-collapsible {

    &:not(:last-child) {
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-border-light-primary, #b5b3a4);
    }

    & > summary {
      display: block;
      font-weight: 900;

      &::before {
        font-family: "Font Awesome 5 Free";
        font-weight: 900;
        content: "\f054";
        margin-right: 0.5rem;
      }
    }

    &[open] > summary {
      margin-bottom: 0.5rem;

      &::before {
        font-family: "Font Awesome 5 Free";
        font-weight: 900;
        content: "\f078";
        margin-right: 0.275rem;
      }
    }
  }

</style>