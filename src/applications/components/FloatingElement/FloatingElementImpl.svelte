<script>


	import { current_component } from 'svelte/internal';
	import { styleFromObject } from "../../../helpers/helpers.js";

	export let position;
	export let zIndex;
	export let style;
	export let component;
	export let componentData;
	const local = current_component;

	$: elementStyle = styleFromObject({
		"left": $position.x + "px",
		"top": $position.y + "px",
		"z-index": zIndex,
		...style
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

