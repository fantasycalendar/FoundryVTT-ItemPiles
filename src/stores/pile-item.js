import { get, writable } from "svelte/store";
import * as Utilities from "../helpers/utilities.js";
import { TJSDocument } from "#runtime/svelte/store/fvtt/document";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import CONSTANTS from "../constants/constants.js";
import { Plugins } from "../plugins/main.js";
import { SYSTEMS } from "../systems.js";
import * as CompendiumUtilities from "../helpers/compendium-utilities.js";

class PileBaseItem {

	constructor(store, data, isCurrency = false, isSecondaryCurrency = false, parent = false) {
		this.store = store;
		this.parent = parent?.item || store.actor;
		this.parentDoc = parent?.itemDocument || store.document;
		this.subscriptions = [];
		this.isCurrency = isCurrency;
		this.isSecondaryCurrency = isSecondaryCurrency;
		this.setup(data);
	}

	setupStores() {
		this.category = writable({ service: false, type: "", label: "" });
		this.quantity = writable(1);
		this.currentQuantity = writable(1);
		this.quantityLeft = writable(1);
		this.filtered = writable(true);
		this.presentFromTheStart = writable(false);
		this.rarityColor = writable(false);
		this.containerID = writable("");
		this.subItems = writable([]);
	}

	setupSubscriptions() {
		// Higher order implementation
	}

	setup(data) {
		this.unsubscribe();
		this.setupStores(data);
		this.setupSubscriptions(data);
	}

	subscribeTo(target, callback) {
		this.subscriptions.push(target.subscribe(callback));
	}

	unsubscribe() {
		this.subscriptions.forEach(unsubscribe => unsubscribe());
		this.subscriptions = [];
	}

	preview() {
	}
}

export class PileItem extends PileBaseItem {

	setupStores(item) {
		super.setupStores();
		this.item = item;
		this.itemDocument = new TJSDocument(this.item);
		this.canStack = PileUtilities.canItemStack(this.item, this.actor);
		this.presentFromTheStart.set(Utilities.getItemQuantity(this.item) > 0 || !this.canStack);
		this.quantity.set(this.canStack ? Utilities.getItemQuantity(this.item) : 1);
		this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
		this.id = this.item.id;
		this.type = this.item.type;
		const itemData = CompendiumUtilities.findSimilarItemInCompendiumSync(this.item);
		this.name = writable(itemData?.name ?? this.item.name);
		this.img = writable(itemData?.img ?? this.item.img);
		this.abbreviation = writable("");
		this.identifier = foundry.utils.randomID();
		this.itemFlagData = writable(PileUtilities.getItemFlagData(this.item));
	}

	setupSubscriptions() {
		super.setupSubscriptions()

		this.subscribeTo(this.store.pileData, () => {
			this.setupProperties();
		});
		this.subscribeTo(this.store.pileCurrencies, () => {
			this.setupProperties();
		});

		this.subscribeTo(this.store.shareData, () => {
			if (!this.toShare) {
				this.quantityLeft.set(get(this.quantity));
				return;
			}
			const quantityLeft = SharingUtilities.getItemSharesLeftForActor(this.store.actor, this.item, this.store.recipient);
			this.quantityLeft.set(quantityLeft);
		});

		this.subscribeTo(this.itemDocument, (doc, update) => {
			if (update.action.includes("delete")) return;
			const updateData = update.data?.[0] ?? {};
			const itemData = CompendiumUtilities.findSimilarItemInCompendiumSync(this.item);
			this.name.set(itemData?.name ?? this.item.name);
			this.img.set(itemData?.img ?? this.item.img);
			this.similarities = Utilities.setSimilarityProperties({}, this.item);
			if (PileUtilities.canItemStack(this.item, this.store.actor) && Utilities.hasItemQuantity(updateData)) {
				this.quantity.set(Utilities.getItemQuantity(updateData));
				const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity));
				this.currentQuantity.set(quantity);
			}
			if (foundry.utils.hasProperty(updateData, CONSTANTS.FLAGS.ITEM)) {
				this.itemFlagData.set(PileUtilities.getItemFlagData(this.item));
				this.updateCategory();
				this.store.refreshItems();
			}
			if (Plugins["rarity-colors"].data) {
				this.rarityColor.set(Plugins["rarity-colors"].data.getItemColor(this.item));
			}
			if (Utilities.hasItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED)) {
				this.containerID.set(Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED)({ item: this.item }));
			}
			if (!foundry.utils.isEmpty(updateData) && Utilities.hasItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.HAS_CURRENCY, this.item.type)) {
				this.store.populateItems();
				this.store.refreshItems();
			}
		});

		this.updateCategory();

		this.subscribeTo(this.quantity, this.filter.bind(this));
		this.subscribeTo(this.store.search, this.filter.bind(this));
		this.subscribeTo(this.category, this.filter.bind(this));
	}

	setupProperties() {
		const actorIsItemPile = PileUtilities.isValidItemPile(this.store.actor, get(this.store.pileData));
		const pileActor = actorIsItemPile ? this.store.actor : this.store.recipient;
		const pileActorData = actorIsItemPile ? this.store.pileData : this.store.recipientPileData;
		const pileCurrencies = actorIsItemPile ? get(this.store.pileCurrencies) : get(this.store.recipientCurrencies);
		this.isCurrency = PileUtilities.isItemCurrency(this.item, {
			target: pileActor,
			actorCurrencies: pileCurrencies
		});
		const currency = this.isCurrency ? PileUtilities.getItemCurrencyData(this.item, {
			target: pileActor,
			actorCurrencies: pileCurrencies
		}) : {};
		this.isSecondaryCurrency = !!currency?.secondary;
		this.abbreviation.set(currency?.abbreviation ?? "");
		this.similarities = Utilities.setSimilarityProperties({}, this.item);
		this.name.set(this.isCurrency ? currency.name : this.item.name);
		this.img.set(this.isCurrency ? currency.img : this.item.img);
		this.toShare = this.isCurrency
			? get(pileActorData).shareCurrenciesEnabled && !!this.store.recipient
			: get(pileActorData).shareItemsEnabled && !!this.store.recipient;
	}

	updateCategory() {
		const pileData = get(this.store.pileData);
		const itemFlagData = get(this.itemFlagData);
		this.category.update(cat => {
			cat.service = itemFlagData?.isService;
			if (itemFlagData.customCategory) {
				cat.type = itemFlagData.customCategory.toLowerCase();
				cat.label = itemFlagData.customCategory;
			} else if (cat.service && pileData.enabled && pileData.type === CONSTANTS.PILE_TYPES.MERCHANT) {
				cat.type = "item-piles-service";
				cat.label = "ITEM-PILES.Merchant.Service";
			} else {
				cat.type = this.type;
				cat.label = CONFIG.Item.typeLabels[this.type];
			}
			return cat;
		});
	}

	filter() {
		const name = get(this.name).trim();
		const search = get(this.store.search).trim();
		const presentFromTheStart = get(this.presentFromTheStart);
		const quantity = get(this.quantity);
		if (quantity === 0 && !presentFromTheStart) {
			this.filtered.set(true);
		} else if (search) {
			const nameIsInSearchQuery = name.toLowerCase().includes(search.toLowerCase());
			const subItemNamesMatchQuery = get(this.subItems).some(item => get(item.filtered));
			this.filtered.set(!(nameIsInSearchQuery || subItemNamesMatchQuery));
		} else {
			this.filtered.set(!presentFromTheStart && quantity === 0);
		}
	}

	take() {
		const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft));
		if (!quantity) return;
		return game.itempiles.API.transferItems(
			this.store.actor,
			this.store.recipient,
			[{ _id: this.id, quantity }],
			{ interactionId: this.store.interactionId }
		);
	}

	async remove() {
		return game.itempiles.API.removeItems(this.store.actor, [this.id]);
	}

	async updateQuantity(quantity, add = false) {
		let total = typeof quantity === "string" ? (await new Roll(quantity).evaluate({ allowInteractive: false })).total : quantity;
		if (add) {
			total += get(this.quantity);
		}
		this.quantity.set(total);
		return this.item.update(Utilities.setItemQuantity({}, total));
	}

	async updateFlags() {
		await PileUtilities.updateItemData(this.item, {
			flags: get(this.itemFlagData)
		});
	}

	preview() {
		const pileData = get(this.store.pileData);
		if (!pileData.canInspectItems && !game.user.isGM) return;
		if (SYSTEMS.DATA?.PREVIEW_ITEM_TRANSFORMER) {
			if (!SYSTEMS.DATA?.PREVIEW_ITEM_TRANSFORMER(this.item)) {
				return;
			}
		}
		if (game.user.isGM || this.item.ownership[game.user.id] === 3) {
			return this.item.sheet.render(true);
		}
		const itemData = this.item.toObject();
		itemData.ownership[game.user.id] = 1;
		const newItem = new Item.implementation(itemData);
		newItem.document = newItem;
		const sheet = new cls(newItem, { editable: false });
		return sheet?._render ? sheet._render(true) : sheet.render(true);
	}
}

export class PileAttribute extends PileBaseItem {

	setupStores(attribute) {
		super.setupStores();
		this.attribute = attribute;
		this.path = this.attribute.path;
		this.name = writable(this.attribute.name);
		this.img = writable(this.attribute.img);
		this.abbreviation = writable(this.attribute.abbreviation);
		this.identifier = foundry.utils.randomID();
		const startingQuantity = Utilities.sanitizeNumber(foundry.utils.getProperty(this.parent, this.path) ?? 0);
		this.presentFromTheStart.set(startingQuantity > 0);
		this.quantity.set(startingQuantity);
		this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
		this.category.set({ type: "currency", label: "ITEM-PILES.Currency" });
	}

	setupSubscriptions() {
		super.setupSubscriptions();

		this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));

		this.subscribeTo(this.store.shareData, (val) => {
			const quantity = get(this.quantity);
			if (!this.toShare) {
				this.quantityLeft.set(quantity);
				return;
			}
			const quantityLeft = SharingUtilities.getAttributeSharesLeftForActor(this.store.actor, this.path, this.store.recipient);
			this.quantityLeft.set(Math.min(quantity, quantityLeft));
		});

		this.subscribeTo(this.parentDoc, (doc, update) => {
			if (update.action.includes("delete")) return;
			const updateData = update.data?.[0] ?? {};
			this.path = this.attribute.path;
			this.name.set(this.attribute.name);
			this.img.set(this.attribute.img);
			if (foundry.utils.hasProperty(updateData, this.path)) {
				const newQuantity = Utilities.sanitizeNumber(foundry.utils.getProperty(updateData, this.path) ?? 0);
				this.quantity.set(newQuantity);
				if (!this.toShare) {
					this.quantityLeft.set(newQuantity);
				} else {
					const quantityLeft = SharingUtilities.getAttributeSharesLeftForActor(this.store.actor, this.path, this.store.recipient);
					this.quantityLeft.set(Math.min(newQuantity, quantityLeft));
				}
				this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), newQuantity));
				this.store.refreshItems();
			}
		});

		this.subscribeTo(this.quantity, this.filter.bind(this));
		this.subscribeTo(this.store.search, this.filter.bind(this));
	}

	setupProperties() {
		this.toShare = get(this.store.pileData).shareCurrenciesEnabled && !!this.store.recipient;
	}

	filter() {
		const name = get(this.name);
		const search = get(this.store.search);
		const presentFromTheStart = get(this.presentFromTheStart);
		const quantity = get(this.quantity);
		if (quantity === 0 && !presentFromTheStart) {
			this.filtered.set(true);
		} else if (search) {
			const nameIsInSearchQuery = name.toLowerCase().includes(search.toLowerCase());
			const subItemNamesMatchQuery = get(this.subItems).some(item => get(item.filtered));
			this.filtered.set(!(nameIsInSearchQuery || subItemNamesMatchQuery));
		} else {
			this.filtered.set(!presentFromTheStart && quantity === 0);
		}
	}

	take() {
		const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft));
		return game.itempiles.API.transferAttributes(
			this.parent,
			this.store.recipient,
			{ [this.path]: quantity },
			{ interactionId: this.store.interactionId }
		);
	}

	updateQuantity() {
		return this.parent.update({
			[this.path]: get(this.quantity)
		});
	}

}
