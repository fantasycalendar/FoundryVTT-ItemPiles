import * as Helpers from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import ItemPileSocket from "../socket.js";
import SETTINGS from "../constants/settings.js";
import CONSTANTS from "../constants/constants.js";
import DropItemDialog from "../applications/dialogs/drop-item-dialog/drop-item-dialog.js";
import ItemPileInventoryApp from "../applications/item-pile-inventory-app/item-pile-inventory-app.js";
import Transaction from "../helpers/transaction.js";
import ItemPileStore from "../stores/item-pile-store.js";
import MerchantApp from "../applications/merchant-app/merchant-app.js";
import { SYSTEMS } from "../systems.js";
import { TJSDialog } from "#runtime/svelte/application";
import CustomDialog from "../applications/components/CustomDialog.svelte";
import ReceiveItemsShell from "../applications/dialogs/receive-items-dialog/receive-items-shell.svelte";
import BankVaultApp from "../applications/vault-app/vault-app.js";
import { hotkeyActionState } from "../hotkeys.js";
import { ensureValidIds } from "../helpers/utilities.js";
import { getPileActorDefaults } from "../helpers/pile-utilities.js";

const preloadedFiles = new Set();

export default class PrivateAPI {

	/**
	 * Initializes the API for Foundry's core hooks
	 */
	static initialize() {
		Helpers.hooks.on("canvasReady", this._onCanvasReady.bind(this));
		Helpers.hooks.on("createItem", this._onCreateItem.bind(this));
		Helpers.hooks.on("updateItem", this._onUpdateItem.bind(this));
		Helpers.hooks.on("deleteItem", this._onDeleteItem.bind(this));
		Helpers.hooks.on("updateActor", this._onUpdateActor.bind(this));
		Helpers.hooks.on("deleteToken", this._onDeleteToken.bind(this));
		Helpers.hooks.on("deleteActor", this._onDeleteActor.bind(this));
		Helpers.hooks.on("preCreateToken", this._onPreCreateToken.bind(this))
		Helpers.hooks.on("preUpdateToken", this._onPreUpdateToken.bind(this));
		Helpers.hooks.on("updateToken", this._onUpdateToken.bind(this));
		Helpers.hooks.on("createToken", this._onCreateToken.bind(this))
		Helpers.hooks.on("dropCanvasData", this._dropData.bind(this));
	}

	/**
	 * @private
	 */
	static async _onCanvasReady(canvas) {
		const tokens = [...canvas.tokens.placeables].map(token => token.document);
		for (const doc of tokens) {
			await this._preloadItemPileFiles(doc);
		}
	}

	/**
	 * @private
	 */
	static _onCreateItem(doc) {
		if (!doc.parent) return true;
		ItemPileStore.notifyChanges("createItem", doc.parent, doc);
		if (!PileUtilities.isValidItemPile(doc.parent)) return true;
		this._evaluateItemPileChange(doc.parent, {}, true);
	}

	/**
	 * @private
	 */
	static _onUpdateItem(doc) {
		if (!doc.parent) return true;
		if (!PileUtilities.isValidItemPile(doc.parent)) return true;
		this._evaluateItemPileChange(doc.parent, {}, true);
	}

	/**
	 * @private
	 */
	static _onDeleteItem(doc) {
		if (!doc.parent) return true;
		ItemPileStore.notifyChanges("deleteItem", doc.parent, doc);
		if (!PileUtilities.isValidItemPile(doc.parent)) return true;
		this._evaluateItemPileChange(doc.parent, {}, true);
	}

	/**
	 * @private
	 */
	static _onUpdateActor(doc, changes) {
		if (!PileUtilities.isValidItemPile(doc)) return true;
		this._evaluateItemPileChange(doc, changes);
	}

	/**
	 * @private
	 */
	static _onDeleteToken(doc) {
		ItemPileStore.notifyChanges("delete", doc.actor)
		if (!PileUtilities.isValidItemPile(doc)) return true;
		Helpers.hooks.callAll(CONSTANTS.HOOKS.PILE.DELETE, doc);
	}

	/**
	 * @private
	 */
	static _onDeleteActor(doc) {
		ItemPileStore.notifyChanges("delete", doc)
	}

	/**
	 * @private
	 */
	static _onPreCreateToken(doc, data) {
		const docData = foundry.utils.deepClone(data);
		const sourceActor = game.actors.get(doc.actorId);
		let itemPileConfig = foundry.utils.mergeObject(
			foundry.utils.deepClone(CONSTANTS.PILE_DEFAULTS),
			foundry.utils.getProperty(docData, CONSTANTS.FLAGS.PILE) ?? {}
		)
		if (doc.isLinked || !foundry.utils.hasProperty(docData, CONSTANTS.FLAGS.PILE)) {
			itemPileConfig = foundry.utils.mergeObject(
				itemPileConfig,
				foundry.utils.deepClone(foundry.utils.getProperty(sourceActor, CONSTANTS.FLAGS.PILE) ?? {})
			);
		}
		if (!itemPileConfig?.enabled) return true;
		if (!doc.isLinked) {
			Utilities.deleteProperty(docData, CONSTANTS.ACTOR_DELTA_PROPERTY + "." + CONSTANTS.FLAGS.SHARING);
		}
		if (itemPileConfig.closedImage.includes("*")) {
			itemPileConfig.closedImage = Helpers.random_array_element(itemPileConfig.closedImages);
			itemPileConfig.closedImages = [];
		}
		if (itemPileConfig.emptyImage.includes("*")) {
			itemPileConfig.emptyImage = Helpers.random_array_element(itemPileConfig.emptyImages);
			itemPileConfig.emptyImages = [];
		}
		if (itemPileConfig.openedImage.includes("*")) {
			itemPileConfig.openedImage = Helpers.random_array_element(itemPileConfig.openedImages);
			itemPileConfig.openedImages = [];
		}
		if (itemPileConfig.lockedImage.includes("*")) {
			itemPileConfig.lockedImage = Helpers.random_array_element(itemPileConfig.lockedImages);
			itemPileConfig.lockedImages = [];
		}
		const targetItems = PileUtilities.getActorItems(doc.actor, {
			itemFilters: itemPileConfig?.overrideItemFilters
		});
		const targetCurrencies = PileUtilities.getActorCurrencies(doc.actor, {
			currencyList: PileUtilities.getCurrencyList(doc.actor, itemPileConfig)
		});
		const pileData = { data: itemPileConfig, items: targetItems, currencies: targetCurrencies };
		const scale = PileUtilities.getItemPileTokenScale(doc, pileData);
		foundry.utils.setProperty(docData, "texture.src", PileUtilities.getItemPileTokenImage(doc, pileData));
		foundry.utils.setProperty(docData, "texture.scaleX", scale);
		foundry.utils.setProperty(docData, "texture.scaleY", scale);
		foundry.utils.setProperty(docData, "name", PileUtilities.getItemPileName(doc, pileData));
		const cleanItemPileConfig = PileUtilities.cleanFlagData(itemPileConfig);
		Utilities.deleteProperty(docData, CONSTANTS.FLAGS.PILE);
		foundry.utils.setProperty(docData, CONSTANTS.FLAGS.PILE, cleanItemPileConfig);
		if (!doc.isLinked) {
			Utilities.deleteProperty(docData, CONSTANTS.ACTOR_DELTA_PROPERTY + "." + CONSTANTS.FLAGS.PILE);
			foundry.utils.setProperty(docData, CONSTANTS.ACTOR_DELTA_PROPERTY + "." + CONSTANTS.FLAGS.PILE, cleanItemPileConfig);
		}

		doc.updateSource(docData);
	}

	static _onPreUpdateToken(doc, changes) {
		const diff = foundry.utils.diffObject(doc, changes);
		if (!foundry.utils.hasProperty(diff, "actorLink")) return true;
		if (!PileUtilities.isValidItemPile(doc)) return true;
		const actor = Utilities.getActor(doc);
		const changingFlags = foundry.utils.getProperty(changes, CONSTANTS.FLAGS.PILE) ?? {};
		const flagData = foundry.utils.mergeObject(
			PileUtilities.getActorFlagData(actor),
			changingFlags
		);
		changes[CONSTANTS.FLAGS.PILE] = PileUtilities.cleanFlagData(flagData);
	}

	static _onUpdateToken(doc) {
		if (doc.actorLink) return true;
		if (!PileUtilities.isValidItemPile(doc)) return true;
		ItemPileStore.notifyChanges("updateUnlinkedToken", doc.actor)
	}

	/**
	 * @private
	 */
	static _onCreateToken(doc) {
		if (!PileUtilities.isValidItemPile(doc)) return true;
		const itemPileConfig = PileUtilities.getActorFlagData(doc.actor)
		Helpers.hooks.callAll(CONSTANTS.HOOKS.PILE.CREATE, doc, itemPileConfig);
		return this._preloadItemPileFiles(doc);
	}

	static async _addItems(targetUuid, items, userId, {
		removeExistingActorItems = false, skipVaultLogging = false, interactionId = false
	} = {}) {

		const targetActor = Utilities.getActor(targetUuid);

		const transaction = new Transaction(targetActor);

		if (removeExistingActorItems) {
			const existingItems = PileUtilities.getActorItems(targetActor);
			await transaction.appendItemChanges(existingItems, { remove: true });
		}

		await transaction.appendItemChanges(items);

		const { itemsToUpdate, itemsToCreate } = transaction.prepare(); // Prepare data

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_ADD, targetActor, itemsToCreate, itemsToUpdate, interactionId);
		if (hookResult === false) return false; // Call pre-hook to allow user to interrupt it

		const { itemDeltas } = await transaction.commit(); // Actually add the items to the actor

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ITEM.ADD, targetUuid, itemDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.ADD_ITEMS,
			target: targetUuid,
			items: itemDeltas,
			userId: userId,
			interactionId: interactionId
		});

		if (!skipVaultLogging && PileUtilities.isItemPileVault(targetActor)) {
			await PileUtilities.updateVaultLog(targetActor, {
				userId, items: itemDeltas, withdrawal: false
			});
		}

		return itemDeltas;

	}

	static async _removeItems(targetUuid, items, userId, { skipVaultLogging = false, interactionId = false } = {}) {

		const targetActor = Utilities.getActor(targetUuid);

		const transaction = new Transaction(targetActor);

		await transaction.appendItemChanges(items, { remove: true });

		const { itemsToUpdate, itemsToDelete } = transaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_REMOVE, targetActor, itemsToUpdate, itemsToDelete, interactionId);
		if (hookResult === false) return false;

		const { itemDeltas } = await transaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ITEM.REMOVE, targetUuid, itemDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.REMOVE_ITEMS,
			target: targetUuid,
			items: itemDeltas,
			userId: userId,
			interactionId: interactionId
		});

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(targetUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(targetUuid);
		}

		if (!skipVaultLogging && PileUtilities.isItemPileVault(targetActor)) {
			await PileUtilities.updateVaultLog(targetActor, {
				userId, items: itemDeltas, withdrawal: true
			});
		}

		return itemDeltas;

	}

	static async _transferItems(sourceUuid, targetUuid, items, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const sourceTransaction = new Transaction(sourceActor);
		if (SYSTEMS.DATA.ITEM_TYPE_HANDLERS) {
			const newItems = [];
			for (const data of items) {
				const itemData = data?.item ?? data;
				const item = sourceActor.items.get(itemData._id ?? itemData.id);
				const handler = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.TRANSFER, item.type);
				if (!handler) continue;
				handler({ item, items: newItems });
			}
			items = items.concat(newItems.map(item => ({
				_id: item._id,
				flags: undefined,
				quantity: Utilities.getItemQuantity(item)
			})));
		}
		await sourceTransaction.appendItemChanges(items, { remove: true });

		const sourceUpdates = sourceTransaction.prepare();

		const targetTransaction = new Transaction(targetActor);
		await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
		const targetUpdates = targetTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_TRANSFER, sourceActor, sourceUpdates, targetActor, targetUpdates, interactionId);
		if (hookResult === false) return false;

		await sourceTransaction.commit();
		const { itemDeltas } = await targetTransaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ITEM.TRANSFER, sourceUuid, targetUuid, itemDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_ITEMS,
			source: sourceUuid,
			target: targetUuid,
			items: itemDeltas,
			userId: userId,
			interactionId: interactionId
		};

		await this._executeItemPileMacro(sourceUuid, macroData);
		await this._executeItemPileMacro(targetUuid, macroData);

		const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);

		const itemPileUuid = sourceIsItemPile ? sourceUuid : targetUuid;
		const itemPile = sourceIsItemPile ? Utilities.getToken(sourceUuid) : Utilities.getToken(targetUuid);

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(itemPileUuid);
		} else if (PileUtilities.isItemPileLootable(itemPile)) {
			if (PileUtilities.isItemPileEmpty(itemPile)) {
				await SharingUtilities.clearItemPileSharingData(itemPile);
			} else {
				await SharingUtilities.setItemPileSharingData(sourceUuid, targetUuid, {
					items: itemDeltas
				});
			}
		} else if (!skipVaultLogging && (PileUtilities.isItemPileVault(sourceActor) || PileUtilities.isItemPileVault(targetActor))) {
			const pileActor = sourceIsItemPile ? sourceActor : targetActor;
			const actorToLog = sourceIsItemPile ? targetActor : sourceActor;
			await PileUtilities.updateVaultLog(pileActor, {
				userId, actor: actorToLog, items: itemDeltas, withdrawal: sourceIsItemPile
			});
		}

		return itemDeltas;

	}

	static async _transferAllItems(sourceUuid, targetUuid, userId, {
		itemFilters = false, skipVaultLogging = false, interactionId = false
	} = {}) {

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const itemsToTransfer = PileUtilities.getActorItems(sourceActor, { itemFilters }).map(item => item.toObject());

		const sourceTransaction = new Transaction(sourceActor);
		await sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true });
		const sourceUpdates = sourceTransaction.prepare();

		const targetTransaction = new Transaction(targetActor);
		await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
		const targetUpdates = targetTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_TRANSFER_ALL, sourceActor, sourceUpdates, targetActor, targetUpdates, userId);
		if (hookResult === false) return false;

		await sourceTransaction.commit();
		const { itemDeltas } = await targetTransaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ITEM.TRANSFER_ALL, sourceUuid, targetUuid, itemDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_ALL_ITEMS,
			source: sourceUuid,
			target: targetUuid,
			items: itemDeltas,
			userId: userId,
			interactionId: interactionId
		};
		await this._executeItemPileMacro(sourceUuid, macroData);
		await this._executeItemPileMacro(targetUuid, macroData);

		const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);
		const itemPileUuid = sourceIsItemPile ? sourceUuid : targetUuid;
		const itemPile = sourceIsItemPile ? Utilities.getToken(sourceUuid) : Utilities.getToken(targetUuid);

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(itemPileUuid);
		} else if (!skipVaultLogging && (PileUtilities.isItemPileVault(itemPile) || PileUtilities.isItemPileVault(targetActor))) {
			const pileActor = sourceIsItemPile ? sourceActor : targetActor;
			const actorToLog = sourceIsItemPile ? targetActor : sourceActor;
			await PileUtilities.updateVaultLog(pileActor, {
				userId, actor: actorToLog, items: itemDeltas, withdrawal: sourceIsItemPile
			});
		}

		return itemDeltas;
	}

	static async _updateCurrencies(targetUuid, currencies, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const targetActor = Utilities.getActor(targetUuid);

		const transaction = new Transaction(targetActor);

		const currenciesToUpdate = PileUtilities.getPriceFromString(currencies).currencies
			.filter(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity >= 0);

		const itemsToUpdate2 = currenciesToUpdate.filter(currency => currency.type === "item")
			.map(currency => ({ item: currency.data.item, quantity: 1, cost: currency.quantity }));

		const attributesToUpdate = currenciesToUpdate.filter(currency => currency.type === "attribute")
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		await transaction.appendItemChanges(itemsToUpdate2, { type: "currency", set: true });
		await transaction.appendDocumentChanges(attributesToUpdate, { type: "currency", set: true });

		const { actorUpdates, itemsToCreate, itemsToUpdate } = transaction.prepare(); // Prepare data

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.CURRENCY.PRE_UPDATE, targetActor, actorUpdates, itemsToCreate, itemsToUpdate, interactionId);
		if (hookResult === false) return false; // Call pre-hook to allow user to interrupt it

		const { itemDeltas, attributeDeltas } = await transaction.commit(); // Actually update the items to the actor

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.CURRENCY.UPDATE, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.UPDATE_CURRENCIES,
			target: targetUuid,
			items: itemDeltas,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		});

		if (!skipVaultLogging && PileUtilities.isItemPileVault(targetActor)) {
			await PileUtilities.updateVaultLog(targetActor, {
				userId, items: itemDeltas, attributes: attributeDeltas, withdrawal: false
			});
		}

		return { itemDeltas, attributeDeltas };

	}

	static async _addCurrencies(targetUuid, currencies, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const targetActor = Utilities.getActor(targetUuid);

		const transaction = new Transaction(targetActor);

		const currenciesToAdd = PileUtilities.getPriceFromString(currencies).currencies
			.filter(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity > 0);

		const itemsToAdd = currenciesToAdd.filter(currency => currency.type === "item")
			.map(currency => ({ item: currency.data.item, quantity: currency.quantity }));

		const attributesToAdd = currenciesToAdd.filter(currency => currency.type === "attribute")
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		await transaction.appendItemChanges(itemsToAdd, { type: "currency" });
		await transaction.appendDocumentChanges(attributesToAdd, { type: "currency" });

		const { actorUpdates, itemsToCreate, itemsToUpdate } = transaction.prepare(); // Prepare data

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.CURRENCY.PRE_ADD, targetActor, actorUpdates, itemsToCreate, itemsToUpdate, interactionId);
		if (hookResult === false) return false; // Call pre-hook to allow user to interrupt it

		const { itemDeltas, attributeDeltas } = await transaction.commit(); // Actually add the items to the actor

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.CURRENCY.ADD, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.ADD_CURRENCIES,
			target: targetUuid,
			items: itemDeltas,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		});

		if (!skipVaultLogging && PileUtilities.isItemPileVault(targetActor)) {
			await PileUtilities.updateVaultLog(targetActor, {
				userId, items: itemDeltas, attributes: attributeDeltas, withdrawal: false
			});
		}

		return { itemDeltas, attributeDeltas };

	}

	static async _removeCurrencies(targetUuid, currencies, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const targetActor = Utilities.getActor(targetUuid);

		const transaction = new Transaction(targetActor);

		const priceData = PileUtilities.getPriceFromString(currencies)
		const secondaryPrices = priceData.currencies.filter(currency => currency.secondary && currency.quantity);
		const overallCost = priceData.overallCost;

		const paymentData = PileUtilities.getPaymentData({
			purchaseData: [{ cost: overallCost, quantity: 1, secondaryPrices }], buyer: targetActor
		});

		const itemsToRemove = paymentData.finalPrices.filter(currency => currency.type === "item" && currency.quantity)
			.map(currency => ({ item: currency.data.item, quantity: currency.quantity }));

		const attributesToRemove = paymentData.finalPrices.filter(currency => currency.type === "attribute" && currency.quantity)
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		const itemsToAdd = paymentData.buyerChange.filter(currency => currency.type === "item" && currency.quantity)
			.map(currency => ({ item: currency.data.item, quantity: currency.quantity }));

		const attributesToAdd = paymentData.buyerChange.filter(currency => currency.type === "attribute" && currency.quantity)
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		await transaction.appendItemChanges(itemsToRemove, { remove: true, type: "currency" });
		await transaction.appendDocumentChanges(attributesToRemove, { remove: true, type: "currency" });
		await transaction.appendItemChanges(itemsToAdd, { type: "currency" });
		await transaction.appendDocumentChanges(attributesToAdd, { type: "currency" });

		const { actorUpdates, itemsToUpdate } = transaction.prepare(); // Prepare data

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.CURRENCY.PRE_REMOVE, targetActor, actorUpdates, itemsToUpdate, interactionId);
		if (hookResult === false) return false; // Call pre-hook to allow user to interrupt it

		const { itemDeltas, attributeDeltas } = await transaction.commit(); // Actually add the items to the actor

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.CURRENCY.REMOVE, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.REMOVE_CURRENCIES,
			target: targetUuid,
			items: itemDeltas,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		});

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(targetUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(targetUuid);
		}

		if (!skipVaultLogging && PileUtilities.isItemPileVault(targetActor)) {
			await PileUtilities.updateVaultLog(targetActor, {
				userId, items: itemDeltas, attributes: attributeDeltas, withdrawal: true
			});
		}

		return { itemDeltas, attributeDeltas };

	}

	static async _transferCurrencies(sourceUuid, targetUuid, currencies, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const priceData = PileUtilities.getPriceFromString(currencies);
		const overallCost = priceData.overallCost;

		const paymentData = PileUtilities.getPaymentData({
			purchaseData: [{ cost: overallCost, quantity: 1 }], buyer: sourceActor
		});

		const sourceItemsToRemove = paymentData.finalPrices.filter(currency => currency.type === "item" && currency.quantity)
			.map(currency => ({ item: currency.data.item, quantity: currency.quantity }));

		const sourceAttributesToRemove = paymentData.finalPrices.filter(currency => currency.type === "attribute" && currency.quantity)
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		const sourceItemsToAdd = paymentData.buyerChange.filter(currency => currency.type === "item" && currency.quantity)
			.map(currency => ({ item: currency.data.item, quantity: currency.quantity }));

		const sourceAttributesToAdd = paymentData.buyerChange.filter(currency => currency.type === "attribute" && currency.quantity)
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		const sourceTransaction = new Transaction(sourceActor);
		await sourceTransaction.appendItemChanges(sourceItemsToRemove, { remove: true, type: "currency" });
		await sourceTransaction.appendDocumentChanges(sourceAttributesToRemove, { remove: true, type: "currency" });
		await sourceTransaction.appendItemChanges(sourceItemsToAdd, { type: "currency" });
		await sourceTransaction.appendDocumentChanges(sourceAttributesToAdd, { type: "currency" });
		const sourceUpdates = sourceTransaction.prepare();

		const targetItemsToAdd = paymentData.sellerReceive.filter(currency => currency.type === "item")
			.map(currency => ({ item: currency.data.item, quantity: currency.quantity }));

		const targetAttributesToAdd = paymentData.sellerReceive.filter(currency => currency.type === "attribute")
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		const targetTransaction = new Transaction(targetActor);
		await targetTransaction.appendItemChanges(targetItemsToAdd, { type: "currency" });
		await targetTransaction.appendDocumentChanges(targetAttributesToAdd, { type: "currency" });
		const targetUpdates = targetTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.CURRENCY.PRE_TRANSFER, sourceActor, sourceUpdates, targetActor, targetUpdates, interactionId);
		if (hookResult === false) return false;

		await sourceTransaction.commit();
		const { itemDeltas, attributeDeltas } = await targetTransaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.CURRENCY.TRANSFER, sourceUuid, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_CURRENCIES,
			source: sourceUuid,
			target: targetUuid,
			items: itemDeltas,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		};

		await this._executeItemPileMacro(sourceUuid, macroData);
		await this._executeItemPileMacro(targetUuid, macroData);

		const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);

		const itemPileUuid = sourceIsItemPile ? sourceUuid : targetUuid;
		const itemPile = sourceIsItemPile ? Utilities.getToken(sourceUuid) : Utilities.getToken(targetUuid);

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(itemPileUuid);
		} else if (PileUtilities.isItemPileLootable(itemPile)) {
			if (PileUtilities.isItemPileEmpty(itemPile)) {
				await SharingUtilities.clearItemPileSharingData(itemPile);
			} else {
				await SharingUtilities.setItemPileSharingData(sourceUuid, targetUuid, {
					items: itemDeltas, attributes: attributeDeltas
				});
			}
		} else if (!skipVaultLogging && (PileUtilities.isItemPileVault(sourceActor) || PileUtilities.isItemPileVault(targetActor))) {
			const sourceIsItemPile = PileUtilities.isItemPileVault(sourceActor);
			const pileActor = sourceIsItemPile ? sourceActor : targetActor;
			const actorToLog = sourceIsItemPile ? targetActor : sourceActor;
			await PileUtilities.updateVaultLog(pileActor, {
				userId, actor: actorToLog, items: itemDeltas, attributes: attributeDeltas, withdrawal: sourceIsItemPile
			});
		}

		return { itemDeltas, attributeDeltas };

	}

	static async _transferAllCurrencies(sourceUuid, targetUuid, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const currencyList = PileUtilities.getCurrencyList();
		const sourceCurrencyList = PileUtilities.getActorCurrencies(sourceActor, { currencyList });

		const itemsToTransfer = sourceCurrencyList.filter(currency => currency.type === "item")
			.map(currency => ({ item: currency.data.item, quantity: currency.quantity }));

		const attributesToTransfer = sourceCurrencyList.filter(currency => currency.type === "attribute")
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		const sourceTransaction = new Transaction(sourceActor);
		await sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true, type: "currency" });
		await sourceTransaction.appendDocumentChanges(attributesToTransfer, { remove: true, type: "currency" });
		const sourceUpdates = sourceTransaction.prepare();

		const targetTransaction = new Transaction(targetActor);
		await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
		await targetTransaction.appendDocumentChanges(sourceUpdates.attributeDeltas);
		const targetUpdates = targetTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.CURRENCY.PRE_TRANSFER_ALL, sourceActor, sourceUpdates, targetActor, targetUpdates, interactionId);
		if (hookResult === false) return false;

		await sourceTransaction.commit();
		const { itemDeltas, attributeDeltas } = await targetTransaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.CURRENCY.TRANSFER_ALL, sourceUuid, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_ALL_CURRENCIES,
			source: sourceUuid,
			target: targetUuid,
			items: itemDeltas,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		};
		await this._executeItemPileMacro(sourceUuid, macroData);
		await this._executeItemPileMacro(targetUuid, macroData);

		const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);
		const itemPileUuid = sourceIsItemPile ? sourceUuid : targetUuid;
		const itemPile = sourceIsItemPile ? Utilities.getToken(sourceUuid) : Utilities.getToken(targetUuid);

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(itemPileUuid);
		} else if (!skipVaultLogging && PileUtilities.isItemPileVault(itemPile)) {
			const pileActor = sourceIsItemPile ? sourceActor : targetActor;
			const actorToLog = sourceIsItemPile ? targetActor : sourceActor;
			await PileUtilities.updateVaultLog(pileActor, {
				userId, actor: actorToLog, items: itemDeltas, attributes: attributeDeltas, withdrawal: sourceIsItemPile
			});
		}

		return { itemDeltas, attributeDeltas };

	}

	static async _setAttributes(targetUuid, attributes, userId, { interactionId = false } = {}) {

		const targetDocument = Utilities.getDocument(targetUuid);

		const transaction = new Transaction(targetDocument);
		await transaction.appendDocumentChanges(attributes, { set: true });
		const { actorUpdates } = transaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ATTRIBUTE.PRE_SET, targetDocument, actorUpdates, interactionId);
		if (hookResult === false) return false;

		const { attributeDeltas } = await transaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ATTRIBUTE.SET, targetUuid, attributeDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.SET_ATTRIBUTES,
			target: targetUuid,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		});

		return attributeDeltas;

	}

	static async _addAttributes(targetUuid, attributes, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const targetDocument = Utilities.getDocument(targetUuid);

		const transaction = new Transaction(targetDocument);
		await transaction.appendDocumentChanges(attributes);
		const { actorUpdates } = transaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ATTRIBUTE.PRE_ADD, targetDocument, actorUpdates, interactionId);
		if (hookResult === false) return false;

		const { attributeDeltas } = await transaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ATTRIBUTE.ADD, targetUuid, attributeDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.ADD_ATTRIBUTES,
			target: targetUuid,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		});

		const targetActor = Utilities.getActor(targetUuid);
		if (!skipVaultLogging && PileUtilities.isItemPileVault(targetActor)) {
			await PileUtilities.updateVaultLog(targetActor, {
				userId, attributes: attributeDeltas, withdrawal: false
			});
		}

		return attributeDeltas;

	}

	static async _removeAttributes(targetUuid, attributes, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const targetDocument = Utilities.getDocument(targetUuid);

		const transaction = new Transaction(targetDocument);
		await transaction.appendDocumentChanges(attributes, { remove: true });
		const { actorUpdates } = transaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ATTRIBUTE.PRE_REMOVE, targetDocument, actorUpdates, interactionId);
		if (hookResult === false) return false;

		const { attributeDeltas } = await transaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ATTRIBUTE.REMOVE, targetUuid, attributeDeltas, userId, interactionId);

		await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.REMOVE_ATTRIBUTES,
			target: targetUuid,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		});

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(targetUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(targetUuid);
		}

		const targetActor = Utilities.getActor(targetUuid);
		if (!skipVaultLogging && PileUtilities.isItemPileVault(targetActor)) {
			await PileUtilities.updateVaultLog(targetActor, {
				userId, attributes: attributeDeltas, withdrawal: true
			});
		}

		return attributeDeltas;

	}

	static async _transferAttributes(sourceUuid, targetUuid, attributes, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const sourceDocument = Utilities.getDocument(sourceUuid);
		const targetDocument = Utilities.getDocument(targetUuid);

		const sourceTransaction = new Transaction(sourceDocument);
		await sourceTransaction.appendDocumentChanges(attributes, { remove: true });
		const sourceUpdates = sourceTransaction.prepare();

		const targetTransaction = new Transaction(targetDocument);
		await targetTransaction.appendDocumentChanges(sourceUpdates.attributeDeltas);
		const targetUpdates = targetTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ATTRIBUTE.PRE_TRANSFER, sourceDocument, sourceUpdates.actorUpdates, targetDocument, targetUpdates.actorUpdates, interactionId);
		if (hookResult === false) return false;

		await sourceTransaction.commit();
		const { attributeDeltas } = await targetTransaction.commit();

		await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, CONSTANTS.HOOKS.ATTRIBUTE.TRANSFER, sourceUuid, targetUuid, attributeDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_ATTRIBUTES,
			source: sourceUuid,
			target: targetUuid,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		};
		await this._executeItemPileMacro(sourceUuid, macroData);
		await this._executeItemPileMacro(targetUuid, macroData);

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);

		const itemPileUuid = sourceIsItemPile ? sourceUuid : targetUuid;
		const itemPile = sourceIsItemPile ? Utilities.getToken(sourceUuid) : Utilities.getToken(targetUuid);

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(itemPileUuid);
		} else if (PileUtilities.isItemPileLootable(itemPile)) {
			if (PileUtilities.isItemPileEmpty(itemPile)) {
				await SharingUtilities.clearItemPileSharingData(itemPile);
			} else {
				await SharingUtilities.setItemPileSharingData(sourceUuid, targetUuid, {
					attributes: attributeDeltas
				});
			}
		} else if (!skipVaultLogging && (PileUtilities.isItemPileVault(sourceActor) || PileUtilities.isItemPileVault(targetActor))) {
			const pileActor = sourceIsItemPile ? sourceActor : targetActor;
			const actorToLog = sourceIsItemPile ? targetActor : sourceActor;
			await PileUtilities.updateVaultLog(pileActor, {
				userId, actor: actorToLog, attributes: attributeDeltas, withdrawal: sourceIsItemPile
			});
		}

		return attributeDeltas;

	}

	static async _transferAllAttributes(sourceUuid, targetUuid, userId, {
		skipVaultLogging = false, interactionId = false
	} = {}) {

		const sourceDocument = Utilities.getDocument(sourceUuid);
		const targetDocument = Utilities.getDocument(targetUuid);

		const sourceAttributes = PileUtilities.getActorCurrencies(sourceDocument).filter(entry => entry.type === "attribute");
		const attributesToTransfer = sourceAttributes.filter(attribute => {
			return foundry.utils.hasProperty(targetActor, attribute.data.path);
		}).map(attribute => attribute.data.path);

		const sourceTransaction = new Transaction(sourceDocument);
		await sourceTransaction.appendDocumentChanges(attributesToTransfer, { remove: true });
		const sourceUpdates = sourceTransaction.prepare();

		const targetTransaction = new Transaction(targetDocument);
		await targetTransaction.appendDocumentChanges(sourceUpdates.attributeDeltas);
		const targetUpdates = targetTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ATTRIBUTE.PRE_TRANSFER_ALL, sourceDocument, sourceUpdates.actorUpdates, targetDocument, targetUpdates.actorUpdates, interactionId);
		if (hookResult === false) return false;

		await sourceTransaction.commit();
		const { attributeDeltas } = await targetTransaction.commit();

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ATTRIBUTE.TRANSFER_ALL, sourceUuid, targetUuid, attributeDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_ALL_ATTRIBUTES,
			source: sourceUuid,
			target: targetUuid,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		};
		await this._executeItemPileMacro(sourceUuid, macroData);
		await this._executeItemPileMacro(targetUuid, macroData);

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);

		const itemPileUuid = sourceIsItemPile ? sourceUuid : targetUuid;

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(itemPileUuid);
		}

		return attributeDeltas;

	}

	static async _transferEverything(sourceUuid, targetUuid, userId, { itemFilters = false, interactionId } = {}) {

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const itemsToTransfer = PileUtilities.getActorItems(sourceActor, { itemFilters }).map(item => item.toObject());

		const sourceCurrencies = PileUtilities.getActorCurrencies(sourceActor);

		const itemCurrenciesToTransfer = sourceCurrencies
			.filter(currency => currency.type === "item")
			.map(currency => ({ id: currency.id, quantity: currency.quantity }));

		const attributesToTransfer = sourceCurrencies
			.filter(entry => entry.type === "attribute")
			.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

		const sourceTransaction = new Transaction(sourceActor);
		await sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true });
		await sourceTransaction.appendItemChanges(itemCurrenciesToTransfer, {
			remove: true, type: "currency"
		});
		await sourceTransaction.appendDocumentChanges(attributesToTransfer, { remove: true, type: "currency" });
		const sourceUpdates = sourceTransaction.prepare();

		const targetTransaction = new Transaction(targetActor);
		await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
		await targetTransaction.appendDocumentChanges(sourceUpdates.attributeDeltas);
		const targetUpdates = targetTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PRE_TRANSFER_EVERYTHING, sourceActor, sourceUpdates, targetActor, targetUpdates, interactionId);
		if (hookResult === false) return false;

		await sourceTransaction.commit();
		const { itemDeltas, attributeDeltas } = await targetTransaction.commit();

		await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, CONSTANTS.HOOKS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_EVERYTHING,
			source: sourceUuid,
			target: targetUuid,
			items: itemDeltas,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		};
		await this._executeItemPileMacro(sourceUuid, macroData);
		await this._executeItemPileMacro(targetUuid, macroData);

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(sourceUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(sourceUuid);
		}

		return {
			itemsTransferred: itemDeltas, attributesTransferred: attributeDeltas
		};

	}

	static async _combineItemPiles(targetUuid, sourceUuids, userId, {
		itemFilters = false,
		targetItemPileFlags = false,
		interactionId
	} = {}) {

		const sourceActors = sourceUuids.map(Utilities.getActor);
		const targetActor = Utilities.getActor(targetUuid);

		const targetTransaction = new Transaction(targetActor);

		const sourceTransactions = [];
		for (const sourceActor of sourceActors) {

			const itemsToTransfer = PileUtilities.getActorItems(sourceActor, { itemFilters })
				.map(item => item.toObject());

			const sourceCurrencies = PileUtilities.getActorCurrencies(sourceActor);

			const itemCurrenciesToTransfer = sourceCurrencies
				.filter(currency => currency.type === "item")
				.map(currency => ({ id: currency.id, quantity: currency.quantity }));

			const attributesToTransfer = sourceCurrencies
				.filter(entry => entry.type === "attribute")
				.map(currency => ({ path: currency.data.path, quantity: currency.quantity }));

			const sourceTransaction = new Transaction(sourceActor);
			await sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true });
			await sourceTransaction.appendItemChanges(itemCurrenciesToTransfer, {
				remove: true, type: "currency"
			});
			await sourceTransaction.appendDocumentChanges(attributesToTransfer, { remove: true, type: "currency" });
			const sourceUpdates = sourceTransaction.prepare();

			await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
			await targetTransaction.appendDocumentChanges(sourceUpdates.attributeDeltas);

			sourceTransactions.push({ transaction: sourceTransaction, updates: sourceUpdates });

		}

		const targetUpdates = targetTransaction.prepare();
		const sourceUpdates = sourceTransactions.map(data => data.updates)

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PRE_TRANSFER_EVERYTHING, sourceActors, sourceUpdates, targetActor, targetUpdates, interactionId);
		if (hookResult === false) return false;

		await Promise.allSettled(sourceTransactions.map(data => data.transaction.commit()));
		const { itemDeltas, attributeDeltas } = await targetTransaction.commit();

		if (targetItemPileFlags) {
			const flags = PileUtilities.cleanFlagData(foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, targetItemPileFlags));
			await PileUtilities.updateItemPileData(targetActor, flags);
		}

		await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, CONSTANTS.HOOKS.TRANSFER_EVERYTHING, sourceUuids, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);

		const macroData = {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRANSFER_EVERYTHING,
			sources: sourceUuids,
			target: targetUuid,
			items: itemDeltas,
			attributes: attributeDeltas,
			userId: userId,
			interactionId: interactionId
		};
		await Promise.allSettled(sourceUuids.map(uuid => this._executeItemPileMacro(uuid, { ...macroData, source: uuid })));
		await this._executeItemPileMacro(targetUuid, { ...macroData, source: false });

		const tokensToDelete = sourceUuids
			.filter(PileUtilities.shouldItemPileBeDeleted)
			.map(Utilities.getToken)
			.map(Utilities.getDocument)
			.filter(Boolean)
			.reduce((acc, doc) => {
				acc[doc.parent.id] ??= [];
				acc[doc.parent.id].push(doc.id);
				return acc;
			}, {});

		for (const [sceneId, tokenIds] of Object.entries(tokensToDelete)) {
			const scene = game.scenes.get(sceneId);
			if (scene) await scene.deleteEmbeddedDocuments("Token", tokenIds);
		}

		return {
			itemsTransferred: itemDeltas, attributesTransferred: attributeDeltas, deletedTokens: tokensToDelete
		};

	}

	static async _commitDocumentChanges(documentUuid, {
		documentChanges = {}, itemsToUpdate = [], itemsToDelete = [], itemsToCreate = []
	} = {}) {
		const targetDocument = Utilities.getDocument(documentUuid);
		if (!foundry.utils.isEmpty(documentChanges)) {
			await targetDocument.update(documentChanges);
		}
		const createdItems = itemsToCreate.length
			? await targetDocument.createEmbeddedDocuments("Item", itemsToCreate, { keepId: true, keepEmbeddedIds: true })
			: [];
		if (itemsToUpdate.length) await targetDocument.updateEmbeddedDocuments("Item", itemsToUpdate);
		if (itemsToDelete.length) await targetDocument.deleteEmbeddedDocuments("Item", itemsToDelete);
		return createdItems.map(item => item.toObject());
	}

	/**
	 * If not given an actor, this method creates an item pile at a location, then adds an item to it.
	 *
	 * If a target was provided, it will just add the item to that target actor.
	 *
	 * If an actor was provided, it will transfer the item from the actor to the target actor.
	 *
	 * @param {String} userId
	 * @param {String} sceneId
	 * @param {String/Boolean} [sourceUuid=false]
	 * @param {String/Boolean} [targetUuid=false]
	 * @param {Object/Boolean} [position=false]
	 * @param {Number/Boolean} [elevation=false]
	 * @param {Object} [itemData=false]
	 *
	 * @returns {sourceUuid: string/boolean, targetUuid: string/boolean, position: object/boolean, itemsDropped: array }
	 */
	static async _dropItems({
		userId, sceneId, sourceUuid = false, targetUuid = false, itemData = false, position = false, elevation = false
	} = {}) {

		let itemsDropped;

		foundry.utils.setProperty(itemData.item, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE, itemData?.quantity ?? 1);
		const containerItems = [itemData.item];
		const item = fromUuidSync(itemData.uuid);
		const handler = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.TRANSFER, item.type);
		if (handler) handler({ item, items: containerItems });
		const items = containerItems.map(item => ({
			item,
			flags: undefined,
			quantity: Utilities.getItemQuantity(item)
		}));

		// If there's a source of the item (it wasn't dropped from the item bar)
		if (sourceUuid) {

			// If there's a target token, add the item to it, otherwise create a new pile at the drop location
			if (targetUuid) {
				itemsDropped = await this._transferItems(sourceUuid, targetUuid, items, userId);
			} else {

				itemsDropped = (await this._removeItems(sourceUuid, items, userId)).map(item => {
					item.quantity = Math.abs(item.quantity)
					Utilities.setItemQuantity(item.item, Math.abs(item.quantity), true);
					return item;
				});
				targetUuid = await this._createItemPile({
					sceneId, position, items: itemsDropped, tokenOverrides: {
						elevation: elevation || fromUuidSync(sourceUuid)?.elevation || 0
					}, checkContainers: false
				})
			}

			// If there's no source (it was dropped from the item bar)
		} else {

			// If there's a target token, add the item to it, otherwise create a new pile at the drop location
			if (targetUuid) {
				itemsDropped = await this._addItems(targetUuid, items, userId);
			} else {
				targetUuid = await this._createItemPile({
					sceneId, position, items: items.map(data => data.item), tokenOverrides: { elevation: elevation || 0 }
				});
			}

		}

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.ITEM.DROP, sourceUuid, targetUuid, itemsDropped, position);

		return { sourceUuid, targetUuid, position, itemsDropped };

	}

	static async _createItemPile({
		sceneId = null,
		position = false,
		actor = false,
		createActor = false,
		items = false,
		tokenOverrides = {},
		actorOverrides = {},
		itemPileFlags = {},
		folders = false
	} = {}) {

		let returns = {};

		let pileActor;

		if (createActor) {

			const pileDataDefaults = PileUtilities.getPileActorDefaults({ ...itemPileFlags, enabled: true });

			const actorData = {
				name: actor || "New Item Pile", type: Helpers.getSetting("actorClassType"), img: "icons/svg/item-bag.svg"
			};

			if (folders) {
				const folder = await Utilities.createFoldersFromNames(folders);
				if (folder) {
					actorData.folder = folder.id;
				}
			}

			pileActor = await Actor.create(actorData);

			const prototypeTokenData = foundry.utils.mergeObject({
				name: "Item Pile",
				actorLink: false,
				bar1: { attribute: "" },
				vision: false,
				displayName: 50,
				[CONSTANTS.FLAGS.PILE]: pileDataDefaults,
				[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(), ...Helpers.getSetting(SETTINGS.TOKEN_FLAG_DEFAULTS)
			}, tokenOverrides)

			const actorUpdate = foundry.utils.mergeObject({
				[CONSTANTS.FLAGS.PILE]: pileDataDefaults,
				[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(),
				prototypeToken: prototypeTokenData,
			}, actorOverrides)

			await pileActor.update(actorUpdate);

		} else if (!actor) {

			const defaultItemPileId = Helpers.getSetting(SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID);
			pileActor = game.actors.get(defaultItemPileId);

			if (!pileActor) {

				Helpers.custom_notify("A Default Item Pile has been added to your Actors list. You can configure the default look and behavior on it, or duplicate it to create different styles.")

				let pileDataDefaults = foundry.utils.deepClone(CONSTANTS.PILE_DEFAULTS);

				pileDataDefaults.enabled = true;
				if (foundry.utils.isEmpty(itemPileFlags)) {
					pileDataDefaults.deleteWhenEmpty = true;
					pileDataDefaults.displayOne = true;
					pileDataDefaults.showItemName = true;
					pileDataDefaults.overrideSingleItemScale = true;
					pileDataDefaults.singleItemScale = 0.75;
				}

				pileDataDefaults = foundry.utils.mergeObject(pileDataDefaults, itemPileFlags);

				const actorData = {
					name: "Default Item Pile", type: Helpers.getSetting("actorClassType"), img: "icons/svg/item-bag.svg"
				};

				if (folders) {
					const folder = await Utilities.createFoldersFromNames(folders);
					if (folder) {
						actorData.folder = folder.id;
					}
				}

				pileActor = await Actor.create(actorData);

				await pileActor.update({
					[CONSTANTS.FLAGS.PILE]: pileDataDefaults,
					[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(),
					prototypeToken: {
						name: "Item Pile",
						actorLink: false,
						bar1: { attribute: "" },
						vision: false,
						displayName: 50,
						[CONSTANTS.FLAGS.PILE]: pileDataDefaults,
						[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(), ...Helpers.getSetting(SETTINGS.TOKEN_FLAG_DEFAULTS)
					}
				})

				await game.settings.set(CONSTANTS.MODULE_NAME, SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID, pileActor.id);

			}

		} else {

			pileActor = await fromUuid(actor);

			if (!pileActor) {
				throw Helpers.custom_error("Could not find actor with UUID " + actor);
			}

		}

		if (items) {
			for (let i = 0; i < items.length; i++) {
				let itemData = items[i]?.item ?? items[i];
				itemData = new Item.implementation(itemData);
				itemData = itemData.toObject();
				if (SYSTEMS.DATA.ITEM_TRANSFORMER) {
					itemData = await SYSTEMS.DATA.ITEM_TRANSFORMER(itemData);
				}
				items[i] = itemData;
			}
		} else {
			items = []
		}

		items = items ? items.map(item => {
			return item.item ?? item;
		}) : [];

		if (position && sceneId) {

			let pileData = PileUtilities.getActorFlagData(pileActor);
			pileData.enabled = true;
			pileData = foundry.utils.mergeObject(pileData, itemPileFlags);

			let overrideData = foundry.utils.mergeObject({
				...position,
				...tokenOverrides,
				...Helpers.getSetting(SETTINGS.TOKEN_FLAG_DEFAULTS)
			}, {});

			if (!pileActor.prototypeToken.actorLink) {

				overrideData[CONSTANTS.ACTOR_DELTA_PROPERTY] = actorOverrides;

				const data = { data: pileData, items: [...items] };

				for (let index = 0; index < data.items.length; index++) {
					data.items[index] = new Item.implementation(data.items[index]);
				}

				const overrideImage = foundry.utils.getProperty(overrideData, "texture.src")
					?? foundry.utils.getProperty(overrideData, "img");
				const overrideScale = foundry.utils.getProperty(overrideData, "texture.scaleX")
					?? foundry.utils.getProperty(overrideData, "texture.scaleY")
					?? foundry.utils.getProperty(overrideData, "scale");

				const scale = PileUtilities.getItemPileTokenScale(pileActor, data, overrideScale);

				overrideData = foundry.utils.mergeObject(overrideData, {
					"texture.src": PileUtilities.getItemPileTokenImage(pileActor, data, overrideImage),
					"texture.scaleX": scale,
					"texture.scaleY": scale,
					"name": PileUtilities.getItemPileName(pileActor, data, overrideData?.name)
				});

			}

			const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_CREATE, overrideData, items);
			if (hookResult === false) return false;

			const tokenData = (await pileActor.getTokenDocument(overrideData)).toObject();

			const cleanItemPileConfig = PileUtilities.cleanFlagData(pileData);
			Utilities.deleteProperty(tokenData, CONSTANTS.FLAGS.PILE);
			foundry.utils.setProperty(tokenData, CONSTANTS.FLAGS.PILE, cleanItemPileConfig);
			if (!pileActor.prototypeToken.actorLink) {
				Utilities.deleteProperty(tokenData, CONSTANTS.ACTOR_DELTA_PROPERTY + "." + CONSTANTS.FLAGS.PILE);
				foundry.utils.setProperty(tokenData, CONSTANTS.ACTOR_DELTA_PROPERTY + "." + CONSTANTS.FLAGS.PILE, cleanItemPileConfig);
			}

			const scene = game.scenes.get(sceneId);

			const [tokenDocument] = await scene.createEmbeddedDocuments("Token", [tokenData]);

			if (items.length && !pileActor.prototypeToken.actorLink) {
				new Promise(async (resolve) => {
					await Helpers.wait(250);
					await Helpers.hooks.runWithout(async () => {
						const newItems = Utilities.ensureValidIds(tokenDocument.actor, items);
						await tokenDocument.actor.createEmbeddedDocuments("Item", newItems, {
							keepId: true,
							keepEmbeddedIds: true
						});
					});
					resolve();
				});
			}

			returns["tokenUuid"] = Utilities.getUuid(tokenDocument);

		} else if (pileActor.prototypeToken.actorLink) {

			if (items.length && !pileActor.prototypeToken.actorLink) {
				await Helpers.hooks.runWithout(async () => {
					const newItems = Utilities.ensureValidIds(pileActor, items);
					await pileActor.createEmbeddedDocuments("Item", newItems, { keepId: true, keepEmbeddedIds: true });
				});
			}

		}

		returns["actorUuid"] = pileActor.uuid;

		return returns;

	}

	static async _turnTokensIntoItemPiles(targetUuids, pileSettings = {}, tokenSettings = {}) {

		const tokenUpdateGroups = {};
		const actorUpdateGroups = {};

		for (const targetUuid of targetUuids) {

			const target = fromUuidSync(targetUuid);

			let targetItemPileSettings = PileUtilities.getActorFlagData(target);

			const defaultItemPileId = Helpers.getSetting(SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID);
			const defaultItemPileActor = game.actors.get(defaultItemPileId);
			if (defaultItemPileActor) {
				const defaultItemPileSettings = PileUtilities.getActorFlagData(defaultItemPileActor);
				targetItemPileSettings = foundry.utils.mergeObject(targetItemPileSettings, defaultItemPileSettings);
			}

			let specificPileSettings = foundry.utils.mergeObject(targetItemPileSettings, pileSettings);
			specificPileSettings.enabled = true;

			const targetItems = PileUtilities.getActorItems(target, { itemFilters: specificPileSettings.overrideItemFilters });
			const targetCurrencies = PileUtilities.getActorCurrencies(target, { currencyList: specificPileSettings.overrideCurrencies });

			const data = { data: specificPileSettings, items: targetItems, currencies: targetCurrencies };

			let specificTokenSettings = Helpers.isFunction(tokenSettings) ? await tokenSettings(target) : foundry.utils.deepClone(tokenSettings);

			const overrideImage = foundry.utils.getProperty(specificTokenSettings, "texture.src")
				?? foundry.utils.getProperty(specificTokenSettings, "img");
			const overrideScale = foundry.utils.getProperty(specificTokenSettings, "texture.scaleX")
				?? foundry.utils.getProperty(specificTokenSettings, "texture.scaleY")
				?? foundry.utils.getProperty(specificTokenSettings, "scale");

			const scale = PileUtilities.getItemPileTokenScale(target, data, overrideScale);

			specificTokenSettings = foundry.utils.mergeObject(specificTokenSettings, {
				"texture.src": PileUtilities.getItemPileTokenImage(target, data, overrideImage),
				"texture.scaleX": scale,
				"texture.scaleY": scale,
				"name": PileUtilities.getItemPileName(target, data, specificTokenSettings?.name)
			});

			const sceneId = targetUuid.split('.')[1];
			const tokenId = targetUuid.split('.')[3];

			if (!tokenUpdateGroups[sceneId]) {
				tokenUpdateGroups[sceneId] = []
			}

			tokenUpdateGroups[sceneId].push({
				"_id": tokenId, ...specificTokenSettings, [CONSTANTS.FLAGS.PILE]: specificPileSettings
			});

			if (target.isLinked) {
				if (actorUpdateGroups[target.actor.id]) continue;
				actorUpdateGroups[target.actor.id] = {
					"_id": target.actor.id, [CONSTANTS.FLAGS.PILE]: specificPileSettings
				}
			}
		}

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_TURN_INTO, tokenUpdateGroups, actorUpdateGroups);
		if (hookResult === false) return false;

		await Actor.updateDocuments(Object.values(actorUpdateGroups));

		for (const [sceneId, updateData] of Object.entries(tokenUpdateGroups)) {
			const scene = game.scenes.get(sceneId);
			await scene.updateEmbeddedDocuments("Token", updateData, { animate: false });
		}

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.PILE.TURN_INTO, tokenUpdateGroups, actorUpdateGroups);

		return targetUuids;

	}

	static async _revertTokensFromItemPiles(targetUuids, tokenSettings) {

		const actorUpdateGroups = {};
		const tokenUpdateGroups = {};

		for (const targetUuid of targetUuids) {

			let target = fromUuidSync(targetUuid);

			let specificPileSettings = PileUtilities.getActorFlagData(target);
			specificPileSettings.enabled = false;

			const sceneId = targetUuid.split('.')[1];
			const tokenId = targetUuid.split('.')[3];

			if (!tokenUpdateGroups[sceneId]) {
				tokenUpdateGroups[sceneId] = [];
			}

			const specificTokenSettings = Helpers.isFunction(tokenSettings) ? await tokenSettings(target) : foundry.utils.deepClone(tokenSettings);

			tokenUpdateGroups[sceneId].push({
				"_id": tokenId, ...specificTokenSettings, [CONSTANTS.FLAGS.PILE]: specificPileSettings
			});

			if (target.isLinked) {
				if (actorUpdateGroups[target.actor.id]) continue;
				actorUpdateGroups[target.actor.id] = {
					"_id": target.actor.id, [CONSTANTS.FLAGS.PILE]: specificPileSettings
				}
			}
		}

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_REVERT_FROM, tokenUpdateGroups, actorUpdateGroups);
		if (hookResult === false) return false;

		await Actor.updateDocuments(Object.values(actorUpdateGroups));

		for (const [sceneId, updateData] of Object.entries(tokenUpdateGroups)) {
			const scene = game.scenes.get(sceneId);
			await scene.updateEmbeddedDocuments("Token", updateData, { animate: false });
		}

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.PILE.REVERT_FROM, tokenUpdateGroups, actorUpdateGroups);

		return targetUuids;

	}

	static async _updateItemPile(targetUuid, newData, { interactingTokenUuid = false, tokenSettings = false } = {}) {

		const targetActor = Utilities.getActor(targetUuid);
		const interactingToken = interactingTokenUuid ? Utilities.getToken(interactingTokenUuid) : false;

		const oldData = PileUtilities.getActorFlagData(targetActor);

		const data = foundry.utils.mergeObject(foundry.utils.deepClone(oldData), foundry.utils.deepClone(newData));

		const diff = foundry.utils.diffObject(oldData, data);

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_UPDATE, targetActor, data, interactingToken, tokenSettings);
		if (hookResult === false) return false;

		await Helpers.wait(15);

		await PileUtilities.updateItemPileData(targetActor, data, tokenSettings);

		if (PileUtilities.isItemPileContainer(targetActor, data)) {
			if (diff?.closed === true) {
				await this._executeItemPileMacro(targetUuid, {
					action: CONSTANTS.MACRO_EXECUTION_TYPES.OPEN_ITEM_PILE, source: interactingTokenUuid, target: targetUuid
				});
			}
			if (diff?.locked === true) {
				await this._executeItemPileMacro(targetUuid, {
					action: CONSTANTS.MACRO_EXECUTION_TYPES.LOCK_ITEM_PILE, source: interactingTokenUuid, target: targetUuid
				});
			}
			if (diff?.locked === false) {
				await this._executeItemPileMacro(targetUuid, {
					action: CONSTANTS.MACRO_EXECUTION_TYPES.UNLOCK_ITEM_PILE, source: interactingTokenUuid, target: targetUuid
				});
			}
			if (diff?.closed === false) {
				await this._executeItemPileMacro(targetUuid, {
					action: CONSTANTS.MACRO_EXECUTION_TYPES.OPEN_ITEM_PILE, source: interactingTokenUuid, target: targetUuid
				});
			}
		}

		return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.UPDATED_PILE, targetUuid, diff, interactingTokenUuid);
	}

	static _updatedItemPile(targetUuid, diffData, interactingTokenUuid) {

		const target = Utilities.getToken(targetUuid);

		const interactingToken = interactingTokenUuid ? fromUuidSync(interactingTokenUuid) : false;

		if (foundry.utils.isEmpty(diffData)) return false;

		const data = PileUtilities.getActorFlagData(target);

		Helpers.hooks.callAll(CONSTANTS.HOOKS.PILE.UPDATE, target, diffData, interactingToken)

		if (PileUtilities.isItemPileContainer(target, data)) {
			if (diffData?.closed === true) {
				Helpers.hooks.callAll(CONSTANTS.HOOKS.PILE.CLOSE, target, interactingToken)
			}
			if (diffData?.locked === true) {
				Helpers.hooks.callAll(CONSTANTS.HOOKS.PILE.LOCK, target, interactingToken)
			}
			if (diffData?.locked === false) {
				Helpers.hooks.callAll(CONSTANTS.HOOKS.PILE.UNLOCK, target, interactingToken)
			}
			if (diffData?.closed === false) {
				Helpers.hooks.callAll(CONSTANTS.HOOKS.PILE.OPEN, target, interactingToken)
			}
		}
	}

	static async _deleteItemPile(targetUuid) {
		const target = Utilities.getToken(targetUuid);
		if (!target) return false;
		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_DELETE, target);
		if (hookResult === false) return false;
		return target.document.delete();
	}

	/* -------- PRIVATE ITEM PILE METHODS -------- */

	/**
	 * Checks whether a given item pile would need to update its images, text, and/or scale
	 *
	 * @param {foundry.abstract.Document} doc
	 * @param {object} changes
	 * @param {boolean} force
	 * @returns {*}
	 * @private
	 */
	static async _evaluateItemPileChange(doc, changes = {}, force = false) {
		const diff = foundry.utils.diffObject(doc, changes);
		const duplicatedChanges = foundry.utils.deepClone(diff);
		const target = doc?.token ?? doc;
		if (!Helpers.isResponsibleGM()) return;
		if (!force && !PileUtilities.shouldEvaluateChange(target, duplicatedChanges)) return;
		const targetUuid = target.uuid;
		return Helpers.debounceManager.setDebounce(targetUuid, async (uuid) => {
			if (!Utilities.getDocument(uuid)) return;
			const deleted = PileUtilities.shouldItemPileBeDeleted(uuid);
			if (deleted) return;
			await Helpers.hooks.runWithout(async () => {
				await PileUtilities.updateItemPileData(uuid);
			});
		})(targetUuid);
	}

	/**
	 * Pre-loads all images and sounds related to a given token document on the client-side.
	 *
	 * @param {TokenDocument} tokenDocument
	 * @return {Promise<boolean>}
	 */
	static async _preloadItemPileFiles(tokenDocument) {

		if (!PileUtilities.isItemPileContainer(tokenDocument)) return false;

		const pileData = PileUtilities.getActorFlagData(tokenDocument);

		if (Helpers.getSetting("preloadFiles")) {
			await Promise.allSettled(Object.entries(pileData).map(entry => {
				return new Promise(async (resolve) => {
					const [property, filePath] = entry;
					if (Array.isArray(filePath)) {
						return resolve();
					}
					const isImage = property.toLowerCase().includes("image");
					const isSound = property.toLowerCase().includes("sound");
					if ((!isImage && !isSound) || (!filePath || preloadedFiles.has(filePath))) return resolve();
					preloadedFiles.add(filePath);
					if (isImage) {
						await loadTexture(filePath);
						Helpers.debug(`Preloaded image: ${filePath}`);
					} else if (isSound) {
						Helpers.debug(`Preloaded sound: ${filePath}`);
						await AudioHelper.preloadSound(filePath);
					}
					resolve();
				});
			}));
		}

		Helpers.debug(`Initialized item pile with uuid ${tokenDocument.uuid}`);
	}

	/**
	 * This method will resolve any uuids and replace them with their corresponding documents.
	 * If the macroData has already been marked as reformatted, nothing will be done.
	 *
	 * @param {Object} macroData
	 * @return {Promise}
	 */
	static async _reformatMacroData(macroData) {
		if (macroData.reformatted) {
			return;
		}
		// Reformat macro data to contain useful information
		if (macroData.source) {
			macroData.source = fromUuidSync(macroData.source);
		}

		if (Array.isArray(macroData.target)) {

			macroData.target = macroData.target.map(target => fromUuidSync(target));

		} else {

			if (macroData.target) {
				macroData.target = fromUuidSync(macroData.target);
			}

			const sourceActor = macroData.source instanceof TokenDocument ? macroData.source.actor : macroData.source;
			const targetActor = macroData.target instanceof TokenDocument ? macroData.target.actor : macroData.target;

			if (macroData.items) {
				macroData.items = macroData.items.map(item => targetActor.items.get(item?.item?._id ?? item._id));
			}

			if (macroData.sourceItems) {
				macroData.sourceItems = macroData.sourceItems.map(item => sourceActor.items.get(item?.item?._id ?? item._id));
			}

			if (macroData.targetItems) {
				macroData.targetItems = macroData.targetItems.map(item => targetActor.items.get(item?.item?._id ?? item._id));
			}

		}
		macroData.reformatted = true;
	}

	/**
	 * This executes any macro that is configured on the item pile, providing the macro with extra data relating to the
	 * action that prompted the execution (if the advanced-macros module is installed)
	 *
	 * @param {String} targetUuid
	 * @param {Object} macroData
	 * @return {Promise/Boolean}
	 */
	static async _executeItemPileMacro(targetUuid, macroData) {

		const target = Utilities.getToken(targetUuid);

		if (!PileUtilities.isValidItemPile(target)) return;

		const pileData = PileUtilities.getActorFlagData(target);

		if (!pileData.macro) return;

		// Reformat macro data to contain useful information
		await this._reformatMacroData(macroData);

		return Utilities.runMacro(pileData.macro, macroData)
	}

	/**
	 * This handles any dropped data onto the canvas or a set item pile
	 *
	 * @param {canvas} canvas
	 * @param {Object} data
	 * @return {Promise}
	 */
	static async _dropData(canvas, data) {

		if (data.type !== "Item") return;

		let item = await Item.implementation.fromDropData(data);
		let itemData = item ? item.toObject() : false;

		if (!itemData) {
			console.error(data);
			throw Helpers.custom_error("Something went wrong when dropping this item!")
		}

		const dropData = {
			source: false, target: data?.target ?? false, elevation: data?.elevation, itemData: {
				item: itemData, quantity: 1, uuid: data?.uuid
			}, position: false
		};

		dropData.source = Utilities.getSourceActorFromDropData(data);

		if (!dropData.source && !game.user.isGM) {
			return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
		}

		const pre_drop_determined_hook = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_DROP_DETERMINED, dropData.source, dropData.target, dropData.itemData, dropData.position);
		if (pre_drop_determined_hook === false) return;

		let droppableDocuments = [];
		let x, y;

		if (dropData.target) {

			droppableDocuments.push(dropData.target);

		} else {

			const position = canvas.grid.getTopLeft(data.x, data.y);
			x = position[0];
			y = position[1];

			droppableDocuments = Utilities.getTokensAtLocation({ x, y })
				.map(token => Utilities.getDocument(token));

			if (droppableDocuments.length && game.modules.get("midi-qol")?.active && game.settings.get("midi-qol", "DragDropTarget")) {
				Helpers.custom_warning("You have Drag & Drop Targetting enabled in MidiQOL, which disables drag & drop items");
				return;
			}

			if (!droppableDocuments.length) {
				dropData.position = { x, y };
			}
		}

		const droppableItemPiles = droppableDocuments.filter(token => PileUtilities.isValidItemPile(token));
		const droppableNormalTokens = droppableDocuments.filter(token => !PileUtilities.isValidItemPile(token));

		dropData.target = droppableItemPiles?.[0] ?? droppableNormalTokens[0];

		const sourceIsVault = dropData.source ? PileUtilities.isItemPileVault(dropData.source) : false;
		const targetIsVault = PileUtilities.isItemPileVault(dropData.target);
		const targetIsItemPile = PileUtilities.isValidItemPile(droppableItemPiles[0]);

		const canGiveItems = Helpers.getSetting(SETTINGS.ENABLE_GIVING_ITEMS);
		const canDropItems = Helpers.getSetting(SETTINGS.ENABLE_DROPPING_ITEMS);

		const givingItem = canGiveItems && dropData.target && !targetIsItemPile;
		const droppingItem = canDropItems && (dropData.target || dropData.position);

		if ((sourceIsVault || targetIsVault) && dropData.target) {
			return this._depositWithdrawItem(dropData, sourceIsVault, targetIsVault);
		} else if (givingItem && canGiveItems) {
			return this._giveItem(dropData);
		} else if (droppingItem && canDropItems) {
			return this._dropItem(dropData);
		}

	}

	static async _depositWithdrawItem(dropData, sourceIsVault = false, targetIsVault = true) {

		const sourceActor = Utilities.getActor(dropData.source);
		const targetActor = Utilities.getActor(dropData.target);
		if (sourceActor && targetActor && sourceActor === targetActor) return;

		const vaultActor = (!sourceIsVault && targetIsVault) || !sourceActor ? targetActor : sourceActor;
		const localization = (!sourceIsVault && targetIsVault) || !sourceActor ? "DepositItem" : "WithdrawItem";

		const validItem = await PileUtilities.checkItemType(vaultActor, dropData.itemData.item);
		if (!validItem) return;
		dropData.itemData.item = validItem;

		const item = new Item.implementation(dropData.itemData.item);

		dropData.itemData.quantity = 1;
		if (PileUtilities.canItemStack(dropData.itemData.item, vaultActor)) {
			const itemQuantity = Utilities.getItemQuantity(dropData.itemData.item);
			if (itemQuantity > 1) {
				dropData.itemData.quantity = await DropItemDialog.show(item, vaultActor, {
					localizationTitle: localization
				});
			} else if (!itemQuantity || itemQuantity <= 0) {
				Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.ItemNoQuantity"), true);
				return;
			}
		}
		Utilities.setItemQuantity(dropData.itemData.item, dropData.itemData.quantity);

		let flagData = PileUtilities.getItemFlagData(dropData.itemData.item);
		if (!sourceIsVault && targetIsVault) {
			foundry.utils.setProperty(flagData, "x", dropData.gridPosition?.x ?? 0);
			foundry.utils.setProperty(flagData, "y", dropData.gridPosition?.y ?? 0);
		}
		foundry.utils.setProperty(dropData.itemData, CONSTANTS.FLAGS.ITEM, flagData);

		if (sourceActor) {
			return game.itempiles.API.transferItems(sourceActor, targetActor, [dropData.itemData], { interactionId: dropData.interactionId });
		}

		if (!game.user.isGM) return;

		return game.itempiles.API.addItems(targetActor, [dropData.itemData], { interactionId: dropData.interactionId });

	}

	static async _dropItem(dropData) {

		const sourceActor = Utilities.getActor(dropData.source);
		const targetActor = Utilities.getActor(dropData.target);
		if (sourceActor && targetActor && sourceActor === targetActor) return;

		if (dropData.target && PileUtilities.isItemPileMerchant(dropData.target)) return;

		const validItem = await PileUtilities.checkItemType(dropData.target, dropData.itemData.item);
		if (!validItem) return;
		dropData.itemData.item = validItem;

		if (dropData.target && !dropData.position && !game.user.isGM) {

			if (!(dropData.target instanceof Actor && dropData.source instanceof Actor)) {

				const sourceToken = canvas.tokens.placeables.find(token => token.actor === dropData.source);

				if (sourceToken) {

					const distance = Math.floor(Utilities.distance_between_rect(sourceToken, dropData.target.object) / canvas.grid.size) + 1

					const pileData = PileUtilities.getActorFlagData(dropData.target);

					const maxDistance = pileData?.distance ? pileData?.distance : Infinity;

					if (distance > maxDistance) {
						Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
						return;
					}
				}
			}

			if (game.itempiles.API.isItemPileLocked(dropData.target)) {
				Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileLocked"), true);
				return;
			}
		}

		dropData.itemData.quantity = 1;

		if (PileUtilities.canItemStack(dropData.itemData.item, targetActor)) {

			let itemQuantity = Utilities.getItemQuantity(dropData.itemData.item);

			if (!itemQuantity || itemQuantity <= 0) {
				Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.ItemNoQuantity"), true);
				return;
			}

			if (!hotkeyActionState.forceDropOneItem) {

				if (!dropData.skipCheck) {
					const item = new Item.implementation(dropData.itemData.item);
					itemQuantity = await DropItemDialog.show(item, dropData.target, { unlimitedQuantity: !dropData.source && game.user.isGM });
					if (!itemQuantity) return;
				}

				dropData.itemData.quantity = Number(itemQuantity);

			}
		}

		Utilities.setItemQuantity(dropData.itemData.item, dropData.itemData.quantity);

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_DROP, dropData.source, dropData.target, dropData.position, dropData.itemData);
		if (hookResult === false) return;

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DROP_ITEMS, {
			userId: game.user.id,
			sceneId: canvas?.scene?.id ?? "",
			sourceUuid: Utilities.getUuid(dropData.source),
			targetUuid: Utilities.getUuid(dropData.target),
			position: dropData.position,
			elevation: dropData.elevation,
			itemData: dropData.itemData
		});

	}

	static async _giveItem(dropData, options = {}) {

		const sourceActor = Utilities.getActor(dropData.source);
		const targetActor = Utilities.getActor(dropData.target);
		if (sourceActor === targetActor) return;

		const sourceUuid = Utilities.getUuid(sourceActor);
		const targetUuid = Utilities.getUuid(targetActor);

		const validItem = await PileUtilities.checkItemType(dropData.target, dropData.itemData.item);
		if (!validItem) return;
		dropData.itemData.item = validItem;

		const actorOwners = Object.entries(targetActor.ownership)
			.filter(entry => {
				return entry[0] !== "default" && entry[1] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
			})
			.map(entry => game.users.get(entry[0]))
			.sort(user => user.isGM ? 1 : -1);

		let user = actorOwners?.[0];

		if (user && !user?.active) {
			user = Helpers.getActiveGMs()?.[0];
		}

		if (user && !user?.active && !game.user.isGM) {
			return TJSDialog.prompt({
				title: game.i18n.localize("ITEM-PILES.Dialogs.GiveItemUserNotActive.Title"), content: {
					class: CustomDialog, props: {
						content: game.i18n.format("ITEM-PILES.Dialogs.GiveItemUserNotActive.Content", {
							actor_name: targetActor.name, user_name: user.name
						})
					}
				}
			});
		}

		const item = new Item.implementation(dropData.itemData.item);

		if (!sourceActor && game.user.isGM) {
			Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ItemAdded", {
				target_actor_name: targetActor.name, item_name: item.name
			}));
			return this._addItems(targetUuid, [dropData.itemData.item], game.user.id)
		}

		const gms = Helpers.getActiveGMs().map(user => user.id);

		if (user?.active || gms.length || game.user.isGM) {

			if (PileUtilities.canItemStack(dropData.itemData.item)) {
				let itemQuantity = Utilities.getItemQuantity(item);
				if ((!itemQuantity || itemQuantity <= 0)) {
					Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.ItemNoQuantity"), true);
					return;
				}
				if (!options?.skipQuantityDialog) {
					dropData.itemData.quantity = await DropItemDialog.show(item, dropData.target.actor, {
						localizationTitle: "GiveItem"
					});
				} else if (!dropData.itemData.quantity) {
					dropData.itemData.quantity = 1;
				}
			} else {
				dropData.itemData.quantity = 1;
			}

			Utilities.setItemQuantity(dropData.itemData.item, dropData.itemData.quantity);
			foundry.utils.setProperty(dropData.itemData, "quantity", dropData.itemData.quantity);

			if (Hooks.call(CONSTANTS.HOOKS.ITEM.PRE_GIVE, sourceActor, targetActor, dropData.itemData, user.id) === false) {
				return;
			}

			if ((!user || !user?.active || user === game.user) && game.user.isGM) {
				if (sourceActor) {
					Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ItemTransferred", {
						source_actor_name: sourceActor.name, target_actor_name: targetActor.name, item_name: item.name
					}));
					Hooks.callAll(CONSTANTS.HOOKS.ITEM.GIVE, sourceActor, targetActor, dropData.itemData, game.user.id, game.user.id, dropData?.secret);
					return this._transferItems(sourceUuid, targetUuid, [dropData.itemData], game.user.id)
				}
			}

			return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.GIVE_ITEMS, [user ? user.id : gms[0]], {
				userId: game.user.id, sourceUuid, targetUuid, itemData: dropData.itemData, secret: dropData?.secret
			});
		}
	}

	static async _giveItems({ userId, sourceUuid, targetUuid, itemData } = {}) {

		const sourceActor = Utilities.getActor(sourceUuid);
		const targetActor = Utilities.getActor(targetUuid);

		const item = new Item.implementation(itemData.item);

		const accepted = await TJSDialog.confirm({
			title: "Item Piles - " + game.i18n.localize("ITEM-PILES.Dialogs.ReceiveItem.Title"), content: {
				class: ReceiveItemsShell, props: {
					sourceActor, targetActor, quantity: itemData.quantity, item
				}
			}
		});

		if (accepted) {
			await PrivateAPI._addItems(targetUuid, [itemData], game.user.id);
		}

		return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.GIVE_ITEMS_RESPONSE, [userId], {
			userId: game.user.id, accepted, sourceUuid, targetUuid, itemData
		});

	}

	static async _giveItemsResponse({ userId, accepted, sourceUuid, targetUuid, itemData, secret } = {}) {
		const user = game.users.get(userId);
		if (accepted) {
			await ItemPileSocket.callHook(CONSTANTS.HOOKS.ITEM.GIVE, sourceUuid, targetUuid, itemData, game.user.id, userId, secret)
			await PrivateAPI._removeItems(sourceUuid, [itemData], game.user.id);
			return Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.GiveItemAccepted", { user_name: user.name }));
		}
		return Helpers.custom_warning(game.i18n.format("ITEM-PILES.Warnings.GiveItemDeclined", { user_name: user.name }), true);
	}

	static async _itemPileClicked(pileDocument) {

		if (!PileUtilities.isValidItemPile(pileDocument)) return;

		if (PileUtilities.isItemPileLootable(pileDocument) && !Helpers.isGMConnected()) {
			Helpers.custom_warning(`Item Piles requires a GM to be connected for players to be able to loot item piles.`, true)
			return;
		}

		const pileToken = pileDocument.object;

		Helpers.debug(`Clicked: ${pileDocument.uuid}`);

		const pileData = PileUtilities.getActorFlagData(pileDocument);

		const maxDistance = pileData.distance ? pileData.distance : Infinity;

		let validTokens = [];

		let playerToken = false;
		if (game.user.character) {
			playerToken = canvas.tokens.placeables.find(token => token.actor === game.user.character && Utilities.tokens_close_enough(pileToken, token, maxDistance));
		}

		if (!playerToken && canvas.tokens.controlled.length > 0) {
			validTokens = [...canvas.tokens.controlled];
			validTokens = validTokens.filter(token => token.document !== pileDocument);
		} else if (game.user.character) {
			if (playerToken) {
				validTokens.push(playerToken);
			}
		}

		if (!validTokens.length && !game.user.isGM) {
			validTokens.push(...canvas.tokens.placeables);
			if (_token) {
				validTokens.unshift(_token);
			}
		}

		validTokens = validTokens.filter(token => token.isOwner && token.document !== pileDocument).filter(token => {
			return Utilities.tokens_close_enough(pileToken, token, maxDistance) || game.user.isGM;
		});

		let interactingActor;

		if (!validTokens.length && !game.user.isGM) {
			if (maxDistance === Infinity) {
				interactingActor = Utilities.getUserCharacter();
			}
			if (!interactingActor) {
				Helpers.custom_warning(game.i18n.localize(maxDistance === Infinity ? "ITEM-PILES.Errors.NoTokenFound" : "ITEM-PILES.Errors.PileTooFar"), true);
				return;
			}
		}

		if (!interactingActor && validTokens.length) {
			if (validTokens.includes(_token)) {
				interactingActor = _token.actor;
			} else if (validTokens.includes(playerToken)) {
				interactingActor = playerToken.actor;
			} else {
				validTokens.sort((potentialTargetA, potentialTargetB) => {
					return Utilities.grids_between_tokens(pileToken, potentialTargetA) - Utilities.grids_between_tokens(pileToken, potentialTargetB);
				});
				interactingActor = validTokens[0].actor;
			}
		}

		if (PileUtilities.isItemPileContainer(pileDocument) && interactingActor) {

			if (pileData.locked && !game.user.isGM) {
				Helpers.debug(`Attempted to open locked item pile with UUID ${pileDocument.uuid}`);
				return game.itempiles.API.rattleItemPile(pileDocument, interactingActor);
			}

			if (pileData.closed) {
				Helpers.debug(`Opened item pile with UUID ${pileDocument.uuid}`);
				await game.itempiles.API.openItemPile(pileDocument, interactingActor);
			}

		}

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_CLICK, pileDocument, interactingActor);
		if (hookResult === false) return;

		return this._renderItemPileInterface(pileDocument.uuid, { inspectingTargetUuid: interactingActor?.uuid });

	}

	static async _splitItemPileContents(itemPileUuid, actorUuids, userId, instigator) {

		const itemPileActor = Utilities.getActor(itemPileUuid);

		const items = PileUtilities.getActorItems(itemPileActor);
		const currencies = PileUtilities.getActorCurrencies(itemPileActor);

		const pileData = PileUtilities.getActorFlagData(itemPileActor);
		const shareData = SharingUtilities.getItemPileSharingData(itemPileActor);

		const tempPileTransaction = new Transaction(itemPileActor);

		const numPlayers = actorUuids.length;

		if (pileData.shareItemsEnabled) {
			const itemsToRemove = items.map(item => {
				const itemData = item.toObject();
				const quantity = Math.floor(Utilities.getItemQuantity(itemData) / numPlayers) * numPlayers;
				return {
					item: itemData, quantity
				}
			}).filter(entry => entry.quantity);
			await tempPileTransaction.appendItemChanges(itemsToRemove, { remove: true });
		}

		const currencyItems = currencies.filter(entry => entry.type === "item").map(entry => {
			const itemData = entry.item.toObject();
			const quantity = Math.floor(Utilities.getItemQuantity(itemData) / numPlayers) * numPlayers;
			return {
				item: itemData, quantity
			}
		}).filter(entry => entry.quantity);
		await tempPileTransaction.appendItemChanges(currencyItems, { remove: true, type: "currency" });

		const attributes = currencies.filter(entry => entry.type === "attribute").map(attribute => {
			return {
				...attribute, quantity: Math.floor(attribute.quantity / numPlayers) * numPlayers
			}
		});
		await tempPileTransaction.appendDocumentChanges(attributes, { remove: true, type: "currency" });

		if (SYSTEMS.DATA.ITEM_TYPE_HANDLERS) {
			for (const item of items) {
				if (!Utilities.hasItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.HAS_CURRENCY, item.type)) continue;
				const itemCurrencies = PileUtilities.getCurrenciesInItem(item, { forActor: itemPileActor });

				const attributes = itemCurrencies.filter(entry => entry.type === "attribute").map(attribute => {
					return {
						...attribute, quantity: Math.floor(attribute.quantity / numPlayers) * numPlayers
					}
				});
				await tempPileTransaction.appendEmbeddedChanges(item, attributes, { remove: true, type: "currency" });
			}
		}

		const preparedData = tempPileTransaction.prepare();

		const transactionMap = actorUuids.map(uuid => {
			return [uuid, new Transaction(Utilities.getActor(uuid))];
		});

		for (const [uuid, transaction] of transactionMap) {

			const clonedData = foundry.utils.deepClone(preparedData);

			if (pileData.shareItemsEnabled) {
				await transaction.appendItemChanges(clonedData.itemDeltas.filter(delta => delta.type === "item").map(delta => {
					delta.quantity = SharingUtilities.getItemSharesLeftForActor(itemPileActor, delta.item, transaction.document, {
						players: numPlayers, shareData: shareData, floor: true
					});
					return delta;
				}));
			}

			if (pileData.shareCurrenciesEnabled || pileData.splitAllEnabled) {
				await transaction.appendItemChanges(clonedData.itemDeltas.filter(delta => delta.type === "currency").map(delta => {
					delta.quantity = SharingUtilities.getItemSharesLeftForActor(itemPileActor, delta.item, transaction.document, {
						players: numPlayers, shareData: shareData, floor: true
					});
					return delta;
				}), { type: "currency" });

				await transaction.appendDocumentChanges(Object.entries(clonedData.attributeDeltas).map(entry => {
					let [path] = entry;
					const quantity = SharingUtilities.getAttributeSharesLeftForActor(itemPileActor, path, transaction.document, {
						players: numPlayers, shareData: shareData, floor: true
					});
					return { path, quantity };
				}));

			}
		}

		const actorPreparedData = Object.fromEntries(transactionMap.map(entry => [entry[0], entry[1].prepare()]));

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_SPLIT_INVENTORY, itemPileActor, preparedData, actorPreparedData, userId, instigator);
		if (hookResult === false) return false;

		const pileDeltas = await tempPileTransaction.commit();
		const actorDeltas = {};
		for (const [uuid, transaction] of transactionMap) {
			actorDeltas[uuid] = await transaction.commit();
		}

		await SharingUtilities.clearItemPileSharingData(itemPileActor);

		await ItemPileSocket.callHook(CONSTANTS.HOOKS.PILE.SPLIT_INVENTORY, itemPileUuid, pileDeltas, actorDeltas, userId, instigator);

		await this._executeItemPileMacro(itemPileUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.SPLIT_INVENTORY, source: itemPileUuid, target: actorUuids, transfers: {
				pileDeltas, actorDeltas
			}, userId: userId, instigator: instigator
		});

		const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
		if (shouldBeDeleted) {
			await this._deleteItemPile(itemPileUuid);
		}

		return {
			pileDeltas, actorDeltas
		};

	}

	static async _updateTokenHud() {
		if (!canvas.tokens.hud.rendered) return;
		return canvas.tokens.hud.render(true);
	}

	static async _renderItemPileInterface(targetUuid, {
		inspectingTargetUuid = false, useDefaultCharacter = false, remote = false
	} = {}) {

		const target = Utilities.getActor(targetUuid);

		let inspectingTarget;
		if (useDefaultCharacter) {
			inspectingTarget = Utilities.getUserCharacter();
		} else {
			inspectingTarget = inspectingTargetUuid ? fromUuidSync(inspectingTargetUuid) : false;
		}

		const hookResult = Hooks.call(CONSTANTS.HOOKS.PRE_RENDER_INTERFACE, target, inspectingTarget)
		if (hookResult === false) return;

		const result = await this._executeItemPileMacro(targetUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.RENDER_INTERFACE,
			source: inspectingTarget?.uuid ?? false,
			target: targetUuid,
			userId: game.user.id
		});
		if (result === false) return;

		if (PileUtilities.isItemPileVault(target)) {
			return BankVaultApp.show(target, inspectingTarget)
		}

		if (PileUtilities.isItemPileMerchant(target)) {
			return MerchantApp.show(target, inspectingTarget)
		}

		return ItemPileInventoryApp.show(target, inspectingTarget, { remote });

	}

	static async _unrenderItemPileInterface(targetUuid, { remote = false } = {}) {

		const target = Utilities.getActor(targetUuid);

		return Promise.allSettled(Object.values(ui.windows).filter(app => {
			return app.id.includes(`-${target.id}-`) || app?.actor === target || app?.merchant === target;
		}).map(app => app.close()));

	}

	static async _tradeItems(sellerUuid, buyerUuid, items, userId, { interactionId = false } = {}) {

		const sellingActor = Utilities.getActor(sellerUuid);
		const buyingActor = Utilities.getActor(buyerUuid);

		const itemPrices = PileUtilities.getPaymentData({
			purchaseData: items.map(data => {
				return {
					...data, item: sellingActor.items.get(data.id)
				}
			}), seller: sellingActor, buyer: buyingActor
		});

		const preCalcHookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_CALC_TRADE, sellingActor, buyingActor, itemPrices, userId, interactionId);
		if (preCalcHookResult === false) return false;

		const sellerTransaction = new Transaction(sellingActor);
		const sellerFlagData = PileUtilities.getActorFlagData(sellerTransaction);
		const sellerIsMerchant = PileUtilities.isItemPileMerchant(sellingActor, sellerFlagData);
		const sellerInfiniteQuantity = sellerIsMerchant && sellerFlagData.infiniteQuantity;
		const sellerInfiniteCurrencies = sellerIsMerchant && sellerFlagData.infiniteCurrencies;
		const sellerKeepZeroQuantity = sellerIsMerchant && sellerFlagData.keepZeroQuantity;

		for (const payment of itemPrices.sellerReceive) {
			if (!payment.quantity) continue;
			if (payment.type === "attribute") {
				await sellerTransaction.appendDocumentChanges([{
					path: payment.data.path, quantity: payment.quantity
				}], { type: payment.isCurrency ? "currency" : payment.type });
			} else {
				await sellerTransaction.appendItemChanges([{
					item: payment.data.item, quantity: payment.quantity
				}], { type: payment.isCurrency ? "currency" : payment.type });
			}
		}

		for (const entry of itemPrices.buyerReceive) {
			if (!entry.quantity) {
				continue;
			}
			const onlyDelta = (sellerInfiniteCurrencies && entry.isCurrency) || (sellerInfiniteQuantity && !entry.isCurrency);
			if (entry.type === "attribute") {
				await sellerTransaction.appendDocumentChanges([{
					path: entry.data.path, quantity: entry.quantity
				}], {
					remove: true, type: entry.isCurrency ? "currency" : entry.type, onlyDelta
				});
			} else {
				const itemFlagData = PileUtilities.getItemFlagData(entry.item);
				const itemInfiniteQuantity = {
					"default": sellerFlagData?.infiniteQuantity ?? false, "yes": true, "no": false
				}[itemFlagData.infiniteQuantity ?? "default"];
				if (sellerIsMerchant && itemInfiniteQuantity) continue;
				await sellerTransaction.appendItemChanges([{
					item: entry.item, quantity: entry.quantity
				}], {
					remove: true,
					type: entry.isCurrency ? "currency" : entry.type,
					keepIfZero: itemFlagData.isService || sellerKeepZeroQuantity || itemFlagData.keepZeroQuantity,
					onlyDelta
				});
			}
		}

		const buyerTransaction = new Transaction(buyingActor);
		const buyerFlagData = PileUtilities.getActorFlagData(buyingActor);
		const buyerIsMerchant = PileUtilities.isItemPileMerchant(buyingActor, buyerFlagData);
		const buyerInfiniteCurrencies = buyerIsMerchant && buyerFlagData.infiniteCurrencies;
		const buyerInfiniteQuantity = buyerIsMerchant && buyerFlagData.infiniteQuantity;
		const buyerHidesNewItems = buyerIsMerchant && buyerFlagData.hideNewItems;

		for (const price of itemPrices.finalPrices) {
			if (!price.quantity) {
				continue;
			}
			const onlyDelta = (buyerInfiniteCurrencies && price.isCurrency) || (buyerInfiniteQuantity && !price.isCurrency);
			if (price.type === "attribute") {
				await buyerTransaction.appendDocumentChanges([{
					path: price.data.path, quantity: price.quantity
				}], { remove: true, type: price.isCurrency ? "currency" : price.type, onlyDelta });
			} else {
				await buyerTransaction.appendItemChanges([{
					item: price.data.item, quantity: price.quantity
				}], { remove: true, type: price.isCurrency ? "currency" : price.type, onlyDelta });
			}
		}

		for (const entry of itemPrices.buyerReceive) {
			if (!entry.quantity) continue;
			if (entry.type === "attribute") {
				await buyerTransaction.appendDocumentChanges([{
					path: entry.data.path, quantity: entry.quantity
				}], { type: entry.type });
			} else {
				const itemFlagData = PileUtilities.getItemFlagData(entry.item);
				if (itemFlagData.isService) continue;
				const item = entry.item.toObject();
				if (buyerHidesNewItems) {
					foundry.utils.setProperty(item, CONSTANTS.FLAGS.ITEM + '.hidden', true);
				}
				await buyerTransaction.appendItemChanges([{
					item: item, quantity: entry.quantity
				}], { type: entry.type });
			}
		}

		for (const change of itemPrices.buyerChange) {
			if (!change.quantity) continue;
			if (change.type === "attribute") {
				await buyerTransaction.appendDocumentChanges([{
					path: change.data.path, quantity: change.quantity
				}], { type: "currency" });
			} else {
				await buyerTransaction.appendItemChanges([{
					item: change.data.item, quantity: change.quantity
				}], { type: "currency" });
			}
		}

		const sellerUpdates = sellerTransaction.prepare();
		const buyerUpdates = buyerTransaction.prepare();

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.ITEM.PRE_TRADE, sellingActor, sellerUpdates, buyingActor, buyerUpdates, userId, interactionId);
		if (hookResult === false) return false;

		const sellerTransactionData = await sellerTransaction.commit();
		const buyerTransactionData = await buyerTransaction.commit();

		const itemPileActorUuid = sellerIsMerchant ? sellerUuid : buyerUuid;

		await this._executeItemPileMacro(itemPileActorUuid, {
			action: CONSTANTS.MACRO_EXECUTION_TYPES.TRADE_ITEMS,
			source: sellerUuid,
			target: buyerUuid,
			sourceIsMerchant: sellerIsMerchant,
			sourceItems: sellerTransactionData.itemDeltas,
			sourceAttributes: sellerTransactionData.attributeDeltas,
			targetItems: buyerTransactionData.itemDeltas,
			targetAttributes: buyerTransactionData.attributeDeltas,
			prices: itemPrices,
			userId: userId,
			interactionId: interactionId
		});

		const merchantFlagData = sellerIsMerchant ? sellerFlagData : buyerFlagData;
		if (merchantFlagData.logMerchantActivity) {
			const merchantActor = sellerIsMerchant ? sellingActor : buyingActor;
			const regularActor = sellerIsMerchant ? buyingActor : sellingActor;
			await PileUtilities.updateMerchantLog(merchantActor, {
				type: "transaction",
				actor: regularActor.name,
				user: userId,
				item: itemPrices["buyerReceive"][0].name,
				qty: itemPrices["buyerReceive"][0].quantity,
				price: itemPrices.basePriceString,
				sold: !sellerIsMerchant
			})
		}

		if (sellerIsMerchant) {
			for (let entry of itemPrices.buyerReceive) {
				const itemFlagData = PileUtilities.getItemFlagData(entry.item);
				if (!itemFlagData.macro) continue;
				await Utilities.runMacro(itemFlagData.macro, {
					seller: sellingActor, buyer: buyingActor, item: entry.item, quantity: entry.quantity, userId
				});
			}
		}

		await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, CONSTANTS.HOOKS.ITEM.TRADE, sellerUuid, buyerUuid, itemPrices, userId, interactionId);

		return {
			itemDeltas: buyerTransactionData.itemDeltas, attributeDeltas: buyerTransactionData.attributeDeltas, itemPrices
		};

	}

	static async _rollItemTable({
		table = "",
		timesToRoll = "1",
		resetTable = true,
		normalizeTable = false,
		displayChat = false,
		rollData = {},
		customCategory = false,
		targetActor = false,
		removeExistingActorItems = false,
		userId = false,
	} = {}) {

		let items = await PileUtilities.rollTable({
			tableUuid: table,
			formula: timesToRoll,
			normalize: normalizeTable,
			resetTable,
			displayChat,
			rollData,
			customCategory
		});

		if (targetActor) {
			const itemsToAdd = items.map((item) => {
				const actualItem = item.item.toObject();
				return Utilities.setItemQuantity(actualItem, item.quantity);
			});
			items = await this._addItems(targetActor, itemsToAdd, userId, { removeExistingActorItems });
		}

		return items;

	}

	static async _refreshMerchantInventory(merchantUuid, {
		removeExistingActorItems = false,
		userId = false
	} = {}) {

		const merchant = Utilities.getActor(merchantUuid);

		const items = await PileUtilities.rollMerchantTables({ actor: merchant });

		const itemsToAdd = items.map((item) => {
			const actualItem = item.item.toObject();
			return Utilities.setItemQuantity(actualItem, item.quantity);
		});

		return this._addItems(merchantUuid, itemsToAdd, userId, { removeExistingActorItems });

	}

}
