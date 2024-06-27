<script>

	import { CurrenciesEditor, SecondaryCurrenciesEditor } from "../../editors/currencies-editor/currencies-editor.js";
	import ItemFiltersEditor from "../../editors/item-filters-editor/item-filters-editor.js";
	import MacroSelector from "../../components/MacroSelector.svelte";
	import { localize } from "#runtime/svelte/helper";
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
		pileData.overrideCurrencies = pileData?.overrideCurrencies || foundry.utils.deepClone(game.itempiles.API.CURRENCIES);
		return CurrenciesEditor.show(
			pileData.overrideCurrencies,
			{
				id: `currencies-item-pile-config-${pileActor.id}`,
				title: game.i18n.format("ITEM-PILES.Applications.CurrenciesEditor.TitleActor", { actor_name: pileActor.name })
			},
		).then((result) => {
			pileData.overrideCurrencies = result;
		});
	}

	async function showSecondaryCurrenciesEditor() {
		pileData.overrideSecondaryCurrencies = pileData?.overrideSecondaryCurrencies || foundry.utils.deepClone(game.itempiles.API.SECONDARY_CURRENCIES);
		return SecondaryCurrenciesEditor.show(
			pileData.overrideSecondaryCurrencies,
			{
				id: `secondary-currencies-item-pile-config-${pileActor.id}`,
				title: game.i18n.format("ITEM-PILES.Applications.SecondaryCurrenciesEditor.TitleActor", { actor_name: pileActor.name })
			},
		).then((result) => {
			pileData.overrideSecondaryCurrencies = result;
		});
	}

	async function showItemFiltersEditor() {
		pileData.overrideItemFilters = pileData?.overrideItemFilters || foundry.utils.deepClone(game.itempiles.API.ITEM_FILTERS);
		return ItemFiltersEditor.show(
			pileData.overrideItemFilters,
			{
				id: `item-filters-item-pile-config-${pileActor.id}`,
				title: game.i18n.format("ITEM-PILES.Applications.FilterEditor.TitleActor", { actor_name: pileActor.name })
			}
		).then((result) => {
			pileData.overrideItemFilters = result;
		});
	}

	async function showRequiredItemPropertiesEditor() {
		return ItemFiltersEditor.show(
			pileData?.requiredItemProperties,
			{
				id: `required-item-properties-item-pile-config-${pileActor.id}`,
				localization: "RequiredItemPropertiesEditor",
				title: game.i18n.format("ITEM-PILES.Applications.RequiredItemPropertiesEditor.TitleActor", { actor_name: pileActor.name }),
			},
		).then((result) => {
			pileData.requiredItemProperties = result;
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
		<span style="flex:0 1 auto;"><input bind:checked={$pileEnabled} type="checkbox"/></span>
        </span>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.Distance")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.GridUnits")}</p>
	</label>
	<input bind:value={pileData.distance} placeholder="Infinity" style="flex:4;" type="number"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.InspectItems")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.InspectItemsExplanation")}</p>
	</label>
	<input bind:checked={pileData.canInspectItems} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DisplayItemTypes")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DisplayItemTypesExplanation")}</p>
	</label>
	<input bind:checked={pileData.displayItemTypes} type="checkbox"/>
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
	<select bind:value={pileData.deleteWhenEmpty} style="flex:4;">
		<option
			value="default">{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyDefault")}
			({localize(deleteWhenEmptySetting)})
		</option>
		<option value={true}>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyYes")}</option>
		<option value={false}>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.DeleteWhenEmptyNo")}</option>
	</select>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.CanStackItems")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.CanStackItemsExplanation")}</p>
	</label>
	<div class="break"></div>
	<select bind:value={pileData.canStackItems} style="flex:4;">
		<option value="yes">
			{localize("ITEM-PILES.Applications.ItemPileConfig.Main.CanStackItemsYes")}
		</option>
		<option value="no">
			{localize("ITEM-PILES.Applications.ItemPileConfig.Main.CanStackItemsNo")}
		</option>
		<option value="alwaysyes">
			{localize("ITEM-PILES.Applications.ItemPileConfig.Main.CanStackItemsYesAlways")}
		</option>
		<option value="alwaysno">
			{localize("ITEM-PILES.Applications.ItemPileConfig.Main.CanStackItemsNoAlways")}
		</option>
	</select>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescription")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescriptionExplanation")}</p>
	</label>
</div>
<div class="form-group">
	<button on:click={() => { showDescriptionDialog() }} style="flex:4;" type="button">
		{localize("ITEM-PILES.Applications.ItemPileConfig.Main.EditDescription")}
	</button>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrencies")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideCurrenciesExplanation")}</p>
	</label>
	<input bind:checked={$hasOverrideCurrencies} type="checkbox"/>
</div>

<div class="form-group">
	<button disabled={!$hasOverrideCurrencies} on:click={() => { showCurrenciesEditor() }}
	        style="flex:4;" type="button">
		{localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideCurrencies")}
	</button>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideSecondaryCurrencies")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideSecondaryCurrenciesExplanation")}</p>
	</label>
	<input bind:checked={$hasOverrideSecondaryCurrencies} type="checkbox"/>
</div>

<div class="form-group">
	<button disabled={!$hasOverrideSecondaryCurrencies} on:click={() => { showSecondaryCurrenciesEditor() }}
	        style="flex:4;" type="button">
		{localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideSecondaryCurrencies")}
	</button>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFilters")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.OverrideItemFiltersExplanation")}</p>
	</label>
	<input bind:checked={$hasOverrideItemFilters} type="checkbox"/>
</div>

<div class="form-group">
	<button disabled={!$hasOverrideItemFilters} on:click={() => { showItemFiltersEditor() }}
	        style="flex:4;" type="button">
		{localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureOverrideItemFilters")}
	</button>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.RequiredItemProperties")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Main.RequiredItemPropertiesExplanation")}</p>
	</label>
</div>

<div class="form-group">
	<button on:click={() => { showRequiredItemPropertiesEditor() }}
	        style="flex:4;" type="button">
		{localize("ITEM-PILES.Applications.ItemPileConfig.Main.ConfigureRequiredItemProperties")}
	</button>
</div>
