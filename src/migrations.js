import CONSTANTS from "./constants/constants.js";
import { custom_warning, getSetting } from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import SETTINGS from "./constants/settings.js";
import { findOrCreateItemInCompendium } from "./helpers/compendium-utilities.js";

export default async function runMigrations() {

	for (const version of Object.keys(migrations)) {
		try {
			await migrations[version](version);
		} catch (err) {
			console.error(err);
			custom_warning(`Something went wrong when migrating to version ${version}. Please check the console for the error!`, true)
		}
	}
}

function getItemPileActorsOfLowerVersion(version) {
	return PileUtilities.getItemPileActors((a) => {
		const actorFlagVersion = getProperty(a, CONSTANTS.FLAGS.VERSION) || "1.0.0";
		return getProperty(a, CONSTANTS.FLAGS.PILE)?.enabled && isNewerVersion(version, actorFlagVersion);
	})
}

function getItemPileTokensOfLowerVersion(version) {
	return PileUtilities.getItemPileTokens((token) => {
		try {
			const actorFlagVersion = getProperty(token, CONSTANTS.FLAGS.VERSION) || "1.0.0";
			return token.actor && isNewerVersion(version, actorFlagVersion);
		} catch (err) {
			return false;
		}
	})
}

function filterValidItems(items, version) {
	return items.filter(item => {
		const itemFlagVersion = getProperty(item, CONSTANTS.FLAGS.VERSION);
		return (itemFlagVersion && isNewerVersion(version, itemFlagVersion)) || (!itemFlagVersion && hasProperty(item, CONSTANTS.FLAGS.ITEM));
	});
}

function getActorValidItems(actor, version) {
	return filterValidItems(actor.items, version);
}

/**
 * @param version
 * @param {Function} callback
 * @returns {Promise}
 */
async function updateActors(version, callback) {

	const actorUpdates = getItemPileActorsOfLowerVersion(version).map(actor => {
		let flags = getProperty(actor, CONSTANTS.FLAGS.PILE);
		const flagData = {
			[CONSTANTS.FLAGS.PILE]: callback(flags, actor), [CONSTANTS.FLAGS.VERSION]: version
		}
		if (actor.actorLink) {
			flagData["token"] = foundry.utils.deepClone(flagData);
		}
		return {
			_id: actor.id, ...flagData
		};
	});

	if (actorUpdates.length) {
		console.log(`Item Piles | Migrating ${actorUpdates.length} actors to version ${version}...`)
		await Actor.updateDocuments(actorUpdates);
	}

}

/**
 * @param version
 * @param {Function} callback
 * @returns {Promise}
 */
async function updateTokens(version, callback) {

	const { validTokensOnScenes } = getItemPileTokensOfLowerVersion(version);

	for (const [sceneId, tokens] of validTokensOnScenes) {
		const scene = game.scenes.get(sceneId)
		const updates = tokens.map(token => ({
			_id: token.id,
			[CONSTANTS.FLAGS.PILE]: callback(getProperty(token, CONSTANTS.FLAGS.PILE)),
			[CONSTANTS.FLAGS.VERSION]: version,
		}));
		if (updates.length) {
			console.log(`Item Piles | Migrating ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);
			await scene.updateEmbeddedDocuments("Token", updates);
		}
	}

}

/**
 * @param version
 * @param {Function} callback
 * @returns {Promise}
 */
async function updateItems(version, callback) {

	const gameItems = filterValidItems(game.items, version);

	const gameItemUpdates = gameItems.map(item => {
		const flags = getProperty(item, CONSTANTS.FLAGS.ITEM);
		if (!flags) return false;
		return PileUtilities.updateItemData(item, {
			flags: callback(flags)
		}, { version, returnUpdate: true });
	}).filter(Boolean);

	if (gameItemUpdates.length) {
		console.log(`Item Piles | Migrating ${gameItemUpdates.length} items to version ${version}...`);
		await Item.updateDocuments(gameItemUpdates);
	}

	const actors = getItemPileActorsOfLowerVersion(version);

	const actorItemUpdates = actors.map(actor => {

		const itemPileItems = getActorValidItems(actor, version)

		return {
			actor, update: {
				_id: actor.id, [CONSTANTS.FLAGS.VERSION]: version
			}, items: itemPileItems.map(item => {
				const flags = getProperty(item, CONSTANTS.FLAGS.ITEM);
				if (!flags) return false;
				return PileUtilities.updateItemData(item, {
					flags: callback(flags)
				}, { version, returnUpdate: true });
			}).filter(Boolean)
		}

	});

	if (actorItemUpdates.length) {
		console.log(`Item Piles | Migrating ${actorItemUpdates.length} item pile actors' items to version ${version}...`)
	}

	await Actor.updateDocuments(actorItemUpdates.map(data => data.update))

	for (const { actor, items } of actorItemUpdates) {
		await actor.updateEmbeddedDocuments("Item", items);
	}

	const { validTokensOnScenes } = getItemPileTokensOfLowerVersion(version);

	for (const [sceneId, tokens] of validTokensOnScenes) {

		const scene = game.scenes.get(sceneId);

		const updates = tokens.map(token => {
			const itemPileItems = getActorValidItems(token.actor, version);
			return {
				token, update: {
					_id: token.id, [CONSTANTS.FLAGS.VERSION]: version
				}, items: itemPileItems.map(item => {
					const flags = getProperty(item, CONSTANTS.FLAGS.ITEM);
					if (!flags) return false;
					return PileUtilities.updateItemData(item, {
						flags: callback(flags)
					}, { version, returnUpdate: true });
				}).filter(Boolean)
			}
		});

		console.log(`Item Piles | Migrating ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);

		await scene.updateEmbeddedDocuments("Token", updates.map(data => data.update));

		for (const { token, itemUpdates } of updates) {
			await token.actor.updateEmbeddedDocuments("Item", itemUpdates);
		}

	}

}

const migrations = {

	"2.4.0": async (version) => {

		await updateActors(version, (flags) => {
			return PileUtilities.cleanFlagData(flags);
		});

		await updateTokens(version, (flags) => {
			return PileUtilities.cleanFlagData(flags);
		});

		const { invalidTokensOnScenes } = getItemPileTokensOfLowerVersion(version);

		for (const [sceneId, tokens] of invalidTokensOnScenes) {

			const scene = game.scenes.get(sceneId);

			let deletions = [];
			let updates = [];
			for (const token of tokens) {

				const flagData = {
					[CONSTANTS.FLAGS.PILE]: PileUtilities.cleanFlagData(PileUtilities.migrateFlagData(token)),
					[CONSTANTS.FLAGS.VERSION]: version,
				}

				let tokenActor = game.actors.get(token.actorId);
				if (!tokenActor) {
					tokenActor = game.actors.get(getSetting(SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID));
				}
				if (!tokenActor) {
					deletions.push(token.id);
					continue;
				}

				const update = {
					_id: token.id, actorLink: false, actorId: tokenActor.id, [CONSTANTS.ACTOR_DELTA_PROPERTY]: {
						items: []
					}, ...flagData
				}

				for (let itemData of token[CONSTANTS.ACTOR_DELTA_PROPERTY]?.items ?? []) {
					const item = await Item.implementation.create(itemData, { temporary: true });
					update[CONSTANTS.ACTOR_DELTA_PROPERTY].items.push(item.toObject());
				}

				updates.push(update);

				await token.update({
					actorLink: true
				});
			}

			await scene.updateEmbeddedDocuments("Token", updates);
			await scene.deleteEmbeddedDocuments("Token", deletions);

			console.log(`Item Piles | Fixing ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);

		}

		if (invalidTokensOnScenes.length && invalidTokensOnScenes.some(([sceneId]) => sceneId === game.user.viewedScene)) {
			ui.notifications.notify("Item Piles | Attempted to fix some broken tokens on various scenes. If the current scene fails to load, please refresh.")
		}
	},

	"2.4.17": async (version) => {

		await updateItems(version, (flags) => {
			flags.infiniteQuantity = "default";
			return flags;
		});

	},

	"2.6.1": async (version) => {

		const flagUpdateCallback = (flags) => {
			if (flags?.itemTypePriceModifiers) {
				flags.itemTypePriceModifiers = flags.itemTypePriceModifiers.map(priceModifier => {
					const custom = Object.keys(CONFIG.Item.typeLabels).indexOf(priceModifier.type) === -1;
					priceModifier.category = custom ? priceModifier.type : "";
					priceModifier.type = custom ? "custom" : priceModifier.type;
					return priceModifier;
				})
			}
			return flags;
		}

		await updateActors(version, flagUpdateCallback);
		await updateTokens(version, flagUpdateCallback);

	},

	"2.7.18": async (version) => {

		const actors = getItemPileActorsOfLowerVersion(version);

		const recursivelyAddItemsToCompendium = async (itemData) => {
			const flagData = PileUtilities.getItemFlagData(itemData);
			for (const priceGroup of flagData?.prices ?? []) {
				for (const price of priceGroup) {
					if (price.type !== "item" || !price.data.item) continue;
					const compendiumItemUuid = (await recursivelyAddItemsToCompendium(price.data.item).uuid);
					price.data = { uuid: compendiumItemUuid };
				}
			}
			setProperty(itemData, CONSTANTS.FLAGS.ITEM, PileUtilities.cleanItemFlagData(flagData, { addRemoveFlag: true }));
			return findOrCreateItemInCompendium(itemData);
		}

		const getActorItemUpdates = async (actorItems) => {
			const items = actorItems.filter(item => PileUtilities.getItemFlagData(item).prices.length);
			const updates = [];
			for (const item of items) {
				const flagData = PileUtilities.getItemFlagData(item);
				let update = false;
				if (!flagData.prices.length) continue;
				for (const priceGroup of flagData.prices) {
					for (const price of priceGroup) {
						if (price.type !== "item" || !price.data.item) continue;
						const compendiumItem = await recursivelyAddItemsToCompendium(price.data.item);
						price.data = { uuid: compendiumItem.uuid };
						update = true;
					}
				}
				if (update) {
					updates.push({
						_id: item.id,
						[CONSTANTS.FLAGS.VERSION]: version,
						[CONSTANTS.FLAGS.ITEM]: PileUtilities.cleanItemFlagData(flagData)
					})
				}
			}
			return updates;
		}

		const updates = await getActorItemUpdates(filterValidItems(game.items, version));
		if (updates.length) {
			console.log(`Item Piles | Migrating ${updates.length} items to version ${version}...`);
			await Item.updateDocuments(updates);
		}

		let updatedActors = 0;
		for (const actor of actors) {
			const items = getActorValidItems(actor, version);
			const updates = await getActorItemUpdates(items);
			if (updates.length) {
				await actor.updateEmbeddedDocuments("Item", updates);
				updatedActors++;
			}
		}
		if (updatedActors) {
			console.log(`Item Piles | Migrating ${updatedActors} actors with out of date items to version ${version}...`);
		}

		const { validTokensOnScenes } = getItemPileTokensOfLowerVersion(version);

		for (const [sceneId, tokens] of validTokensOnScenes) {
			let updatedTokens = 0;
			for (const token of tokens) {
				const items = getActorValidItems(token.actor, version);
				const updates = await getActorItemUpdates(items);
				if (updates.length) {
					updatedTokens++;
					await token.actor.updateEmbeddedDocuments("Item", updates);
				}
			}
			console.log(`Item Piles | Migrating ${updatedTokens} tokens on scene "${sceneId}" to version ${version}...`);
		}
	},

	"2.8.2": async (version) => {

		const flagUpdateCallback = (flags) => {
			if (flags?.canStackItems !== undefined) {
				flags.canStackItems = flags.canStackItems ? "yes" : "no";
			}
			return flags;
		}

		await updateActors(version, flagUpdateCallback);
		await updateTokens(version, flagUpdateCallback);

	}
};
