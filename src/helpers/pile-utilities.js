import CONSTANTS from "../constants/constants.js";
import { SYSTEMS } from "../systems.js";
import SETTINGS from "../constants/settings.js";
import {
	cachedActorCurrencies,
	cachedCurrenciesInItem,
	cachedCurrencyList,
	cachedFilterList,
	cachedRequiredPropertiesList
} from "./caches.js";
import { hotkeyActionState } from "../hotkeys.js";
import * as Utilities from "./utilities.js"
import * as Helpers from "./helpers.js";
import * as CompendiumUtilities from "./compendium-utilities.js";

export function getPileDefaults() {
	return foundry.utils.mergeObject({}, CONSTANTS.PILE_DEFAULTS, Helpers.getSetting(SETTINGS.PILE_DEFAULTS) ?? {});
}

export function getPileActorDefaults(itemPileFlags = {}) {
	const defaultItemPileId = Helpers.getSetting(SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID);
	const defaultItemPileActor = game.actors.get(defaultItemPileId);

	let pileDataDefaults = foundry.utils.deepClone(CONSTANTS.PILE_DEFAULTS);
	if (foundry.utils.isEmpty(itemPileFlags) && defaultItemPileActor) {
		const defaultItemPileSettings = getActorFlagData(defaultItemPileActor);
		itemPileFlags = foundry.utils.mergeObject(pileDataDefaults, defaultItemPileSettings);
	}

	return foundry.utils.mergeObject(pileDataDefaults, itemPileFlags);
}

function getFlagData(inDocument, flag, defaults, existing = false) {
	const defaultFlags = foundry.utils.deepClone(defaults);
	let flags = foundry.utils.deepClone(existing || (foundry.utils.getProperty(inDocument, flag) ?? {}));
	if (flag === CONSTANTS.FLAGS.PILE) {
		flags = migrateFlagData(inDocument, flags);
	}
	return foundry.utils.mergeObject(defaultFlags, flags);
}

export function migrateFlagData(document, data = false) {

	let flags = data || foundry.utils.getProperty(document, CONSTANTS.FLAGS.PILE);

	if (flags.type) {
		return flags;
	}

	if (flags.isMerchant) {
		flags.type = CONSTANTS.PILE_TYPES.MERCHANT;
	} else if (flags.isContainer) {
		flags.type = CONSTANTS.PILE_TYPES.CONTAINER;
	} else {
		flags.type = CONSTANTS.PILE_TYPES.PILE;
	}

	return flags;

}

export function areItemsColliding(itemA, itemB) {
	const itemAFlags = getItemFlagData(itemA);
	const itemBFlags = getItemFlagData(itemB);
	return (
		itemAFlags.x + (itemAFlags.width - 1) >= itemBFlags.x &&
		itemAFlags.y + (itemAFlags.height - 1) >= itemBFlags.y &&
		itemAFlags.x <= itemBFlags.x + (itemBFlags.width - 1) &&
		itemAFlags.y <= itemBFlags.y + (itemBFlags.height - 1)
	);
}

export function canItemStack(item, targetActor) {
	const itemData = item instanceof Item
		? item.toObject()
		: item;
	const itemFlagData = getItemFlagData(itemData);
	const actorFlagData = getActorFlagData(targetActor);
	if (actorFlagData.enabled && actorFlagData.type === CONSTANTS.PILE_TYPES.VAULT && itemFlagData.vaultExpander) {
		return false;
	}
	if (isItemCurrency(itemData)) return true;
	if (typeof actorFlagData.canStackItems === "boolean") {
		actorFlagData.canStackItems = "yes";
	}
	if (!Utilities.isItemStackable(itemData)) return false;
	if (actorFlagData.canStackItems.includes("always")) {
		return actorFlagData.canStackItems.endsWith("yes");
	}
	return {
		"default": actorFlagData.canStackItems === "yes", "yes": true, "no": false
	}[itemFlagData?.canStack ?? "default"];
}

/**
 *
 * @param item
 * @param options
 * @param useDefaults.data
 * @param useDefaults.useDefaults
 * @returns {Object<CONSTANTS.ITEM_DEFAULTS>}
 */
export function getItemFlagData(item, { data = false, useDefaults = true } = {}) {
	return getFlagData(
		Utilities.getDocument(item),
		CONSTANTS.FLAGS.ITEM,
		{ ...(useDefaults ? CONSTANTS.ITEM_DEFAULTS : {}) },
		data
	);
}

/**
 *
 * @param target
 * @param data
 * @param useDefaults
 * @returns {Object<CONSTANTS.PILE_DEFAULTS>}
 */
export function getActorFlagData(target, { data = false, useDefaults = true } = {}) {
	const defaults = useDefaults ? getPileDefaults() : {};
	target = Utilities.getActor(target);
	if (target?.token) {
		target = target.token;
	}
	return getFlagData(target, CONSTANTS.FLAGS.PILE, defaults, data);
}

export function isValidItemPile(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return targetActor && pileData?.enabled;
}

export function isRegularItemPile(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return targetActor && pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.PILE;
}

export function isItemPileContainer(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.CONTAINER;
}

export function isItemPileLootable(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return targetActor && pileData?.enabled && (pileData?.type === CONSTANTS.PILE_TYPES.PILE || pileData?.type === CONSTANTS.PILE_TYPES.CONTAINER);
}

export function isItemPileVault(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.VAULT;
}

export function isItemPileMerchant(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.MERCHANT;
}

export function isItemPileAuctioneer(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.AUCTIONEER;
}

export function isItemPileBanker(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.BANKER;
}

export function isItemPileClosed(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	if (!pileData?.enabled || pileData?.type !== CONSTANTS.PILE_TYPES.CONTAINER) return false;
	return pileData.closed;
}

export function isItemPileLocked(target, data = false) {
	const targetActor = Utilities.getActor(target);
	const pileData = getActorFlagData(targetActor, { data });
	if (!pileData?.enabled || pileData?.type !== CONSTANTS.PILE_TYPES.CONTAINER) return false;
	return pileData.locked;
}

export function isItemPileEmpty(target) {

	const targetActor = Utilities.getActor(target);
	if (!targetActor) return false;

	const validItemPile = isValidItemPile(targetActor);
	if (!validItemPile) return false;

	const hasNoItems = getActorItems(targetActor).length === 0;
	const hasNoAttributes = getActorCurrencies(targetActor).length === 0;

	return validItemPile && hasNoItems && hasNoAttributes;

}

export function shouldItemPileBeDeleted(targetUuid) {

	const target = Utilities.getToken(targetUuid);

	if (!(target instanceof Token)) return false;

	const targetDocument = Utilities.getDocument(target);

	const pileData = getActorFlagData(targetDocument);

	if (!isItemPileLootable(targetDocument, pileData) || !isItemPileEmpty(targetDocument)) {
		return false;
	}

	if (typeof pileData?.deleteWhenEmpty === "boolean") {
		return pileData?.deleteWhenEmpty;
	}

	return {
		"default": Helpers.getSetting("deleteEmptyPiles"), "true": true, "false": false
	}[pileData?.deleteWhenEmpty ?? "default"];

}

export function getItemPileActors(filter = false) {
	return Array.from(game.actors).filter((a) => {
		return foundry.utils.getProperty(a, CONSTANTS.FLAGS.PILE)?.enabled && (filter
			? filter(a)
			: true);
	});
}

export function getItemPileTokens(filter = false) {

	const allTokensOnScenes = Array.from(game.scenes)
		.map(scene => ([scene.id, Array.from(scene.tokens).filter(t => {
			return foundry.utils.getProperty(t, CONSTANTS.FLAGS.PILE)?.enabled && !t.actorLink;
		})]))
		.filter(([_, tokens]) => tokens.length)

	const validTokensOnScenes = allTokensOnScenes.map(([scene, tokens]) => [scene, tokens.filter((token) => {
		return filter
			? filter(token)
			: true;
	})]).filter(([_, tokens]) => tokens.length);

	const mappedValidTokens = Object.fromEntries(validTokensOnScenes);

	const invalidTokensOnScenes = allTokensOnScenes.map(([scene, tokens]) => [scene, tokens.filter(token => {
		if (mappedValidTokens[scene.id] && mappedValidTokens[scene.id].includes(token)) return false;
		try {
			if (filter) filter(token);
		} catch (err) {
			return true;
		}
		return false;
	})]).filter(([_, tokens]) => tokens.length);

	return { invalidTokensOnScenes, validTokensOnScenes };
}

export function getActorItems(target, { itemFilters = false, getItemCurrencies = false } = {}) {
	const actor = Utilities.getActor(target);
	const actorItemFilters = itemFilters
		? cleanItemFilters(itemFilters)
		: getActorItemFilters(actor);
	const currencies = (actor
		? getActorCurrencies(actor, { getAll: true })
		: game.itempiles.API.CURRENCIES.concat(game.itempiles.API.SECONDARY_CURRENCIES))
		.map(entry => entry.id);
	return actor.items.filter(item => (getItemCurrencies || currencies.indexOf(item.id) === -1) && !isItemInvalid(actor, item, actorItemFilters));
}

// Lots happening here, but in essence, it gets the actor's currencies, and creates an array of them
export function getActorCurrencies(target, {
	forActor = false, currencyList = false, getAll = false, secondary = true
} = {}) {
	const actor = Utilities.getActor(target);
	const actorUuid = Utilities.getUuid(actor.uuid)
	const actorItems = actor
		? Array.from(actor.items)
		: [];
	const cached = cachedActorCurrencies.get(actorUuid)
	currencyList = cached
		? false
		: currencyList || getCurrencyList(forActor || actor);
	// Loop through each currency and match it against the actor's data
	let currencies = cached || (currencyList.map((currency, index) => {
		if (currency.type === "attribute" || !currency.type) {
			const path = currency?.data?.path ?? currency?.path;
			return {
				...currency, quantity: 0, path: path, id: path, index
			}
		}
		const itemData = CompendiumUtilities.getItemFromCache(currency.data.uuid) || currency.data.item || false;
		if (!itemData) return false;
		const item = Utilities.findSimilarItem(actorItems, itemData);
		// If the item exists on the actor, use the item's ID, so that we can match it against the actual item on the actor
		currency.data.item = itemData;
		currency.data.item._id = item?.id ?? itemData._id;
		return {
			...currency, quantity: 0, id: item?.id ?? item?._id ?? itemData._id ?? null, item, index
		}
	})).filter(Boolean);

	cachedActorCurrencies.set(actorUuid, currencies);

	currencies = currencies.map(currency => {
		currency.quantity = currency.type === "attribute"
			? Utilities.sanitizeNumber(foundry.utils.getProperty(actor, currency.path))
			: Utilities.getItemQuantity(currency.item);
		return currency;
	});

	if (!getAll) {
		currencies = currencies.filter(currency => currency.quantity > 0);
	}

	if (!secondary) {
		currencies = currencies.filter(currency => !currency.secondary);
	}

	return currencies;
}

export function getCurrenciesInItem(targetItem, {
	forActor = false, currencyList = false, getAll = false, secondary = true
} = {}) {

	const itemDocument = Utilities.getDocument(targetItem);
	const itemUuid = Utilities.getUuid(itemDocument);
	const handler = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.CONTENTS, itemDocument.type);
	const subItems = handler
		? handler({ item: itemDocument })
		: [];
	const cached = cachedCurrenciesInItem.get(itemUuid)
	currencyList = cached
		? false
		: currencyList || getCurrencyList(forActor || itemDocument.parent);

	let currencies = cached || (currencyList.map((currency, index) => {
		if (currency.type === "attribute" || !currency.type) {
			const path = currency?.data?.path ?? currency?.path;
			return {
				...currency, quantity: 0, path: path, id: path, index
			}
		}
		const itemData = CompendiumUtilities.getItemFromCache(currency.data.uuid) || currency.data.item || false;
		if (!itemData) return false;
		const item = Utilities.findSimilarItem(subItems, itemData);
		// If the item exists on the actor, use the item's ID, so that we can match it against the actual item on the actor
		currency.data.item = itemData;
		currency.data.item._id = item?.id ?? itemData._id;
		return {
			...currency, quantity: 0, id: item?.id ?? item?._id ?? itemData._id ?? null, item, index
		}
	})).filter(Boolean);

	cachedCurrenciesInItem.set(itemUuid, currencies);

	currencies = currencies.map(currency => {
		currency.quantity = currency.type === "attribute"
			? Utilities.sanitizeNumber(foundry.utils.getProperty(itemDocument, currency.path))
			: Utilities.getItemQuantity(currency.item);
		return currency;
	});

	if (!getAll) {
		currencies = currencies.filter(currency => currency.quantity > 0);
	}

	if (!secondary) {
		currencies = currencies.filter(currency => !currency.secondary);
	}

	return currencies;

}

export function getActorPrimaryCurrency(target) {
	const actor = Utilities.getActor(target);
	return getActorCurrencies(actor, { getAll: true }).find(currency => currency.primary);
}

export function getCurrencyList(target = false, pileData = false) {
	let targetUuid = false;
	if (target) {
		targetUuid = Utilities.getUuid(target);
		if (cachedCurrencyList.has(targetUuid)) {
			return cachedCurrencyList.get(targetUuid)
		}
		const targetActor = Utilities.getActor(target);
		pileData = getActorFlagData(targetActor, { data: pileData });
	}

	const primaryCurrencies = (pileData?.overrideCurrencies || game.itempiles.API.CURRENCIES);
	const secondaryCurrencies = (pileData?.overrideSecondaryCurrencies || game.itempiles.API.SECONDARY_CURRENCIES).map(currency => {
		currency.secondary = true;
		return currency;
	});

	const currencies = primaryCurrencies.concat(secondaryCurrencies);

	const currencyList = currencies.map(currency => {
		currency.name = game.i18n.localize(currency.name);
		return currency;
	});
	if (target) {
		cachedCurrencyList.set(targetUuid, currencyList);
	}
	return currencyList;
}

export function getActorItemFilters(target, pileData = false) {
	if (!target) return cleanItemFilters(game.itempiles.API.ITEM_FILTERS);
	const targetUuid = Utilities.getUuid(target);
	if (cachedFilterList.has(targetUuid)) {
		return cachedFilterList.get(targetUuid)
	}
	const targetActor = Utilities.getActor(target);
	pileData = getActorFlagData(targetActor, { data: pileData });
	const itemFilters = isValidItemPile(targetActor, pileData) && pileData?.overrideItemFilters
		? cleanItemFilters(pileData.overrideItemFilters)
		: cleanItemFilters(game.itempiles.API.ITEM_FILTERS);
	cachedFilterList.set(targetUuid, itemFilters);
	return itemFilters;
}

export function getActorRequiredItemProperties(target, pileData = false) {
	if (!target) return [];
	const targetUuid = Utilities.getUuid(target);
	if (cachedRequiredPropertiesList.has(targetUuid)) {
		return cachedRequiredPropertiesList.get(targetUuid)
	}
	const targetActor = Utilities.getActor(target);
	pileData = getActorFlagData(targetActor, { data: pileData });
	const itemFilters = isValidItemPile(targetActor, pileData)
		? cleanItemFilters(pileData.requiredItemProperties)
		: [];
	cachedRequiredPropertiesList.set(targetUuid, itemFilters);
	return itemFilters;
}

export function cleanItemFilters(itemFilters) {
	return itemFilters
		? foundry.utils.duplicate(itemFilters).map(filter => {
			filter.path = filter.path.trim();
			filter.filters = (Array.isArray(filter.filters)
				? filter.filters
				: filter.filters.split(','))
				.map(string => {
					if (typeof string === "boolean") return string;
					const str = string.trim();
					if (str.toLowerCase() === "true" || str.toLowerCase() === "false") {
						return str.toLowerCase() === "true";
					}
					return str;
				});
			return filter;
		})
		: [];
}

function doesPropertyMatch(propertyValue, filterValue) {
	if (Array.isArray(propertyValue)) {
		return propertyValue.some(value => doesPropertyMatch(value, filterValue));
	}
	if (Utilities.isRealNumber(propertyValue) && Utilities.isRealNumber(Number(filterValue))) {
		return Math.abs(propertyValue - Number(filterValue)) < Number.EPSILON;
	}
	return propertyValue === filterValue;
}

export function isItemInvalid(targetActor, item, itemFilters = false) {
	const pileItemFilters = itemFilters
		? itemFilters
		: getActorItemFilters(targetActor)
	const itemData = item instanceof Item
		? item.toObject()
		: item;
	for (const filter of pileItemFilters) {
		if (!foundry.utils.hasProperty(itemData, filter.path)) continue;
		const propertyValue = foundry.utils.getProperty(itemData, filter.path);
		const filterValues = Array.isArray(filter.filters) ? filter.filters : Array.from(filter.filters);
		const foundFilterValue = filterValues.find(filterValue => doesPropertyMatch(propertyValue, filterValue));
		if (foundFilterValue) return foundFilterValue;
	}
	return false;
}

export function isItemValidBasedOnProperties(targetActor, item) {
	const pileItemRequiredProperties = getActorRequiredItemProperties(targetActor);
	const itemData = item instanceof Item
		? item.toObject()
		: item;
	for (const filter of pileItemRequiredProperties) {
		if (!foundry.utils.hasProperty(itemData, filter.path)) return false;

		const propertyValue = foundry.utils.getProperty(itemData, filter.path);
		const filterValues = Array.isArray(filter.filters) ? filter.filters : Array.from(filter.filters);

		const matchFound = filterValues.some(filterValue => doesPropertyMatch(propertyValue, filterValue));
		if (!matchFound) return false;
	}
	return true;

}

export async function checkItemType(targetActor, item, {
	errorText = "ITEM-PILES.Errors.DisallowedItemDrop",
	warningTitle = "ITEM-PILES.Dialogs.TypeWarning.Title",
	warningContent = "ITEM-PILES.Dialogs.TypeWarning.DropContent",
	runTransformer = true
} = {}) {

	const disallowedType = isItemInvalid(targetActor, item);
	if (disallowedType) {
		if (!game.user.isGM) {
			return Helpers.custom_warning(game.i18n.format(errorText, { type: disallowedType }), true)
		}

		if (SYSTEMS.DATA.ITEM_TRANSFORMER && runTransformer) {
			item = await SYSTEMS.DATA.ITEM_TRANSFORMER(item);
		}

		const newDisallowedType = isItemInvalid(targetActor, item);

		if (newDisallowedType && !hotkeyActionState.forceDropItem) {
			const force = await Dialog.confirm({
				title: game.i18n.localize(warningTitle),
				content: `<p class="item-piles-dialog">${game.i18n.format(warningContent, { type: newDisallowedType })}</p>`,
				defaultYes: false
			});
			if (!force) {
				return false;
			}
		}
	} else {
		if (SYSTEMS.DATA.ITEM_TRANSFORMER && runTransformer) {
			item = await SYSTEMS.DATA.ITEM_TRANSFORMER(item);
		}
	}

	return item;

}

export function isItemCurrency(item, { target = false, actorCurrencies = false } = {}) {
	const currencies = (actorCurrencies || getActorCurrencies(item.parent || false, {
		forActor: target, getAll: true
	}))
		.filter(currency => currency.type === "item")
		.map(item => item.data.item);

	return !!Utilities.findSimilarItem(currencies, item);
}

export function getItemCurrencyData(item, { target = false, actorCurrencies = false }) {
	return (actorCurrencies || getActorCurrencies(item?.parent || false, {
		forActor: target, getAll: true, combine: true
	}))
		.filter(currency => currency.type === "item")
		.find(currency => {
			return item.name === currency.data.item.name && item.type === currency.data.item.type;
		})
}

export function getItemPileTokenImage(token, {
	data = false, items = false, currencies = false
} = {}, overrideImage = null) {

	const pileDocument = Utilities.getDocument(token);

	const itemPileData = getActorFlagData(pileDocument, { data });

	const originalImg = overrideImage ?? (pileDocument instanceof TokenDocument
		? pileDocument.texture.src
		: pileDocument.prototypeToken.texture.src);

	if (!isValidItemPile(pileDocument, itemPileData) || !isItemPileLootable(pileDocument, itemPileData)) return originalImg;

	items = (items || getActorItems(pileDocument)).filter(itemData => {
		const method = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED);
		if (!method) return true;
		return !method({ item: itemData });
	});
	currencies = currencies || getActorCurrencies(pileDocument);

	const numItems = items.length + currencies.length;

	let img = originalImg;

	if (itemPileData.type === CONSTANTS.PILE_TYPES.CONTAINER) {

		img = itemPileData.lockedImage || itemPileData.closedImage || itemPileData.openedImage || itemPileData.emptyImage;

		if (itemPileData.locked && itemPileData.lockedImage) {
			img = itemPileData.lockedImage;
		} else if (itemPileData.closed && itemPileData.closedImage) {
			img = itemPileData.closedImage;
		} else if (itemPileData.emptyImage && isItemPileEmpty(pileDocument)) {
			img = itemPileData.emptyImage;
		} else if (itemPileData.openedImage) {
			img = itemPileData.openedImage;
		}

	} else if (itemPileData.displayOne && numItems === 1) {

		img = items.length > 0
			? items[0].img
			: currencies[0].img;

	} else if (itemPileData.displayOne && numItems > 1) {

		img = originalImg;

	}

	return img || originalImg;

}

export function getItemPileTokenScale(target, {
	data = false, items = false, currencies = false
} = {}, overrideScale = null) {

	const pileDocument = Utilities.getDocument(target);

	let itemPileData = getActorFlagData(pileDocument, { data });

	const baseScale = overrideScale ?? (pileDocument instanceof TokenDocument
		? pileDocument.texture.scaleX
		: pileDocument.prototypeToken.texture.scaleX);

	if (!isValidItemPile(pileDocument, itemPileData) || !isItemPileLootable(pileDocument, itemPileData)) {
		return baseScale;
	}

	items = (items || getActorItems(pileDocument)).filter(itemData => {
		const method = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED);
		if (!method) return true;
		return !method({ item: itemData });
	});
	currencies = currencies || getActorCurrencies(pileDocument);

	const numItems = items.length + currencies.length;

	if (itemPileData?.type === CONSTANTS.PILE_TYPES.CONTAINER || !itemPileData.displayOne || !itemPileData.overrideSingleItemScale || numItems > 1 || numItems === 0) {
		return baseScale;
	}

	return itemPileData.singleItemScale;

}

export function getItemPileName(target, { data = false, items = false, currencies = false } = {}, overrideName = null) {

	const pileDocument = Utilities.getDocument(target);

	const itemPileData = getActorFlagData(pileDocument, { data });

	let name = overrideName ?? (pileDocument instanceof TokenDocument
		? pileDocument.name
		: pileDocument.prototypeToken.name);

	if (!isValidItemPile(pileDocument, itemPileData) || !isItemPileLootable(pileDocument, itemPileData)) {
		return name;
	}

	items = (items || getActorItems(pileDocument)).filter(itemData => {
		const method = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED);
		if (!method) return true;
		return !method({ item: itemData });
	});
	currencies = currencies || getActorCurrencies(pileDocument);

	const numItems = items.length + currencies.length;

	if (itemPileData?.type === CONSTANTS.PILE_TYPES.CONTAINER || !itemPileData.displayOne || !itemPileData.showItemName || numItems > 1 || numItems === 0) {
		return name;
	}

	const item = items.length > 0
		? items[0]
		: currencies[0];
	const quantity = (items.length > 0
		? Utilities.getItemQuantity(item)
		: currencies[0]?.quantity) ?? 1

	return item.name + (quantity > 1
		? " x " + quantity
		: "");

}

export function shouldEvaluateChange(target, changes) {
	const baseFlags = foundry.utils.getProperty(changes, CONSTANTS.FLAGS.PILE) ?? false;
	const flags = getActorFlagData(target, baseFlags
		? foundry.utils.deepClone(baseFlags)
		: baseFlags);
	if (!isValidItemPile(target, flags)) return false;
	return (flags.type === CONSTANTS.PILE_TYPES.CONTAINER
			&& (flags.closedImage || flags.emptyImage || flags.openedImage || flags.lockedImage))
		|| flags.displayOne || flags.showItemName || flags.overrideSingleItemScale;
}

export async function updateItemPileData(target, newFlags, tokenData) {

	if (!target) return;

	const flagData = getActorFlagData(target, { data: foundry.utils.deepClone(newFlags) });
	if (!tokenData) tokenData = {};
	tokenData = foundry.utils.mergeObject(tokenData, {});

	let documentActor = Utilities.getActor(target);
	const documentTokens = documentActor.getActiveTokens();

	const items = getActorItems(documentActor, { itemFilters: flagData.overrideItemFilters });
	const actorCurrencies = (flagData.overrideCurrencies || []).concat(flagData.overrideSecondaryCurrencies || []);
	const currencies = getActorCurrencies(documentActor, { currencyList: actorCurrencies });

	const pileData = { data: flagData, items, currencies };

	const currentFlagData = getActorFlagData(target, { useDefaults: false });

	const cleanedFlagData = cleanFlagData(flagData, {
		addRemoveFlag: true,
		existingData: currentFlagData
	});

	const sceneUpdates = documentTokens.reduce((acc, token) => {
		const tokenDocument = token.document;
		const overrideImage = foundry.utils.getProperty(tokenData, "texture.src")
			?? foundry.utils.getProperty(tokenData, "img");
		const overrideScale = foundry.utils.getProperty(tokenData, "texture.scaleX")
			?? foundry.utils.getProperty(tokenData, "texture.scaleY")
			?? foundry.utils.getProperty(tokenData, "scale");
		const scale = getItemPileTokenScale(tokenDocument, pileData, overrideScale);
		const newTokenData = foundry.utils.mergeObject(tokenData, {
			"texture.src": getItemPileTokenImage(tokenDocument, pileData, overrideImage),
			"texture.scaleX": scale,
			"texture.scaleY": scale,
			"name": getItemPileName(tokenDocument, pileData, tokenData?.name),
		});
		const data = {
			"_id": tokenDocument.id,
			[CONSTANTS.FLAGS.PILE]: cleanedFlagData,
			[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(),
			...newTokenData
		};
		if (!tokenDocument.actorLink) {
			data[CONSTANTS.ACTOR_DELTA_PROPERTY] = {
				[CONSTANTS.FLAGS.PILE]: cleanedFlagData,
				[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(),
			}
		}
		acc[tokenDocument.parent.id] ??= [];
		acc[tokenDocument.parent.id].push(foundry.utils.mergeObject({}, data));
		return acc;
	}, {});

	if (!foundry.utils.isEmpty(sceneUpdates)) {
		for (const [sceneId, updates] of Object.entries(sceneUpdates)) {
			const scene = game.scenes.get(sceneId);
			if (!scene) continue
			await scene.updateEmbeddedDocuments("Token", updates, { animate: false });
		}
	}

	if (documentActor) {
		await documentActor.update({
			[CONSTANTS.FLAGS.PILE]: cleanedFlagData,
			[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(),
			prototypeToken: {
				[CONSTANTS.FLAGS.PILE]: cleanedFlagData,
				[CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion(),
			}
		});
	}

	return true;
}

export function cleanFlagData(flagData, { addRemoveFlag = false, existingData = false } = {}) {
	const defaults = getPileDefaults();
	const defaultKeys = Object.keys(defaults);
	const newKeys = new Set(Object.keys(flagData));
	const difference = new Set(Object.keys(foundry.utils.diffObject(flagData, defaults)));
	const toRemove = new Set(defaultKeys.filter(key => !difference.has(key) && newKeys.has(key)));
	const existingDataKeys = existingData ? new Set(Object.keys(existingData)) : false;
	if (flagData.enabled) {
		toRemove.delete("type")
	}
	if (!CONSTANTS.CUSTOM_PILE_TYPES[flagData.type]) {
		const baseKeys = new Set(defaultKeys);
		for (const key of Object.keys(flagData)) {
			if (!baseKeys.has(key)) {
				delete flagData[key];
				if (addRemoveFlag && (!existingDataKeys || existingDataKeys.has(key))) {
					flagData["-=" + key] = null;
				}
			}
		}
	}
	for (const key of toRemove) {
		delete flagData[key];
		if (addRemoveFlag && (!existingDataKeys || existingDataKeys.has(key))) {
			flagData["-=" + key] = null;
		}
	}
	return flagData;
}

export function cleanItemFlagData(flagData, { addRemoveFlag = false, existingData = false } = {}) {
	const defaults = Object.keys(CONSTANTS.ITEM_DEFAULTS);
	const difference = new Set(Object.keys(foundry.utils.diffObject(flagData, CONSTANTS.ITEM_DEFAULTS)));
	const toRemove = new Set(defaults.filter(key => !difference.has(key)));
	const existingDataKeys = existingData ? new Set(Object.keys(existingData)) : false;
	for (const key of toRemove) {
		delete flagData[key];
		if (addRemoveFlag && (!existingDataKeys || existingDataKeys.has(key))) {
			flagData["-=" + key] = null;
		}
	}
	return flagData;
}

export function updateItemData(item, update, { returnUpdate = false, version = false } = {}) {
	const existingData = getItemFlagData(item, { useDefaults: false });
	const flagData = cleanItemFlagData(update.flags ?? {}, { addRemoveFlag: true, existingData });
	const updates = foundry.utils.mergeObject(update?.data ?? {}, {});
	foundry.utils.setProperty(updates, CONSTANTS.FLAGS.ITEM, flagData)
	foundry.utils.setProperty(updates, CONSTANTS.FLAGS.VERSION, version || Helpers.getModuleVersion())
	if (returnUpdate) {
		updates["_id"] = item?.id ?? item?._id;
		return updates;
	}
	return item.update(updates);
}

/* -------------------------- Merchant Methods ------------------------- */

export function getMerchantModifiersForActor(merchant, {
	item = false, actor = false, pileFlagData = false, itemFlagData = false, absolute = false
} = {}) {

	let {
		buyPriceModifier, sellPriceModifier, itemTypePriceModifiers, actorPriceModifiers
	} = getActorFlagData(merchant, { data: pileFlagData });

	if (item) {
		if (!itemFlagData) {
			itemFlagData = getItemFlagData(item);
		}

		buyPriceModifier *= itemFlagData.buyPriceModifier ?? 1.0;
		sellPriceModifier *= itemFlagData.sellPriceModifier ?? 1.0;

		const itemTypePriceModifier = itemTypePriceModifiers
			.sort((a, b) => a.type === "custom" && b.type !== "custom"
				? -1
				: 0)
			.find(priceData => {
				return priceData.type === "custom"
					? priceData.category.toLowerCase() === itemFlagData.customCategory.toLowerCase()
					: priceData.type === item.type;
			});
		if (itemTypePriceModifier) {
			buyPriceModifier = itemTypePriceModifier.override
				? itemTypePriceModifier.buyPriceModifier ?? buyPriceModifier
				: buyPriceModifier * itemTypePriceModifier.buyPriceModifier;
			sellPriceModifier = itemTypePriceModifier.override
				? itemTypePriceModifier.sellPriceModifier ?? sellPriceModifier
				: sellPriceModifier * itemTypePriceModifier.sellPriceModifier;
		}
	}

	if (actor && actorPriceModifiers) {
		const actorSpecificModifiers = actorPriceModifiers?.find(data => data.actorUuid === Utilities.getUuid(actor) || data.actor === actor.id);
		if (actorSpecificModifiers) {
			buyPriceModifier = actorSpecificModifiers.override || absolute
				? actorSpecificModifiers.buyPriceModifier ?? buyPriceModifier
				: buyPriceModifier * actorSpecificModifiers.buyPriceModifier;
			sellPriceModifier = actorSpecificModifiers.override || absolute
				? actorSpecificModifiers.sellPriceModifier ?? sellPriceModifier
				: sellPriceModifier * actorSpecificModifiers.sellPriceModifier;
		}
	}

	if (SYSTEMS.DATA.PRICE_MODIFIER_TRANSFORMER && !absolute) {
		const modifiers = SYSTEMS.DATA.PRICE_MODIFIER_TRANSFORMER({
			buyPriceModifier, sellPriceModifier, merchant, item, actor, actorPriceModifiers
		});
		buyPriceModifier = modifiers.buyPriceModifier;
		sellPriceModifier = modifiers.sellPriceModifier;
	}

	return {
		buyPriceModifier: Helpers.roundToDecimals(buyPriceModifier, 2),
		sellPriceModifier: Helpers.roundToDecimals(sellPriceModifier, 2)
	}
}

function getSmallestExchangeRate(currencies) {
	return currencies.filter(currency => !currency.secondary).length > 1
		? Math.min(...currencies.filter(currency => !currency.secondary).map(currency => currency.exchangeRate))
		: (Helpers.getSetting(SETTINGS.CURRENCY_DECIMAL_DIGITS) ?? 0.00001);
}

function getDecimalDifferenceBetweenExchangeRates(currencies) {
	const smallest = Math.min(...currencies.filter(currency => !currency.secondary).map(curr => curr.exchangeRate));
	if (smallest >= 1) {
		return 0;
	}
	const largest = Math.max(...currencies.filter(currency => !currency.secondary).map(curr => curr.exchangeRate));
	const difference = (smallest / largest);
	return difference.toString().split(".")[1].length;
}

export function getPriceArray(totalCost, currencies) {

	if (!currencies) currencies = getCurrencyList()

	const primaryCurrency = currencies.find(currency => currency.primary);

	if (currencies.length === 1) {
		return [{
			...primaryCurrency,
			cost: totalCost,
			baseCost: totalCost,
			maxCurrencyCost: totalCost,
			string: primaryCurrency.abbreviation.replace('{#}', totalCost)
		}]
	}

	const smallestExchangeRate = getSmallestExchangeRate(currencies);

	const prices = [];

	if (primaryCurrency.exchangeRate === smallestExchangeRate) {

		let cost = totalCost;

		for (const currency of currencies) {

			if (currency.secondary) continue;

			const numCurrency = Math.floor(cost / currency.exchangeRate);

			cost = cost - (numCurrency * currency.exchangeRate);

			prices.push({
				...currency,
				cost: Math.round(numCurrency),
				baseCost: Math.round(numCurrency),
				maxCurrencyCost: Math.ceil(totalCost / currency.exchangeRate),
				string: currency.abbreviation.replace("{#}", numCurrency)
			});

		}

		return prices;

	}

	const decimals = getDecimalDifferenceBetweenExchangeRates(currencies);

	let fraction = Helpers.roundToDecimals(totalCost % 1, decimals);
	let cost = Math.round(totalCost - fraction);

	let skipPrimary = false;
	if (cost) {
		skipPrimary = true;
		prices.push({
			...primaryCurrency,
			cost: cost,
			baseCost: cost,
			maxCurrencyCost: totalCost,
			string: primaryCurrency.abbreviation.replace('{#}', cost)
		});
	}

	for (const currency of currencies) {

		if ((currency === primaryCurrency && skipPrimary) || currency.secondary) continue;

		const numCurrency = Math.floor(Helpers.roundToDecimals(fraction / currency.exchangeRate, decimals));

		fraction = Helpers.roundToDecimals(fraction - (numCurrency * currency.exchangeRate), decimals);

		prices.push({
			...currency,
			cost: Math.round(numCurrency),
			baseCost: Math.round(numCurrency),
			maxCurrencyCost: Math.ceil(totalCost / currency.exchangeRate),
			string: currency.abbreviation.replace("{#}", numCurrency)
		});
	}

	prices.sort((a, b) => b.exchangeRate - a.exchangeRate);

	return prices.map(price => {
		if (price?.quantity === undefined) {
			price.quantity = price.cost;
		}
		return price;
	});
}

export function getCurrenciesAbbreviations() {
	// Retrieve all the primary abbreviations for the check
	let primaryAbbreviationsArray = game.itempiles.API.CURRENCIES
		.filter(currency => currency.abbreviation)
		.map(currency => {
			if (currency.abbreviation?.includes("{#}")) {
				return currency.abbreviation?.replace("{#}", "");
			} else {
				return currency.abbreviation || "";
			}
		});
	let secondaryAbbreviationsArray = game.itempiles.API.SECONDARY_CURRENCIES
		.filter(currency => currency.abbreviation)
		.map(currency => {
			if (currency.abbreviation?.includes("{#}")) {
				return currency.abbreviation?.replace("{#}", "");
			} else {
				return currency.abbreviation || "";
			}
		});
	return primaryAbbreviationsArray.concat(secondaryAbbreviationsArray);
}

export function getStringFromCurrencies(currencies) {
	let allAbbreviationsArray = getCurrenciesAbbreviations();

	let priceString = currencies
		.filter(price => price.cost)
		.map(price => {
			let cost = price.cost;
			let abbreviation = price.abbreviation;
			if (!Helpers.isRealNumber(cost) || !abbreviation) {
				Helpers.custom_error(`getStringFromCurrencies | The currency element is not valid with cost '${cost}' and abbreviation '${abbreviation}'`, true);
				return "";
			}
			// Check abbreviation by case unsensitive...
			const indexAbbreviation = allAbbreviationsArray.findIndex(a => {
				return a?.replace("{#}", "")?.toLowerCase() === abbreviation?.replace("{#}", "")?.toLowerCase();
			});
			if (indexAbbreviation === -1) {
				Helpers.custom_error(`getStringFromCurrencies | The currency abbreviation '${abbreviation?.replace("{#}", "")}' is not registered`, true);
				return "";
			}
			if (price.percent && abbreviation.includes("%")) {
				abbreviation = abbreviation.replaceAll("%", "")
			}
			if (abbreviation.includes("{#}")) {
				return abbreviation.replace("{#}", price.cost)
			} else {
				return price.cost + abbreviation;
			}
		}).join(" ");

	return priceString
		? priceString.trim()
		: "";
}

export function getPriceFromString(str, currencyList = false) {

	if (!currencyList) {
		currencyList = getCurrencyList()
	}

	let currencies = foundry.utils.duplicate(currencyList)
		.map(currency => {
			currency.quantity = 0
			currency.identifier = currency.abbreviation.toLowerCase().replace("{#}", "").trim()
			return currency;
		});

	const sortedCurrencies = currencies.map(currency => `(${currency.identifier})`);
	sortedCurrencies.sort((a, b) => b.length - a.length);
	const splitBy = new RegExp("(.*?) *(" + sortedCurrencies.join("|") + ")", "g");

	const parts = [...str.split(",").join("").split(" ").join("").trim().toLowerCase().matchAll(splitBy)];
	const identifierFilter = [];
	let overallCost = 0;
	for (const part of parts) {
		for (const currency of currencies) {

			if (part[2]) {
				identifierFilter.push(part[2]?.toLowerCase());
			}

			if (part[2] !== currency.identifier) continue;

			try {
				const roll = new Roll(part[1]).evaluateSync()
				currency.quantity = roll.total;
				if (roll.total !== Number(part[1])) {
					currency.roll = roll;
				}
				if (currency.exchangeRate) {
					overallCost += roll.total * currency.exchangeRate;
				}
			} catch (err) {

			}
		}
	}

	// Maybe there is a better method for this ?
	currencies = currencies.filter(currency => identifierFilter.includes(currency.identifier?.toLowerCase()));

	if (!currencies.some(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity >= 0)) {
		try {
			const roll = new Roll(str).evaluateSync();
			if (roll.total) {
				const primaryCurrency = currencies.find(currency => currency.primary);
				primaryCurrency.quantity = roll.total;
				if (roll.total !== Number(str)) {
					primaryCurrency.roll = roll;
				}
				overallCost = roll.total;
			}
		} catch (err) {

		}
	}

	return { currencies, overallCost };
}

export function getCostOfItem(item, defaultCurrencies = false) {

	if (!defaultCurrencies) {
		defaultCurrencies = getCurrencyList().filter(currency => !currency.secondary);
	}

	let overallCost = 0;
	let itemCost = Utilities.getItemCost(item);
	if (SYSTEMS.DATA.ITEM_COST_TRANSFORMER) {
		overallCost = SYSTEMS.DATA.ITEM_COST_TRANSFORMER(item, defaultCurrencies);
		if (overallCost === false) {
			Helpers.debug("failed to find price for item:", item)
		}
	} else if (typeof itemCost === "string" && isNaN(Number(itemCost))) {
		overallCost = getPriceFromString(itemCost, defaultCurrencies).overallCost;
	} else {
		overallCost = Number(itemCost);
	}

	return Math.max(0, overallCost);
}

function getItemFlagPriceData(priceData, quantity, modifier, defaultCurrencies, currencyList) {

	return priceData.map(priceGroup => {
		if (!Array.isArray(priceGroup)) priceGroup = [priceGroup];
		const itemPrices = priceGroup.map(price => {
			const itemModifier = price.fixed
				? 1
				: modifier;
			const cost = Math.round(price.quantity * itemModifier * quantity);
			let baseCost = Math.round(price.quantity * itemModifier);
			price.name = game.i18n.localize(price.name);
			if (!price.data?.item) {
				price.data.item = CompendiumUtilities.getItemFromCache(price.data.uuid);
			}

			const isRegularCurrency = !price.secondary ? currencyList.find(currency => {
				return currency.name === price.name && currency.img === price.img && (currency.data.uuid === price.data.uuid || currency.data.path === price.data.path)
			}) : false;

			const totalCost = isRegularCurrency ? price.quantity * isRegularCurrency.exchangeRate : 0;

			return {
				...price,
				cost,
				baseCost: baseCost * (isRegularCurrency ? isRegularCurrency.exchangeRate : 1.0),
				totalCost,
				modifier: itemModifier,
				priceString: cost
					? price.abbreviation.replace("{#}", cost)
					: "",
				basePriceString: baseCost
					? price.abbreviation.replace("{#}", baseCost)
					: "",
				secondary: !isRegularCurrency
			};
		});

		const primaryPrices = itemPrices.filter(price => !price.secondary);
		const secondaryPrices = itemPrices.filter(price => price.secondary);
		const totalCost = primaryPrices.reduce((acc, price) => price.totalCost + acc, 0) * quantity;
		const baseCost = primaryPrices.reduce((acc, price) => price.baseCost + acc, 0) * quantity;
		const primaryCurrencyPrices = getPriceArray(totalCost, defaultCurrencies);

		const prices = primaryCurrencyPrices.filter(price => price.cost).concat(secondaryPrices);

		return {
			prices,
			baseCost,
			totalCost,
			priceString: prices.filter(price => price.string || price.priceString).map(price => price.string || price.priceString).join(" "),
			basePriceString: prices.filter(price => price.string || price.basePriceString).map(price => price.string || price.basePriceString).join(" "),
			maxQuantity: 0,
			quantity: quantity,
		}
	});

}

export function getPriceData({
	cost = false,
	item = false,
	seller = false,
	buyer = false,
	sellerFlagData = false,
	buyerFlagData = false,
	itemFlagData = false,
	quantity = 1,
	secondaryPrices = false
} = {}) {

	let priceData = [];

	buyerFlagData = getActorFlagData(buyer, { data: buyerFlagData });
	if (!isItemPileMerchant(buyer, buyerFlagData)) {
		buyerFlagData = false;
	}

	sellerFlagData = getActorFlagData(seller, { data: sellerFlagData });
	if (!isItemPileMerchant(seller, sellerFlagData)) {
		sellerFlagData = false;
	}

	if (cost && !item) {
		item = {};
		foundry.utils.setProperty(item, game.itempiles.API.ITEM_PRICE_ATTRIBUTE, cost);
		foundry.utils.setProperty(item, CONSTANTS.FLAGS.ITEM, CONSTANTS.ITEM_DEFAULTS);
	}

	itemFlagData = itemFlagData || getItemFlagData(item);

	let merchant = sellerFlagData
		? seller
		: buyer;

	if (merchant === buyer && itemFlagData.cantBeSoldToMerchants) {
		priceData.push({
			free: false,
			basePrices: [],
			basePriceString: "",
			prices: [],
			priceString: "",
			totalCost: 0,
			baseCost: 0,
			primary: true,
			maxQuantity: 0,
			quantity
		});
		return priceData;
	}

	// Retrieve the item price modifiers
	let modifier = 1;
	if (sellerFlagData) {

		modifier = getMerchantModifiersForActor(seller, {
			item, actor: buyer, pileFlagData: sellerFlagData, itemFlagData
		}).buyPriceModifier;

	} else if (buyerFlagData) {

		modifier = getMerchantModifiersForActor(buyer, {
			item, actor: seller, pileFlagData: buyerFlagData, itemFlagData
		}).sellPriceModifier;

	}

	const disableNormalCost = itemFlagData.disableNormalCost && (merchant === seller || (itemFlagData.purchaseOptionsAsSellOption && !buyerFlagData.onlyAcceptBasePrice));
	const hasOtherPrices = secondaryPrices?.length > 0 || itemFlagData.prices.filter(priceGroup => priceGroup.length).length > 0 || itemFlagData.sellPrices.filter(priceGroup => priceGroup.length).length > 0;

	const currencyList = getCurrencyList(merchant);
	const currencies = getActorCurrencies(merchant, { currencyList, getAll: true });
	const defaultCurrencies = currencies.filter(currency => !currency.secondary);

	// In order to easily calculate an item's total worth, we can use the smallest exchange rate and convert all prices
	// to it, in order have a stable form of exchange calculation
	const smallestExchangeRate = getSmallestExchangeRate(defaultCurrencies);
	const decimals = getDecimalDifferenceBetweenExchangeRates(defaultCurrencies);

	let overallCost = getCostOfItem(item, defaultCurrencies);

	if (itemFlagData?.free || (!disableNormalCost && (overallCost === 0 || overallCost < smallestExchangeRate) && !hasOtherPrices) || modifier <= 0) {
		priceData.push({
			free: true,
			basePrices: [],
			basePriceString: "",
			prices: [],
			priceString: "",
			totalCost: 0,
			baseCost: 0,
			primary: true,
			maxQuantity: Infinity,
			quantity: quantity
		})
		return priceData;
	}

	// If the item does include its normal cost, we calculate that here
	if (overallCost >= smallestExchangeRate && !disableNormalCost) {

		// Base prices is the displayed price, without quantity taken into account
		const baseCost = Helpers.roundToDecimals(overallCost * modifier, decimals);
		const basePrices = getPriceArray(baseCost, defaultCurrencies);

		// Prices is the cost with the amount of quantity taken into account, which may change the number of the different
		// types of currencies it costs (eg, an item wouldn't cost 1 gold and 100 silver, it would cost 11 gold
		let totalCost = baseCost * quantity;

		let prices = getPriceArray(totalCost, defaultCurrencies);

		if (baseCost) {

			priceData.push({
				basePrices,
				basePriceString: basePrices.filter(price => price.cost).map(price => price.string).join(" "),
				prices,
				priceString: prices.filter(price => price.cost).map(price => price.string).join(" "),
				totalCost,
				baseCost,
				primary: true,
				maxQuantity: 0,
				quantity: quantity
			});

		}
	}

	// If the item has custom prices, we include them here
	if (secondaryPrices?.length) {

		if (!priceData.length) {
			priceData.push({
				basePrices: [],
				basePriceString: "",
				prices: [],
				priceString: "",
				totalCost: 0,
				baseCost: 0,
				primary: true,
				maxQuantity: 0,
				quantity: quantity
			});
		}

		for (const secondaryPrice of secondaryPrices) {

			const itemModifier = modifier;
			const cost = Math.round(secondaryPrice.quantity * itemModifier * quantity);
			const baseCost = Math.round(secondaryPrice.quantity * itemModifier);
			secondaryPrice.name = game.i18n.localize(secondaryPrice.name);
			if (!secondaryPrice.data?.item && secondaryPrice.data.uuid) {
				secondaryPrice.data.item = CompendiumUtilities.getItemFromCache(secondaryPrice.data.uuid);
			}
			priceData[0].basePrices.push({
				...secondaryPrice,
				cost,
				baseCost,
				modifier: itemModifier,
				string: secondaryPrice.abbreviation.replace("{#}", baseCost),
				priceString: cost
					? secondaryPrice.abbreviation.replace("{#}", cost)
					: "",
				basePriceString: baseCost
					? secondaryPrice.abbreviation.replace("{#}", baseCost)
					: ""
			});
			priceData[0].prices.push({
				...secondaryPrice,
				cost,
				baseCost,
				modifier: itemModifier,
				string: secondaryPrice.abbreviation.replace("{#}", cost),
				priceString: cost
					? secondaryPrice.abbreviation.replace("{#}", cost)
					: "",
				basePriceString: baseCost
					? secondaryPrice.abbreviation.replace("{#}", baseCost)
					: ""
			});

			priceData[0].basePriceString = priceData[0].basePrices.filter(price => price.cost).map(price => price.string).join(" ");
			priceData[0].priceString = priceData[0].prices.filter(price => price.cost).map(price => price.string).join(" ");

		}

	}

	if (itemFlagData.prices.length && (merchant === seller || (itemFlagData.purchaseOptionsAsSellOption && !buyerFlagData.onlyAcceptBasePrice))) {
		priceData = priceData.concat(getItemFlagPriceData(itemFlagData.prices, quantity, modifier, defaultCurrencies, currencyList));
	}

	if (itemFlagData.sellPrices.length && merchant === buyer && !buyerFlagData.onlyAcceptBasePrice) {
		priceData = priceData.concat(getItemFlagPriceData(itemFlagData.sellPrices, quantity, modifier, defaultCurrencies, currencyList));
	}

	// If there's a buyer, we also calculate how many of the item the buyer can afford
	if (!buyer) return priceData;

	const buyerInfiniteCurrencies = buyerFlagData?.infiniteCurrencies;
	const buyerInfiniteQuantity = buyerFlagData?.infiniteQuantity;

	const recipientCurrencies = getActorCurrencies(buyer, { currencyList });
	const totalCurrencies = recipientCurrencies
		.filter(currency => currency.exchangeRate !== undefined)
		.map(currency => currency.quantity * currency.exchangeRate).reduce((acc, num) => acc + num, 0);

	// For each price group, check for properties and items and make sure that the actor can afford it
	for (const priceGroup of priceData) {

		const primaryPrices = priceGroup.prices.filter(price => !price.secondary);
		const secondaryPrices = priceGroup.prices.filter(price => price.secondary);
		priceGroup.maxQuantity = Infinity;

		if (primaryPrices.length) {
			priceGroup.prices.forEach(price => {
				price.maxQuantity = Infinity;
			});
			if (!buyerInfiniteCurrencies) {
				priceGroup.maxQuantity = Math.floor(totalCurrencies / priceGroup.baseCost);
				priceGroup.prices.forEach(price => {
					price.maxQuantity = priceGroup.maxQuantity;
				});
			}
		}

		for (const price of secondaryPrices) {

			if (buyerInfiniteQuantity) {
				price.maxQuantity = Infinity;
				continue;
			}

			if (price.type === "attribute") {
				const attributeQuantity = Utilities.sanitizeNumber(foundry.utils.getProperty(buyer, price.data.path));
				price.buyerQuantity = attributeQuantity;

				if (price.percent) {
					const percent = Math.min(1, price.baseCost / 100);
					const percentQuantity = Math.max(0, Math.floor(attributeQuantity * percent));
					price.maxQuantity = Math.floor(attributeQuantity / percentQuantity);
					price.baseCost = !buyer
						? price.baseCost
						: percentQuantity;
					price.cost = !buyer
						? price.cost
						: percentQuantity * quantity;
					price.quantity = !buyer
						? price.quantity
						: percentQuantity;
				} else {
					price.maxQuantity = Math.floor(attributeQuantity / price.baseCost);
				}

				priceGroup.maxQuantity = Math.min(priceGroup.maxQuantity, price.maxQuantity)

			} else {
				const priceItem = CompendiumUtilities.getItemFromCache(price.data.uuid);
				const foundItem = priceItem
					? Utilities.findSimilarItem(buyer.items, priceItem)
					: false;
				const itemQuantity = foundItem
					? Utilities.getItemQuantity(foundItem)
					: 0;
				price.buyerQuantity = itemQuantity;
				if (!itemQuantity) {
					priceGroup.maxQuantity = 0;
					priceGroup.quantity = 0;
					continue;
				}

				if (price.percent) {
					const percent = Math.min(1, price.baseCost / 100);
					const percentQuantity = Math.max(0, Math.floor(itemQuantity * percent));
					price.maxQuantity = Math.floor(itemQuantity / percentQuantity);
					price.baseCost = !buyer
						? price.baseCost
						: percentQuantity;
					price.cost = !buyer
						? price.cost
						: percentQuantity * quantity;
					price.quantity = !buyer
						? price.quantity
						: percentQuantity;
				} else {
					price.maxQuantity = Math.floor(itemQuantity / price.baseCost);
				}

				priceGroup.maxQuantity = Math.min(priceGroup.maxQuantity, price.maxQuantity);
			}

		}
	}

	return priceData;
}

export function getPaymentData({
	purchaseData = [],
	seller = false,
	buyer = false,
	sellerFlagData = false,
	buyerFlagData = false
} = {}) {

	buyerFlagData = getActorFlagData(buyer, { data: buyerFlagData });
	if (!isItemPileMerchant(buyer, buyerFlagData)) {
		buyerFlagData = false;
	}

	sellerFlagData = getActorFlagData(seller, { data: sellerFlagData });
	if (!isItemPileMerchant(seller, sellerFlagData)) {
		sellerFlagData = false;
	}

	const merchant = sellerFlagData
		? seller
		: buyer;
	const currencyList = getCurrencyList(merchant);
	const currencies = getActorCurrencies(merchant, { currencyList, getAll: true });
	const decimals = getDecimalDifferenceBetweenExchangeRates(currencies);

	const recipientCurrencies = getActorCurrencies(buyer, { currencyList, getAll: true });

	const buyerInfiniteCurrencies = buyerFlagData?.infiniteCurrencies;

	const paymentData = purchaseData.map(data => {
			const prices = getPriceData({
				cost: data.cost,
				item: data.item,
				secondaryPrices: data.secondaryPrices,
				seller,
				buyer,
				sellerFlagData,
				buyerFlagData,
				itemFlagData: data.itemFlagData,
				quantity: data.quantity || 1
			})[data.paymentIndex || 0];
			return {
				...prices,
				item: data.item
			};
		})
		.reduce((priceData, priceGroup) => {

			priceData.reasons = [];

			if (!priceGroup.maxQuantity && (buyer || seller)) {
				priceData.canBuy = false;
				const reason = (buyer === merchant ? "TheyCantAfford" : "YouCantAfford");
				priceData.reason.push([`ITEM-PILES.Applications.TradeMerchantItem.${reason}`]);
				return priceData;
			}

			const primaryPrices = priceGroup.prices.filter(price => !price.secondary && price.cost);
			const secondaryPrices = priceGroup.prices.filter(price => price.secondary && price.cost);

			if (primaryPrices.length) {

				priceData.totalCurrencyCost = Helpers.roundToDecimals(priceData.totalCurrencyCost + priceGroup.totalCost, decimals);
				priceData.primary = true;

			}

			if (secondaryPrices.length) {

				for (const price of secondaryPrices) {

					let existingPrice = priceData.otherPrices.find(otherPrice => {
						return otherPrice.id === price.id || (otherPrice.name === price.name && otherPrice.img === price.img && otherPrice.type === price.type);
					});

					if (existingPrice) {
						existingPrice.cost += price.cost;
					} else {
						const index = priceData.otherPrices.push(price);
						existingPrice = priceData.otherPrices[index - 1];
						existingPrice.quantity = 0;
					}

					existingPrice.quantity += price.cost;
					existingPrice.buyerQuantity -= price.cost;

					if (existingPrice.buyerQuantity < 0) {
						priceData.canBuy = false;
						const reason = (buyer === merchant ? "TheyCantAfford" : "YouCantAfford");
						priceData.reasons.push([`ITEM-PILES.Applications.TradeMerchantItem.${reason}`]);
					}
				}
			}

			if (priceGroup.item) {

				let items = [{ item: priceGroup.item, contained: false }];
				const itemTypeHandler = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.TRANSFER, priceGroup.item.type);
				if (itemTypeHandler) {
					const containedItems = [];
					itemTypeHandler({ item: priceGroup.item, items: containedItems, raw: true })
					items = items.concat(containedItems.map(item => ({ item, contained: true })))
				}

				for (const itemData of items) {

					const itemQuantity = Utilities.getItemQuantity(itemData.item);

					const quantityPerPrice = foundry.utils.getProperty(itemData.item, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE) ?? 1;

					const requiredQuantity = Math.floor(priceGroup.quantity * quantityPerPrice);

					if (requiredQuantity > itemQuantity && requiredQuantity > (priceGroup.maxQuantity * quantityPerPrice)) {
						priceData.canBuy = false;
						const reason = buyer === merchant ? "You" : "They";
						priceData.reasons.push([`ITEM-PILES.Applications.TradeMerchantItem.${reason}LackQuantity`, {
							quantity: itemQuantity,
							requiredQuantity
						}]);
					}

					priceData.buyerReceive.push({
						type: "item",
						name: itemData.item.name,
						img: itemData.item.img,
						quantity: requiredQuantity,
						item: itemData.item,
						contained: itemData.contained
					});
				}
			}

			return priceData;

		}, {
			totalCurrencyCost: 0, canBuy: true, primary: false, finalPrices: [], otherPrices: [], reason: [],

			buyerReceive: [], buyerChange: [], sellerReceive: []
		});

	if (paymentData.totalCurrencyCost && !seller && !buyer) {

		paymentData.finalPrices = getPriceArray(paymentData.totalCurrencyCost, recipientCurrencies)
			.filter(currency => !currency.secondary);

	} else if (paymentData.totalCurrencyCost) {

		// The price array that we need to fill
		const prices = getPriceArray(paymentData.totalCurrencyCost, recipientCurrencies)
			.filter(currency => !currency.secondary);

		// This is the target price amount we need to hit
		let priceLeft = paymentData.totalCurrencyCost;

		const inverse = prices[prices.length - 1].primary && prices[prices.length - 1].exchangeRate === 1;

		// Starting from the smallest currency increment in the price
		for (let i = prices.length - 1, j = 0; i >= 0; i--, j++) {

			const price = prices[inverse
				? j
				: i];

			const buyerPrice = {
				...price,
				buyerQuantity: buyerInfiniteCurrencies
					? Infinity
					: price.quantity,
				quantity: 0,
				isCurrency: true
			}

			if (price.type === "item") {
				buyerPrice.item = price.data.item ?? CompendiumUtilities.getItemFromCache(price.data.uuid);
			}

			// If we have met the price target (or exceeded it, eg, we need change), populate empty entry
			if (priceLeft <= 0 || !price.cost || currencies.length === 1) {
				if (currencies.length === 1) {
					buyerPrice.quantity = price.cost;
					priceLeft = 0;
				}
				paymentData.finalPrices.push(buyerPrice);
				continue;
			}

			// If the buyer does not have enough to cover the cost, put what we can into it, otherwise all of it
			buyerPrice.quantity = buyerPrice.buyerQuantity < price.cost
				? buyerPrice.buyerQuantity
				: price.cost;

			// If it's the primary currency
			if (price.primary) {
				// And the buyer has enough of the primary currency to cover the rest of the price, use that
				const totalCurrencyValue = Helpers.roundToDecimals(buyerPrice.buyerQuantity * price.exchangeRate, decimals);
				if (totalCurrencyValue > priceLeft) {
					buyerPrice.quantity = Math.ceil(priceLeft);
				}
			}

			paymentData.finalPrices.push(buyerPrice);

			// Then adjust the remaining price - if this goes below zero, we will need change back
			priceLeft = Helpers.roundToDecimals(priceLeft - (buyerPrice.quantity * price.exchangeRate), decimals);

		}

		// If there's STILL some remaining price (eg, we haven't been able to scrounge up enough currency to pay for it)
		// we can start using the larger currencies, such as platinum in D&D 5e
		if (currencies.length > 1) {

			while (priceLeft > 0) {

				// We then need to loop through each price, and check if we have any more left over
				for (const buyerPrice of paymentData.finalPrices) {

					// If we don't, look for the next one
					let buyerCurrencyQuantity = buyerPrice.buyerQuantity - buyerPrice.quantity;
					if (!buyerCurrencyQuantity) continue;

					// Otherwise, add enough to cover the remaining cost
					const newQuantity = Math.ceil(Math.min(buyerCurrencyQuantity, priceLeft / buyerPrice.exchangeRate));
					buyerPrice.quantity += newQuantity;
					priceLeft = Helpers.roundToDecimals(priceLeft - (newQuantity * buyerPrice.exchangeRate), decimals);

					if (priceLeft <= 0) break;

				}

				if (priceLeft > 0) {
					paymentData.finalPrices = paymentData.finalPrices.sort((a, b) => b.exchangeRate - a.exchangeRate);
				} else {
					break;
				}
			}

			paymentData.finalPrices = paymentData.finalPrices.sort((a, b) => b.exchangeRate - a.exchangeRate);

			// Since the change will be negative, we'll need to flip it, since this is what we'll get back
			let change = Math.abs(priceLeft);

			for (const currency of currencies) {

				if (!change) break;

				// Get the remaining price, and normalize it to this currency
				let numCurrency = Math.floor(Helpers.roundToDecimals(change / currency.exchangeRate, decimals));
				change = Helpers.roundToDecimals(change - (numCurrency * currency.exchangeRate), decimals);

				// If there's some currencies to be gotten back
				if (numCurrency) {
					// We check if we've paid with this currency
					const payment = paymentData.finalPrices.find(payment => {
						return payment.id === currency.id || (payment.name === currency.name && payment.img === currency.img && payment.type === currency.type);
					});
					if (!payment) continue;

					// If we have paid with this currency, and we're getting some back, we can do one of two things:
					if ((payment.quantity - numCurrency) >= 0) {
						// Either just subtract it from the total paid if some of our payment will still remain
						// IE, the change we got back didn't cancel out the payment
						payment.quantity -= numCurrency;
					} else {
						// Or if it does cancel out our payment, we add that to the change we'll get back and remove the payment entirely
						paymentData.buyerChange.push({
							...currency, isCurrency: true, quantity: numCurrency - payment.quantity
						});
						payment.quantity = 0;
					}
				}
			}
		}

		// Copy the final currencies that the seller will get
		paymentData.sellerReceive = paymentData.finalPrices.map(price => {
			return { ...price };
		});

		// But, we'll need to make sure they have enough change to _give_ to the buyer
		// We collate the total amount of change needed
		let changeNeeded = paymentData.buyerChange.reduce((acc, change) => {
			const currency = currencies.find(currency => {
				return change.id === currency.id || (change.name === currency.name && change.img === currency.img && change.type === currency.type);
			});
			return acc + currency.quantity >= change.quantity
				? 0
				: (change.quantity - currency.quantity) * change.exchangeRate;
		}, 0);

		// If the seller needs give the buyer some change, we'll modify the payment they'll get to cover for it
		if (changeNeeded) {

			// If the seller is being given enough of the primary currency to cover for the cost, we use that
			const primaryCurrency = paymentData.sellerReceive.find(price => price.primary && (price.quantity * price.exchangeRate) > changeNeeded);
			if (primaryCurrency) {
				primaryCurrency.quantity--;
				changeNeeded -= 1 * primaryCurrency.exchangeRate;
			} else {
				// Otherwise, we'll use the biggest currency we can find to cover for it
				const biggestCurrency = paymentData.sellerReceive.find(price => price.quantity && (price.quantity * price.exchangeRate) > changeNeeded);
				biggestCurrency.quantity--;
				changeNeeded -= 1 * biggestCurrency.exchangeRate;
			}

			changeNeeded = Math.abs(changeNeeded);

			// Then loop through each currency and add enough currency so that the total adds up
			for (const currency of paymentData.sellerReceive) {
				if (!changeNeeded) break;
				let numCurrency = Math.floor(Helpers.roundToDecimals(changeNeeded / currency.exchangeRate, decimals));
				changeNeeded = Helpers.roundToDecimals(changeNeeded - (numCurrency * currency.exchangeRate), decimals);
				currency.quantity += numCurrency;
			}
		}
	}

	paymentData.finalPrices = paymentData.finalPrices.concat(paymentData.otherPrices);
	paymentData.sellerReceive = paymentData.sellerReceive.concat(paymentData.otherPrices);

	paymentData.basePriceString = paymentData.finalPrices
		.filter(price => price.cost)
		.map(price => {
			let abbreviation = price.abbreviation;
			if (price.percent && abbreviation.includes("%")) {
				abbreviation = abbreviation.replaceAll("%", "")
			}
			return abbreviation.replace("{#}", price.cost)
		}).join(" ");

	delete paymentData.otherPrices;

	return paymentData;

}

export function isMerchantClosed(merchant, { pileData = false } = {}) {

	if (!pileData) pileData = getActorFlagData(merchant);

	const timestamp = window.SimpleCalendar.api.timestampToDate(window.SimpleCalendar.api.timestamp());

	const openTimes = pileData.openTimes.open;
	const closeTimes = pileData.openTimes.close;

	const openingTime = Number(openTimes.hour.toString() + "." + openTimes.minute.toString());
	const closingTime = Number(closeTimes.hour.toString() + "." + closeTimes.minute.toString());
	const currentTime = Number(timestamp.hour.toString() + "." + timestamp.minute.toString());

	let isClosed = openingTime > closingTime
		? !(currentTime >= openingTime || currentTime <= closingTime)  // Is the store open over midnight?
		: !(currentTime >= openingTime && currentTime <= closingTime); // or is the store open during normal daylight hours?

	const currentWeekday = window.SimpleCalendar.api.getCurrentWeekday();

	isClosed = isClosed || (pileData.closedDays ?? []).includes(currentWeekday.name);

	const currentDate = window.SimpleCalendar.api.currentDateTime();
	const notes = window.SimpleCalendar.api.getNotesForDay(currentDate.year, currentDate.month, currentDate.day);
	const categories = new Set(notes.map(note => foundry.utils.getProperty(note, "flags.foundryvtt-simple-calendar.noteData.categories") ?? []).deepFlatten());

	return isClosed || categories.intersection(new Set(pileData.closedHolidays ?? [])).size > 0;

}

export async function updateMerchantLog(itemPile, activityData) {

	const vaultLog = getActorLog(itemPile);

	vaultLog.push({
		...activityData, date: Date.now()
	});

	return itemPile.update({
		[CONSTANTS.FLAGS.LOG]: vaultLog
	});
}

/* ---------------------- VAULT FUNCTIONS ---------------------- */

export function getVaultGridData(vaultActor, { flagData = false, items = false } = {}) {

	const vaultFlags = getActorFlagData(vaultActor, { data: flagData });

	const vaultItems = getActorItems(vaultActor);

	let enabledCols = vaultFlags.cols;
	let enabledRows = vaultFlags.rows;

	const regularItems = (items || vaultItems).map(item => ({
		item, itemFlagData: getItemFlagData(item), quantity: Utilities.getItemQuantity(item)
	})).filter(({ itemFlagData }) => {
		return !itemFlagData.vaultExpander || !vaultFlags.vaultExpansion;
	});

	const vaultExpanders = vaultItems.map(item => ({
		item, itemFlagData: getItemFlagData(item), quantity: Utilities.getItemQuantity(item)
	})).filter(({ itemFlagData }) => {
		return itemFlagData.vaultExpander && vaultFlags.vaultExpansion;
	});

	if (vaultFlags.vaultExpansion) {

		const expansions = vaultExpanders.reduce((acc, item) => {
			acc.cols += (item.itemFlagData.addsCols ?? 0) * item.quantity;
			acc.rows += (item.itemFlagData.addsRows ?? 0) * item.quantity;
			return acc;
		}, {
			cols: vaultFlags.baseExpansionCols ?? 0, rows: vaultFlags.baseExpansionRows ?? 0
		});

		enabledCols = expansions.cols;
		enabledRows = expansions.rows;

	}

	enabledCols = Math.min(enabledCols, vaultFlags.cols);
	enabledRows = Math.min(enabledRows, vaultFlags.rows);

	const grid = Array.from(Array(enabledCols).keys()).map(() => {
		return Array.from(Array(enabledRows).keys()).map(() => {
			return null;
		})
	});

	for (const item of regularItems) {
		const { width, height } = getVaultItemDimensions(item.item, item.itemFlagData);
		for (let w = 0; w < width; w++) {
			const x = Math.max(0, Math.min(item.itemFlagData.x + w, enabledCols - 1));
			for (let h = 0; h < height; h++) {
				const y = Math.max(0, Math.min(item.itemFlagData.y + h, enabledRows - 1));
				grid[x][y] = item.item.name;
			}
		}
	}

	let freeCells = [];
	for (let x = 0; x < enabledCols; x++) {
		for (let y = 0; y < enabledRows; y++) {
			if (grid[x][y]) continue;
			freeCells.push({ x, y });
		}
	}

	return {
		totalSpaces: Math.max(0, (vaultFlags.cols * vaultFlags.rows)),
		enabledSpaces: Math.max(0, (enabledCols * enabledRows)),
		freeSpaces: Math.max(0, (enabledCols * enabledRows) - regularItems.length),
		enabledCols: enabledCols,
		enabledRows: enabledRows,
		cols: vaultFlags.cols,
		rows: vaultFlags.rows,
		items: regularItems,
		grid,
		freeCells
	}

}

export function getVaultItemDimensions(item, itemFlagData = false) {
	let { width, height, flipped } = getItemFlagData(item, itemFlagData);
	return {
		width: flipped
			? height
			: width,
		height: flipped
			? width
			: height
	}
}

export function fitItemsIntoVault(items, vaultActor, {
	mergeItems = true,
	existingItems = false,
	itemFilters = false
} = {}) {
	if (!isItemPileVault(vaultActor)) return { updates: items, deletions: [] };
	const vaultItems = existingItems || getActorItems(vaultActor, { itemFilters });
	const gridData = getVaultGridData(vaultActor, { items: existingItems });
	const updates = [];
	const deletions = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const itemData = foundry.utils.deepClone(item instanceof Item
			? item.toObject()
			: item);
		const flagData = getItemFlagData(itemData);
		const newPosition = canItemFitInVault(itemData, vaultActor, { gridData, items: vaultItems, mergeItems });
		if (typeof newPosition === "string") {
			deletions.push(item._id);
			const update = updates.find(update => update._id === newPosition);
			if (update) Utilities.setItemQuantity(update, (Utilities.getItemQuantity(update) ?? 1) + Utilities.getItemQuantity(itemData));
			continue;
		} else if (!newPosition) {
			return false;
		}
		foundry.utils.setProperty(flagData, "x", newPosition.x);
		foundry.utils.setProperty(flagData, "y", newPosition.y);
		foundry.utils.setProperty(flagData, "flipped", newPosition.flipped);
		const { width, height } = getVaultItemDimensions(item, flagData);
		for (let w = 0; w < width; w++) {
			const x = Math.max(0, Math.min(newPosition.x + w, gridData.enabledCols - 1));
			for (let h = 0; h < height; h++) {
				const y = Math.max(0, Math.min(newPosition.y + h, gridData.enabledRows - 1));
				gridData.grid[x][y] = item.name;
				const indexToDelete = gridData.freeCells.findIndex(pos => pos.x === x && pos.y === y);
				if (indexToDelete > -1) {
					gridData.freeCells.splice(indexToDelete, 1);
				}
			}
		}
		foundry.utils.setProperty(itemData, CONSTANTS.FLAGS.ITEM, flagData);
		updates.push(itemData);
		vaultItems.push(itemData);
	}
	return {
		updates,
		deletions
	}
}

export function canItemFitInVault(item, vaultActor, {
	mergeItems = true,
	gridData = null,
	position = null,
	items = null
} = {}) {
	if (!isItemPileVault(vaultActor)) return true;
	const vaultItems = items ?? getActorItems(vaultActor);
	if (mergeItems && canItemStack(item, vaultActor)) {
		const similarItem = Utilities.findSimilarItem(vaultItems, item);
		if (similarItem) {
			const itemFlagData = getItemFlagData(similarItem);
			if (!position || areItemsColliding(position, itemFlagData)) {
				return similarItem.id ?? similarItem._id;
			}
		}
	}
	const vaultGridData = gridData ?? getVaultGridData(vaultActor);
	return getNewItemsVaultPosition(item, vaultGridData, { position, items });
}

export function getNewItemsVaultPosition(item, gridData, { position = null } = {}) {

	const itemFlagData = getItemFlagData(item);
	let flipped = position?.flipped ?? false;
	const { grid, freeCells, enabledCols, enabledRows } = gridData;

	if (position) {
		let fitsInPosition = true;
		const { width, height } = getVaultItemDimensions(item, { ...itemFlagData, flipped });
		for (let w = 0; w < width; w++) {
			for (let h = 0; h < height; h++) {
				fitsInPosition = (position.x + w) < enabledCols
					&& (position.y + h) < enabledRows
					&& !grid[position.x + w][position.y + h];
				if (!fitsInPosition) break;
			}
			if (!fitsInPosition) break;
		}
		if (fitsInPosition) return position;
	} else {
		position = { x: 0, y: 0 };
	}

	const loops = Number(itemFlagData.width > 1 || itemFlagData.height > 1);
	for (let i = 0; i <= loops; i++) {

		const { width, height } = getVaultItemDimensions(item, { ...itemFlagData, flipped });

		const validCells = freeCells.filter(cell => {
			return ((cell.x + width) <= enabledCols) && ((cell.y + height) <= enabledRows);
		});

		const cellsToCheck = validCells.sort((a, b) => {
			const distA = (new Ray(a, position)).distance;
			const distB = (new Ray(b, position)).distance;
			return distA - distB;
		});

		if (width === 1 && height === 1 && cellsToCheck.length) {
			return cellsToCheck[0];
		}

		cellLoop:
			for (const { x, y } of cellsToCheck) {
				for (let w = 0; w < width; w++) {
					for (let h = 0; h < height; h++) {
						if (grid[x + w][y + h]) {
							continue cellLoop;
						}
					}
				}
				return { x, y, flipped };
			}
		flipped = !flipped;
	}

	return false;

}

export function getVaultAccess(vaultActor, { flagData = false, hasRecipient = false } = {}) {

	const vaultFlags = getActorFlagData(vaultActor, { data: flagData });

	const vaultAccess = vaultFlags.vaultAccess.filter(access => {
		return fromUuidSync(access.uuid)?.isOwner;
	});

	return vaultAccess.reduce((acc, access) => {
		acc.canView = acc.canView || (access.view ?? true);
		acc.canOrganize = acc.canOrganize || access.organize;
		acc.canWithdrawItems = (acc.canWithdrawItems || access.items.withdraw) && hasRecipient;
		acc.canDepositItems = (acc.canDepositItems || access.items.deposit) && hasRecipient;
		acc.canWithdrawCurrencies = (acc.canWithdrawCurrencies || access.currencies.withdraw) && hasRecipient;
		acc.canDepositCurrencies = (acc.canDepositCurrencies || access.currencies.deposit) && hasRecipient;
		return acc;
	}, {
		canView: vaultActor.isOwner || !vaultFlags.restrictVaultAccess,
		canOrganize: vaultActor.isOwner,
		canWithdrawItems: vaultActor.isOwner && hasRecipient,
		canDepositItems: vaultActor.isOwner && hasRecipient,
		canWithdrawCurrencies: vaultActor.isOwner && hasRecipient,
		canDepositCurrencies: vaultActor.isOwner && hasRecipient
	});

}

export async function updateVaultLog(itemPile, {
	actor = false, userId = false, items = [], attributes = [], withdrawal = true, vaultLogData = {},
} = {}) {

	const formattedItems = [];
	const formattedCurrencies = [];

	const currencies = getActorCurrencies(itemPile, { getAll: true });

	const date = Date.now();

	for (const itemData of items) {
		if (currencies.some(currency => currency.name === itemData.item.name)) {
			formattedCurrencies.push({
				actor: actor?.name ?? false,
				user: userId,
				name: itemData.item.name,
				qty: itemData.quantity * (withdrawal
					? -1
					: 1),
				action: vaultLogData?.action ?? (withdrawal
					? "withdrew"
					: "deposited"),
				date
			});
		} else {
			const item = new Item.implementation(itemData.item);
			formattedItems.push({
				actor: actor?.name ?? false,
				user: userId,
				name: item.name,
				qty: itemData.quantity * (withdrawal
					? -1
					: 1),
				action: vaultLogData?.action ?? (withdrawal
					? "withdrew"
					: "deposited"),
				date
			});
		}
	}

	for (const [key, quantity] of Object.entries(attributes)) {
		const currency = currencies.find(currency => currency.data.path === key);
		if (currency) {
			formattedCurrencies.push({
				actor: actor?.name ?? false,
				user: userId,
				name: currency.name,
				qty: quantity * (withdrawal
					? -1
					: 1),
				action: vaultLogData?.action ?? (withdrawal
					? "withdrew"
					: "deposited"),
				date
			});
		}
	}

	const vaultLog = getActorLog(itemPile);

	return itemPile.update({
		[CONSTANTS.FLAGS.LOG]: formattedItems.concat(formattedCurrencies).concat(vaultLog)
	});
}

export function getActorLog(actor) {
	return foundry.utils.getProperty(Utilities.getActor(actor), CONSTANTS.FLAGS.LOG) || [];
}

export function clearActorLog(actor) {
	return actor.update({
		[CONSTANTS.FLAGS.LOG]: []
	});
}

/**
 *
 * @param tableUuid
 * @param formula
 * @param resetTable
 * @param normalize
 * @param displayChat
 * @param rollData
 * @param customCategory
 * @returns {Promise<[object]>}
 */
export async function rollTable({
	tableUuid,
	formula = "1",
	resetTable = true,
	normalize = false,
	displayChat = false,
	rollData = {},
	customCategory = false
} = {}) {

	const rolledItems = [];

	const table = await fromUuid(tableUuid);

	if (!tableUuid.startsWith("Compendium")) {
		if (resetTable) {
			await table.reset();
		}

		if (normalize) {
			await table.update({
				results: table.results.map(result => ({
					_id: result.id, weight: result.range[1] - (result.range[0] - 1)
				}))
			});
			await table.normalize();
		}
	}

	const roll = await new Roll(formula.toString(), rollData).evaluate({ allowInteractive: false });
	if (roll.total <= 0) {
		return [];
	}

	let results = [];
	if (game.modules.get("better-rolltables")?.active) {
		const brtOptions = {
			rollsAmount: roll.total,
			roll: undefined,
			displayChat: displayChat,
			recursive: true
		}
		results = (await game.modules.get("better-rolltables").api.roll(table, brtOptions)).itemsData.map(result => ({
			documentCollection: result.documentCollection,
			documentId: result.documentId,
			text: result.text || result.name,
			img: result.img,
			quantity: 1
		}));
	} else {
		results = (await table.drawMany(roll.total, { displayChat, recursive: true })).results;
	}

	for (const data of results) {

		const rollData = data.toObject();

		let rolledQuantity = rollData?.quantity ?? 1;

		let item = await getItem(rollData);

		if (item instanceof RollTable) {
			rolledItems.push(...(await rollTable({ tableUuid: item.uuid, resetTable, normalize, displayChat })))
		} else if (item instanceof Item) {
			const quantity = Math.max(Utilities.getItemQuantity(item) * rolledQuantity, 1);
			rolledItems.push({
				...rollData, item, quantity
			});
		}

	}

	const items = [];

	rolledItems.forEach(newItem => {
		const existingItem = items.find((item) => {
			if (item.documentId && newItem.documentId) {
				return item.documentId === newItem.documentId;
			} else {
				return item._id === newItem._id;
			}
		});
		if (existingItem) {
			existingItem.quantity += Math.max(newItem.quantity, 1);
		} else {
			const flags = foundry.utils.getProperty(newItem.item, CONSTANTS.FLAGS.ITEM) ?? {};
			if (customCategory) {
				foundry.utils.setProperty(newItem, CONSTANTS.FLAGS.CUSTOM_CATEGORY, customCategory);
				foundry.utils.setProperty(flags, "customCategory", customCategory);
			}
			foundry.utils.setProperty(newItem, CONSTANTS.FLAGS.ITEM, flags);
			if (game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE && !foundry.utils.getProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE)) {
				foundry.utils.setProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE, Utilities.getItemQuantity(newItem.item));
			}
			items.push({
				...newItem
			});
		}
	})

	return items;

}

export async function rollMerchantTables({ tableData = false, actor = false } = {}) {

	if (tableData && !Array.isArray(tableData)) {
		tableData = [tableData]
	} else if (!tableData && actor) {
		const flagData = getActorFlagData(actor);
		tableData = flagData.tablesForPopulate;
	} else if (!tableData && !actor) {
		return [];
	}

	let items = [];

	for (const table of tableData) {

		const rollableTable = await fromUuid(table.uuid);

		if (!rollableTable) continue;

		if (!table.uuid.startsWith("Compendium")) {
			await rollableTable.reset();
		}

		let tableItems = [];
		const customCategory = table?.customCategory ?? false;

		if (table.addAll) {

			for (const [itemId, formula] of Object.entries(table.items)) {
				const roll = await new Roll(formula).evaluate({ allowInteractive: false });
				if (roll.total <= 0) continue;
				const rollResult = rollableTable.results.get(itemId).toObject();
				const potentialPack = game.packs.get(rollResult.documentCollection);
				if (rollResult.documentCollection === "RollTable" || potentialPack?.documentName === "RollTable") {
					const subTable = await getTable(rollResult);
					items.push(...(await rollMerchantTables({
						tableData: [{
							uuid: subTable.uuid, addAll: false, timesToRoll: roll.total, customCategory: customCategory
						}], actor
					})))
					continue;
				}
				const item = await getItem(rollResult);
				if (!item) continue;
				const quantity = roll.total * Math.max(Utilities.getItemQuantity(item), 1);

				tableItems.push({
					...(typeof rollResult === "string" ? rollResult : {}), customCategory: customCategory, item, quantity
				})
			}

		} else {

			const roll = await new Roll((table.timesToRoll ?? "1").toString()).evaluate({ allowInteractive: false });

			if (roll.total <= 0) {
				continue;
			}

			tableItems = await rollTable({
				tableUuid: table.uuid, formula: roll.total, customCategory: customCategory
			})

			if (table?.customCategory) {
				tableItems = tableItems.map(item => {
					foundry.utils.setProperty(item, "customCategory", table?.customCategory)
					return item;
				});
			}
		}

		tableItems.forEach(newItem => {
			const existingItem = items.find((item) => {
				if (item.documentId && newItem.documentId) {
					return item.documentId === newItem.documentId;
				} else {
					return item._id === newItem._id;
				}
			});
			if (existingItem) {
				existingItem.quantity += Math.max(newItem.quantity, 1);
			} else {
				const flags = cleanItemFlagData(foundry.utils.getProperty(newItem.item, CONSTANTS.FLAGS.ITEM) ?? {});
				if (newItem?.customCategory) {
					foundry.utils.setProperty(newItem, CONSTANTS.FLAGS.CUSTOM_CATEGORY, newItem?.customCategory);
					foundry.utils.setProperty(flags, "customCategory", newItem?.customCategory);
				}
				foundry.utils.setProperty(newItem, CONSTANTS.FLAGS.ITEM, flags);
				if (game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE && !foundry.utils.getProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE)) {
					foundry.utils.setProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE, Utilities.getItemQuantity(newItem.item));
				}
				items.push({
					...newItem,
					quantity: newItem.quantity
				});
			}
		})
	}

	return items;
}

async function getTable(tableToGet) {
	let table;
	if (tableToGet.documentCollection === "RollTable") {
		table = game.tables.get(tableToGet.documentId);
	} else {
		const compendium = game.packs.get(tableToGet.documentCollection);
		if (compendium) {
			table = await compendium.getDocument(tableToGet.documentId);
		}
	}
	return table;
}

async function getItem(rollData) {
	let item;
	if (typeof rollData.text === "string" && rollData.text.match(CONSTANTS.TABLE_UUID_REGEX)) {
		const matches = [...rollData.text.matchAll(CONSTANTS.TABLE_UUID_REGEX)];
		const [firstIndex, lastIndex] = matches.reduce((acc, elem) => {
			acc[0] = Math.min(acc[0], elem.index)
			acc[1] = Math.max(acc[1], elem.index + elem[0].length)
			return acc;
		}, [Infinity, -Infinity]);
		const uuidNameMap = matches.map((elem) => {
			return [elem[1], elem[2]];
		});
		const [uuid, name] = Helpers.random_array_element(uuidNameMap);
		const itemName = rollData.text.replace(rollData.text.slice(firstIndex, lastIndex), name);
		item = await fromUuid(uuid)
		const itemObj = item.toObject();
		itemObj.name = itemName;
		item = new Item.implementation(itemObj);
		rollData.text = itemName;
		rollData.img = itemObj.img;
		rollData.documentCollection = uuid.split(".").slice(1, 3).join(".");
		rollData.documentId = uuid.split(".")[4];
	} else if (rollData.documentCollection === "Item") {
		item = game.items.get(rollData.documentId);
	} else {
		const compendium = game.packs.get(rollData.documentCollection);
		if (compendium) {
			item = await compendium.getDocument(rollData.documentId);
		}
	}
	return item;
}
