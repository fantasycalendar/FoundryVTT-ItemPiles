<script>
	import { getContext, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { localize } from '#runtime/svelte/helper';
	import { ApplicationShell } from '#runtime/svelte/component/core';

	import ItemList from "./ItemList.svelte";
	import CurrencyList from "./CurrencyList.svelte";
	import ActorPicker from "../components/ActorPicker.svelte";

	import * as SharingUtilities from "../../helpers/sharing-utilities.js";
	import * as PileUtilities from "../../helpers/pile-utilities.js";
	import PrivateAPI from "../../API/private-api.js";
	import ItemPileStore from "../../stores/item-pile-store.js";
	import CategorizedItemList from "./CategorizedItemList.svelte";
	import * as Helpers from "../../helpers/helpers.js";
	import { getSourceActorFromDropData } from "../../helpers/utilities.js";
	import { isItemValidBasedOnProperties } from "../../helpers/pile-utilities.js";

	const { application } = getContext('#external');

	export let elementRoot;
	export let actor;
	export let recipient;

	export let store = ItemPileStore.make(application, actor, recipient);

	// Stores
	let canBeSplit = false;
	let searchStore = store.search;
	let editQuantities = store.editQuantities;
	let pileData = store.pileData;
	let deleted = store.deleted;

	const items = store.allItems;
	const currencies = store.currencies;
	const numItems = store.numItems;
	const shareData = store.shareData;
	const numCurrencies = store.numCurrencies;

	$: isPileEmpty = $numItems === 0 && $numCurrencies === 0;
	$: hasItems = $numItems > 0;
	$: showSearchBar = $items.length >= 8;
	$: isContainer = PileUtilities.isItemPileContainer(actor, $pileData)
	$: {
		$shareData;
		$items;
		$currencies;
		canBeSplit = SharingUtilities.canItemPileBeSplit(actor);
	}

	let num_players = SharingUtilities.getPlayersForItemPile(actor).length;

	async function dropData(event) {

		event.preventDefault();

		let data;
		try {
			data = JSON.parse(event.dataTransfer.getData('text/plain'));
		} catch (err) {
			return false;
		}

		if (data.type === "Actor" && game.user.isGM) {
			const newRecipient = data.uuid ? (await fromUuid(data.uuid)) : game.actors.get(data.id);
			return store.updateRecipient(newRecipient)
		}

		if (data.type !== "Item") {
			Helpers.custom_warning(localize("ITEM-PILES.Warnings.DroppedIsNotItem", { type: data.type }), true)
			return false;
		}

		const item = await Item.implementation.fromDropData(data);
		const itemData = item.toObject();

		if (!itemData) {
			console.error(data);
			throw Helpers.custom_error("Something went wrong when dropping this item!")
		}

		if (!isItemValidBasedOnProperties(this.actor, itemData) && !game.user.isGM) {
			Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.VaultInvalidItemDropped"), true)
			return false;
		}

		const source = getSourceActorFromDropData(data);

		return PrivateAPI._dropItem({
			source: source,
			target: store.actor,
			itemData: {
				item: itemData, quantity: 1
			},
			skipCheck: true
		});

	}

	function preventDefaultGM(event) {
		if (game.user.isGM) return;
		event.preventDefault();
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	let itemListElement;
	let scrolled = false;

	function evaluateShadow() {
		scrolled = itemListElement.scrollTop > 20;
	}

	onDestroy(() => {
		store.onDestroy();
	});

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<main in:fade={{duration: 500}}>

		<div class="item-piles-item-drop-container" on:dragover={preventDefault} on:dragstart={preventDefaultGM}
		     on:drop={dropData}>

			{#if $deleted}
				<p style="text-align: center; flex: 0 1 auto;">
					{localize("ITEM-PILES.Inspect.Destroyed")}
				</p>
			{:else}

				<ActorPicker {store}/>

				{#if showSearchBar}
					<div class="form-group item-piles-flexrow item-piles-top-divider item-piles-bottom-divider"
					     style="margin-bottom: 0.5rem; align-items: center;" transition:fade={{duration: 250}}>
						<label style="flex:0 1 auto; margin-right: 5px;">Search:</label>
						<input type="text" bind:value={$searchStore}>
					</div>
				{/if}

				{#if isPileEmpty}
					<p class="item-piles-top-divider" style="text-align: center; flex: 0 1 auto;">
						{localize("ITEM-PILES.Inspect.Empty")}
					</p>

				{/if}

				<div class="item-piles-items-list" bind:this={itemListElement} on:scroll={evaluateShadow}>

					{#if scrolled}
						<div class="item-pile-shadow scroll-shadow-top" transition:fade={{duration:300}}></div>
						<div></div>
					{/if}

					{#if $pileData.displayItemTypes}
						<CategorizedItemList {store}/>
					{:else}
						<ItemList {store}/>
					{/if}

					{#if hasItems}
						<hr>
					{/if}

					<CurrencyList {store}/>

				</div>

			{/if}

			<footer class="sheet-footer item-piles-flexrow item-piles-top-divider">
				{#if editQuantities}
					<button type="button" on:click={() => { store.update() }}>
						<i class="fas fa-save"></i> {localize("ITEM-PILES.Applications.ItemPileConfig.Update")}
					</button>
				{/if}

				{#if $pileData.splitAllEnabled}
					<button type="button" on:click={() => { store.splitAll() }} disabled="{isPileEmpty || !canBeSplit}">
						<i class="fas fa-handshake"></i>
						{#if $pileData.shareItemsEnabled}
							{localize("ITEM-PILES.Inspect.SplitAll", { num_players })}
						{:else}
							{localize("ITEM-PILES.Inspect.SplitCurrencies", { num_players })}
						{/if}
					</button>
				{/if}

				{#if store.recipient && $pileData.takeAllEnabled}
					<button type="submit" on:click={() => { store.takeAll() }} disabled="{isPileEmpty}">
						<i class="fas fa-fist-raised"></i> {localize("ITEM-PILES.Inspect.TakeAll")}
					</button>
				{/if}

				{#if isContainer && !application.options.remote}
					<button type="submit" on:click={() => { store.closeContainer(); application.close(); }}>
						<i class="fas fa-box"></i> {localize("ITEM-PILES.Inspect.Close")}
					</button>
				{/if}

				<button on:click={() => { application.close() }} type="submit">
					<i class="fas fa-sign-out-alt"></i> {localize("ITEM-PILES.Inspect.Leave")}
				</button>
			</footer>

		</div>

	</main>

</ApplicationShell>

<style lang="scss">

  .item-piles-items-list {
    max-height: 500px;
    overflow-y: auto;
    display: block;
    padding-right: 5px;

    .item-pile-shadow {

      position: absolute;
      width: calc(100% - 1rem);
      height: 50px;
      z-index: 25;
      pointer-events: none;
      border-radius: 5px;

      &.scroll-shadow-top {
        box-shadow: inset 0px 22px 15px -14px rgba(0, 0, 0, 0.5);
      }

    }

    .item-piles-add-currency {
      margin-right: 5px;
      flex: 0 1 auto;
      vertical-align: middle;
    }

  }

  #item-piles-preview-container {

    position: absolute;
    display: inline-block;

    #item-piles-preview-image {
      border: 0;
      width: 300px;
      border-radius: 1rem;
      box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
    }
  }

  .hidden {
    display: none;
  }

  .item-piles-img-container {
    min-height: 25px;
    max-width: 25px;
    max-height: 25px;
    margin: 2px;
  }
</style>
