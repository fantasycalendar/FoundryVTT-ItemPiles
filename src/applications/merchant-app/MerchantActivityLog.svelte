<script>

	import { localize } from "#runtime/util/i18n";
	import * as Helpers from "../../helpers/helpers.js";
	import { getContext } from "svelte";
	import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
	import CustomDialog from "../components/CustomDialog.svelte";
	import * as PileUtilities from "../../helpers/pile-utilities.js";

	export let store;

	const { application } = getContext('#external');

	const actor = store.actor;
	const logStore = store.log;
	const logSearchStore = store.logSearch;
	const visibleLogItems = store.visibleLogItems;
	const applicationHeight = application.position.stores.height;

	$: exportableMerchantLog = PileUtilities.getActorLogText(store.actor, $logStore);

	async function clearMerchantLog() {

		const doThing = await TJSDialog.confirm({
			id: `sharing-dialog-item-pile-config-${store.actor.id}`,
			title: "Item Piles - " + localize("ITEM-PILES.Dialogs.ClearMerchantLog.Title"),
			content: {
				class: CustomDialog,
				props: {
					header: localize("ITEM-PILES.Dialogs.ClearMerchantLog.Title"),
					content: localize("ITEM-PILES.Dialogs.ClearMerchantLog.Content", { actor_name: store.actor.name })
				},
			},
			modal: true
		});
		if (!doThing) return;
		return PileUtilities.clearActorLog(store.actor);

	}

</script>

<div class="form-group item-piles-flexrow item-piles-bottom-divider"
     style="margin: 0.25rem 0; align-items: center; flex: 0 1 auto;">
	<label style="flex:0 1 auto; margin-right: 5px;">{localize("ITEM-PILES.Merchant.LogSearch")}</label>
	<input bind:value={$logSearchStore} type="text">
</div>

<div class="item-piles-merchant-log"
     style="flex:1 0 auto; overflow-y: scroll; font-size: 0.75rem; margin-bottom: 0.5rem; padding: 0 0.5rem 0.5rem 0;">

	{#each $logStore.slice(0, $visibleLogItems).filter(log => log.visible) as log, index (index)}
		<div class={log.class}>
			{@html log.text} - {Helpers.timeSince(log.date)} ago
		</div>
	{/each}

	{#if $logStore.length > $visibleLogItems}
		<div class="item-piles-top-divider" style="text-align: center;">
			<a on:click={() => { $visibleLogItems += 20; }}><i>Load more transactions ({$visibleLogItems}
				/ {$logStore.length})...</i></a>
		</div>
	{/if}

</div>

<div class="item-piles-flexrow">
	<button type="button" disabled={!exportableMerchantLog} on:click={() => {
		Helpers.downloadText(exportableMerchantLog, `${actor.name}-merchant-log.txt`);
	}}>
		{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ExportMerchantLog")}
	</button>
	<button type="button" disabled={!exportableMerchantLog} on:click={clearMerchantLog}>
		{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ClearMerchantLog")}
	</button>
</div>
