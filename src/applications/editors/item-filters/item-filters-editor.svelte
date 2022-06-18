<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  import { getSetting, setSetting } from "../../../helpers/helpers.js";
  import { CONSTANTS } from "../../../constants.js";

  const { application } = getContext('external');

  let form;

  export let itemFilters = [];

  let mainSettings = !itemFilters?.length;
  if (!itemFilters) {
    itemFilters = getSetting(CONSTANTS.SETTINGS.ITEM_FILTERS);
  }

  function add() {
    itemFilters = [...itemFilters, { path: "", filters: "" }];
    itemFilters = itemFilters;
  }

  function remove(index) {
    itemFilters.splice(index, 1)
    itemFilters = itemFilters;
  }

  async function updateSettings() {
    application.options.resolve(itemFilters);
    if (mainSettings) {
      await setSetting(CONSTANTS.SETTINGS.ITEM_FILTERS, itemFilters);
    }
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>

  <p>{localize("ITEM-PILES.Applications.FilterEditor.Explanation")}</p>

  <table>
    <tr>
      <th>{localize("ITEM-PILES.Applications.FilterEditor.Path")}</th>
      <th>{localize("ITEM-PILES.Applications.FilterEditor.Filters")}</th>
      <th class="custom-small"><a on:click={add} class="item-piles-clickable"><i class="fas fa-plus"></i></a></th>
    </tr>
    {#each itemFilters as { path, filters }, index (index)}
      <tr>
        <td><input type="text" required placeholder="type" bind:value="{path}"/></td>
        <td><input type="text" required placeholder="class, spell, feat" bind:value="{filters}"/></td>
        <td class="custom-small">
          <button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
        </td>
      </tr>
    {/each}
  </table>

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