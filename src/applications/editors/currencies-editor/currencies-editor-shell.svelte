<script>

  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { getSetting } from "../../../helpers/helpers.js";
  import SETTINGS from "../../../constants/settings.js";
  import CurrencyList from "./CurrencyList.svelte";
  import CurrencyStore from "./currency-store.js"

  const { application } = getContext('external');

  export let data;
  export let elementRoot;

  const store = new CurrencyStore(data || getSetting(SETTINGS.CURRENCIES));

  let form;

  async function updateSettings() {
    application.options.resolve(store.export());
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>

    <p>{localize("ITEM-PILES.Applications.CurrenciesEditor.Explanation")}</p>

    <p class="small">{localize("ITEM-PILES.Applications.CurrenciesEditor.ExplanationSmallAttributes")}</p>

    <p class="small item-piles-bottom-divider">{localize("ITEM-PILES.Applications.CurrenciesEditor.ExplanationSmallItems")}</p>

    <CurrencyList {store}/>

    <footer>
      <button type="button" on:click|once={requestSubmit}>
        <i class="far fa-save"></i> {localize("ITEM-PILES.Applications.CurrenciesEditor.Submit")}
      </button>
      <button type="button" on:click|once={() => { application.close(); }}>
        <i class="far fa-times"></i> { localize("Cancel") }
      </button>
    </footer>

  </form>

</ApplicationShell>


<style lang="scss">

  form {
    padding: 0 0.25rem;
    position:relative;
  }

  footer {
    border-top: 1px solid rgba(0, 0, 0, 0.5);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    display:flex;
  }

  .small {
    font-size: 0.75rem;
  }

</style>