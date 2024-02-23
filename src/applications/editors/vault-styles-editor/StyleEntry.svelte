<script>

	import * as Helpers from "../../../helpers/helpers.js";
	import { writable } from "svelte/store";
	import { getContext } from "svelte";
	import StylesEditor from "../styles-editor/styles-editor.js";

	const { application } = getContext('#external');

	export let index;
	export let entry;
	export let image;
	export let remove;

	let style = writable(entry.styling);

	async function renderStyleEditor(event) {

		const oldStyle = entry.styling;

		const newStyles = await StylesEditor.show(style, {
			width: 400,
			left: application.position.left + 405,
			top: event.clientY - 75,
			readOnly: false
		});

		style.set(newStyles || oldStyle);
		entry.styling = newStyles || oldStyle;

	}

</script>

<div><input bind:value="{entry.path}" placeholder="system.rarity" required type="text"/></div>
<div><input bind:value="{entry.value}" placeholder="rare" required type="text"/></div>
<div>
	{#if image}
		<img class="item-piles-item-image-example" src={image}/>
	{/if}
	<div class="img-div" style={Helpers.styleFromObject($style)}></div>
</div>
<div>
	<a class="item-piles-clickable-green" on:click={(evt) => renderStyleEditor(evt)}>
		<i class="fas fa-cog"></i>
	</a>
</div>
<div>
	<a class="item-piles-clickable-red" on:click={remove(index)}>
		<i class="fas fa-times"></i>
	</a>
</div>

<style lang="scss">

  div {
    display: flex;
    align-items: center;
    position: relative;
    justify-content: center;

    img, .img-div {
      position: absolute;
      border-radius: 4px;
      min-height: 24px;
      min-width: 24px;
      max-height: 24px;
      max-width: 24px;
    }

    a {
      padding: 0;
      line-height: inherit;
      text-align: center;

      > i {
        line-height: inherit;
        margin: 0;
      }
    }
  }

</style>
