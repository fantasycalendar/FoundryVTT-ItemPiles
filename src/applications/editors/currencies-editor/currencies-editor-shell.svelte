<script>

  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  import AttributeCurrencyList from "./AttributeCurrencyList.svelte";
  import ItemCurrencyList from "./ItemCurrencyList.svelte";

  import { getSetting, setSetting } from "../../../helpers/helpers.js";
  import SETTINGS from "../../../constants/settings.js";

  import CurrencyStore from "./currency-store.js"

  const store = new CurrencyStore();

  const { application } = getContext('external');

  export let data;
  data = data || getSetting(SETTINGS.CURRENCIES);

  store.items.set([...data.items]);
  store.attributes.set([...data.attributes]);

  const primary = data.attributes.find(attr => attr.primary) ?? data.items.find(item => item.primary) ?? false;
  store.primary.set(primary)

  let form;

  async function updateSettings() {
    const newData = store.export();
    application.options.resolve(newData);
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-pile-currencies-editor">

  <h1>Attribute based currencies:</h1>

  <p>{localize("ITEM-PILES.Applications.CurrenciesEditor.Explanation")}</p>
  <AttributeCurrencyList {store}/>

  <h1>Item based currencies:</h1>

  <p>{localize("ITEM-PILES.Applications.CurrenciesEditor.ItemExplanation")}</p>
  <ItemCurrencyList {store}/>

</form>


<style lang="scss">

  form {
    padding: 0 0.25rem;
  }

</style>