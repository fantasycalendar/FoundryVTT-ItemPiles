<script>
	import ListEntry from "./ListEntry.svelte";

	export let item;
	export let store;
	export let index;

	const subItems = item.subItems;

</script>

{#if index !== 0}
	<div class="item-piles-item-divider"></div>
{/if}
<ListEntry bind:entry={item} {store}/>
{#if $subItems.length}
	<div class="item-piles-item-sublist">
		{#each $subItems as subItem (subItem.identifier)}
			<div class="item-piles-tree-branch-right-arm"></div>
			<ListEntry {store} bind:entry={subItem}/>
		{/each}
	</div>
{/if}
