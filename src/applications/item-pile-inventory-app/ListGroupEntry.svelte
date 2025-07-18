<script>
	import ListEntry from "./ListEntry.svelte";
	import { get } from "svelte/store";

	export let item;
	export let store;
	export let index;

	const subItems = item.subItems;

	$: visibleSubItems = $subItems.filter(item => !get(item.filtered))

</script>

{#if index !== 0}
	<div class="item-piles-item-divider"></div>
{/if}
<ListEntry bind:entry={item} {store}/>
{#if visibleSubItems.length}
	<div class="item-piles-item-sublist">
		{#each visibleSubItems as subItem (subItem.identifier)}
			<div class="item-piles-tree-branch-right-arm"></div>
			<ListEntry {store} bind:entry={subItem}/>
		{/each}
	</div>
{/if}
