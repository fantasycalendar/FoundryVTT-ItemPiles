<script>

	import ItemTypePriceModifiersEditor
		from "../../editors/item-type-price-modifiers-editor/item-type-price-modifiers-editor.js";
	import PriceModifiersEditor from "../../editors/price-modifiers-editor/price-modifiers-editor.js";
	import FilePicker from "../../components/FilePicker.svelte";
	import SliderInput from "../../components/SliderInput.svelte";
	import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
	import MerchantColumnsEditor from "../../editors/merchant-columns-editor/merchant-columns-editor.js";
	import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
	import CustomDialog from "../../components/CustomDialog.svelte";
	import * as PileUtilities from "../../../helpers/pile-utilities.js";

	export let pileData;
	export let pileActor;

	const simpleCalendarActive = game.modules.get('foundryvtt-simple-calendar')?.active;

	const weekdays = (simpleCalendarActive ? window.SimpleCalendar.api.getAllWeekdays() : []).map(weekday => {
		weekday.selected = pileData.closedDays.includes(weekday.name);
		return weekday;
	});

	const refreshItemDays = (simpleCalendarActive ? window.SimpleCalendar.api.getAllWeekdays() : []).map(weekday => {
		weekday.selected = pileData.refreshItemsDays.includes(weekday.name);
		return weekday;
	});

	pileData.closedDays = pileData.closedDays.filter(closedWeekday => {
		return weekdays.some(weekday => weekday.name === closedWeekday);
	});

	const holidays = (simpleCalendarActive ? window.SimpleCalendar.api.getCurrentCalendar().noteCategories : []).map(holiday => {
		return { name: holiday.name, selected: pileData.closedHolidays.includes(holiday.name) };
	});

	pileData.closedHolidays = pileData.closedHolidays.filter(closedHoliday => {
		return holidays.some(holiday => holiday.name === closedHoliday);
	});

	const refreshItemsHolidays = (simpleCalendarActive ? window.SimpleCalendar.api.getCurrentCalendar().noteCategories : []).map(holiday => {
		return { name: holiday.name, selected: pileData.refreshItemsHolidays.includes(holiday.name) };
	});

	pileData.refreshItemsHolidays = pileData.refreshItemsHolidays.filter(refreshItemsHoliday => {
		return refreshItemsHolidays.some(holiday => holiday.name === refreshItemsHoliday);
	});

	async function showItemTypePriceModifiers() {
		const data = pileData.itemTypePriceModifiers || [];
		return ItemTypePriceModifiersEditor.show(
			data,
			{ id: `item-type-price-modifier-item-pile-config-${pileActor.id}` },
			{ title: localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.TitleActor", { actor_name: pileActor.name }), }
		).then((result) => {
			pileData.itemTypePriceModifiers = result || [];
		});
	}

	async function showActorPriceModifiers() {
		const data = pileData.actorPriceModifiers || [];
		return PriceModifiersEditor.show(
			data,
			{ id: `price-modifier-item-pile-config-${pileActor.id}` },
			{ title: localize("ITEM-PILES.Applications.PriceModifiersEditor.TitleActor", { actor_name: pileActor.name }), }
		).then((result) => {
			pileData.actorPriceModifiers = result || [];
			pileData.actorPriceModifiers.forEach(modifier => {
				if (modifier.actor) {
					delete modifier['actor'];
				}
			})
		});
	}

	async function showMerchantColumns() {
		const data = pileData.merchantColumns || [];
		return MerchantColumnsEditor.show(
			data,
			{ id: `merchant-columns-item-pile-config-${pileActor.id}` },
			{ title: localize("ITEM-PILES.Applications.MerchantColumnsEditor.TitleActor", { actor_name: pileActor.name }), }
		).then((result) => {
			pileData.merchantColumns = result || [];
		});
	}

	async function clearLog() {
		const doThing = await TJSDialog.confirm({
			id: `sharing-dialog-item-pile-config-${pileActor.id}`,
			title: "Item Piles - " + localize("ITEM-PILES.Dialogs.ClearMerchantLog.Title"),
			content: {
				class: CustomDialog,
				props: {
					header: localize("ITEM-PILES.Dialogs.ClearMerchantLog.Title"),
					content: localize("ITEM-PILES.Dialogs.ClearMerchantLog.Content", { actor_name: pileActor.name })
				},
			},
			modal: true
		});
		if (!doThing) return;
		return PileUtilities.clearActorLog(pileActor);
	}

</script>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantImage")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantImageExplanation")}</p>
	</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.merchantImage} placeholder="path/image.png" type="imagevideo"/>
	</div>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteQuantity")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteQuantityExplanation")}</p>
	</label>
	<input bind:checked={pileData.infiniteQuantity} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteCurrency")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteCurrencyExplanation")}</p>
	</label>
	<input bind:checked={pileData.infiniteCurrencies} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.KeepZero")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.KeepZeroExplanation")}</p>
	</label>
	<input bind:checked={pileData.keepZeroQuantity} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantity")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityExplanation")}</p>
	</label>
	<div class="break"></div>
	<select bind:value={pileData.displayQuantity} style="flex:4;">
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
	<input bind:checked={pileData.purchaseOnly} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItems")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItemsExplanation")}</p>
	</label>
	<input bind:checked={pileData.hideNewItems} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideItemsWithZeroCost")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideItemsWithZeroCostExplanation")}</p>
	</label>
	<input bind:checked={pileData.hideItemsWithZeroCost} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OnlyAcceptBasePrice")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OnlyAcceptBasePriceExplanation")}</p>
	</label>
	<input bind:checked={pileData.onlyAcceptBasePrice} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.LogMerchantActivity")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.LogMerchantActivityExplanation")}</p>
	</label>
	<input bind:checked={pileData.logMerchantActivity} type="checkbox"/>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClearMerchantLog")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClearMerchantLogExplanation")}</p>
	</label>
	<button on:click={() => clearLog()} style="flex:2;" type="button">
		{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClearMerchantLog")}
	</button>
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
	<SliderInput bind:value={pileData.buyPriceModifier} style="flex:4;"/>
</div>

<div class="form-group slider-group">
	<label style="flex:3;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}</span>
	</label>
	<SliderInput bind:value={pileData.sellPriceModifier} style="flex:4;"/>
</div>

<div class="form-group">
	<div class="item-piles-flexcol">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ItemTypeModifier")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ItemTypeModifiersExplanation")}</p>
		</label>
		<button on:click={() => { showItemTypePriceModifiers() }} type="button">
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
		<button on:click={() => { showActorPriceModifiers() }} type="button">
			{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ConfigureActorPriceModifiers")}
		</button>
	</div>
</div>

<div class="form-group">
	<div class="item-piles-flexcol">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantColumns")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantColumnsExplanation")}</p>
		</label>
		<button on:click={() => { showMerchantColumns() }} type="button">
			{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ConfigureMerchantColumns")}
		</button>
	</div>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatus")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusExplanation")}</p>
	</label>
	<div class="break"></div>
	<select bind:value={pileData.openTimes.status} style="flex:4;">
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
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideTokenWhenClosed")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideTokenWhenClosedExplanation")}</p>
	</label>
	<input bind:checked={pileData.openTimes.hideTokenWhenClosed} type="checkbox"/>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimes")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimesExplanation")}</p>
	</label>
	<input bind:checked={pileData.openTimes.enabled} type="checkbox"/>
</div>

<div class="form-group" class:item-piles-disabled={!pileData.openTimes.enabled}>
	<div class="item-piles-flexcol" style="margin-right:1rem">
		<label class="item-piles-text-center">
			Open Time:
		</label>
		<div class="item-piles-flexrow">
			<input bind:value="{pileData.openTimes.open.hour}" disabled="{!pileData.openTimes.enabled}"
			       style="text-align: right;"
			       type="number"/>
			<span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
			<input bind:value="{pileData.openTimes.open.minute}" disabled="{!pileData.openTimes.enabled}"
			       type="number"/>
		</div>
	</div>
	<div class="item-piles-flexcol">
		<label class="item-piles-text-center">
			Close Time:
		</label>
		<div class="item-piles-flexrow">
			<input bind:value="{pileData.openTimes.close.hour}" disabled="{!pileData.openTimes.enabled}"
			       style="text-align: right;"
			       type="number"/>
			<span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
			<input bind:value="{pileData.openTimes.close.minute}" disabled="{!pileData.openTimes.enabled}"
			       type="number"/>
		</div>
	</div>
</div>

{#if simpleCalendarActive}

	<div class="form-group" class:item-piles-disabled={!pileData.openTimes.enabled}>
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClosedDays")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClosedDaysExplanation")}</p>
		</label>
		<div class="break"></div>
		<div class="item-piles-flexrow" style="text-align: center;">
			{#each weekdays as weekday (weekday.id + "-weekday-close")}
				<div class="item-piles-flexcol" style="align-items: center;">
					<label>{weekday.abbreviation}</label>
					<input type="checkbox"
					       bind:checked={weekday.selected}
					       disabled={!pileData.openTimes.enabled}
					       on:change={() => {
                 let weekdaySet = new Set(pileData.closedDays);
                 if(weekday.selected){
                   weekdaySet.add(weekday.name)
                 }else{
                   weekdaySet.delete(weekday.name)
                 }
                 pileData.closedDays = Array.from(weekdaySet);
               }}
					/>
				</div>
			{/each}
		</div>
	</div>

	<div class="form-group" class:item-piles-disabled={!pileData.openTimes.enabled}>
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClosedHolidays")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClosedHolidaysExplanation")}</p>
		</label>
		<div class="break"></div>
		<div style="display: grid; grid-template-columns: 1fr 1fr;">
			{#each holidays as holiday, index (holiday.name + "-" + index)}
				<div class="item-piles-flexrow" style="flex:0 1 auto;">
					<input type="checkbox"
					       bind:checked={holiday.selected}
					       disabled={!pileData.openTimes.enabled}
					       on:change={() => {
                 let holidaySet = new Set(pileData.closedHolidays);
                 if(holiday.selected){
                   holidaySet.add(holiday.name)
                 }else{
                   holidaySet.delete(holiday.name)
                 }
                 pileData.closedHolidays = Array.from(holidaySet);
               }}/>
					<label>{holiday.name}</label>
				</div>
			{/each}
		</div>
	</div>

	<div class="form-group item-piles-top-divider">
		<label>
			<p style="color: #c02609;">
				{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.RefreshItemsWarning")}
			</p>
		</label>
	</div>

	<div class="form-group" class:item-piles-disabled={!pileData.openTimes.enabled}>
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.RefreshItemsOnOpen")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.RefreshItemsOnOpenExplanation")}</p>
		</label>
		<input type="checkbox" bind:checked={pileData.refreshItemsOnOpen} disabled={!pileData.openTimes.enabled}/>
	</div>

	<div class="form-group" class:item-piles-disabled={!pileData.openTimes.enabled}>
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.RefreshItemsDays")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.RefreshItemsDaysExplanation")}</p>
		</label>
		<div class="break"></div>
		<div class="item-piles-flexrow" style="text-align: center;">
			{#each refreshItemDays as weekday (weekday.id + "-weekday-refresh")}
				<div class="item-piles-flexcol" style="align-items: center;">
					<label>{weekday.abbreviation}</label>
					<input type="checkbox"
					       bind:checked={weekday.selected}
					       disabled={!pileData.openTimes.enabled}
					       on:change={() => {
                 let weekdaySet = new Set(pileData.refreshItemsDays);
                 if(weekday.selected){
                   weekdaySet.add(weekday.name)
                 }else{
                   weekdaySet.delete(weekday.name)
                 }
                 pileData.refreshItemsDays = Array.from(weekdaySet);
               }}
					/>
				</div>
			{/each}
		</div>
	</div>

	<div class="form-group" class:item-piles-disabled={!pileData.openTimes.enabled}>
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.RefreshItemsHolidays")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.RefreshItemsHolidaysExplanation")}</p>
		</label>
		<div class="break"></div>
		<div style="display: grid; grid-template-columns: 1fr 1fr;">
			{#each refreshItemsHolidays as holiday, index (holiday.name + "-remove-" + index)}
				<div class="item-piles-flexrow" style="flex:0 1 auto;">
					<input type="checkbox"
					       bind:checked={holiday.selected}
					       disabled={!pileData.openTimes.enabled}
					       on:change={() => {
									 let holidaySet = new Set(pileData.refreshItemsHolidays);
									 if(holiday.selected){
										 holidaySet.add(holiday.name)
									 }else{
										 holidaySet.delete(holiday.name)
									 }
									 pileData.refreshItemsHolidays = Array.from(holidaySet);
								 }}/>
					<label>{holiday.name}</label>
				</div>
			{/each}
		</div>
	</div>

{/if}


<style>
    .form-group {
        border-radius: 5px;
    }
</style>
