<script>

	import { styleFromObject } from "../../../helpers/helpers.js";
	import { setContext } from "svelte";

	export let position;
	export let zIndex;
	export let style;
	export let context;
	export let component;
	export let componentData;

	for(const [key, ctx] of Object.entries(context)){
		setContext(key, ctx);
	}

	$: elementStyle = styleFromObject({
		"left": $position.x + "px",
		"top": $position.y + "px",
		"z-index": zIndex,
		...$style
	});

</script>


<div class="item-piles-floting-element" style={elementStyle}>
	<svelte:component {...componentData} this={component}/>
</div>


<style lang="scss">

  .item-piles-floting-element {
    position: fixed;
    pointer-events: none;
    color: red;
  }

</style>

