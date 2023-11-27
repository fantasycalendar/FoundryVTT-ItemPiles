<script>

	import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
	import * as Helpers from "../../helpers/helpers.js";
	import { getContext } from "svelte";

	export let store;

	const { application } = getContext('#external');

	const logStore = store.log;
	const logSearchStore = store.logSearch;
	const visibleLogItems = store.visibleLogItems;
	const applicationHeight = application.position.stores.height;

</script>

<div class="form-group item-piles-flexrow item-piles-bottom-divider"
     style="margin: 0.25rem 0; align-items: center; flex: 0 1 auto;">
	<label style="flex:0 1 auto; margin-right: 5px;">{localize("ITEM-PILES.Merchant.LogSearch")}</label>
	<input bind:value={$logSearchStore} type="text">
</div>

<div class="item-piles-merchant-log"
     style="max-height: {$applicationHeight-130}px; overflow-y: scroll; font-size: 0.75rem; padding-right: 0.5rem;">

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
