<script>

	import * as Helpers from "../../helpers/helpers.js";

	export let entry;

	let imageElem;

	const item = entry.item;

	const name = item.name;
	const img = item.img;
	const flagData = item.itemFlagData;
	const quantity = item.quantity;
	const canStack = item.canStack;
	const style = item.style;
	const transform = entry.transform;
	let imageStyle = "";
	let loaded = false;

	$: styling = Helpers.styleFromObject($style);
	$: displayImage = ($flagData.flipped ? $flagData.vaultImageFlipped || $flagData.vaultImage : $flagData.vaultImage) || $img;
	$: imageLoaded($flagData, $transform)

	function imageLoaded(flagData, transform){
		if (!flagData.vaultImageFlipped){
			getImageDimensions(transform)
		}else{
			imageStyle = ""
		}
	}

	function getImageDimensions(transform) {
		if (!loaded) return;
		const { flipped, w, h } = transform;
		imageStyle = `transform: rotate(${flipped ? "90deg" : "0deg"})`
		const naturalWidth = imageElem.naturalWidth;
		const naturalHeight = imageElem.naturalHeight;
		if (w === h || !flipped) {
			imageStyle = "; object-fit: cover; min-width: 100%; min-height: 100%;"
			return;
		}
		const scale = naturalWidth / naturalHeight;
		imageStyle += ` scale(${scale});`;
	}

</script>

<div class="grid-item" data-fast-tooltip={$name}
     data-fast-tooltip-activation-speed="0" data-fast-tooltip-deactivation-speed="0">
	{#if displayImage}
		<img src={displayImage} style={imageStyle} bind:this={imageElem} on:load={() => {
			loaded = true;
			imageLoaded($flagData, $transform)
		}}/>
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
