<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import PriceList from "../../components/PriceList.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";

  const { application } = getContext('#external');

  export let prices;
  export let elementRoot;
  let form;

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

	<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-piles-config-container">

		<p>{localize("ITEM-PILES.Applications.PricePresetEditor.Explanation")}</p>

		<PriceList bind:prices presets={false}/>

		<footer>
			<button type="button" on:click|once={requestSubmit}>
				<i class="far fa-save"></i> {localize("ITEM-PILES.Applications.PricePresetEditor.Update")}
			</button>
			<button type="button" on:click|once={() => { application.close(); }}>
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
