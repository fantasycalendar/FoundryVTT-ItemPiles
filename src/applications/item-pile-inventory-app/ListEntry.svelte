<script>

	import { fade } from 'svelte/transition';
	import { localize } from '#runtime/util/i18n';
	import CONSTANTS from "../../constants/constants.js";
	import { onMount } from "svelte";

	export let store;
	export let entry;
	export let currency = false;

	const name = entry.name;
	const doc = entry.itemDocument;
	const img = entry.img;
	const rarityColor = entry.rarityColor;
	const quantityLeft = entry.quantityLeft;
	const quantity = entry.quantity;
	const currentQuantity = entry.currentQuantity;
	const pileData = store.pileData;

	let element = false;

	$: canInspectItems = entry.item && ($pileData.canInspectItems || store.actor.isOwner);
	$: {
		$doc;
		entry.rendered(element);
	}

	const editQuantities = store.editQuantities;

	function dragStart(event) {
		const data = {
			type: "Item",
			uuid: entry.item.uuid
		};
		Hooks.callAll(CONSTANTS.HOOKS.DRAG_DOCUMENT, data)
		event.dataTransfer.setData('text/plain', JSON.stringify(data));
	}

	onMount(() => {
		entry.rendered(element);
	});

</script>

<div bind:this={element}
     class="item-piles-flexrow item-piles-item-row"
     class:item-piles-disabled={!$editQuantities && (!$quantityLeft || !$quantity)}
     draggable={!!entry.item}
     on:dragstart={(event) => { dragStart(event) }}
     transition:fade={{duration: 250}}>

	<div
		on:mouseleave={() => { entry.mouseLeave(element) }}
		on:mouseenter={() => { entry.mouseEnter(element) }}
		style="display: flex; flex: 1 0 auto;"
	>
		<div class="item-piles-img-container">
			<img class="item-piles-img" src="{$img}"/>
		</div>

		<div class="item-piles-name"
		>
			<div class="item-piles-name-container">
				<p class:item-piles-clickable-link="{canInspectItems}"
				   on:click={() => { entry.preview() }}
				   style="color: {$rarityColor || 'inherit'};"
				>
					{$name}
				</p>
				{#if !$editQuantities && (entry.canStack || !entry.id) && ($pileData.shareCurrenciesEnabled || !currency)}
					<span class="item-piles-small-text">(x{$quantity})</span>
				{/if}
			</div>
		</div>
	</div>

	{#if entry.canStack || !entry.id}

		<div class="item-piles-quantity-container" style="flex: 0 1 150px;">

			{#if $editQuantities}

				<div class="item-piles-quantity-input-container">
					<input class="item-piles-quantity" type="number" min="0" bind:value="{$quantity}"
					       draggable="true" on:dragstart|stopPropagation|preventDefault/>
				</div>

			{:else}

				{#if $quantityLeft && $quantity}
					<div class="item-piles-quantity-input-container">
						<input class="item-piles-quantity" type="number" min="1" bind:value="{$currentQuantity}"
						       max="{$quantity}" disabled="{!$quantity}"/>

						<span class="item-piles-input-divider" class:item-piles-text-right={!store.recipient}>
               / {$quantityLeft}
            </span>
					</div>
				{:else}
          <span>
            {localize(`ITEM-PILES.Inspect.${entry.toShare && $quantity ? "NoShareLeft" : "NoneLeft"}`)}
          </span>
				{/if}
			{/if}

		</div>

	{/if}

	{#if !$editQuantities}

		<button
			on:click={() => { entry.take() }}
			class="item-piles-item-take-button"
			type="button"
			disabled={!$quantityLeft || !$quantity}>
			{localize("ITEM-PILES.Inspect.Take")}
		</button>

	{:else if !entry.canStack && !entry.isCurrency}

		<button
			on:click={() => { entry.remove() }}
			class="item-piles-item-take-button"
			type="button"
			disabled={!$quantityLeft}>
			{localize("Remove")}
		</button>

	{/if}


</div>

<style lang="scss">

</style>
