<script>

  import { writable } from "svelte/store";
  import * as Helpers from "../../helpers/helpers.js";
  import { openEditor } from "../../helpers/helpers.js";
  import SETTINGS from "../../constants/settings.js";

  export let value;
  export let placeholder = "";

  async function showCustomItemCategoryEditor() {
    openEditor(SETTINGS.CUSTOM_ITEM_CATEGORIES).then((result) => {
      Helpers.setSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES, Array.from(new Set(result)));
      currentCustomCategories.set(Helpers.getSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES));
    })
  }

  let currentCustomCategories = writable(Array.from(new Set(Helpers.getSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES))));

  const id = randomID();

</script>

<div class="item-piles-flexrow" style="align-items: center;">
	<input bind:value list={"item-editor-list-"+id} placeholder={placeholder} type="text"/>
	<a on:click={() => showCustomItemCategoryEditor()} style="flex: 0; margin: 0 0.5rem;"><i
		class="fas fa-cog"></i></a>
	{#if $currentCustomCategories.length}
		<datalist id={"item-editor-list-"+id}>
			{#each $currentCustomCategories as category}
				<option>{category}</option>
			{/each}
		</datalist>
	{/if}
</div>
