<script>
	import { getContext } from 'svelte';
	import { localize } from '#runtime/util/i18n';
	import { ApplicationShell } from "#runtime/svelte/component/application";
	import { get, writable } from "svelte/store";
	import PropertyPathInput from "../../components/PropertyPathInput.svelte";
	import StringListEditor from "../string-list-editor/string-list-editor.js";

	const { application } = getContext('#external');

	let form;

	export let data;
	export let elementRoot;

	const merchantColumns = writable(data);

	function addColumn() {
		merchantColumns.update(value => {
			value.push({
				label: "",
				path: "",
				formatting: "{#}",
				mapping: {},
				buying: true,
				selling: true
			});
			return value;
		});
	}

	function removeColumn(index) {
		merchantColumns.update(value => {
			value.splice(index, 1)
			return value;
		})
	}

	async function showMappingEditor(index) {
		const data = get(merchantColumns)[index];
		return StringListEditor.show(
			Object.entries(data.mapping),
			{
				id: `merchant-columns-mapping-editor-${data.path}`,
				title: localize("ITEM-PILES.Applications.MerchantColumnsEditor.MappingTitle", { label: data.label }),
				content: localize("ITEM-PILES.Applications.MerchantColumnsEditor.MappingContent"),
				keyValuePair: true,
			}
		).then((result) => {
			merchantColumns.update(value => {
				value[index].mapping = Object.fromEntries(result);
				return value;
			})
		});
	}

	async function updateSettings() {
		application.options.resolve(get(merchantColumns));
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<form autocomplete=off bind:this={form} on:submit|preventDefault={updateSettings}>

		<p style="text-align: center;">
			{localize("ITEM-PILES.Applications.MerchantColumnsEditor.Explanation")}
		</p>

		<div class="form-group item-pile-column-grid item-piles-top-divider">
			<div class="item-piles-grid-row-wrapper">
				<div style="text-align: left;">
					<span>{localize("ITEM-PILES.Applications.MerchantColumnsEditor.Label")}</span>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Applications.MerchantColumnsEditor.PropertyPath")}</span>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Applications.MerchantColumnsEditor.Formatting")}</span>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Applications.MerchantColumnsEditor.Buying")}</span>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Applications.MerchantColumnsEditor.Selling")}</span>
				</div>
				<div class="item-piles-flexcol"></div>
				<a on:click={() => addColumn()} style="margin-right: 0.5rem;">
					<i class="fas fa-plus"></i>
				</a>
			</div>

			{#each $merchantColumns as column, index}
				<div class="item-piles-grid-row-wrapper">
					<div>
						<input type="text" bind:value={column.label} required/>
					</div>
					<div>
						<PropertyPathInput bind:value={column.path} templateType="Item" required/>
					</div>
					<div>
						<input type="text" bind:value={column.formatting} required/>
					</div>
					<div>
						<input type="checkbox" bind:checked={column.buying}/>
					</div>
					<div>
						<input type="checkbox" bind:checked={column.selling}/>
					</div>
					<div>
						<button type="button" on:click={() => showMappingEditor(index)} disabled={!column.label || !column.path}>
							{localize("ITEM-PILES.Applications.MerchantColumnsEditor.ConfigureMapping")}
						</button>
					</div>
					<a on:click={() => removeColumn(index)} class="item-piles-clickable-red"
					   style="margin-right: 0.5rem; text-align: center;">
						<i class="fas fa-times"></i>
					</a>
				</div>
			{/each}
		</div>

		<footer class="item-piles-top-divider">
			<button on:click={requestSubmit} type="button">
				<i class="far fa-save"></i> { localize("Save") }
			</button>
			<button on:click|once={() => { application.close(); }} type="button">
				<i class="far fa-times"></i> { localize("Cancel") }
			</button>
		</footer>

	</form>

</ApplicationShell>


<style lang="scss">

  .item-pile-column-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 0.5fr 50px 50px 1fr auto;
    gap: 4px;

    select {
      width: 100%;
    }

    .item-piles-grid-row-wrapper {
      display: contents;
      border-bottom: 1px solid rgba(0, 0, 0, 0.5);

      & > div {
        display: flex;
        justify-content: center;
      }

      button {
        line-height: 1.3rem;
      }
    }

    .item-piles-grid-row-wrapper:first-of-type {
      & > div {
        display: block;
        margin-bottom: 0.25rem;
        text-align: center;

        > div {
          font-size: 0.75rem;
        }
      }
    }
  }

</style>
