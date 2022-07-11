<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { getContext } from "svelte";
  import * as PileUtilities from "../../../helpers/pile-utilities.js";

  const { application } = getContext('external');

  export let sourceActor;
  export let targetActor;
  export let settings;
  export let elementRoot;

  const targetCurrencyData = PileUtilities.getActorCurrencyList(targetActor);

  const currencies = PileUtilities.getActorCurrencies(sourceActor, {
    currencyList: targetCurrencyData.currencies,
    getAll: settings?.unlimitedCurrencies
  });

  let attributes = currencies.filter(entry => entry.type === "attribute")
    .map(currency => {
      currency.currentQuantity = 0;
      return currency;
    });

  if (settings?.existingCurrencies) {
    attributes.forEach(currency => {
      const existingCurrency = settings?.existingCurrencies.find(existingCurrency => existingCurrency.id === currency.id);
      if (existingCurrency) {
        currency.currentQuantity = existingCurrency.quantity;
      }
    });
  }

  let items = currencies.filter(entry => entry.type === "attribute")
    .map(currency => {
      currency.currentQuantity = 0;
      return currency;
    });

  if (settings?.existingCurrencies) {
    items.forEach(currency => {
      const existingCurrency = settings?.existingCurrencies.find(existingCurrency => existingCurrency.id === currency.id);
      if (existingCurrency) {
        currency.currentQuantity = existingCurrency.quantity;
      }
    });
  }

  let form;

  function requestSubmit() {
    form.requestSubmit();
  }

  function submit() {
    application.options.resolve({
      attributes: Object.fromEntries(attributes
        .filter(attribute => attribute.currentQuantity)
        .map(attribute => [attribute.path, attribute.currentQuantity])
      ),
      items: items
        .filter(item => item.currentQuantity)
        .map(item => ({ _id: item.id, quantity: item.currentQuantity }))
    });
    application.close();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <form class="flexcol" bind:this={form} on:submit|once|preventDefault={submit} style="padding:0.5rem;"
        autocomplete="off">

    {#if attributes.length || items.length}

      <p style="text-align: center;" class="item-piles-bottom-divider">
        {settings?.content ?? localize("ITEM-PILES.Applications.DropCurrencies.Player")}
      </p>

      {#each attributes as attribute, index (attribute.path)}
        <div class="form-group item-piles-slider-group item-piles-odd-color">
          <div class="item-piles-img-container">
            <img class="item-piles-img" src="{attribute.img}">
          </div>
          <div class="item-piles-name item-piles-text">
            <div>{attribute.name}</div>
          </div>

          {#if settings?.unlimitedCurrencies}
            <input class="item-piles-range-input" style="flex: 1.5; margin-left:1rem;" type="number"
                   bind:value={attribute.currentQuantity}/>
          {:else}
            <input class="item-piles-range-slider" style="flex: 5;" type="range" min="0" max="{attribute.quantity}"
                   bind:value={attribute.currentQuantity}/>
            <input class="item-piles-range-input" style="flex: 1.5; margin-left:1rem;" type="number"
                   bind:value={attribute.currentQuantity}
                   on:click={() => {
                        attribute.currentQuantity = Math.max(0, Math.min(attribute.quantity, attribute.currentQuantity));
                   }}/>
            <div style="flex:0 1 50px; margin: 0 5px;">/ {attribute.quantity}</div>
          {/if}
        </div>
      {/each}

      {#each items as item, index (item.id)}
        <div class="form-group item-piles-slider-group item-piles-odd-color">
          <div class="item-piles-img-container">
            <img class="item-piles-img" src="{item.img}">
          </div>
          <div class="item-piles-name item-piles-text">
            <div>{item.name}</div>
          </div>

          {#if settings?.unlimitedCurrencies}
            <input class="item-piles-range-input" style="flex: 1.5; margin-left:1rem;" type="number"
                   bind:value={item.currentQuantity}/>
          {:else}
            <input class="item-piles-range-slider" style="flex: 5;" type="range" min="0" max="{item.quantity}"
                   bind:value={item.currentQuantity}/>
            <input class="item-piles-range-input" style="flex: 1.5; margin-left:1rem;" type="number"
                   bind:value={item.currentQuantity}
                   on:click={() => {
                        item.currentQuantity = Math.max(0, Math.min(item.quantity, item.currentQuantity));
                   }}/>
            <div style="flex:0 1 50px; margin: 0 5px;">/ {item.quantity}</div>
          {/if}
        </div>
      {/each}

    {:else}

      <p style="text-align: center;">
        {localize("ITEM-PILES.Applications.DropCurrencies.NoCurrency", { actor_name: sourceActor.name })}
      </p>

    {/if}

    <footer class="sheet-footer flexrow" style="margin-top: 1rem;">
      {#if attributes.length || items.length}
        <button type="button" on:click|once={requestSubmit}>
          <i class="fas fa-download"></i>
          {settings?.button ?? localize("ITEM-PILES.Applications.DropCurrencies.AddToPile")}
        </button>
      {/if}

      <button type="button" on:click|once={() => { application.close() }}>
        <i class="fas fa-times"></i>
        {localize("Cancel")}
      </button>
    </footer>

  </form>

</ApplicationShell>
