import * as Utilities from "./utilities.js";
import * as PileUtilities from "./pile-utilities.js";
import ItemPileSocket from "../socket.js";
import PrivateAPI from "../API/private-api.js";
import { SYSTEMS } from "../systems.js";
import CONSTANTS from "../constants/constants.js";

export default class Transaction {

	constructor(document) {
		this.document = document;
		this.documentFlags = PileUtilities.getActorFlagData(this.document);
		this.itemsToCreate = [];
		this.itemUpdates = {};
		this.itemsToUpdate = [];
		this.itemsToDelete = [];
		this.itemsToForceDelete = new Set();
		this.itemsToNotDelete = new Set();
		this.documentChanges = {};
		this.attributeDeltas = new Map();
		this.attributeTypeMap = new Map();
		this.itemDeltas = new Map();
		this.itemTypeMap = new Map();
		this.itemFlagMap = new Map();
		this.preCommitted = false;
	}

	async appendItemChanges(items, {
		set = false, remove = false, type = "item", keepIfZero = false, onlyDelta = false,
	} = {}) {

		for (let data of items) {

			let item = data.item ?? data;

			type = PileUtilities.isItemCurrency(item) ? "currency" : type;

			let flags = data.flags ?? false;
			let itemData = item instanceof Item ? item.toObject() : foundry.utils.deepClone(item);
			if (SYSTEMS.DATA.ITEM_TRANSFORMER && !remove) {
				itemData = await SYSTEMS.DATA.ITEM_TRANSFORMER(itemData);
			}
			const incomingQuantity = set
				? Math.abs(data.quantity ?? Utilities.getItemQuantity(itemData))
				: Math.abs(data.quantity ?? Utilities.getItemQuantity(itemData)) * (remove ? -1 : 1);

			let itemId = itemData._id ?? itemData.id;
			let documentHasItem = false;
			let documentExistingItem = false;
			if (this.documentFlags.type === CONSTANTS.PILE_TYPES.VAULT && type !== "currency" && !remove) {
				const documentExistingItems = Utilities.findSimilarItem(this.document.items, itemData, {
					returnOne: false
				});
				documentExistingItem = documentExistingItems.find(item => {
					return PileUtilities.canItemStack(item, this.document) && (
						(
							foundry.utils.getProperty(itemData, CONSTANTS.FLAGS.ITEM + ".x") === undefined
							&&
							foundry.utils.getProperty(itemData, CONSTANTS.FLAGS.ITEM + ".y") === undefined
						)
						||
						PileUtilities.areItemsColliding(item, itemData)
					)
				});
			} else {
				documentHasItem = this.document.items.get(itemId);
				documentExistingItem = documentHasItem || Utilities.findSimilarItem(this.document.items, itemData);
			}

			const canItemStack = PileUtilities.canItemStack(documentExistingItem || itemData, this.document);

			if (remove && (keepIfZero || type === "currency")) {
				this.itemsToNotDelete.add(item.id);
			}

			if (flags) {
				this.itemFlagMap.set(itemId, flags);
			}

			if (documentExistingItem) {

				const itemQuantity = Utilities.getItemQuantity(documentExistingItem);

				if (itemQuantity > 1 || canItemStack) {

					const newQuantity = itemQuantity + incomingQuantity;

					const existingItemUpdate = remove
						? this.itemsToUpdate.find(item => item._id === itemId)
						: Utilities.findSimilarItem(this.itemsToUpdate, itemData);

					if (existingItemUpdate) {
						Utilities.setItemQuantity(existingItemUpdate, newQuantity);
						if (keepIfZero && type !== "currency") {
							foundry.utils.setProperty(existingItemUpdate, CONSTANTS.FLAGS.ITEM + ".notForSale", newQuantity === 0);
						}
					} else {
						const update = Utilities.setItemQuantity(documentExistingItem.toObject(), newQuantity);
						if (keepIfZero && type !== "currency") {
							foundry.utils.setProperty(update, CONSTANTS.FLAGS.ITEM + ".notForSale", newQuantity === 0);
						}
						this.itemTypeMap.set(documentExistingItem.id, type)
						this.itemsToUpdate.push(update);
					}

					this.itemDeltas.set(documentExistingItem.id, (this.itemDeltas.has(documentExistingItem.id) ? this.itemDeltas.get(documentExistingItem.id) : 0) + incomingQuantity);

				} else if (remove) {

					this.itemsToForceDelete.add(documentExistingItem.id);
					this.itemDeltas.set(documentExistingItem.id, (this.itemDeltas.has(documentExistingItem.id) ? this.itemDeltas.get(documentExistingItem.id) : 0) + incomingQuantity);

				} else {

					if (!itemData._id) {
						itemData._id = foundry.utils.randomID();
					}
					Utilities.setItemQuantity(itemData, incomingQuantity);
					this.itemsToCreate.push(itemData);
					this.itemTypeMap.set(itemData._id, type)

				}

			} else {
				const existingItemCreation = Utilities.findSimilarItem(this.itemsToCreate, itemData);
				if (existingItemCreation && canItemStack) {
					const newQuantity = Utilities.getItemQuantity(existingItemCreation) + incomingQuantity;
					Utilities.setItemQuantity(existingItemCreation, newQuantity);
				} else {
					if (!itemData._id) {
						itemData._id = foundry.utils.randomID();
					}
					Utilities.setItemQuantity(itemData, incomingQuantity);
					this.itemsToCreate.push(itemData);
					this.itemTypeMap.set(itemData._id, type)
				}
			}
		}
	}

	async appendDocumentChanges(attributes, {
		set = false, remove = false, type = "attribute", onlyDelta = false
	} = {}) {
		if (!Array.isArray(attributes)) {
			attributes = Object.entries(attributes).map(entry => ({ path: entry[0], quantity: entry[1] }));
		}
		this.documentChanges = attributes.reduce((acc, attribute) => {
			const incomingQuantity = Math.abs(attribute.quantity) * (remove ? -1 : 1);
			acc[attribute.path] = acc[attribute.path] ?? Number(foundry.utils.getProperty(this.document, attribute.path) ?? 0);
			if (set) {
				if (!onlyDelta) {
					acc[attribute.path] = incomingQuantity
				}
				this.attributeDeltas.set(attribute.path, (this.attributeDeltas.has(attribute.path) ? this.attributeDeltas.get(attribute.path) : acc[attribute.path]) + incomingQuantity);
			} else {
				if (!onlyDelta) {
					acc[attribute.path] += incomingQuantity
				}
				this.attributeDeltas.set(attribute.path, (this.attributeDeltas.has(attribute.path) ? this.attributeDeltas.get(attribute.path) : 0) + incomingQuantity);
			}
			this.attributeTypeMap.set(attribute.path, type)
			return acc;
		}, this.documentChanges);
	}

	async appendEmbeddedChanges(item, attributes, {
		set = false, remove = false, type = "attribute", onlyDelta = false
	} = {}) {

		if (!Array.isArray(attributes)) {
			attributes = Object.entries(attributes).map(entry => ({ path: entry[0], quantity: entry[1] }));
		}

		this.itemUpdates = attributes.reduce((acc, attribute) => {
			const incomingQuantity = Math.abs(attribute.quantity) * (remove ? -1 : 1);
			const itemIdPath = item.id + "-" + attribute.path;

			acc[item.id] = {
				[attribute.path]: acc[item.id]?.[attribute.path] ?? Number(foundry.utils.getProperty(item, attribute.path) ?? 0)
			};

			if (set) {
				if (!onlyDelta) {
					acc[item.id][attribute.path] = incomingQuantity;
				}
				this.attributeDeltas.set(attribute.path, this.attributeDeltas.has(attribute.path)
					? this.attributeDeltas.get(attribute.path)
					: foundry.utils.getProperty(acc[item.id], attribute.path) + incomingQuantity
				);
			} else {
				if (!onlyDelta) {
					acc[item.id][attribute.path] = acc[item.id][attribute.path] + incomingQuantity;
				}
				this.attributeDeltas.set(attribute.path, (this.attributeDeltas.has(attribute.path) ? this.attributeDeltas.get(attribute.path) : 0) + incomingQuantity);
			}

			return acc;
		}, this.itemUpdates);

	}

	prepare() {

		this.documentChanges = Object.fromEntries(Object.entries(this.documentChanges).filter(entry => {
			if (this.attributeDeltas.get(entry[0]) === 0) {
				this.attributeDeltas.delete(entry[0]);
			}
			return Number(foundry.utils.getProperty(this.document, entry[0])) !== entry[1];
		}))
		this.itemsToCreate = this.itemsToCreate.filter(item => {
			return !PileUtilities.canItemStack(item, this.document) || Utilities.getItemQuantity(item) > 0 || this.itemTypeMap.get(item._id) === "currency"
		}).map(item => {
			const flagData = PileUtilities.getItemFlagData(item);
			Utilities.deleteProperty(item, CONSTANTS.FLAGS.ITEM);
			foundry.utils.setProperty(item, CONSTANTS.FLAGS.ITEM, PileUtilities.cleanItemFlagData(flagData));
			return item;
		});
		this.itemsToDelete = this.itemsToUpdate.filter(item => {
			return Utilities.getItemQuantity(item) <= 0 && this.itemTypeMap.get(item._id) !== "currency";
		}).map(item => item._id).concat(Array.from(this.itemsToForceDelete));

		for (const itemId of this.itemsToDelete) {
			if (this.itemsToNotDelete.has(itemId)) {
				this.itemsToDelete.splice(this.itemsToDelete.indexOf(itemId), 1);
			}
		}

		this.itemDeltas = Array.from(this.itemDeltas).map(([id, quantity]) => {
			const item = this.document.items.get(id).toObject();
			const existingFlagData = PileUtilities.getItemFlagData(item);
			const newFlagData = this.itemFlagMap.get(id) ?? {};
			Utilities.deleteProperty(item, CONSTANTS.FLAGS.ITEM);
			foundry.utils.setProperty(item, CONSTANTS.FLAGS.ITEM, foundry.utils.mergeObject(existingFlagData, PileUtilities.cleanItemFlagData(newFlagData)));
			const type = this.itemTypeMap.get(id);
			Utilities.setItemQuantity(item, quantity, true);
			return { item, quantity, type };
		}).filter(delta => delta.quantity);

		this.itemsToUpdate = this.itemsToUpdate
			.filter(item => Utilities.getItemQuantity(item) > 0 || this.itemsToNotDelete.has(item._id) || this.itemTypeMap.get(item._id) === "currency")
			.filter(itemData => {
				const item = this.document.items.get(itemData._id)
				return Utilities.getItemQuantity(item) !== Utilities.getItemQuantity(itemData);
			});

		Object.entries(this.itemUpdates).forEach(([id, update]) => {
			update["_id"] = id;
			const existingUpdateIndex = this.itemsToUpdate.findIndex(existingUpdate => existingUpdate["_id"] === update["_id"]);
			if (existingUpdateIndex > -1) {
				this.itemsToUpdate[existingUpdateIndex] = foundry.utils.mergeObject(this.itemsToUpdate[existingUpdateIndex], update);
			} else {
				this.itemsToUpdate.push(update);
			}
		});

		this.attributeDeltas = Object.fromEntries(this.attributeDeltas);
		this.preCommitted = true;
		return {
			documentChanges: this.documentChanges,
			itemsToCreate: this.itemsToCreate,
			itemsToDelete: this.itemsToDelete,
			itemsToUpdate: this.itemsToUpdate,
			attributeDeltas: this.attributeDeltas,
			itemDeltas: this.itemDeltas
		}
	}

	async commit() {

		if (!this.preCommitted) {
			this.prepare();
		}

		let itemsCreated;
		const documentUuid = Utilities.getUuid(this.document);
		if (this.document.isOwner) {
			itemsCreated = await PrivateAPI._commitDocumentChanges(documentUuid, {
				documentChanges: this.documentChanges,
				itemsToUpdate: this.itemsToUpdate,
				itemsToDelete: this.itemsToDelete,
				itemsToCreate: this.itemsToCreate
			})
		} else {
			itemsCreated = await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMMIT_DOCUMENT_CHANGES, documentUuid, {
				documentChanges: this.documentChanges,
				itemsToUpdate: this.itemsToUpdate,
				itemsToDelete: this.itemsToDelete,
				itemsToCreate: this.itemsToCreate
			});
		}

		return {
			attributeDeltas: this.attributeDeltas, itemDeltas: this.itemDeltas.concat(itemsCreated.map(item => {
				return {
					item, quantity: PileUtilities.canItemStack(item) ? Utilities.getItemQuantity(item) : 1
				}
			}))
		}
	}
}
