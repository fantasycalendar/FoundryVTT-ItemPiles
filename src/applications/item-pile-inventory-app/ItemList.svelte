<script>

	import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
	import { fade } from 'svelte/transition';
	import ListEntry from "./ListEntry.svelte";

	export let store;
	const items = store.items;
	const numItems = store.numItems;

</script>


{#if $numItems > 0}
	<div in:fade|local={{duration: 150}}>

		<div class="item-piles-flexrow"><h3>{localize("ITEM-PILES.Items")}</h3></div>

		{#each $items as item (item.identifier)}
			<ListEntry {store} bind:entry={item}/>
			<div style="padding-left: 1rem;">
				{#each item.subItems as subItem}
					<ListEntry {store} bind:entry={subItem}/>
				{/each}
			</div>
		{/each}

	</div>

{/if}
