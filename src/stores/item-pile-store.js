import { get, writable } from "svelte/store";
import { TJSDocument } from "#runtime/svelte/store/fvtt/document";
import CONSTANTS from "../constants/constants.js";
import * as Utilities from "../helpers/utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import * as Helpers from "../helpers/helpers.js";
import { InterfaceTracker } from "../socket.js";
import { PileAttribute, PileItem } from "./pile-item.js";
import DropCurrencyDialog from "../applications/dialogs/drop-currency-dialog/drop-currency-dialog.js";

const __STORES__ = new Map();

export default class ItemPileStore {

	constructor(application, source, recipient = false, { recipientPileData = false } = {}) {

		this.subscriptions = [];

		this.interactionId = foundry.utils.randomID();
		this.application = application;

		this.uuid = Utilities.getUuid(source);
		this.actor = Utilities.getActor(source);
		this.document = new TJSDocument(this.actor);

		this.recipient = recipient ? Utilities.getActor(recipient) : false;
		this.recipientDocument = recipient ? new TJSDocument(this.recipient) : new TJSDocument();
		this.recipientPileData = writable(recipientPileData);

		this.pileData = writable({});
		this.shareData = writable({});

		this.recipientPileData = writable({})
		this.recipientShareData = writable({});

		this.deleted = writable(false);

		this.search = writable("");
		this.editQuantities = writable(true);

		this.allItems = writable([]);
		this.attributes = writable([]);

		this.items = writable([]);
		this.visibleItems = writable([]);

		this.pileCurrencies = writable([]);
		this.recipientCurrencies = writable([]);

		this.currencies = writable([]);
		this.allCurrencies = writable([]);

		this.itemsPerCategory = writable({});
		this.categories = writable([]);
		this.itemCategories = writable([]);

		this.numItems = writable(0);
		this.numCurrencies = writable(0);

		this.name = writable("");
		this.img = writable("");

		__STORES__.set(this.uuid, this);

	}

	get ItemClass() {
		return PileItem;
	};

	get AttributeClass() {
		return PileAttribute;
	};

	get searchDelay() {
		return 200;
	}

	static make(...args) {
		const store = new this(...args)
		store.setupStores();
		store.setupSubscriptions();
		return store;
	}

	static getStore(actor) {
		const uuid = Utilities.getUuid(actor);
		return __STORES__.get(uuid);
	}

	static notifyChanges(event, actor, ...args) {
		const store = this.getStore(actor);
		if (store) {
			store[event](...args);
		}
	}

	static notifyAllOfChanges(event, ...args) {
		for (const store of __STORES__.values()) {
			if (store[event]) {
				store[event](...args);
			}
		}
	}

	setupStores() {

		this.pileData.set(PileUtilities.getActorFlagData(this.actor));
		this.shareData.set(SharingUtilities.getItemPileSharingData(this.actor));

		this.recipientPileData.set(this.recipient ? PileUtilities.getActorFlagData(this.recipient) : {});
		this.recipientShareData.set(this.recipient ? SharingUtilities.getItemPileSharingData(this.recipient) : {});

		this.deleted.set(false);

		this.search.set("");
		this.editQuantities.set(!this.recipient);

		this.allItems.set([]);
		this.attributes.set([]);

		this.items.set([]);
		this.visibleItems.set([]);

		this.pileCurrencies.set(PileUtilities.getActorCurrencies(this.actor, { getAll: true }));
		this.recipientCurrencies.set(this.recipient ? PileUtilities.getActorCurrencies(this.recipient, { getAll: true }) : []);

		this.currencies.set([]);
		this.allCurrencies.set([]);

		this.itemsPerCategory.set({});
		this.categories.set([]);
		this.itemCategories.set([]);

		this.numItems.set(0);
		this.numCurrencies.set(0);

		this.name.set("");
		this.img.set("");

	}

	getActorImage() {
		return this.actor.img;
	}

	setupSubscriptions() {

		this.subscribeTo(this.document, () => {
			const updateData = this.document.updateOptions;
			const renderData = updateData?.renderData ?? updateData?.data ?? {};
			if (foundry.utils.hasProperty(renderData, CONSTANTS.FLAGS.SHARING)) {
				this.shareData.set(SharingUtilities.getItemPileSharingData(this.actor));
				13
				this.refreshItems();
			}
			if (foundry.utils.hasProperty(renderData, CONSTANTS.FLAGS.PILE)) {
				this.pileData.set(PileUtilities.getActorFlagData(this.actor));
				this.pileCurrencies.set(PileUtilities.getActorCurrencies(this.actor, { getAll: true }));
				this.refreshItems();
			}
			this.name.set(this.actor.name);
			this.img.set(this.getActorImage());
		});

		if (this.recipientDocument) {
			this.subscribeTo(this.recipientDocument, () => {
				const updateData = this.document.updateOptions;
				const renderData = updateData?.renderData ?? updateData?.data ?? {};
				if (foundry.utils.hasProperty(renderData, CONSTANTS.FLAGS.SHARING)) {
					this.recipientShareData.set(SharingUtilities.getItemPileSharingData(this.recipient));
					this.refreshItems();
				}
				if (foundry.utils.hasProperty(renderData, CONSTANTS.FLAGS.PILE)) {
					this.recipientPileData.set(PileUtilities.getActorFlagData(this.recipient));
					this.recipientCurrencies.set(PileUtilities.getActorCurrencies(this.recipient, { getAll: true }));
					this.refreshItems();
				}
			});
		}

		const items = [];
		const attributes = [];

		const pileData = PileUtilities.isValidItemPile(this.actor) || !this.recipient ? get(this.pileData) : get(this.recipientPileData);

		PileUtilities.getActorItems(this.actor, { itemFilters: pileData.overrideItemFilters }).map(item => {
			items.push(new this.ItemClass(this, item));
		});

		PileUtilities.getActorCurrencies(this.actor, { forActor: this.recipient, getAll: true }).forEach(currency => {
			if (currency.type === "item") {
				if (!currency.item) return
				items.push(new this.ItemClass(this, currency.item, true, !!currency?.secondary));
			} else {
				attributes.push(new this.AttributeClass(this, currency, true, !!currency?.secondary));
			}
		});

		this.allItems.set(items);
		this.attributes.set(attributes);

		this.subscribeTo(this.allItems, () => {
			this.refreshItems();
		});
		this.subscribeTo(this.attributes, () => {
			this.refreshItems();
		});

		const filterDebounce = foundry.utils.debounce(() => {
			this.refreshItems();
		}, this.searchDelay);
		this.subscribeTo(this.search, (val) => {
			filterDebounce()
		});

	}

	updateSource(newSource) {
		this.uuid = Utilities.getUuid(newSource);
		this.actor = Utilities.getActor(newSource);
		this.document.set(this.actor);
		__STORES__.set(this.uuid, this);
		this.unsubscribe();
		this.setupStores();
		this.setupSubscriptions();
	}

	updateRecipient(newRecipient) {
		this.recipient = newRecipient;
		this.recipientDocument.set(this.recipient);
		this.unsubscribe();
		this.setupStores();
		this.setupSubscriptions();
	}

	visibleItemFilterFunction(entry, actorIsMerchant, pileData, recipientPileData) {
		const itemFlagData = entry.itemFlagData ? get(entry.itemFlagData) : {};
		return !entry.isCurrency
			&& (this.actor.isOwner || !actorIsMerchant || !itemFlagData?.hidden);
	}

	itemSortFunction(a, b, inverse) {
		return (b.item.name > a.item.name ? -1 : 1) * (inverse ? -1 : 1);
	}

	refreshItems() {
		const allItems = get(this.allItems);
		const pileData = get(this.pileData);
		const recipientPileData = this.recipient ? PileUtilities.getActorFlagData(this.recipient) : {}
		const actorIsMerchant = PileUtilities.isItemPileMerchant(this.actor, pileData);

		const visibleItems = allItems.filter(entry => this.visibleItemFilterFunction(entry, actorIsMerchant, pileData, recipientPileData));
		const itemCurrencies = allItems.filter(entry => entry.isCurrency && !entry.isSecondaryCurrency);
		const secondaryItemCurrencies = allItems.filter(entry => entry.isSecondaryCurrency);

		this.visibleItems.set(visibleItems);

		const items = visibleItems.filter(entry => !get(entry.filtered));

		this.numItems.set(items.filter(entry => get(entry.quantity) > 0).length);
		this.items.set(items.sort((a, b) => this.itemSortFunction(a, b)));

		const currencies = get(this.attributes).filter(entry => !entry.isSecondaryCurrency).concat(itemCurrencies);
		const secondaryCurrencies = get(this.attributes).filter(entry => entry.isSecondaryCurrency).concat(secondaryItemCurrencies);

		this.numCurrencies.set(currencies.concat(secondaryCurrencies).filter(entry => get(entry.quantity) > 0).length);

		this.currencies.set(currencies.concat(secondaryCurrencies).filter(entry => !get(entry.filtered)));
		this.allCurrencies.set(currencies.concat(secondaryCurrencies));

		this.itemCategories.set(Object.values(visibleItems.reduce((acc, item) => {
			const category = get(item.category);
			if (!acc[category.type]) {
				acc[category.type] = { ...category };
			}
			return acc;
		}, {})).sort((a, b) => a.label < b.label ? -1 : 1));

		const itemsPerCategory = items
			.reduce((acc, item) => {
				const category = get(item.category);
				if (!acc[category.type]) {
					acc[category.type] = {
						service: category.service,
						type: category.type,
						label: category.label,
						items: []
					};
				}
				acc[category.type].items.push(item);
				return acc;
			}, {})

		Object.values(itemsPerCategory).forEach(category => category.items.sort((a, b) => {
			return a.item.name < b.item.name ? -1 : 1;
		}));

		this.itemsPerCategory.set(itemsPerCategory);

		this.categories.set(Object.values(itemsPerCategory).map(category => {
			return {
				service: category.service,
				label: category.label,
				type: category.type
			}
		}).sort((a, b) => a.label < b.label ? -1 : 1));
	}

	createItem(item) {
		if (PileUtilities.isItemInvalid(this.actor, item)) return;
		const items = get(this.allItems);
		const deletedItems = items
			.filter(item => item.id === null)
			.map(item => ({
				pileItem: item,
				...item.similarities
			}));
		const previouslyDeletedItem = Utilities.findSimilarItem(deletedItems, item);
		if (previouslyDeletedItem) {
			previouslyDeletedItem.pileItem.setup(item);
		} else {
			items.push(new this.ItemClass(this, item));
		}
		this.allItems.set(items);
	}

	deleteItem(item) {
		if (PileUtilities.isItemInvalid(this.actor, item)) return;
		const items = get(this.allItems);
		const pileItem = items.find(pileItem => pileItem.id === item.id);
		if (!pileItem) return;
		if (get(this.editQuantities) || !InterfaceTracker.isOpened(this.application.id)) {
			items.splice(items.indexOf(pileItem), 1);
			this.allItems.set(items);
		} else {
			pileItem.id = null;
			pileItem.quantity.set(0);
			pileItem.quantityLeft.set(0);
		}
		pileItem.unsubscribe();
	}

	getSimilarItem(item) {
		const items = get(this.allItems).map(item => item.item);
		return Utilities.findSimilarItem(items, item, get(this.pileData));
	}

	delete() {
		this.deleted.set(true);
	}

	async update() {

		const itemsToUpdate = [];
		const itemsToDelete = [];
		const attributesToUpdate = {};

		const items = get(this.allItems).filter(item => item.id);
		for (let item of items) {
			const itemQuantity = get(item.quantity);
			if (itemQuantity === 0) {
				itemsToDelete.push(item.id);
			} else {
				if (PileUtilities.canItemStack(item.item, this.actor)) {
					itemsToUpdate.push(Utilities.setItemQuantity({ _id: item.id }, itemQuantity));
				}
			}
		}

		const attributes = get(this.attributes);
		for (let attribute of attributes) {
			attributesToUpdate[attribute.path] = get(attribute.quantity);
		}

		const pileSharingData = SharingUtilities.getItemPileSharingData(this.actor);

		await this.actor.update(attributesToUpdate);
		if (pileSharingData?.currencies) {
			pileSharingData.currencies = pileSharingData.currencies.map(currency => {
				if (attributesToUpdate[currency.path] !== undefined) {
					currency.actors = currency.actors.map(actor => {
						actor.quantity = Math.max(0, Math.min(actor.quantity, attributesToUpdate[currency.path]));
						return actor;
					})
				}
				return currency;
			})
		}

		await this.actor.updateEmbeddedDocuments("Item", itemsToUpdate);
		await this.actor.deleteEmbeddedDocuments("Item", itemsToDelete);
		if (pileSharingData?.items) {
			pileSharingData.items = pileSharingData.items.map(item => {
				const sharingItem = itemsToUpdate.find(item => item._id === item.id);
				if (sharingItem) {
					item.actors = item.actors.map(actor => {
						actor.quantity = Math.max(0, Math.min(actor.quantity, sharingItem.quantity));
						return actor;
					})
				}
				return item;
			})
		}

		await SharingUtilities.updateItemPileSharingData(this.actor, pileSharingData);

		this.refreshItems();

		Helpers.custom_notify(game.i18n.localize("ITEM-PILES.Notifications.UpdateItemPileSuccess"));

	}

	async depositCurrency() {
		const result = await DropCurrencyDialog.show(this.recipient, this.actor, { localization: "DepositCurrencies" });
		return this._addCurrency(result, this.recipient, this.actor);
	}

	async withdrawCurrency() {
		const result = await DropCurrencyDialog.show(this.actor, this.recipient, { localization: "WithdrawCurrencies" });
		return this._addCurrency(result, this.actor, this.recipient);
	}

	async addCurrency(recipient = false) {
		const source = recipient || this.actor;
		const target = recipient ? this.actor : false;
		const result = await DropCurrencyDialog.show(source, target, {
			localization: !target ? "EditCurrencies" : false,
			unlimitedCurrencies: !target && game.user.isGM,
			existingCurrencies: PileUtilities.getActorCurrencies(source, { combine: true }),
			getUpdates: !target
		});
		return this._addCurrency(result, source, target);
	}

	async _addCurrency(currencies, source, target = false) {

		if (!currencies) return;

		if (!target) {

			if (!game.user.isGM) return;

			if (!foundry.utils.isEmpty(currencies.attributes)) {
				await game.itempiles.API.setAttributes(source, currencies.attributes, { interactionId: this.interactionId })
			}
			if (currencies.items.length) {
				const itemsToAdd = currencies.items.filter(currency => currency.quantity > 0);
				const itemsToRemove = currencies.items.filter(currency => currency.quantity < 0);
				await game.itempiles.API.addItems(source, itemsToAdd, { interactionId: this.interactionId })
				await game.itempiles.API.removeItems(source, itemsToRemove, { interactionId: this.interactionId })
			}

		} else {

			if (!foundry.utils.isEmpty(currencies.attributes)) {
				await game.itempiles.API.transferAttributes(source, target, currencies.attributes, { interactionId: this.interactionId })
			}
			if (currencies.items.length) {
				await game.itempiles.API.transferItems(source, target, currencies.items, { interactionId: this.interactionId })
			}
		}

	}

	takeAll() {
		game.itempiles.API.transferEverything(
			this.actor,
			this.recipient,
			{ interactionId: this.interactionId }
		);
	}

	splitAll() {
		return game.itempiles.API.splitItemPileContents(this.actor, { instigator: this.recipient });
	}

	closeContainer() {
		if (!InterfaceTracker.isOpened(this.application.id)) {
			return game.itempiles.API.closeItemPile(this.actor, this.recipient);
		}
	}

	subscribeTo(target, callback) {
		this.subscriptions.push(target.subscribe(callback));
	}

	unsubscribe() {
		this.subscriptions.forEach(unsubscribe => unsubscribe());
		this.subscriptions = [];
	}

	onDestroy() {
		this.unsubscribe();
		__STORES__.delete(this.uuid);
	}
}
