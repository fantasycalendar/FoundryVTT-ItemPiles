<script>
  import { getContext } from "svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import * as Utilities from "../../../helpers/utilities.js";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import SliderInput from "../../components/SliderInput.svelte";

  const { application } = getContext('external');

  export let item;
  export let elementRoot;
  export let target = false;

  const unlimitedQuantity = application.options?.unlimitedQuantity ?? false;

  let form;
  let quantity = 1;

  const itemQuantity = Utilities.getItemQuantity(item);
  const canItemStack = Utilities.canItemStack(item);

  function requestSubmit() {
    form.requestSubmit();
  }

  function submit() {
    application.options.resolve(quantity);
    application.close();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<form autocomplete="off" bind:this={form} class="item-piles-flexcol" on:submit|once|preventDefault={submit}
				style="padding:0.5rem;">

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

		{#if (itemQuantity > 1 || unlimitedQuantity) && canItemStack}

			<div class="form-group item-piles-text-center">
				<label>{localize(`ITEM-PILES.Applications.${application.options.localizationTitle}.${unlimitedQuantity ? "ContentInfiniteQuantity" : "ContentMultipleQuantity"}`, {
          target_name: target?.name ?? "",
          quantity: itemQuantity,
          itemName: item.name
        })}</label>
			</div>
			{#if unlimitedQuantity}
				<input type="number" min="1" bind:value={quantity}/>
			{:else}
				<SliderInput min={1} max={itemQuantity} maxInput={itemQuantity} divideBy={1} bind:value={quantity}/>
			{/if}
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
			<button on:click={() => { application.close() }} type="button">
				<i class="fas fa-times"></i>
				{localize("Cancel")}
			</button>
		</footer>

	</form>
</ApplicationShell>
