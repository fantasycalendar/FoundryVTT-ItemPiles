<script>

	import { ApplicationShell } from '#runtime/svelte/component/application';
	import { getContext } from 'svelte';
	import { localize } from '#runtime/util/i18n';
	import { getSetting } from "../../../helpers/helpers.js";
	import SETTINGS from "../../../constants/settings.js";
	import CurrencyList from "./CurrencyList.svelte";
	import CurrencyStore from "./currency-store.js"

	const { application } = getContext('#external');

	export let data;
	export let secondary = false

	export let elementRoot;

	const store = new CurrencyStore(data || getSetting(SETTINGS.CURRENCIES), secondary);

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

<ApplicationShell bind:elementRoot>

	<form autocomplete=off bind:this={form} on:submit|preventDefault={updateSettings}>

		<p>{localize(`ITEM-PILES.Applications.${secondary ? "Secondary" : ""}CurrenciesEditor.Explanation`)}</p>

		<p class="small">
			{localize("ITEM-PILES.Applications.CurrenciesEditor.ExplanationSmallAttributes")}
		</p>

		<p class="small item-piles-bottom-divider">
			{localize("ITEM-PILES.Applications.CurrenciesEditor.ExplanationSmallItems")}
		</p>

		<CurrencyList {store}/>

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

  form {
    padding: 0 0.25rem;
    position: relative;
  }

  footer {
    border-top: 1px solid rgba(0, 0, 0, 0.5);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    display: flex;
  }

  .small {
    font-size: 0.75rem;
  }

</style>
