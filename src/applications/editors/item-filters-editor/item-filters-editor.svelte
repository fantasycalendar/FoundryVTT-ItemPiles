<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  import { getSetting, setSetting } from "../../../helpers/helpers.js";
  import SETTINGS from "../../../constants/settings.js";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";

  const { application } = getContext('#external');

  export let itemFilters;
  export let elementRoot;

  let form;

  if (!itemFilters) {
    itemFilters = getSetting(SETTINGS.ITEM_FILTERS);
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
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

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

		<footer>
			<button type="button" on:click|once={requestSubmit}>
				<i class="far fa-save"></i> {localize("Save")}
			</button>
			<button type="button" on:click|once={() => { application.close(); }}>
				<i class="far fa-times"></i> { localize("Cancel") }
			</button>
		</footer>

	</form>

</ApplicationShell>


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
