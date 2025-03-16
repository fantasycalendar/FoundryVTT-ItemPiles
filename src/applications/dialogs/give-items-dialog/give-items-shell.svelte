<script>
	import { getContext } from "svelte";
	import * as Utilities from "../../../helpers/utilities.js";
	import * as PileUtilities from "../../../helpers/pile-utilities.js";
	import { localize } from "#runtime/util/i18n";
	import SliderInput from "../../components/SliderInput.svelte";
	import Select from 'svelte-select';

	const { application } = getContext('#external');

	export let item;

	let form;

	const itemQuantity = Utilities.getItemQuantity(item);
	const sliderQuantity = itemQuantity + (application.options?.quantityAdjustment ?? 0);
	const canItemStack = PileUtilities.canItemStack(item);

	let quantity = 1;
	let secret = false;
	let selectedActor = localStorage.getItem("item-piles-give-item") ?? false;

	let items = Array.from(game.actors)
		.filter(actor => {
			return game.user.isGM || (actor.ownership["default"] >= 1 || actor.ownership[game.user.id] >= 1);
		})
		.concat(game.users.map(user => user.character).filter(Boolean))
		.filter(actor => actor !== item.parent)
		.filter((actor, index, self) => {
			return index === self.findIndex(a => a.uuid === actor.uuid)
		})
		.map(actor => ({
			value: actor.uuid,
			label: actor.name,
			actor,
			group: actor.hasPlayerOwner ? "Player Characters" : "Unassigned Characters"
		}))
		.sort((a, b) => {
			return (a.group >= b.group ? 100000 : -100000) + (a.label >= b.label ? 1 : -1);
		});

	if (selectedActor && !items.some(data => data.value === selectedActor)) {
		selectedActor = false;
	}

	const groupBy = (item) => item.group;

	function requestSubmit() {
		form.requestSubmit();
	}

	function submit() {
		localStorage.setItem("item-piles-give-item", selectedActor.value)
		application.options.resolve({ quantity, secret, target: selectedActor.value });
		application.close();
	}

</script>

<form autocomplete="off" bind:this={form} class="item-piles-flexcol" on:submit|once|preventDefault={submit}
      style="padding:0.5rem;">

	<h3 style="text-align: center;">
		{localize(`ITEM-PILES.Dialogs.GiveItems.Header`, {
			item_name: item.name
		})}
	</h3>

	{#if itemQuantity > 1 && canItemStack}
		<div class="form-group item-piles-text-center">
			<label>{localize(`ITEM-PILES.Dialogs.GiveItems.ContentMultipleQuantity`, {
				quantity: itemQuantity,
				itemName: item.name
			})}</label>
		</div>
		<SliderInput min={1} max={sliderQuantity} maxInput={sliderQuantity} divideBy={1} bind:value={quantity}/>
	{/if}

	<div class="form-group">
		<Select
			--background="rgba(0, 0, 0, 0.05)"
			--border-radius="5px"
			--font-family="inherit"
			--font-size="0.833rem"
			--group-item-padding-left="1rem"
			--group-title-font-size="0.833rem"
			--group-title-font-weight="bold"
			--height="calc(var(--form-field-height) + 1px)"
			--input-color="black"
			--item-padding="0.25rem"
			--margin="0.25rem 0"
			--padding="0 8px"
			--text-overflow="ellipsis"
			bind:value={selectedActor}
			floatingConfig={{ strategy: "fixed", placement: "bottom" }}
			{groupBy}
			{items}
			placeholder="{localize('ITEM-PILES.Dialogs.GiveItems.SelectPlaceholder')}"
		></Select>
	</div>

	<div class="form-group item-piles-flexrow">
		<input id="item-piles-give-item-secret" type="checkbox" bind:checked={secret}/>
		<label for="item-piles-give-item-secret">{localize("ITEM-PILES.Dialogs.GiveItems.Secret")}</label>
	</div>

	<footer class="sheet-footer item-piles-flexrow" style="margin-top: 0.25rem;">
		<button disabled={!selectedActor} on:click|once={requestSubmit} type="button">
			<i class="fas fa-box"></i>
			{localize(`ITEM-PILES.Dialogs.GiveItems.Submit`)}
		</button>
		<button on:click={() => { application.close() }} type="button">
			<i class="fas fa-times"></i>
			{localize("Cancel")}
		</button>
	</footer>

</form>
