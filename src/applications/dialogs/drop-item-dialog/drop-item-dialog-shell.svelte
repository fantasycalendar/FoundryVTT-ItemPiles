<script>
	import { getContext } from "svelte";
	import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
	import { isValidItemPile } from "../../../helpers/pile-utilities.js";
	import * as Utilities from "../../../helpers/utilities.js";
	import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
	import SliderInput from "../../components/SliderInput.svelte";

	const { application } = getContext('external');

	export let item;
	export let elementRoot;
	export let target = false;

	let form;
	let sliderValue = 1;

	const isItemPile = !target || isValidItemPile(target);

	const itemQuantity = Utilities.getItemQuantity(item);
	const canItemStack = Utilities.canItemStack(item);

	function requestSubmit() {
		form.requestSubmit();
	}

	function submit() {
		application.options.resolve(sliderValue);
		application.close();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <form class="item-piles-flexcol" bind:this={form} on:submit|once|preventDefault={submit} style="padding:0.5rem;"
        autocomplete="off">

    <h3 style="text-align: center;">
      {localize(`ITEM-PILES.Applications.${application.options.localizationTitle}.Header`, {
				item_name: item.name
			})}
    </h3>

    {#if target}

      <p class="item-piles-text-center">
        {localize(`ITEM-PILES.Applications.${application.options.localizationTitle}.Content`, {
					target_name: target.name
				})}
      </p>

    {/if}

    {#if itemQuantity > 1 && canItemStack}

      <div class="form-group item-piles-text-center">
        <label>{localize(`ITEM-PILES.Applications.${application.options.localizationTitle}.ContentMultipleQuantity`, {
					target_name: target.name,
					quantity: itemQuantity,
					itemName: item.name
				})}</label>
      </div>
      <SliderInput min={1} max={itemQuantity} maxInput={itemQuantity} divideBy={1} bind:value={sliderValue}/>

    {/if}

    <footer class="sheet-footer item-piles-flexrow" style="margin-top: 1rem;">
      {#if target}
        <button type="button" on:click|once={requestSubmit}>
          <i class="fas fa-download"></i>
          {localize(`ITEM-PILES.Applications.${application.options.localizationTitle}.Submit`)}
        </button>
      {:else}
        <button type="button" on:click|once={requestSubmit}>
          <i class="fas fa-box"></i>
          {localize(`ITEM-PILES.Applications.${application.options.localizationTitle}.SubmitNoTarget`)}
        </button>
      {/if}
      <button type="button" on:click={() => { application.close() }}>
        <i class="fas fa-times"></i>
        {localize("Cancel")}
      </button>
    </footer>

  </form>
</ApplicationShell>
