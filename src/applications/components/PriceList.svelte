<script>
	import { localize } from '#runtime/util/i18n';
	import FilePicker from "./FilePicker.svelte";
	import { flip } from "svelte/animate";
	import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
	import DropZone from "./DropZone.svelte";
	import * as Helpers from "../../helpers/helpers.js";
	import { getSetting } from "../../helpers/helpers.js";
	import * as Utilities from "../../helpers/utilities.js";
	import SETTINGS from "../../constants/settings.js";
	import * as CompendiumUtilities from "../../helpers/compendium-utilities.js";

	export let prices;
	export let parentFlags = {};
	export let remove = false;
	export let presets = true;
	export let options = {
		showFixed: true,
		showPercent: true,
	};

	let currencies = getSetting(SETTINGS.CURRENCIES);
	let secondaryCurrencies = getSetting(SETTINGS.SECONDARY_CURRENCIES);
	if (parentFlags.overrideCurrencies?.length) {
		currencies = parentFlags.overrideCurrencies;
	}
	if (parentFlags.overrideSecondaryCurrencies?.length) {
		secondaryCurrencies = parentFlags.overrideSecondaryCurrencies;
	}

	let presetPrices = currencies
		.concat(secondaryCurrencies)
		.map(currency => {
			return {
				id: foundry.utils.randomID(),
				quantity: 1,
				fixed: true,
				percent: false,
				...currency,
			}
		})
		.concat(getSetting(SETTINGS.PRICE_PRESETS));

	let isHovering = false;
	let flipDurationMs = 200;
	let dragDisabled = true;
	let selectedPreset = "";

	function removeEntry(index) {
		prices.splice(index, 1);
		prices = prices;
	}

	function addAttribute() {
		prices = [...prices, {
			id: foundry.utils.randomID(),
			type: "attribute",
			name: "New Attribute",
			img: "",
			abbreviation: "{#}N",
			data: {
				path: ""
			},
			quantity: 1,
			fixed: true,
			percent: false
		}];
	}

	function addPreset(index) {
		const preset = foundry.utils.duplicate(presetPrices[index]);
		preset.id = foundry.utils.randomID();
		prices = [...prices, preset];
	}

	async function dropData(data) {

		if (!data.type) {
			throw Helpers.custom_error("Something went wrong when dropping this item!")
		}

		if (data.type !== "Item") {
			throw Helpers.custom_error("You must drop an item, not " + data.type.toLowerCase() + "!")
		}

		let uuid = false;
		if (data.pack) {
			uuid = "Compendium" + data.pack + "." + data.id;
		}

		let item = await Item.implementation.fromDropData(data);
		let itemData = item.toObject();

		if (!itemData) {
			console.error(data);
			throw Helpers.custom_error("Something went wrong when dropping this item!")
		}

		const itemCurrencies = prices.map(entry => entry.data?.item ?? {});
		const foundItem = Utilities.findSimilarItem(itemCurrencies, itemData);

		if (!uuid) {
			uuid = (await CompendiumUtilities.findOrCreateItemInCompendium(itemData)).uuid;
		}

		if (foundItem) {
			const index = itemCurrencies.indexOf(foundItem);
			prices[index].data = {
				uuid,
			}
			Helpers.custom_notify(`Updated item data for ${localize(prices[index].name)} (item name ${itemData.name})`)
		} else {
			prices = [...prices, {
				id: foundry.utils.randomID(),
				type: "item",
				name: itemData.name,
				img: itemData.img,
				abbreviation: "{#} " + itemData.name,
				data: {
					uuid,
				},
				quantity: 1,
				fixed: true,
				percent: false
			}];
		}
	}

	async function editItem(index) {
		const data = prices[index].data;
		let item = await fromUuid(data.uuid);
		item.sheet.render(true);
	}

	function handleConsider(e) {
		const { items: newItems, info: { source, trigger } } = e.detail;
		prices = newItems;
		// Ensure dragging is stopped on drag finish via keyboard
		if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
			dragDisabled = true;
		}
	}

	function handleFinalize(e) {
		const { items: newItems, info: { source } } = e.detail;
		prices = newItems;
		// Ensure dragging is stopped on drag finish via pointer (mouse, touch)
		if (source === SOURCES.POINTER) {
			dragDisabled = true;
		}
	}

	function startDrag(e) {
		// preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
		e.preventDefault();
		dragDisabled = false;
	}

	function handleKeyDown(e) {
		if ((e.key === "Enter" || e.key === " ") && dragDisabled) dragDisabled = false;
	}

	let columnStyle = `grid-template-columns: 28px 1.1fr ${options.showFixed ? "35px" : ""} ${options.showPercent ? "28px" : ""} 28px 0.5fr 60px 1fr 28px;`

</script>


<DropZone bind:isHovering={isHovering} callback={dropData}>
	<div class="table-container item-piles-top-divider">
		<div class="item-piles-sortable-list-columns header" style={columnStyle}>
			<div></div>
			<div>{localize("ITEM-PILES.General.Name")}</div>
			<div>{localize("ITEM-PILES.General.Cost")}</div>
			{#if options.showFixed}
				<div>{localize("ITEM-PILES.General.Fixed")}</div>
			{/if}
			{#if options.showPercent}
				<div>%</div>
			{/if}
			<div>{localize("ITEM-PILES.General.Short")}</div>
			<div>{localize("ITEM-PILES.General.Icon")}</div>
			<div>{localize("ITEM-PILES.General.Data")}</div>
			<div>
				{#if remove}
					<a class="item-piles-clickable-red" on:click={() => remove()}><i class="fas fa-times"></i></a>
				{/if}
			</div>
		</div>
		<section
			on:consider="{handleConsider}"
			on:finalize="{handleFinalize}"
			use:dndzone="{{ items: prices, dragDisabled, flipDurationMs }}"
		>
			{#if isHovering}
				<div class="drop-to-add">Drop to add</div>
			{/if}
			{#each prices as price, index (price.id)}
				<div class="item-piles-sortable-list-columns item-piles-sortable-list-entry item-piles-even-color"
				     animate:flip="{{ duration: flipDurationMs }}" style={columnStyle}>
					<div tabIndex={dragDisabled? 0 : -1}
					     aria-label="drag-handle"
					     style={dragDisabled ? 'cursor: grab' : 'cursor: grabbing'}
					     on:mousedown={startDrag}
					     on:touchstart={startDrag}
					     on:keydown={handleKeyDown}
					><i class="fas fa-bars"></i></div>
					<div><input type="text" bind:value={price.name}/></div>
					<div><input type="number" bind:value={price.quantity}/></div>
					{#if options.showFixed}
						<div><input type="checkbox" bind:checked={price.fixed} min="0"
						            max="{price.percent ? 100 : 1000000000000000}"/></div>
					{/if}
					{#if options.showPercent}
						<div><input type="checkbox" bind:checked={price.percent}/></div>
					{/if}
					<div><input type="text" bind:value={price.abbreviation}/></div>
					<div>
						<FilePicker type="imagevideo" showImage={true} showInput={false} bind:value={price.img}/>
					</div>
					<div>
						{#if price.type === "attribute"}
							<input type="text" bind:value={price.data.path} placeholder="system.attributes.hp.value"/>
						{:else}
							<button type="button" on:click={() => editItem(index)}>
								<i class="fas fa-eye"></i> View item
							</button>
						{/if}
					</div>
					<div>
						<button type="button" on:click={() => removeEntry(index)}><i class="fas fa-times"></i></button>
					</div>
				</div>
			{/each}
			<div class="item-piles-sortable-list-columns" style="margin-top: 0.5rem;">
				<div class="full-span">
					<a class:invisible={isHovering} on:click={() => addAttribute()}>
						{localize("ITEM-PILES.Applications.ItemEditor.PriceTab.DropMeClickMe")}
					</a>
				</div>
				{#if presetPrices.length && presets}
					<div class="full-span" style="margin-top:0.5rem;">
						<span
							style="margin-right:0.25rem;">{localize("ITEM-PILES.Applications.ItemEditor.PriceTab.PricePreset")}</span>
						<select class="price-preset-selector" bind:value={selectedPreset}
						        on:change={() => { addPreset(selectedPreset); selectedPreset = ""; }}>
							<option value="">{localize("ITEM-PILES.Applications.ItemEditor.PriceTab.SelectPreset")}</option>
							{#each presetPrices as price, index (index)}
								<option value={index}>{localize(price.name)}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</section>
	</div>
</DropZone>

<style lang="scss">

  .price-preset-selector {
    height: 20px;
    font-size: 0.8rem;
  }

  .item-piles-sortable-list-columns {
    min-height: 30px;
  }

  .item-piles-sortable-list-entry {
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .item-piles-even-color {
    &:nth-child(even) {
      background-color: #e5e5d6;
    }

    &:nth-child(odd) {
      background-color: #f8f8e7;
    }
  }

  .invisible {
    opacity: 0;
  }

  .table-container {
    position: relative;
  }

  .drop-to-add {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    border-radius: 5px;
    box-shadow: inset 0 0 15px 5px rgb(0, 0, 0, 0.5);
    background-color: rgba(255, 255, 255, 0.75);
    z-index: 100000;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    overflow: hidden;
  }

  .full-span {
    grid-column: 1/-1;
  }

</style>
