<script>
	import { ApplicationShell } from "#runtime/svelte/component/application";
	import { getContext } from 'svelte';
	import { localize } from '#runtime/util/i18n';
	import { get, writable } from "svelte/store";
	import SETTINGS from "../../../constants/settings.js";
	import { getSetting } from "../../../helpers/helpers.js";

	const { application } = getContext('#external');

	let form;

	export let elementRoot;
	export let data;

	const itemFilters = (getSetting(SETTINGS.ITEM_FILTERS).find(filter => filter.path === "type")?.filters ?? "").split(',');

	const unstackableItemTypesStore = writable(data);
	let systemTypes = Object.keys(game.system.documentTypes.Item).filter(type => !itemFilters.includes(type));
	let unusedTypes = [];

	$: {
		unusedTypes = systemTypes.filter(systemType => !$unstackableItemTypesStore.some(type => type === systemType));
	}

	function add() {
		if (!unusedTypes.length) return;
		unstackableItemTypesStore.update(arr => {
			arr.push(unusedTypes[0]);
			return arr;
		})
	}

	function remove(index) {
		unstackableItemTypesStore.update(arr => {
			arr.splice(index, 1)
			return arr;
		})
	}

	async function updateSettings() {
		application.options.resolve(get(unstackableItemTypesStore));
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<form autocomplete=off bind:this={form} on:submit|preventDefault={updateSettings}>
		<p>{localize("ITEM-PILES.Applications.UnstackableItemTypesEditor.Explanation")}</p>

		<table>
			<tr>
				<th>{localize("ITEM-PILES.Applications.UnstackableItemTypesEditor.Type")}</th>
				<th class="small"><a class="item-piles-clickable" on:click={add}><i class="fas fa-plus"></i></a></th>
			</tr>
			{#each $unstackableItemTypesStore as type, index (index)}
				<tr>
					<td>
						<select bind:value={type}>
							{#each systemTypes as systemType}
								<option value="{systemType}" disabled="{systemType !== type && !unusedTypes.includes(systemType)}">
									{systemType}
								</option>
							{/each}
						</select>
					</td>
					<td class="small">
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

    .small {
      width: 26px;
    }

    select {
      width: 100%;
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
