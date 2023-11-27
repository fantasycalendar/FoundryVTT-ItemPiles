<script>
	import { getContext } from 'svelte';
	import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

	import { getSetting } from "../../../helpers/helpers.js";
	import SETTINGS from "../../../constants/settings.js";
	import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
	import { get, writable } from "svelte/store";

	const { application } = getContext('#external');

	export let data;
	export let elementRoot;

	let form;

	const itemFilters = writable(data ? data : getSetting(SETTINGS.ITEM_FILTERS))

	function add() {
		itemFilters.update(val => {
			val.push({ path: "", filters: "" });
			return val;
		})
	}

	function remove(index) {
		itemFilters.update(val => {
			val.splice(index, 1)
			return val;
		})
	}

	async function updateSettings() {
		application.options.resolve(get(itemFilters));
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<form autocomplete=off bind:this={form} on:submit|preventDefault={updateSettings}>

		<p>{localize("ITEM-PILES.Applications.FilterEditor.Explanation")}</p>

		<table>
			<tr>
				<th>{localize("ITEM-PILES.Applications.FilterEditor.Path")}</th>
				<th>{localize("ITEM-PILES.Applications.FilterEditor.Filters")}</th>
				<th class="custom-small"><a class="item-piles-clickable" on:click={add}><i class="fas fa-plus"></i></a></th>
			</tr>
			{#each $itemFilters as { path, filters }, index (index)}
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
			<button on:click|once={requestSubmit} type="button">
				<i class="far fa-save"></i> {localize("Save")}
			</button>
			<button on:click|once={() => { application.close(); }} type="button">
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
