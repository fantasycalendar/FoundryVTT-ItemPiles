<script>

	import { localize } from "#runtime/util/i18n";
	import { TJSDialog } from "#runtime/svelte/application";
	import CustomDialog from "../../components/CustomDialog.svelte";
	import * as SharingUtilities from "../../../helpers/sharing-utilities.js";

	export let pileData;
	export let pileActor;

	async function resetSharingData() {
		const doThing = await TJSDialog.confirm({
			id: `sharing-dialog-item-pile-config-${pileActor.id}`,
			title: "Item Piles - " + game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
			content: {
				class: CustomDialog,
				props: {
					header: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
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

</script>

<details class="item-piles-collapsible item-piles-clickable">

	<summary>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.Title")}</summary>

	<div class="form-group">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabled")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabledExplanation")}</p>
		</label>
		<input bind:checked={pileData.shareItemsEnabled} type="checkbox"/>
	</div>

	<div class="form-group">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabled")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabledExplanation")}</p>
		</label>
		<input bind:checked={pileData.shareCurrenciesEnabled} type="checkbox"/>
	</div>

	<div class="form-group">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabled")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabledExplanation")}</p>
		</label>
		<input bind:checked={pileData.takeAllEnabled} type="checkbox"/>
	</div>

	<div class="form-group">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabled")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabledExplanation")}</p>
		</label>
		<input bind:checked={pileData.splitAllEnabled} type="checkbox"/>
	</div>

	<div class="form-group">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayers")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayersExplanation")}</p>
		</label>
		<input bind:checked={pileData.activePlayers} type="checkbox"/>
	</div>

	<div class="form-group">
		<label style="flex:4;">
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingDataExplanation")}</p>
		</label>
	</div>

	<div class="form-group">
		<button class="item-piles-config-reset-sharing-data" on:click={() => { resetSharingData() }} style="flex:4;"
		        type="button">
			{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}
		</button>
	</div>

</details>
