<script>

	import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
	import { fade } from 'svelte/transition';
	import ListGroupEntry from "./ListGroupEntry.svelte";

	export let store;
	const items = store.items;
	const numItems = store.numItems;

</script>


{#if $numItems > 0}
	<div in:fade|local={{duration: 150}}>

		<div class="item-piles-flexrow"><h3>{localize("ITEM-PILES.Items")}</h3></div>

		{#each $items as item, index (item.identifier)}
			<ListGroupEntry {item} {index} {store}/>
		{/each}

	</div>

{/if}
