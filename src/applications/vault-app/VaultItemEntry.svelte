<script>

	import * as Helpers from "../../helpers/helpers.js";
	import { getContext } from "svelte";
	import { coordinate2size } from "../components/Grid/grid-utils.js";

	export let entry;

	const store = getContext("store");
	const gridDataStore = store.gridData;

	$: gridData = $gridDataStore;

	const item = entry.item;
	const name = item.name;
	const img = item.img;
	const flagData = item.itemFlagData;
	const quantity = item.quantity;
	const canStack = item.canStack;
	const style = item.style;
	const transform = entry.transform;
	let containerStyle = "";

	$: styling = Helpers.styleFromObject($style);
	$: displayImage = ($flagData.flipped ? $flagData.vaultImageFlipped || $flagData.vaultImage : $flagData.vaultImage) || $img;
	$: imageLoaded($flagData, $transform)

	function imageLoaded(flagData, transform) {
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

</script>

<div class="grid-item" data-fast-tooltip={$name}
     data-fast-tooltip-activation-speed="0" data-fast-tooltip-deactivation-speed="0">
	{#if displayImage}
		<div class="grid-item-image-container" style={containerStyle}>
			<img src={displayImage}/>
		</div>
	{/if}
	{#if styling}
		<div class="grid-item-ghost" style={styling}></div>
	{/if}
	{#if canStack && $quantity > 1}
		<span>{$quantity}</span>
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

    img {
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

    span {
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
