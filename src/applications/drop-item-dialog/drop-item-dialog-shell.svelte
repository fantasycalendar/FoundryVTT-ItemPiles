<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as Utilities from "../../helpers/utilities.js";
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { getContext } from "svelte";

  const { application } = getContext('external');

  export let elementRoot;
  export let droppedItem;
  export let itemPile;

  let form;

  let itemQuantity = Utilities.getItemQuantity(droppedItem);
  let sliderValue = 1;

  function requestSubmit() {
    form.requestSubmit();
  }

  function submit() {
    application.options.resolve({
      newPile: !itemPile,
      quantity: sliderValue
    });
    application.close();
  }

</script>

<svelte:options accessors={true}/>

<form class="flexcol" bind:this={form} on:submit|once|preventDefault={submit} style="padding:0.5rem;"
      autocomplete="off">

  <h3 style="text-align: center;">{localize("ITEM-PILES.DropItem.Dropping")}: {droppedItem.name}</h3>

  {#if itemPile}

    <p class="item-piles-text-center">{localize("ITEM-PILES.DropItem.ExistingPiles", { item_pile_name: itemPile.name })}</p>

  {/if}

  {#if itemQuantity > 1}

    <div class="form-group item-piles-text-center">
      <label>{localize("ITEM-PILES.DropItem.QuantityToDrop", {
        quantity: itemQuantity,
        itemName: droppedItem.name
      })}</label>
    </div>
    <div class="form-group">
      <input style="flex: 6;" type="range" name="quantity" min="1" max="{itemQuantity}" bind:value={sliderValue}/>
      <input style="flex: 1; margin-left:1rem;" type="number" bind:value={sliderValue}>
    </div>

  {:else}
    <input type="hidden" name="quantity" value="1"/>
  {/if}

  <footer class="sheet-footer flexrow" style="margin-top: 1rem;">
    {#if itemPile}
      <button type="button" on:click|once={requestSubmit}>
        <i class="fas fa-download"></i>
        {localize("ITEM-PILES.DropItem.AddToPile")}
      </button>
    {:else}
      <button type="button" on:click|once={requestSubmit}>
        <i class="fas fa-box"></i>
        {localize("ITEM-PILES.DropItem.NewPile")}
      </button>
    {/if}
    <button type="button" on:click={() => { application.close() }}>
      <i class="fas fa-times"></i>
      {localize("ITEM-PILES.DropItem.Cancel")}
    </button>
  </footer>

</form>
