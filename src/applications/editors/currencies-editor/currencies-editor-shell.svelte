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

  const store = new CurrencyStore(data || getSetting(SETTINGS.CURRENCIES));

  let form;
  let elementRoot;

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

    <p class="small">{localize("ITEM-PILES.Applications.CurrenciesEditor.ExplanationSmall")}</p>

    <CurrencyList {store}/>

  </form>

</ApplicationShell>


<style lang="scss">

  form {
    padding: 0 0.25rem;
    position:relative;
  }

</style>