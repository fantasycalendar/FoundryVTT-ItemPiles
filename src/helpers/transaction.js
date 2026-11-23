import * as Utilities from "./utilities.js";
import * as PileUtilities from "./pile-utilities.js";
import * as Helpers from "./helpers.js";
import ItemPileSocket from "../socket.js";
import PrivateAPI from "../API/private-api.js";
import { SYSTEMS } from "../systems.js";
import CONSTANTS from "../constants/constants.js";

const ITEM_FLAGS_KEY = CONSTANTS.FLAGS.ITEM.replace(/^flags\./, "");

// value === original + written. delta - written is the delta-only part, reported but never written.
function createValueRecord(original) {
	const value = Utilities.sanitizeNumber(original);
	return { original: value, value, delta: 0, written: 0 };
}

function applyValueChange(record, quantity, { set = false, remove = false, onlyDelta = false } = {}) {
	const current = record.value + (onlyDelta ? record.delta - record.written : 0);
	const next = set
		? Utilities.sanitizeNumber(quantity)
		: current + Math.abs(Utilities.sanitizeNumber(quantity)) * (remove ? -1 : 1);
	record.delta = Helpers.roundToDecimals(record.delta + next - current, PileUtilities.getCurrencyDecimals());
	if (!onlyDelta) {
		record.value = Helpers.roundToDecimals(next, PileUtilities.getCurrencyDecimals());
		record.written = record.delta;
	}
}

function createItemChange({ key, source, isNew, quantity, type = null }) {
	return {
		key,
		source,
		isNew,
		quantity: createValueRecord(quantity),
		fields: new Map(),
		itemFlagData: null,
		type,
		keepIfZero: false,
		notForSaleIfZero: false,
		hasQuantityChange: false
	};
}

function getFieldValues(change) {
	return Object.fromEntries(Array.from(change.fields).map(([path, record]) => [path, record.value]));
}

function cleanAttributes(attributes) {
	return Array.isArray(attributes)
		? attributes
		: Object.entries(attributes).map(([path, quantity]) => ({ path, quantity }));
}

// Written item data stores only non-default item-piles flags; reported itemDeltas carry the full set.
function setCleanItemFlagData(itemData, extraFlagData = {}) {
	const existingFlagData = PileUtilities.getItemFlagData(itemData);
	const flagData = foundry.utils.mergeObject(existingFlagData, extraFlagData, { inplace: false });
	Utilities.deleteProperty(itemData, CONSTANTS.FLAGS.ITEM);
	const cleanFlagData = removeOverheadCost(PileUtilities.cleanItemFlagData(flagData));
	foundry.utils.setProperty(itemData, CONSTANTS.FLAGS.ITEM, cleanFlagData);
	return itemData;
}

function setReportedItemFlagData(itemData, extraFlagData = {}) {
	const flagData = foundry.utils.mergeObject(PileUtilities.getItemFlagData(itemData), extraFlagData);
	Utilities.deleteProperty(itemData, CONSTANTS.FLAGS.ITEM);
	foundry.utils.setProperty(itemData, CONSTANTS.FLAGS.ITEM, removeOverheadCost(flagData));
	return itemData;
}

function removeOverheadCost(flagData) {
	if (!foundry.utils.hasProperty(flagData, "overheadCost")) return flagData;
	delete flagData.overheadCost;
	return Utilities.setForcedDeletion(flagData, "overheadCost");
}

// Each pending number lives in exactly one record. commit() writes the very payload object prepare() returned, so
// edits made to it by pre-hook listeners are committed.
export default class Transaction {

	constructor(document) {
		this.document = document;
		this.pileData = PileUtilities.getActorFlagData(this.document);
		this.attributes = new Map();
		this.embeddedDeltas = new Map();
		this.items = new Map();
		this.payload = null;
	}

	getAttributeValueRecord(path) {
		if (!this.attributes.has(path)) {
			this.attributes.set(path, createValueRecord(foundry.utils.getProperty(this.document, path)));
		}
		return this.attributes.get(path);
	}

	getItemChange(item) {
		if (!this.items.has(item.id)) {
			const quantity = Utilities.getItemQuantity(item);
			this.items.set(item.id, createItemChange({ key: item.id, source: item, isNew: false, quantity }));
		}
		return this.items.get(item.id);
	}

	addItemCreation(itemData, { type = "item" } = {}) {
		const key = foundry.utils.randomID();
		const change = createItemChange({ key, source: itemData, isNew: true, quantity: 0, type });
		this.items.set(key, change);
		return change;
	}

	getFieldValueRecord(change, path) {
		if (!change.fields.has(path)) {
			const original = change.isNew ? 0 : foundry.utils.getProperty(change.source, path);
			change.fields.set(path, createValueRecord(original));
		}
		return change.fields.get(path);
	}

	findTargetForItem(itemData, { remove = false, type = "item" } = {}) {
		const isVault = PileUtilities.isItemPileVault(this.document, this.pileData);
		let existingItem = false;
		// A positioned vault item only stacks onto an item it collides with; it never falls back to id or similarity
		// matching.
		if (isVault && type !== "currency" && !remove) {
			const unpositioned = foundry.utils.getProperty(itemData, CONSTANTS.FLAGS.ITEM + ".x") === undefined
				&& foundry.utils.getProperty(itemData, CONSTANTS.FLAGS.ITEM + ".y") === undefined;
			const similarItems = Utilities.findSimilarItem(this.document.items, itemData, { returnOne: false });
			existingItem = similarItems.find(item => {
				const fits = unpositioned || PileUtilities.areItemsColliding(item, itemData);
				return fits && PileUtilities.canItemStack(item, this.document);
			});
		} else {
			existingItem = this.document.items.get(itemData._id ?? itemData.id)
				|| Utilities.findSimilarItem(this.document.items, itemData);
		}
		if (existingItem) return { existingItem };
		const creations = Array.from(this.items.values()).filter(change => change.isNew);
		const pending = Utilities.findSimilarItem(creations.map(change => change.source), itemData);
		if (pending && PileUtilities.canItemStack(itemData, this.document)) {
			return { pendingCreation: creations.find(change => change.source === pending) };
		}
		return {};
	}

	async appendItemChanges(items, {
		set = false, remove = false, type = null, keepIfZero = false, onlyDelta = false
	} = {}) {
		this.payload = null;

		for (const data of items) {

			const item = data.item ?? data;
			const entryType = type ?? (PileUtilities.isItemCurrency(item) ? "currency" : "item");

			let itemData = item instanceof Item ? item.toObject() : foundry.utils.deepClone(item);
			if (SYSTEMS.DATA.ITEM_TRANSFORMER && !remove) {
				itemData = await SYSTEMS.DATA.ITEM_TRANSFORMER(itemData);
			}
			const quantity = Math.abs(Utilities.getRequestedQuantity(data, itemData));
			const entryFlagData = foundry.utils.getProperty(data.flags ?? {}, ITEM_FLAGS_KEY);

			const { existingItem, pendingCreation } = this.findTargetForItem(itemData, { remove, type: entryType });

			let change;
			if (existingItem) {
				const stacks = Utilities.getItemQuantity(existingItem) > 1
					|| PileUtilities.canItemStack(existingItem, this.document);
				change = (stacks || remove) ? this.getItemChange(existingItem) : null;
			} else if (pendingCreation) {
				change = pendingCreation;
			}

			if (!change) {
				// Removals never create items.
				if (remove) continue;
				if (!itemData._id) itemData._id = foundry.utils.randomID();
				change = this.addItemCreation(itemData, { type: entryType });
			}

			change.type ??= entryType;
			if (remove && (keepIfZero || entryType === "currency")) {
				change.keepIfZero = true;
				change.notForSaleIfZero ||= keepIfZero && entryType !== "currency";
			}
			change.hasQuantityChange = true;
			applyValueChange(change.quantity, quantity, { set, remove, onlyDelta });

			let flagData = null;
			if (entryFlagData && change.isNew) {
				flagData = entryFlagData;
			} else if (entryFlagData?.customCategory !== undefined) {
				flagData = { customCategory: entryFlagData.customCategory };
			}
			if (flagData) {
				change.itemFlagData = foundry.utils.mergeObject(change.itemFlagData ?? {}, flagData, { inplace: false });
			}
		}
	}

	async appendDocumentChanges(attributes, { set = false, remove = false, onlyDelta = false } = {}) {
		this.payload = null;
		for (const { path, quantity } of cleanAttributes(attributes)) {
			applyValueChange(this.getAttributeValueRecord(path), quantity, { set, remove, onlyDelta });
		}
	}

	async appendEmbeddedChanges(item, attributes, { set = false, remove = false, onlyDelta = false } = {}) {
		this.payload = null;
		const change = this.getItemChange(item);
		for (const { path, quantity } of cleanAttributes(attributes)) {
			const record = this.getFieldValueRecord(change, path);
			const deltaBefore = record.delta;
			applyValueChange(record, quantity, { set, remove, onlyDelta });
			const delta = (this.embeddedDeltas.get(path) ?? 0) + record.delta - deltaBefore;
			this.embeddedDeltas.set(path, Helpers.roundToDecimals(delta, PileUtilities.getCurrencyDecimals()));
		}
	}

	shouldItemBeDeleted(change) {
		if (change.keepIfZero) return false;
		return change.hasQuantityChange && change.quantity.value <= 0;
	}

	prepare() {
		if (this.payload) return this.payload;
		const { documentChanges, attributeDeltas } = this.prepareDocumentChanges();
		const { itemsToCreate, itemsToUpdate, itemsToDelete, itemDeltas } = this.prepareItemChanges();
		this.payload = {
			documentChanges,
			itemsToCreate,
			itemsToUpdate,
			itemsToDelete,
			attributeDeltas,
			itemDeltas
		};
		return this.payload;
	}

	prepareDocumentChanges() {
		const documentChanges = {};
		const attributeDeltas = {};
		for (const [path, record] of this.attributes) {
			if (Number(foundry.utils.getProperty(this.document, path)) !== record.value) {
				documentChanges[path] = record.value;
			}
			attributeDeltas[path] = record.delta;
		}
		for (const [path, delta] of this.embeddedDeltas) {
			const total = (attributeDeltas[path] ?? 0) + delta;
			attributeDeltas[path] = Helpers.roundToDecimals(total, PileUtilities.getCurrencyDecimals());
		}
		for (const path of this.attributes.keys()) {
			if (attributeDeltas[path] === 0) delete attributeDeltas[path];
		}
		return { documentChanges, attributeDeltas };
	}

	prepareItemChanges() {
		const itemsToDelete = [];
		const itemsToUpdate = [];
		const fieldUpdates = [];
		const itemDeltas = [];
		let itemsToCreate = [];

		for (const change of this.items.values()) {

			if (change.isNew) {
				const itemData = this.getCreationData(change);
				if (itemData) itemsToCreate.push(itemData);
				continue;
			}

			if (this.shouldItemBeDeleted(change)) {
				itemsToDelete.push(change.key);
			} else {
				const update = this.getItemUpdate(change);
				if (update) itemsToUpdate.push(update);
				const updates = getFieldValues(change);
				if (!foundry.utils.isEmpty(updates)) {
					fieldUpdates.push({ _id: change.key, ...updates });
				}
			}

			if (change.quantity.delta) {
				const item = setReportedItemFlagData(change.source.toObject(), change.itemFlagData ?? {});
				Utilities.setItemQuantity(item, change.quantity.delta, true);
				itemDeltas.push({ item, quantity: change.quantity.delta, type: change.type });
			}
		}

		for (const update of fieldUpdates) {
			const index = itemsToUpdate.findIndex(existingUpdate => existingUpdate._id === update._id);
			if (index > -1) {
				itemsToUpdate[index] = foundry.utils.mergeObject(itemsToUpdate[index], update);
			} else {
				itemsToUpdate.push(update);
			}
		}

		itemsToCreate = Utilities.ensureValidIds(this.document, itemsToCreate);
		itemsToCreate = PileUtilities.assignVaultPositions(this.document, itemsToCreate);

		return { itemsToCreate, itemsToUpdate, itemsToDelete, itemDeltas };
	}

	getCreationData(change) {
		const itemData = Utilities.setItemQuantity(foundry.utils.deepClone(change.source), change.quantity.value);
		const keep = change.quantity.value > 0
			|| change.type === "currency"
			|| !PileUtilities.canItemStack(itemData, this.document);
		return keep ? setCleanItemFlagData(itemData, change.itemFlagData ?? {}) : null;
	}

	getItemUpdate(change) {
		const quantityChanged = change.quantity.value !== Utilities.getItemQuantity(change.source);
		if (!quantityChanged && !change.itemFlagData) return null;
		const update = Utilities.setItemQuantity(change.source.toObject(), change.quantity.value);
		if (change.notForSaleIfZero) {
			foundry.utils.setProperty(update, CONSTANTS.FLAGS.ITEM + ".notForSale", change.quantity.value === 0);
		}
		for (const [key, value] of Object.entries(change.itemFlagData ?? {})) {
			foundry.utils.setProperty(update, `${CONSTANTS.FLAGS.ITEM}.${key}`, value);
		}
		return update;
	}

	async commit() {

		const payload = this.prepare();
		const changes = {
			documentChanges: payload.documentChanges,
			itemsToUpdate: payload.itemsToUpdate,
			itemsToDelete: payload.itemsToDelete,
			itemsToCreate: payload.itemsToCreate
		};

		const documentUuid = Utilities.getUuid(this.document);
		const itemsCreated = this.document.isOwner
			? await PrivateAPI._commitDocumentChanges(documentUuid, changes)
			: await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMMIT_DOCUMENT_CHANGES, documentUuid, changes);

		const changedItemDeltas = payload.itemDeltas.map(delta => ({ ...delta, item: foundry.utils.deepClone(delta.item) }));
		const createdItemDeltas = itemsCreated.map(item => {
			const quantity = PileUtilities.canItemStack(item, this.document) ? Utilities.getItemQuantity(item) : 1;
			return { item, quantity };
		});

		return {
			attributeDeltas: { ...payload.attributeDeltas },
			itemDeltas: changedItemDeltas.concat(createdItemDeltas)
		};
	}
}
