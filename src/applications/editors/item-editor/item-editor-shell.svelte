<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as PileUtilities from "../../../helpers/pile-utilities.js";

  const { application } = getContext('external');

  let form;
  let item;

  const itemData = PileUtilities.getItemFlagData(item);

  async function updateSettings() {
    application.options.resolve();
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>

  <p>{localize("ITEM-PILES.Applications.ItemEditor.Explanation")}</p>

</form>


<style lang="scss">

  table {
    vertical-align: middle;

    tr {
      border-spacing: 15px;
    }

    .custom-small {
      width: 26px;
    }

    button {
      padding: 0.25rem 0.25rem;
      line-height: 1rem;
      text-align: center;
    }

    a {
      text-align: center;
    }
  }

</style>