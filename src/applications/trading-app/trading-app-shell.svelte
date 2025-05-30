<script>

	import { fade } from 'svelte/transition';
	import { localize } from "#runtime/util/i18n";
	import DropZone from "../components/DropZone.svelte";
	import { ApplicationShell } from "#runtime/svelte/component/application";
	import * as Helpers from "../../helpers/helpers.js";
	import * as PileUtilities from "../../helpers/pile-utilities.js";
	import ItemPileSocket from "../../socket.js";
	import TradeEntry from "./TradeEntry.svelte";
	import DropCurrencyDialog from "../dialogs/drop-currency-dialog/drop-currency-dialog.js";
	import * as Utilities from "../../helpers/utilities.js";

	export let elementRoot;
	export let store;

	const leftItems = store.leftTraderItems;
	const leftCurrencies = store.leftTraderCurrencies;
	const leftItemCurrencies = store.leftTraderItemCurrencies;
	const leftTraderAccepted = store.leftTraderAccepted;

	const rightItems = store.rightTraderItems;
	const rightCurrencies = store.rightTraderCurrencies;
	const rightItemCurrencies = store.rightTraderItemCurrencies;
	const rightTraderAccepted = store.rightTraderAccepted;

	let isGM = game.user.isGM;
	let systemHasCurrencies = game.itempiles.API.CURRENCIES.length > 0;

	async function dropItem(data) {

		if (data.type !== "Item") return;

		let item = (await Item.implementation.fromDropData(data)).toObject();

		data.actorId = Utilities.getSourceActorFromDropData(data)?.id;

		if (!data.actorId && !game.user.isGM) {
			return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
		}

		if (!game.user.isGM && data.actorId && data.actorId !== store.leftTraderActor.id) {
			throw Helpers.custom_error(`You cannot drop items into the trade UI from a different actor than ${store.leftTraderActor.name}!`)
		}

		const validItem = await PileUtilities.checkItemType(store.rightTraderActor, item, {
			errorText: "ITEM-PILES.Errors.DisallowedItemTrade",
			warningTitle: "ITEM-PILES.Dialogs.TypeWarning.Title",
			warningContent: "ITEM-PILES.Dialogs.TypeWarning.TradeContent"
		});
		if (!validItem) return;

		const actorItemCurrencyList = PileUtilities.getCurrencyList(store.leftTraderActor).filter(entry => entry.type !== "attribute");
		const isCurrency = !!Utilities.findSimilarItem(actorItemCurrencyList.map(item => item.data), validItem);

		if (!validItem._id) {
			validItem._id = item._id;
		}

		const itemToSend = new Item.implementation(validItem);

		return store.addItem(itemToSend, { uuid: data.uuid, quantity: 1, currency: isCurrency });

	}

	if (store.isUserParticipant) {
		const itemsUpdatedDebounce = debounce(async (items) => {
			await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_UPDATE_ITEMS, [store.leftTraderUser.id, store.rightTraderUser.id], store.privateTradeId, game.user.id, items);
			return executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_UPDATE_ITEMS, store.publicTradeId, game.user.id, items);
		}, 20)
		leftItems.subscribe(itemsUpdatedDebounce)

		const itemCurrenciesUpdatedDebounce = debounce(async (items) => {
			await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_UPDATE_ITEM_CURRENCIES, [store.leftTraderUser.id, store.rightTraderUser.id], store.privateTradeId, game.user.id, items);
			return executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_UPDATE_ITEM_CURRENCIES, store.publicTradeId, game.user.id, items);
		}, 20)
		leftItemCurrencies.subscribe(itemCurrenciesUpdatedDebounce)

		const attributesUpdatedDebounce = debounce(async (attributes) => {
			await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_UPDATE_CURRENCIES, [store.leftTraderUser.id, store.rightTraderUser.id], store.privateTradeId, game.user.id, attributes);
			return executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_UPDATE_CURRENCIES, store.publicTradeId, game.user.id, attributes);
		}, 40)
		leftCurrencies.subscribe(attributesUpdatedDebounce)

		const acceptedDebounce = debounce(async (acceptedState) => {
			await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_STATE, [store.leftTraderUser.id, store.rightTraderUser.id], store.privateTradeId, game.user.id, acceptedState);
			return executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_STATE, store.publicTradeId, game.user.id, acceptedState);
		}, 10)
		leftTraderAccepted.subscribe(acceptedDebounce)
	}

	async function executeSocketAction(socketHandler, ...args) {
		if (store.isPrivate) {
			return ItemPileSocket.executeForUsers(socketHandler, [store.leftTraderUser.id, store.rightTraderUser.id], ...args);
		}
		return ItemPileSocket.executeForEveryone(socketHandler, ...args);
	}

	async function addCurrency(asGM = false) {

		const currenciesToAdd = await DropCurrencyDialog.show(
			store.leftTraderActor,
			store.rightTraderActor,
			{
				existingCurrencies: store.getExistingCurrencies(),
				title: game.i18n.localize("ITEM-PILES.Trade.AddCurrency.Title"),
				content: game.i18n.format("ITEM-PILES.Trade.AddCurrency.Content", { trader_actor_name: store.rightTraderActor.name }),
				button: game.i18n.localize("ITEM-PILES.Trade.AddCurrency.Label"),
				unlimitedCurrencies: asGM
			}
		);

		if (!currenciesToAdd || (foundry.utils.isEmpty(currenciesToAdd.attributes) && !currenciesToAdd.items.length)) return;

		currenciesToAdd.items.forEach(item => {
			const itemData = store.leftTraderActor.items.get(item.item._id).toObject();
			store.addItem(itemData, { quantity: item.quantity, currency: true })
		});

		const currencies = PileUtilities.getActorCurrencies(store.leftTraderActor, { getAll: asGM })
			.filter(currency => currency.type === "attribute");

		Object.entries(currenciesToAdd.attributes).forEach(([path, quantity]) => {
			const currency = currencies.find(currency => currency.path === path);
			store.addAttribute({
				path: path,
				quantity: quantity,
				newQuantity: quantity,
				name: currency.name,
				img: currency.img,
				maxQuantity: !game.user.isGM ? currency.quantity : Infinity,
				index: currency.index
			});
		});
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	{#if $leftTraderAccepted && $rightTraderAccepted}
		<div class="lds-ellipsis" transition:fade>
			<div></div>
			<div></div>
			<div></div>
			<div></div>
		</div>
	{/if}

	<DropZone callback={dropItem}>

		<div class="item-piles-flexcol">

			<div class="item-piles-flexrow">

				<div class="col item-piles-flexcol">

					<div class="item-piles-character-header item-piles-bottom-divider">
						<img src="{store.leftTraderActor.img}">
						<h2 class="item-piles-character-name">
							<div>{store.leftTraderActor.name}</div>
						</h2>
						<div>
							<i
								class="fas accepted-icon"
								class:accepted={$leftTraderAccepted}
								class:fa-user-check={$leftTraderAccepted}
								class:fa-user-times={!$leftTraderAccepted}
							></i>
						</div>
					</div>

					<div class="item-piles-flexcol">

						<div class="row item-piles-items-list">

							{#if !$leftItems.length && store.isUserParticipant}
								<div class="item-piles-flexcol">
									<h3 class="item-piles-text-center">{localize("ITEM-PILES.Trade.DragDrop")}</h3>
								</div>
							{/if}

							{#each $leftItems as item (item.id)}
								<TradeEntry bind:data={item} {store} editable={store.isUserParticipant}/>
							{/each}

						</div>

						{#if systemHasCurrencies}

							<div class="row item-piles-items-list item-piles-currency-list"
							     class:item-piles-top-divider={$leftCurrencies.length || $leftItemCurrencies.length}>

								{#if store.isUserParticipant}
									<div class="item-piles-flexrow">
										{#if isGM}
											<a on:click={() => { addCurrency(true) }}
											   class="item-piles-text-right item-piles-small-text item-piles-middle item-piles-gm-add-currency">
												<i class="fas fa-plus"></i>
												{localize("ITEM-PILES.Trade.GMAddCurrency")}
											</a>
										{/if}
										<a on:click={() => { addCurrency() }}
										   class="item-piles-text-right item-piles-small-text item-piles-middle item-piles-add-currency">
											<i class="fas fa-plus"></i>
											{localize("ITEM-PILES.Inspect.AddCurrency")}
										</a>
									</div>
								{/if}

								{#each $leftCurrencies as currency (currency.path)}
									<TradeEntry bind:data={currency} {store} editable={store.isUserParticipant}/>
								{/each}

								{#each $leftItemCurrencies as item (item.id)}
									<TradeEntry bind:data={item} {store} editable={store.isUserParticipant}/>
								{/each}

							</div>

						{/if}

					</div>

					{#if store.isUserParticipant}

						<button type="button" style="flex:0 1 auto; margin-top: 0.25rem;"
						        on:click={() => { store.toggleAccepted(store.leftTraderUser.id) }}>
							{#if $leftTraderAccepted}
								<i class="fas fa-times"></i>
								{localize("Cancel")}
							{:else}
								<i class="fas fa-check"></i>
								{localize("ITEM-PILES.Trade.Accept")}
							{/if}
						</button>

					{/if}

				</div>

				<div class="col item-piles-flexcol">

					<div class="item-piles-character-header trader item-piles-bottom-divider">
						<div>
							<i
								class="fas accepted-icon"
								class:accepted={$rightTraderAccepted}
								class:fa-user-check={$rightTraderAccepted}
								class:fa-user-times={!$rightTraderAccepted}
							></i>
						</div>
						<h2 class="item-piles-character-name">
							{store.rightTraderActor.name}
						</h2>
						<img src="{store.rightTraderActor.img}">
					</div>

					<div class="item-piles-flexcol">

						<div class="row item-piles-items-list">

							{#each $rightItems as item (item.id)}
								<TradeEntry bind:data={item} {store} editable={false}/>
							{/each}

						</div>

						{#if systemHasCurrencies}

							<div class="row item-piles-items-list item-piles-currency-list"
							     class:item-piles-top-divider={$rightCurrencies.length || $rightItemCurrencies.length}>

								{#each $rightCurrencies as currency (currency.path)}
									<TradeEntry bind:data={currency} {store} editable={false}/>
								{/each}

								{#each $rightItemCurrencies as item (item.id)}
									<TradeEntry bind:data={item} {store} editable={false}/>
								{/each}

							</div>

						{/if}

					</div>

				</div>
			</div>

		</div>

	</DropZone>

</ApplicationShell>


<style lang="scss">

  .col {
    flex-direction: column;
    margin: 0 5px;
  }

  .col:not(:last-child) {
    padding-right: 10px;
    border-right: 1px solid rgba(0, 0, 0, 0.35);
  }

  .row {
    flex: 1;
  }

  .row:last-child {
    flex: 0 1 auto;
  }

  .trader {

  }

  .lds-ellipsis {
    position: absolute;
    left: calc(50% - 38px);
    top: calc(50% - 40px);
    display: inline-block;
    width: 80px;
    height: 80px;
  }

  .lds-ellipsis div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #435068;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }

  .lds-ellipsis div:nth-child(1) {
    left: 8px;
    animation: lds-ellipsis1 0.6s infinite;
  }

  .lds-ellipsis div:nth-child(2) {
    left: 8px;
    animation: lds-ellipsis2 0.6s infinite;
  }

  .lds-ellipsis div:nth-child(3) {
    left: 32px;
    animation: lds-ellipsis2 0.6s infinite;
  }

  .lds-ellipsis div:nth-child(4) {
    left: 56px;
    animation: lds-ellipsis3 0.6s infinite;
  }

  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }

  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }


</style>
