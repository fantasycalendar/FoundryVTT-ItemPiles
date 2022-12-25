<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import FilePicker from "../components/FilePicker.svelte";
  import CONSTANTS from "../../constants/constants.js";
  import * as SharingUtilities from "../../helpers/sharing-utilities.js";
  import * as Helpers from "../../helpers/helpers.js";
  import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";

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
  import { writable } from "svelte/store";
  import TextEditorDialog from "../dialogs/text-editor-dialog/text-editor-dialog.js";
  import CustomDialog from "../components/CustomDialog.svelte";
  import MacroSelector from "../components/MacroSelector.svelte";

  import MerchantApp from "../merchant-app/merchant-app.js";
  import ItemPileInventoryApp from "../item-pile-inventory-app/item-pile-inventory-app.js";

  const { application } = getContext('external');

  export let elementRoot;
  export let pileActor;

  let form;

  let pileData = PileUtilities.getActorFlagData(pileActor);
  let deleteWhenEmptySetting = localize(Helpers.getSetting(SETTINGS.DELETE_EMPTY_PILES) ? "Yes" : "No");

  if (typeof pileData?.deleteWhenEmpty === "boolean") {
    pileData.deleteWhenEmpty = !!pileData?.deleteWhenEmpty;
  }

  let pileEnabled = writable(pileData.enabled);

  $: pileData.enabled = $pileEnabled;

  let hasOverrideCurrencies = writable(typeof pileData?.overrideCurrencies === "object");
  let hasOverrideItemFilters = writable(typeof pileData?.overrideItemFilters === "object");
  let simpleCalendarActive = game.modules.get('foundryvtt-simple-calendar')?.active;

  $: {
    if (!$hasOverrideCurrencies) {
      pileData.overrideCurrencies = false;
    }
  }
  $: {
    if (!$hasOverrideItemFilters) {
      pileData.overrideItemFilters = false;
    }
  }

  async function updateSettings() {

    let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

    const types = [
      "closedImage",
      "emptyImage",
      "openedImage",
      "lockedImage",
      "closeSound",
      "openSound",
      "lockedSound",
      "unlockedSound",
    ];

    for (let type of types) {
      if (pileData[type].includes("*")) {
        pileData[type + "s"] = await Helpers.getFiles(pileData[type], { applyWildCard: true, softFail: true });
        pileData[type + "s"] = pileData[type + "s"] || [];
      }
    }

    const data = foundry.utils.mergeObject(defaults, pileData);

    data.deleteWhenEmpty = {
      "default": "default",
      "true": true,
      "false": false
    }[data.deleteWhenEmpty];

    const currentData = PileUtilities.getActorFlagData(pileActor);
    const diff = Object.keys(foundry.utils.diffObject(currentData, foundry.utils.deepClone(data)));

    PileAPI.updateItemPile(pileActor, data).then( async () => {
      if (diff.includes("enabled") || diff.includes("type")) {
        const promises = [];
        if (currentData.type === CONSTANTS.PILE_TYPES.MERCHANT) {
          if (MerchantApp.getActiveApp(pileActor.id)) {
            promises.push(MerchantApp.getActiveApp(pileActor.id).close());
          }
          if (MerchantApp.getActiveApp(pileActor?.token?.id)) {
            promises.push(MerchantApp.getActiveApp(pileActor?.token?.id).close());
          }
        } else {
          const apps = ItemPileInventoryApp.getActiveApps(pileActor.id)
            .concat(ItemPileInventoryApp.getActiveApps(pileActor?.token?.id));
          for (let app of apps) {
            promises.push(app.close());
          }
        }
        if (promises.length || pileActor?.sheet.rendered) {
          await Promise.allSettled(promises);
          if (data.enabled) {
            pileActor?.sheet.close();
            game.itempiles.API.renderItemPileInterface(pileActor);
          } else if (!data.enabled) {
            pileActor?.sheet.render(true);
          }
        }
      }
    });

    application.close();

  }

  async function showCurrenciesEditor() {
    pileData.overrideCurrencies = pileData?.overrideCurrencies || game.itempiles.API.CURRENCIES;
    return CurrenciesEditor.show(
      pileData.overrideCurrencies,
      { id: `currencies-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.CurrenciesEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.overrideCurrencies = result;
    });
  }

  async function showItemFiltersEditor() {
    pileData.overrideItemFilters = pileData?.overrideItemFilters || game.itempiles.API.ITEM_FILTERS;
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
    const doThing = await TJSDialog.confirm({
      id: `sharing-dialog-item-pile-config-${pileActor.id}`,
      title: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
      content: {
        class: CustomDialog,
        props: {
          header: "Item Piles - " + game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
          content: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Content")
        },
      },
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Confirm"),
        }
      },
      modal: true
    });
    if (!doThing) return;
    return SharingUtilities.clearItemPileSharingData(pileActor);
  }

  async function showDescriptionDialog() {
    return TextEditorDialog.show(pileData.description, { id: "item-pile-text-editor-" + pileActor.id }).then((result) => {
      pileData.description = result || "";
    });
  }

  function requestSubmit() {
    form.requestSubmit();
  }

  let tabs = [];
  $: {
    tabs = [
      {
        value: "mainsettings",
        label: "ITEM-PILES.Applications.ItemPileConfig.Main.Title",
        highlight: !$pileEnabled
      },
      { value: "othersettings", label: "ITEM-PILES.Applications.ItemPileConfig.Other.Title" }
    ]
  }

  let activeTab = "mainsettings";

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete=off
        class="item-piles-config-container">

    <Tabs bind:activeTab bind:tabs/>

    <section class="tab-body">

      {#if activeTab === 'mainsettings'}

        <div class="tab item-piles-flexcol">

          <div class="form-group">
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EnabledPile")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EnabledPileExplanation")}</p>
            </label>

            <span class="item-piles-flexrow" style="max-width: 100px; justify-content: flex-end; align-items:center;">
          {#if !$pileEnabled}
            <div style="flex:0 1 auto; margin-right: 1rem;" class="blob"><i class="fas fa-exclamation"></i></div>
          {/if}
              <span style="flex:0 1 auto;"><input type="checkbox" bind:checked={$pileEnabled}/></span>
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
            <label>
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DisplayItemTypes")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DisplayItemTypesExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={pileData.displayItemTypes}/>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.Macro")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.MacroExplanation")}</p>
            </label>
          </div>
          <div class="form-group">
            <MacroSelector bind:macro={pileData.macro}/>
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
              <option value={true}>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyYes")}</option>
              <option value={false}>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyNo")}</option>
            </select>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescription")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescriptionExplanation")}</p>
            </label>
          </div>
          <div class="form-group">
            <button type="button" style="flex:4;" on:click={() => { showDescriptionDialog() }}>
              {localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescription")}
            </button>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrencies")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrenciesExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={$hasOverrideCurrencies}/>
          </div>

          <div class="form-group">
            <button type="button" on:click={() => { showCurrenciesEditor() }}
                    disabled={!$hasOverrideCurrencies} style="flex:4;">
              {localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideCurrencies")}
            </button>
          </div>

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFilters")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFiltersExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={$hasOverrideItemFilters}/>
          </div>

          <div class="form-group">
            <button type="button" on:click={() => { showItemFiltersEditor() }}
                    disabled={!$hasOverrideItemFilters} style="flex:4;">
              {localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideItemFilters")}
            </button>
          </div>

        </div>

      {/if}

      {#if activeTab === "othersettings"}

        <div class="form-group">
          <label style="flex:4;">
            <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Other.Type")}</span>
            <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Other.TypeExplanation")}</p>
          </label>
          <select style="flex:4;" bind:value={pileData.type}>
            {#each Object.values(CONSTANTS.PILE_TYPES) as type}
            <option value={type}>
              {localize(`ITEM-PILES.Types.${type}`)}
            </option>
            {/each}
          </select>
        </div>

        <hr>

        {#if pileData.type === CONSTANTS.PILE_TYPES.MERCHANT}

          <div class="tab flex">

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantImage")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantImageExplanation")}</p>
              </label>
              <div class="form-fields">
                <FilePicker type="imagevideo" bind:value={pileData.merchantImage} placeholder="path/image.png"/>
              </div>
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
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.KeepZero")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.KeepZeroExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.keepZeroQuantity}/>
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

            <div class="form-group">
              <label>
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OnyAcceptBasePrice")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OnyAcceptBasePriceExplanation")}</p>
              </label>
              <input type="checkbox" bind:checked={pileData.onlyAcceptBasePrice}/>
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
                <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatus")}</span>
                <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusExplanation")}</p>
              </label>
              <div class="break"></div>
              <select style="flex:4;" bind:value={pileData.openTimes.status}>
                <option value="open">
                  {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusOpen")}
                </option>
                <option value="closed">
                  {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusClosed")}
                </option>
                {#if simpleCalendarActive && pileData.openTimes.enabled}
                  <option value="auto">
                    {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusAuto")}
                  </option>
                {/if}
              </select>
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

        {:else if pileData.type === CONSTANTS.PILE_TYPES.PILE || pileData.type === CONSTANTS.PILE_TYPES.CONTAINER}

          {#if pileData.type === CONSTANTS.PILE_TYPES.PILE}

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
                <input style="flex:3;" type="range" min="0.2" step="0.01" max="3" class="item-piles-scaleRange"
                        disabled="{!pileData.overrideSingleItemScale}" bind:value="{pileData.singleItemScale}"/>
                <input style="flex:0.5; margin-left:1rem;" type="number" step="0.01" class="item-piles-scaleInput"
                        disabled="{!pileData.overrideSingleItemScale}" bind:value="{pileData.singleItemScale}"/>
              </div>

            </div>

          {/if}

          {#if pileData.type === CONSTANTS.PILE_TYPES.CONTAINER}

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

          {/if}

          <hr>

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

        {/if}
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
