import * as Helpers from "./helpers.js";
import CONSTANTS from "../constants/constants.js";
import SETTINGS from "../constants/settings.js";
import { getItemFlagData } from "./pile-utilities.js";
import { deletedActorCache } from "./caches.js";

export function getActor(target) {
	if (target instanceof Actor) return target;
	let targetDoc = target;
	if (stringIsUuid(target)) {
		targetDoc = fromUuidSync(target);
		if (!targetDoc && deletedActorCache.has(target)) {
			return deletedActorCache.get(target);
		}
	}
	targetDoc = getDocument(targetDoc);
	return targetDoc?.character ?? targetDoc?.actor ?? targetDoc;
}

/**
 * @param documentUuid
 * @returns {PlaceableObject|foundry.abstract.Document}
 */
export function getToken(documentUuid) {
	let doc = fromUuidSync(documentUuid);
	doc = doc?.token ?? doc;
	return doc instanceof TokenDocument ? doc?.object ?? doc : doc;
}

export function getDocument(target) {
	if (stringIsUuid(target)) {
		target = fromUuidSync(target);
	}
	return target?.document ?? target;
}

export function stringIsUuid(inId) {
	return typeof inId === "string"
		&& (inId.match(/\./g) || []).length
		&& !inId.endsWith(".");
}

export function getUuid(target) {
	if (stringIsUuid(target)) return target;
	const document = getDocument(target);
	return document?.uuid ?? false;
}

/**
 * Find and retrieves an item in a list of items
 *
 * @param {Array<Item|Object>} items
 * @param {Item|Object} findItem
 * @param {boolean/object} actorFlagData
 * @param {boolean} ignoreVault
 * @returns {*}
 */
export function findSimilarItem(items, findItem, actorFlagData = false, ignoreVault = false) {

	const itemSimilarities = game.itempiles.API.ITEM_SIMILARITIES;

	let findItemData = findItem instanceof Item ? findItem.toObject() : findItem;
	findItemData = findItemData?.item ?? findItemData;
	const findItemId = findItemData?._id;

	let hasUniqueKey = false;
	for (let prop of CONSTANTS.ITEM_FORCED_UNIQUE_KEYS) {
		if (getProperty(findItemData, prop)) {
			hasUniqueKey = true;
			break;
		}
	}

	const actorIsVault = actorFlagData ? actorFlagData?.enabled && actorFlagData?.type === CONSTANTS.PILE_TYPES.VAULT : false;

	const filteredItems = items
		.filter(item => {
			for (let prop of CONSTANTS.ITEM_FORCED_UNIQUE_KEYS) {
				if (getProperty(item?.item ?? item, prop)) {
					return false;
				}
			}
			return true;
		})
		.filter(item => {
			const itemId = item instanceof Item ? item.id : item?.item?._id ?? item?._id ?? item?.id;
			if (itemId && findItemId && itemId === findItemId) {
				return true;
			}

			if (!itemSimilarities.some(path => hasProperty(findItem, path))) {
				return false;
			}

			if (hasUniqueKey) {
				return false;
			}

			let itemData = item instanceof Item ? item.toObject() : item;
			itemData = itemData?.item ?? itemData;
			if (areItemsDifferent(itemData, findItemData)) {
				return false;
			}

			return itemSimilarities.length > 0;
		})

	let sortedItems = filteredItems;
	if (actorIsVault && !ignoreVault) {

		let distanceItems = filteredItems.map(item => {
			const itemX = getProperty(item, CONSTANTS.FLAGS.ITEM + ".x") ?? Infinity;
			const itemY = getProperty(item, CONSTANTS.FLAGS.ITEM + ".y") ?? Infinity;
			const findX = getProperty(findItem, CONSTANTS.FLAGS.ITEM + ".x") ?? Infinity;
			const findY = getProperty(findItem, CONSTANTS.FLAGS.ITEM + ".y") ?? Infinity;
			const distance = new Ray({ x: itemX, y: itemY }, { x: findX, y: findY }).distance;
			return { distance, item };
		});

		distanceItems.sort((a, b) => a.distance - b.distance);
		distanceItems = distanceItems.filter(item => {
			return item.distance === 0 && {
				"default": actorFlagData?.canStackItems ?? true,
				"yes": true,
				"no": false
			}[getItemFlagData(item)?.canStack ?? "default"];
		}).map(item => item.item);

		sortedItems = distanceItems;

	}

	return sortedItems?.[0] ?? false;

}

export function areItemsDifferent(itemA, itemB) {
	const itemSimilarities = game.itempiles.API.ITEM_SIMILARITIES;
	for (const path of itemSimilarities) {
		if (getProperty(itemA, path) !== getProperty(itemB, path) || (!hasProperty(itemA, path) ^ !hasProperty(itemB, path))) {
			return true;
		}
	}
	return false;
}

export function setSimilarityProperties(obj, item) {
	const itemData = item instanceof Item ? item.toObject() : item;
	setProperty(obj, "_id", itemData._id);
	game.itempiles.API.ITEM_SIMILARITIES.forEach(prop => {
		setProperty(obj, prop, getProperty(itemData, prop));
	})
	return obj;
}

let itemTypesWithQuantities = false;

export function refreshItemTypesThatCanStack() {
	itemTypesWithQuantities = false;
	getItemTypesThatCanStack();
}

export function getItemTypesThatCanStack() {
	if (!itemTypesWithQuantities) {

		itemTypesWithQuantities = new Set();

		if (game.system.id === "custom-system-builder") {
			const itemTemplates = game.items
				.filter(item => item?.templateSystem?.isTemplate)
				.filter(item => item.templatesystem.getKeys().has(item.system.body.contents));
			for (const item of itemTemplates) {
				itemTypesWithQuantities.add(item.name);
			}
		}

		const unstackableItemTypes = Helpers.getSetting(SETTINGS.UNSTACKABLE_ITEM_TYPES);
		const types = new Set(Object.keys(CONFIG?.Item?.dataModels ?? {}).concat(game.system.template.Item.types));
		itemTypesWithQuantities = new Set([...itemTypesWithQuantities, ...types.filter(type => {
			let itemTemplate = {};
			if (CONFIG?.Item?.dataModels?.[type]?.defineSchema !== undefined) {
				itemTemplate.system = Object.entries(CONFIG.Item.dataModels[type].defineSchema())
					.map(([key, schema]) => {
						return [key, schema.fields ?? true]
					})
				itemTemplate.system = Object.fromEntries(itemTemplate.system);
			} else if (game.system?.template?.Item?.[type]) {
				itemTemplate.system = foundry.utils.deepClone(game.system.template.Item[type]);
				if (itemTemplate.system?.templates?.length) {
					const templates = foundry.utils.duplicate(itemTemplate.system.templates);
					for (let template of templates) {
						itemTemplate.system = foundry.utils.mergeObject(
							itemTemplate.system,
							foundry.utils.duplicate(game.system.template.Item.templates[template])
						);
					}
				}
			}
			return hasItemQuantity(itemTemplate);
		})].filter(type => !unstackableItemTypes.includes(type)));
	}
	return itemTypesWithQuantities;
}

export function isItemStackable(itemData) {
	getItemTypesThatCanStack();
	if (game.system.id === "custom-system-builder") {
		const templateItem = game.items.get(itemData.system.template);
		if (templateItem) {
			return itemTypesWithQuantities.has(templateItem.name)
		}
	}
	return itemTypesWithQuantities.has(itemData.type);
}

/**
 * Returns a given item's quantity
 *
 * @param {Item/Object} item
 * @returns {number}
 */
export function getItemQuantity(item) {
	const itemData = item instanceof Item ? item.toObject() : item;
	return Number(getProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE) ?? 0);
}


/**
 * Returns whether an item has the quantity property
 *
 * @param {Item/Object} item
 * @returns {Boolean}
 */
export function hasItemQuantity(item) {
	const itemData = item instanceof Item ? item.toObject() : item;
	return hasProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE);
}

/**
 * Returns a given item's quantity
 *
 * @param {Object} itemData
 * @param {Number} quantity
 * @param {Boolean} requiresExistingQuantity
 * @returns {Object}
 */
export function setItemQuantity(itemData, quantity, requiresExistingQuantity = false) {
	if (!requiresExistingQuantity || getItemTypesThatCanStack().has(itemData.type) || hasItemQuantity(itemData)) {
		setProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE, quantity);
	}
	return itemData;
}


export function getItemCost(item) {
	const itemData = item instanceof Item ? item.toObject() : item;
	return getProperty(itemData, game.itempiles.API.ITEM_PRICE_ATTRIBUTE) ?? 0;
}

/**
 * Retrieves all visible tokens on a given location
 *
 * @param position
 * @returns {Array<Token>}
 */
export function getTokensAtLocation(position) {
	const tokens = [...canvas.tokens.placeables].filter(token => token?.mesh?.visible);
	return tokens.filter(token => {
		return position.x >= token.x && position.x < (token.x + (token.document.width * canvas.grid.size))
			&& position.y >= token.y && position.y < (token.y + (token.document.height * canvas.grid.size));
	});
}

export function distance_between_rect(p1, p2) {

	const x1 = p1.x;
	const y1 = p1.y;
	const x1b = p1.x + p1.w;
	const y1b = p1.y + p1.h;

	const x2 = p2.x;
	const y2 = p2.y;
	const x2b = p2.x + p2.w;
	const y2b = p2.y + p2.h;

	const left = x2b < x1;
	const right = x1b < x2;
	const bottom = y2b < y1;
	const top = y1b < y2;

	if (top && left) {
		return distance_between({ x: x1, y: y1b }, { x: x2b, y: y2 });
	} else if (left && bottom) {
		return distance_between({ x: x1, y: y1 }, { x: x2b, y: y2b });
	} else if (bottom && right) {
		return distance_between({ x: x1b, y: y1 }, { x: x2, y: y2b });
	} else if (right && top) {
		return distance_between({ x: x1b, y: y1b }, { x: x2, y: y2 });
	} else if (left) {
		return x1 - x2b;
	} else if (right) {
		return x2 - x1b;
	} else if (bottom) {
		return y1 - y2b;
	} else if (top) {
		return y2 - y1b;
	}

	return 0;

}

export function distance_between(a, b) {
	return new Ray(a, b).distance;
}

export function grids_between_tokens(a, b) {
	return Math.floor(distance_between_rect(a, b) / canvas.grid.size) + 1
}

export function tokens_close_enough(a, b, maxDistance) {
	const distance = grids_between_tokens(a, b);
	return maxDistance >= distance;
}

export function refreshAppsWithDocument(doc, callback) {
	const apps = Object.values(ui.windows).filter(app => app.id.endsWith(doc.id));
	for (const app of apps) {
		if (app[callback]) {
			app[callback]();
		}
	}
}

export async function runMacro(macroId, macroData) {

	// Credit to Otigon, Zhell, Gazkhan and MrVauxs for the code in this section
	let macro;
	if (macroId.startsWith("Compendium")) {
		let packArray = macroId.split(".");
		let compendium = game.packs.get(`${packArray[1]}.${packArray[2]}`);
		if (!compendium) {
			throw Helpers.custom_error(`Compendium ${packArray[1]}.${packArray[2]} was not found`);
		}
		let findMacro = (await compendium.getDocuments()).find(m => m.name === packArray[3] || m.id === packArray[3])
		if (!findMacro) {
			throw Helpers.custom_error(`The "${packArray[3]}" macro was not found in Compendium ${packArray[1]}.${packArray[2]}`);
		}
		macro = new Macro(findMacro?.toObject());
		macro.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
	} else {
		macro = game.macros.getName(macroId);
		if (!macro) {
			throw Helpers.custom_error(`Could not find macro with name "${macroId}"`);
		}
	}

	let result = false;
	try {
		result = await macro.execute(macroData);
	} catch (err) {
		Helpers.custom_warning(`Error when executing macro ${macroId}!\n${err}`, true);
	}

	return result;

}

export function getOwnedCharacters(user = false) {
	user = user || game.user;
	return game.actors.filter(actor => {
			return actor.ownership?.[user.id] === CONST.DOCUMENT_PERMISSION_LEVELS.OWNER
				&& actor.prototypeToken.actorLink;
		})
		.sort((a, b) => {
			return b._stats.modifiedTime - a._stats.modifiedTime;
		});
}

export function getUserCharacter(user = false) {
	user = user || game.user;
	return user.character
		|| (user.isGM ? false : (getOwnedCharacters(user)?.[0] ?? false));
}

export async function createFoldersFromNames(folders, type = "Actor") {
	let lastFolder = false;
	for (const folder of folders) {
		let actualFolder = game.folders.getName(folder);
		if (!actualFolder) {
			const folderData = { name: folder, type, sorting: 'a' };
			if (lastFolder) {
				folderData.parent = lastFolder.id;
			}
			actualFolder = await Folder.create(folderData);
		}
		lastFolder = actualFolder;
	}

	if (lastFolder) {
		return lastFolder;
	}
}


export function getSourceActorFromDropData(dropData) {
	if (dropData.uuid) {
		const doc = fromUuidSync(dropData.uuid);
		return doc instanceof Actor ? doc : doc.parent;
	} else if (dropData.tokenId) {
		if (dropData.sceneId) {
			const uuid = `Scene.${dropData.sceneId}.Token.${dropData.tokenId}`;
			return fromUuidSync(uuid)?.actor;
		}
		return canvas.tokens.get(dropData.tokenId).actor;
	} else if (dropData.actorId) {
		return game.actors.get(dropData.actorId);
	}
	return false;
}
