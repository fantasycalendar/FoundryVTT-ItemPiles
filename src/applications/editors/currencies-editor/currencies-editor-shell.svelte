<script>

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

  async function updateSettings() {
    application.options.resolve(store.export());
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-pile-currencies-editor">]

  <p>{localize("ITEM-PILES.Applications.CurrenciesEditor.Explanation")}</p>

  <p class="small">{localize("ITEM-PILES.Applications.CurrenciesEditor.ExplanationSmall")}</p>

  <CurrencyList {store}/>

</form>


<style lang="scss">

  form {
    padding: 0 0.25rem;
  }

</style>