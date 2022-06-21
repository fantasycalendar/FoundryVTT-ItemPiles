<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { getContext } from "svelte";
  import * as Utilities from "../../helpers/utilities.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";

  const { application } = getContext('external');

  export let elementRoot;
  export let sourceActor;
  export let targetActor;
  export let settings;

  const targetCurrencyData = PileUtilities.getActorCurrencyData(targetActor);

  let currencies = PileUtilities.getFormattedActorCurrencies(sourceActor, {
      currencyList: targetCurrencyData.currencies,
      getAll: settings?.unlimitedCurrencies
    })
    .map(currency => {
      currency.currentQuantity = 0;
      return currency;
    });

  if (settings?.existingCurrencies) {
    currencies.forEach(currency => {
      const existingCurrency = settings?.existingCurrencies.find(existingCurrency => existingCurrency.path === currency.path);
      if (existingCurrency) {
        currency.currentQuantity = existingCurrency.quantity;
      }
    });
  }

  let itemCurrencies = PileUtilities.getActorCurrencyItems(sourceActor, { currencyList: targetCurrencyData.items })
    .map(item => ({
      id: item.id,
      name: item.name,
      img: item.img,
      quantity: Utilities.getItemQuantity(item),
      currentQuantity: 0,
    }));

  if (settings?.existingCurrencies) {
    itemCurrencies.forEach(currency => {
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
      attributes: Object.fromEntries(currencies
        .filter(currency => currency.currentQuantity)
        .map(currency => [currency.path, currency.currentQuantity])
      ),
      items: itemCurrencies
        .filter(item => item.currentQuantity)
        .map(item => ({ _id: item.id, quantity: item.currentQuantity }))
    });
    application.close();
  }

</script>

<svelte:options accessors={true}/>

<form class="flexcol" bind:this={form} on:submit|once|preventDefault={submit} style="padding:0.5rem;"
      autocomplete="off">

  {#if currencies.length || itemCurrencies.length}

    <p style="text-align: center;" class="item-piles-bottom-divider">
      {settings?.content ?? localize("ITEM-PILES.DropCurrencies.Player")}
    </p>

    {#each currencies as currency, index (currency.path)}
      <div class="form-group item-piles-slider-group item-piles-odd-color">
        <div class="item-piles-img-container">
          <img class="item-piles-img" src="{currency.img}">
        </div>
        <div class="item-piles-name item-piles-text">
          <div>{currency.name}</div>
        </div>

        {#if settings?.unlimitedCurrencies}
          <input class="item-piles-range-input" style="flex: 1.5; margin-left:1rem;" type="number"
                 bind:value={currency.currentQuantity}/>
        {:else}
          <input class="item-piles-range-slider" style="flex: 5;" type="range" min="0" max="{currency.quantity}"
                 bind:value={currency.currentQuantity}/>
          <input class="item-piles-range-input" style="flex: 1.5; margin-left:1rem;" type="number"
                 bind:value={currency.currentQuantity}
                 on:click={() => {
                      currency.currentQuantity = Math.max(0, Math.min(currency.quantity, currency.currentQuantity));
                 }}/>
          <div style="flex:0 1 50px; margin: 0 5px;">/ {currency.quantity}</div>
        {/if}
      </div>
    {/each}

    {#each itemCurrencies as item, index (item.id)}
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
      {localize("ITEM-PILES.DropCurrencies.NoCurrency", { actor_name: sourceActor.name })}
    </p>

  {/if}

  <footer class="sheet-footer flexrow" style="margin-top: 1rem;">
    {#if currencies.length || itemCurrencies.length}
      <button type="button" on:click|once={requestSubmit}>
        <i class="fas fa-download"></i>
        {settings?.button ?? localize("ITEM-PILES.DropCurrencies.AddToPile")}
      </button>
    {/if}

    <button type="button" on:click|once={() => { application.close() }}>
      <i class="fas fa-times"></i>
      {localize("ITEM-PILES.DropCurrencies.Cancel")}
    </button>
  </footer>

</form>
