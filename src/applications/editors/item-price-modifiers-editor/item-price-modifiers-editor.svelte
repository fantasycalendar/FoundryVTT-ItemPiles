<script>
	import { getContext } from 'svelte';
	import { localize } from '#runtime/util/i18n';
	import SliderInput from "../../components/SliderInput.svelte";
	import { ApplicationShell } from "#runtime/svelte/component/application";
	import { get, writable } from "svelte/store";
	import * as Utilities from "../../../helpers/utilities.js";
	import * as CompendiumUtilities from "../../../helpers/compendium-utilities.js";

	const { application } = getContext('#external');

	let form;

	export let data = [];
	export let elementRoot;

	function getStoredItem(priceData) {
		if (priceData.uuid) {
			const uuidItem = foundry.utils.fromUuidSync(priceData.uuid);
			if (uuidItem) {
				return uuidItem;
			}
		}

		const itemData = priceData.itemData ?? priceData.item;
		if (!itemData) {
			return false;
		}

		return new Item.implementation(foundry.utils.deepClone(itemData));
	}

	function hydrateModifier(priceData) {
		const item = getStoredItem(priceData);

		if (!item) {
			return false;
		}

		return {
			override: false,
			buyPriceModifier: 1,
			sellPriceModifier: 0.5,
			...foundry.utils.deepClone(priceData),
			itemData: item.toObject(),
			item
		};
	}

	const itemPriceModifiers = writable(data.map(hydrateModifier).filter(Boolean));

	function remove(index) {
		itemPriceModifiers.update(val => {
			val.splice(index, 1)
			return val;
		})
	}

	async function updateSettings() {
		const result = get(itemPriceModifiers).map(priceData => {
			const data = foundry.utils.deepClone(priceData);
			data.itemData = priceData.item.toObject();
			delete data.item;
			return data;
		});
		application.options.resolve?.(result);
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}

	async function dropData(event) {

		event.preventDefault();

		let data;
		try {
			data = JSON.parse(event.dataTransfer.getData('text/plain'));
		} catch (err) {
			return false;
		}

		if (data.type !== "Item") return;

		const item = await Item.implementation.fromDropData(data);

		if (!item) return;

		const itemData = item.toObject();
		const uuid = item.pack ? item.uuid : (await CompendiumUtilities.findOrCreateItemInCompendium(itemData)).uuid;

		itemPriceModifiers.update(val => {

			const existingIndex = val.findIndex(existingPriceData => {
				return Utilities.areItemsSimilar(existingPriceData.itemData, itemData);
			});

			if (existingIndex !== -1) {
				val[existingIndex].uuid = uuid;
				val[existingIndex].itemData = itemData;
				val[existingIndex].item = item;
				return val;
			}

			val.push({
				override: false,
				item,
				itemData,
				uuid,
				buyPriceModifier: 1,
				sellPriceModifier: 0.5
			});

			return val;

		})
	}

	async function editItem(priceData) {
		let item = priceData.uuid ? await foundry.utils.fromUuid(priceData.uuid) : false;
		if (!item) {
			item = new Item.implementation(foundry.utils.deepClone(priceData.itemData));
		}
		item.sheet.render(true);
	}

	function preventDefault(event) {
		event.preventDefault();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<form autocomplete=off bind:this={form} on:submit|preventDefault={updateSettings}>

		<p>{localize("ITEM-PILES.Applications.ItemPriceModifiersEditor.Explanation")}</p>

		<div class:border-highlight={!$itemPriceModifiers.length} on:dragover={preventDefault} on:dragstart={preventDefault}
		     on:drop={dropData}>

			{#if $itemPriceModifiers.length}
				<table>
					<tr>
						<th style="width:5%;">{localize("ITEM-PILES.Applications.ItemPriceModifiersEditor.Override")}</th>
						<th style="width:25%;">{localize("ITEM-PILES.Applications.ItemPriceModifiersEditor.Item")}</th>
						<th style="width:35%;">{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.BuyPriceModifier")}</th>
						<th style="width:35%;">{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}</th>
						<th style="width:5%;"></th>
					</tr>
					{#each $itemPriceModifiers as priceData, index (index)}
						<tr>
							<td>
								<div class="form-group">
									<input type="checkbox" bind:checked={priceData.override}>
								</div>
							</td>
							<td>
								<a class="item-piles-actor-name-clickable"
								   on:click={() => editItem(priceData)}>{priceData.item.name}</a>
							</td>
							<td>
								<div class="item-piles-flexrow" style="margin: 0 0.25rem">
									<SliderInput bind:value={priceData.buyPriceModifier}/>
								</div>
							</td>
							<td>
								<div class="item-piles-flexrow" style="margin: 0 0.25rem">
									<SliderInput bind:value={priceData.sellPriceModifier}/>
								</div>
							</td>
							<td class="small">
								<button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
							</td>
						</tr>
					{/each}
				</table>
			{/if}

			<p class="item-piles-text-center">{localize("ITEM-PILES.Applications.ItemPriceModifiersEditor.DragDrop")}</p>

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

  .border-highlight {
    padding: 1rem;
    margin: 0.25rem;
    border-radius: 10px;
    border: 2px dashed gray;
  }

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
