<script>
	import { getContext } from 'svelte';
	import { localize } from '#runtime/svelte/helper';
	import PriceList from "../../components/PriceList.svelte";
	import { ApplicationShell } from "#runtime/svelte/component/core";

	const { application } = getContext('#external');

	export let data;
	export let elementRoot;
	let form;

	let prices = foundry.utils.deepClone(data);

	async function updateSettings() {
		application.options.resolve(prices);
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<form autocomplete=off bind:this={form} class="item-piles-config-container" on:submit|preventDefault={updateSettings}>

		<p>{localize("ITEM-PILES.Applications.PricePresetEditor.Explanation")}</p>

		<PriceList bind:prices presets={false}/>

		<footer>
			<button on:click|once={requestSubmit} type="button">
				<i class="far fa-save"></i> {localize("ITEM-PILES.Applications.PricePresetEditor.Update")}
			</button>
			<button on:click|once={() => { application.close(); }} type="button">
				<i class="far fa-times"></i> { localize("Cancel") }
			</button>
		</footer>

	</form>

</ApplicationShell>

<style lang="scss">

  p {
    font-size: 0.8rem;
    text-align: center;
    line-height: 1rem;
  }

  table {

    td {
      vertical-align: middle;
    }

    tr {

      &.is-active {
        background-color: #3273dc;
        color: #fff;
      }

      &.is-dragging {
        background-color: rgba(50, 220, 132, 0.55);
        color: #fff;
      }
    }

    .small {
      width: 26px;
    }

    button {
      padding: 0.25rem 0.25rem;
      line-height: 1rem;
      flex: 0;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    a {
      text-align: center;
    }
  }

</style>
