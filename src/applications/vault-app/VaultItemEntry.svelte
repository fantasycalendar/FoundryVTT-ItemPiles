<script>

	import CONSTANTS from "../../constants/constants.js";
	import * as Helpers from "../../helpers/helpers.js";
	import { getContext, onMount } from "svelte";
	import { coordinate2size } from "../components/Grid/grid-utils.js";

	export let entry;

	const store = getContext("store");
	const gridDataStore = store.gridData;

	$: gridData = $gridDataStore;

	const item = entry.item;
	const doc = item.itemDocument;
	const name = item.name;
	const img = item.img;
	const flagData = item.itemFlagData;
	const quantity = item.quantity;
	const canStack = item.canStack;
	const style = item.style;
	const transform = entry.transform;
	let containerStyle = "";

	let element = false;

	$: styling = Helpers.styleFromObject($style);
	$: displayImage = ($flagData.flipped ? $flagData.vaultImageFlipped || $flagData.vaultImage : $flagData.vaultImage) || $img;
	$: imageChanged($flagData, $transform);
	$: {
		$doc;
		item.rendered(element);
	}

	function imageChanged(flagData, transform) {
		if (!flagData.vaultImageFlipped) {
			getImageDimensions(transform)
		} else {
			containerStyle = ""
		}
	}

	function getImageDimensions(transform) {
		let { w, h, flipped } = transform;
		const width = coordinate2size(!flipped ? w : h, gridData.gridSize, gridData.gap);
		const height = coordinate2size(!flipped ? h : w, gridData.gridSize, gridData.gap);
		containerStyle = `transform: rotate(${flipped ? "90deg" : "0deg"}); min-width: ${width}px; max-width: ${width}px; min-height: ${height}px; max-height: ${height}px;`;
	}

	onMount(() => {
		item.rendered(element);
	});

</script>

<div bind:this={element}
     class="grid-item"
     data-fast-tooltip={$name} data-fast-tooltip-activation-speed="0"
     data-fast-tooltip-deactivation-speed="0"
     on:mouseover={() => { item.mouseEnter(element) }}
     on:mouseleave={() => { item.mouseLeave(element) }}
>
	{#if displayImage}
		<div class="grid-item-image-container" style={containerStyle}>
			<img class="grid-item-image" src={displayImage}/>
		</div>
	{/if}
	{#if styling}
		<div class="grid-item-ghost" style={styling}></div>
	{/if}
	{#if canStack && $quantity > 1}
		<span class="grid-item-quantity">{$quantity}</span>
	{/if}
</div>

<style lang="scss">

  .grid-item {
    width: 100%;
    height: 100%;
    border-radius: 0.25rem;
    position: relative;

    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border: 1px solid black;

    .grid-item-image {
      position: absolute;
      flex-shrink: 0;
      border: 0;
      object-fit: cover;
      width: 100%;
      min-height: 100%;
    }

    .grid-item-image-container {
      width: 100%;
      height: 100%;
      align-items: center;
      display: flex;
    }

    .grid-item-quantity {
      position: absolute;
      bottom: 0;
      right: 3px;
      text-align: right;
      color: white;
      text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
      pointer-events: none;
    }

    .grid-item-ghost {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }

</style>
