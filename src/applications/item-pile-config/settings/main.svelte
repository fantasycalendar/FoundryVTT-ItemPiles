<script>

  import { SecondaryCurrenciesEditor, CurrenciesEditor } from "../../editors/currencies-editor/currencies-editor.js";
  import ItemFiltersEditor from "../../editors/item-filters-editor/item-filters-editor.js";
  import MacroSelector from "../../components/MacroSelector.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import * as Helpers from "../../../helpers/helpers.js";
  import SETTINGS from "../../../constants/settings.js";
  import TextEditorDialog from "../../dialogs/text-editor-dialog/text-editor-dialog.js";
  import { writable } from "svelte/store";

  export let pileActor;
  export let pileData;
  export let pileEnabled;

  const deleteWhenEmptySetting = localize(Helpers.getSetting(SETTINGS.DELETE_EMPTY_PILES) ? "Yes" : "No");

  let hasOverrideCurrencies = writable(typeof pileData?.overrideCurrencies === "object");
  let hasOverrideSecondaryCurrencies = writable(typeof pileData?.overrideSecondaryCurrencies === "object");
  let hasOverrideItemFilters = writable(typeof pileData?.overrideItemFilters === "object");

  $: {
    if (!$hasOverrideCurrencies) {
      pileData.overrideCurrencies = false;
    }
  }
  $: {
    if (!$hasOverrideSecondaryCurrencies) {
      pileData.overrideSecondaryCurrencies = false;
    }
  }
  $: {
    if (!$hasOverrideItemFilters) {
      pileData.overrideItemFilters = false;
    }
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

  async function showSecondaryCurrenciesEditor() {
    pileData.overrideSecondaryCurrencies = pileData?.overrideSecondaryCurrencies || game.itempiles.API.SECONDARY_CURRENCIES;
    return SecondaryCurrenciesEditor.show(
      pileData.overrideSecondaryCurrencies,
      { id: `secondary-currencies-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.SecondaryCurrenciesEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.overrideSecondaryCurrencies = result;
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

  async function showDescriptionDialog() {
    return TextEditorDialog.show(pileData.description, { id: "item-pile-text-editor-" + pileActor.id }).then((result) => {
      pileData.description = result || "";
    });
  }

</script>

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
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideSecondaryCurrencies")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideSecondaryCurrenciesExplanation")}</p>
	</label>
	<input type="checkbox" bind:checked={$hasOverrideSecondaryCurrencies}/>
</div>

<div class="form-group">
	<button type="button" on:click={() => { showSecondaryCurrenciesEditor() }}
					disabled={!$hasOverrideSecondaryCurrencies} style="flex:4;">
		{localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideSecondaryCurrencies")}
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
