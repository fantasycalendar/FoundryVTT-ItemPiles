<script>
  const { application } = getContext('external');
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  import AttributeCurrencyList from "./AttributeCurrencyList.svelte";
  import ItemCurrencyList from "./ItemCurrencyList.svelte";

  import { getSetting, setSetting } from "../../../helpers/helpers.js";
  import { CONSTANTS } from "../../../constants.js";

  import { currencyStore } from "./currency-store.js"

  export let data;

  let mainSettings = !data;
  if (!data) {
    data = getSetting(CONSTANTS.SETTINGS.CURRENCIES);
  }

  currencyStore.items.set([...data.items]);
  currencyStore.attributes.set([...data.attributes]);

  const primary = data.attributes.find(attr => attr.primary) ?? data.items.find(item => item.primary) ?? false;
  currencyStore.primary.set(primary)

  let form;

  async function updateSettings() {
    const newData = currencyStore.export();
    application.options.resolve(newData);
    if (mainSettings) {
      await setSetting(CONSTANTS.SETTINGS.CURRENCIES, newData);
    }
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
  <AttributeCurrencyList/>

  <h1>Item based currencies:</h1>

  <p>{localize("ITEM-PILES.Applications.CurrenciesEditor.ItemExplanation")}</p>
  <ItemCurrencyList/>

</form>


<style lang="scss">

  form {
    padding: 0 0.25rem;
  }

  .form-group {
    label {
      p {
        flex: 0;
        line-height: 14px;
        font-size: var(--font-size-12);
        color: var(--color-text-dark-secondary);
        padding-right: 1rem;
        margin-top: 0;
        overflow-y: hidden;
      }
    }
  }

</style>