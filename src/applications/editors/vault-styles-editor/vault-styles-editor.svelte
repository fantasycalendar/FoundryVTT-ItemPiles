<script>
	import { ApplicationShell } from "#runtime/svelte/component/core";
	import { getContext } from 'svelte';
	import { localize } from '#runtime/svelte/helper';
	import { get, writable } from "svelte/store";
	import StyleEntry from "./StyleEntry.svelte";

	const { application } = getContext('#external');

	let form;

	export let elementRoot;
	export let data;

	const vaultStyleStore = writable(data);

	loadImages();

	function add() {
		vaultStyleStore.update(arr => {
			arr.push({ path: "", value: "", styling: {} })
			return arr;
		});
	}

	let images = [];

	async function loadImages() {
		const data = await FilePicker.browse("public", "icons/weapons/swords/*.webp", { wildcard: true });
		images = data.files;
	}

	function remove(index) {
		vaultStyleStore.update(arr => {
			arr.splice(index, 1)
			return arr;
		});
	}

	async function updateSettings() {
		application.options.resolve(get(vaultStyleStore));
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}


</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<form autocomplete=off bind:this={form} on:submit|preventDefault={updateSettings}>
		<p>{localize("ITEM-PILES.Applications.VaultStylesEditor.Explanation")}</p>

		<div class="item-piles-table">
			<div>{localize("ITEM-PILES.Applications.VaultStylesEditor.Path")}</div>
			<div>{localize("ITEM-PILES.Applications.VaultStylesEditor.Value")}</div>
			<div></div>
			<div></div>
			<div style="text-align: right;"><a class="item-piles-clickable" on:click={add}><i class="fas fa-plus"></i></a>
			</div>

			{#each $vaultStyleStore as entry, index (index)}
				<StyleEntry bind:entry image={images[index]} {index} {remove}/>
			{/each}
		</div>

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

  .item-piles-table {
    display: grid;
    grid-template-columns: 1fr 1fr 26px 21px 21px;
    padding: 3px;
    gap: 3px;

    div > a {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;

      a {
        padding: 0;
        line-height: inherit;
        text-align: center;


        > i {
          line-height: inherit;
          margin: 0;
        }
      }
    }
  }

</style>
