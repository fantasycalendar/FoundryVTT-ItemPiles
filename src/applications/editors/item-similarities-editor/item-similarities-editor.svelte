<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import SETTINGS from "../../../constants/settings.js";

  const { application } = getContext('external');

  import { getSetting, setSetting } from "../../../helpers/helpers.js";
  import CONSTANTS from "../../../constants/constants.js";

  let form;

  let itemSimilarities = getSetting(SETTINGS.ITEM_SIMILARITIES);

  function add() {
    itemSimilarities = [...itemSimilarities, ""];
    itemSimilarities = itemSimilarities;
  }

  function remove(index) {
    itemSimilarities.splice(index, 1)
    itemSimilarities = itemSimilarities;
  }

  async function updateSettings() {
    await setSetting(SETTINGS.ITEM_SIMILARITIES, itemSimilarities);
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>
  <p>{localize("ITEM-PILES.Applications.SimilaritiesEditor.Explanation_P1")}</p>
  <p>{localize("ITEM-PILES.Applications.SimilaritiesEditor.Explanation_P2")}</p>

  <table>
    <tr>
      <th>{localize("ITEM-PILES.Applications.SimilaritiesEditor.Path")}</th>
      <th class="small"><a on:click={add} class="item-piles-clickable"><i class="fas fa-plus"></i></a></th>
    </tr>
    {#each itemSimilarities as path, index (index)}
      <tr>
        <td><input type="text" required placeholder="'type' or 'name' etc" bind:value="{path}"/></td>
        <td class="small">
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

    .small {
      width: 26px;
    }

    button {
      padding: 0.25rem 0.25rem;
      line-height: 1rem;
      flex: 0;
      text-align: center;
    }

    a {
      text-align: center;
    }
  }

</style>