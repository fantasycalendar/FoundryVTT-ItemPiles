<script>
	import { getContext } from 'svelte';
	import { localize } from '#runtime/util/i18n';
	import { ApplicationShell } from "#runtime/svelte/component/application";
	import { getSetting } from "../../../helpers/helpers.js";
	import * as Helpers from "../../../helpers/helpers.js";
	import { validateCurrencyHolders } from "../../../helpers/pile-utilities.js";
	import SETTINGS from "../../../constants/settings.js";
	import PropertyPathInput from "../../components/PropertyPathInput.svelte";
	import DropZone from "../../components/DropZone.svelte";

	const { application } = getContext('#external');

	export let data;
	export let elementRoot;

	const L = (key) => localize(`ITEM-PILES.Applications.CurrencyHoldersEditor.${key}`);
	const OPTIONS = ["deleteWhenEmpty", "hidden", "ignoreInItemPiles", "includeContents"];

	const currencyChoices = getSetting(SETTINGS.CURRENCIES).concat(getSetting(SETTINGS.SECONDARY_CURRENCIES))
		.filter(currency => currency.type === "attribute" && currency.data?.path)
		.map(currency => ({ path: currency.data.path, name: localize(currency.name) }));

	function toForm(holderType) {
		const { id, name, filter, currencies, receive, createItem, priority, ...rest } = holderType;
		return {
			id,
			name: name ?? "",
			filter: (filter ?? []).map(entry => ({
				path: entry.path,
				filters: Array.isArray(entry.filters) ? entry.filters.join(", ") : entry.filters
			})),
			currencies: Object.entries(currencies ?? {}).map(([currency, entry]) => ({
				currency,
				path: entry.path ?? "",
				exclusive: !!entry.exclusive,
				receive: !!receive?.includes(currency)
			})),
			createItem: createItem ?? null,
			priority: priority ?? 0,
			...Object.fromEntries(OPTIONS.map(option => [option, !!rest[option]]))
		};
	}

	function fromForm(form) {
		const holderType = {
			id: form.id,
			filter: form.filter.map(entry => ({ path: entry.path.trim(), filters: entry.filters })),
			currencies: Object.fromEntries(form.currencies.map(row => {
				return [row.currency, row.exclusive ? { path: row.path.trim(), exclusive: true } : { path: row.path.trim() }];
			}))
		};
		if (form.name.trim()) holderType.name = form.name.trim();
		const receive = form.currencies.filter(row => row.receive).map(row => row.currency);
		if (receive.length) holderType.receive = receive;
		if (form.createItem) holderType.createItem = form.createItem;
		for (const option of OPTIONS) {
			if (form[option]) holderType[option] = true;
		}
		if (Number(form.priority)) holderType.priority = Number(form.priority);
		return holderType;
	}

	let holderTypes = foundry.utils.deepClone(data || getSetting(SETTINGS.CURRENCY_HOLDERS) || []).map(toForm);
	let errors = [];

	function addHolderType() {
		holderTypes = [...holderTypes, toForm({ id: foundry.utils.randomID(), filter: [], currencies: {} })];
	}

	function removeHolderType(index) {
		holderTypes.splice(index, 1);
		holderTypes = holderTypes;
	}

	function addFilter(holderType) {
		holderType.filter = [...holderType.filter, { path: "", filters: "" }];
		holderTypes = holderTypes;
	}

	function removeFilter(holderType, index) {
		holderType.filter.splice(index, 1);
		holderTypes = holderTypes;
	}

	function addCurrency(holderType) {
		const used = new Set(holderType.currencies.map(row => row.currency));
		const currency = currencyChoices.find(choice => !used.has(choice.path))?.path ?? "";
		holderType.currencies = [...holderType.currencies, { currency, path: "", exclusive: false, receive: false }];
		holderTypes = holderTypes;
	}

	function removeCurrency(holderType, index) {
		holderType.currencies.splice(index, 1);
		holderTypes = holderTypes;
	}

	function choicesFor(row) {
		if (!row.currency || currencyChoices.some(choice => choice.path === row.currency)) return currencyChoices;
		return [...currencyChoices, { path: row.currency, name: row.currency }];
	}

	async function dropItem(holderType, dropData) {
		if (dropData?.type !== "Item") {
			Helpers.custom_warning(L("DropItem"), true);
			return;
		}
		const item = await foundry.utils.fromUuid(dropData.uuid);
		if (!item) return;
		const itemData = item.toObject();
		for (const key of ["_id", "folder", "sort", "ownership", "_stats"]) {
			delete itemData[key];
		}
		holderType.createItem = itemData;
		holderTypes = holderTypes;
	}

	function clearItem(holderType) {
		holderType.createItem = null;
		holderTypes = holderTypes;
	}

	function save() {
		const result = holderTypes.map(fromForm);
		errors = validateCurrencyHolders(result);
		if (errors.length) return;
		application.options.resolve(result);
		application.close();
	}
</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<form autocomplete=off on:submit|preventDefault={save} class="item-piles-currency-holders-editor">

		<p>{L("Explanation")}</p>

		{#each holderTypes as holderType, index (holderType.id)}
			<fieldset class="item-piles-holder-type">
				<div class="item-piles-flexrow item-piles-holder-header">
					<input type="text" name="name" placeholder={L("Name")} bind:value={holderType.name}/>
					<button type="button" class="item-piles-holder-remove" data-action="delete-holder"
					        on:click={() => removeHolderType(index)}>
						<i class="fas fa-trash"></i>
					</button>
				</div>

				<h4 data-tooltip={L("MatchingItemsHint")}>{L("MatchingItems")}</h4>
				<table>
					<tr>
						<th>{localize("ITEM-PILES.Applications.FilterEditor.Path")}</th>
						<th>{localize("ITEM-PILES.Applications.FilterEditor.Filters")}</th>
						<th class="custom-small">
							<a class="item-piles-clickable" data-action="add-filter" on:click={() => addFilter(holderType)}>
								<i class="fas fa-plus"></i>
							</a>
						</th>
					</tr>
					{#each holderType.filter as entry, filterIndex (filterIndex)}
						<tr class="item-piles-holder-filter">
							<td><PropertyPathInput name="path" placeholder="type" templateType="Item" bind:value={entry.path}/></td>
							<td><input type="text" name="filters" placeholder="loot, container" bind:value={entry.filters}/></td>
							<td class="custom-small">
								<button type="button" on:click={() => removeFilter(holderType, filterIndex)}><i class="fas fa-times"></i></button>
							</td>
						</tr>
					{/each}
				</table>

				<h4>{L("Currencies")}</h4>
				<table>
					<tr>
						<th>{L("Currency")}</th>
						<th>{L("ItemPath")}</th>
						<th class="custom-check" data-tooltip={L("OnlyOnHoldersHint")}>{L("OnlyOnHolders")}</th>
						<th class="custom-check" data-tooltip={L("ReceivesIncomeHint")}>{L("ReceivesIncome")}</th>
						<th class="custom-small">
							<a class="item-piles-clickable" data-action="add-currency" on:click={() => addCurrency(holderType)}>
								<i class="fas fa-plus"></i>
							</a>
						</th>
					</tr>
					{#each holderType.currencies as row, currencyIndex (currencyIndex)}
						<tr class="item-piles-holder-currency">
							<td>
								<select name="currency" bind:value={row.currency}>
									{#each choicesFor(row) as choice (choice.path)}
										<option value={choice.path}>{choice.name}</option>
									{/each}
								</select>
							</td>
							<td><PropertyPathInput name="path" placeholder="system.currency.gp" templateType="Item" bind:value={row.path}/></td>
							<td class="custom-check"><input type="checkbox" name="exclusive" bind:checked={row.exclusive}/></td>
							<td class="custom-check"><input type="checkbox" name="receive" bind:checked={row.receive}/></td>
							<td class="custom-small">
								<button type="button" on:click={() => removeCurrency(holderType, currencyIndex)}><i class="fas fa-times"></i></button>
							</td>
						</tr>
					{/each}
				</table>

				<h4 data-tooltip={L("NewHolderItemHint")}>{L("NewHolderItem")}</h4>
				<DropZone class="item-piles-holder-item" callback={(dropData) => dropItem(holderType, dropData)}>
					{#if holderType.createItem}
						<div class="item-piles-flexrow item-piles-holder-item-row">
							<img class="item-piles-img" src={holderType.createItem.img}/>
							<span>{holderType.createItem.name}</span>
							<button type="button" on:click={() => clearItem(holderType)}><i class="fas fa-times"></i></button>
						</div>
					{:else}
						<p class="item-piles-holder-drop">{L("DropItem")}</p>
					{/if}
				</DropZone>

				<div class="item-piles-holder-options">
					<label><input type="checkbox" name="deleteWhenEmpty" bind:checked={holderType.deleteWhenEmpty}/>
						{L("DeleteWhenEmpty")}</label>
					<label data-tooltip={L("TreatAsMoneyHint")}><input type="checkbox" name="hidden" bind:checked={holderType.hidden}/>
						{L("TreatAsMoney")}</label>
					<label data-tooltip={L("IgnoreInItemPilesHint")}>
						<input type="checkbox" name="ignoreInItemPiles" bind:checked={holderType.ignoreInItemPiles}/>
						{L("IgnoreInItemPiles")}</label>
					<label><input type="checkbox" name="includeContents" bind:checked={holderType.includeContents}/>
						{L("IncludeContents")}</label>
					<label data-tooltip={L("PriorityHint")}>{L("Priority")}
						<input type="number" name="priority" bind:value={holderType.priority}/></label>
				</div>
			</fieldset>
		{:else}
			<p class="item-piles-holder-none">{L("NoHolderTypes")}</p>
		{/each}

		{#if errors.length}
			<ul class="item-piles-holder-errors">
				{#each errors as error}
					<li>{error}</li>
				{/each}
			</ul>
		{/if}

		<footer>
			<button type="button" data-action="add-holder" on:click={addHolderType}>
				<i class="fas fa-plus"></i> {L("AddHolderType")}
			</button>
			<button type="button" data-action="save" on:click={save}>
				<i class="far fa-save"></i> {localize("Save")}
			</button>
			<button type="button" on:click|once={() => { application.close(); }}>
				<i class="far fa-times"></i> {localize("Cancel")}
			</button>
		</footer>

	</form>

</ApplicationShell>

<style lang="scss">

  .item-piles-holder-type {
    margin-bottom: 0.5rem;

    h4 {
      margin: 0.5rem 0 0.25rem;
    }

    table {
      vertical-align: middle;
      margin: 0;
    }

    .custom-small {
      width: 26px;
    }

    .custom-check {
      width: 70px;
      text-align: center;
    }

    button {
      padding: 0.25rem;
      line-height: 1rem;
      flex: 0 0 auto;
      width: auto;
    }
  }

  .item-piles-holder-header {
    gap: 0.5rem;
  }

  :global(.item-piles-holder-item) {
    border: 1px dashed rgba(0, 0, 0, 0.35);
    border-radius: 4px;
    padding: 0.25rem;
    min-height: 2rem;
  }

  .item-piles-holder-item-row {
    align-items: center;
    gap: 0.5rem;

    img {
      flex: 0 0 28px;
      height: 28px;
    }
  }

  .item-piles-holder-drop {
    margin: 0.25rem;
    text-align: center;
    opacity: 0.7;
  }

  .item-piles-holder-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin-top: 0.5rem;

    label {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    input[type=number] {
      width: 4rem;
    }
  }

  .item-piles-holder-errors {
    color: #d93131;
  }

</style>
