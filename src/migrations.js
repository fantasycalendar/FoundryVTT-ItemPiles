import CONSTANTS from "./constants/constants.js";
import { custom_warning, getSetting } from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import SETTINGS from "./constants/settings.js";

export default async function runMigrations() {

  const sortedMigrations = Object.entries(migrations)
    .sort((a, b) => {
      return isNewerVersion(b[0], a[0]) ? -1 : 1;
    });

  for (const [version, migration] of sortedMigrations) {
    try {
      await migration(version);
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
    return (itemFlagVersion && isNewerVersion(version, itemFlagVersion))
      || (!itemFlagVersion && hasProperty(item, CONSTANTS.FLAGS.ITEM));
  });
}

function getActorValidItems(actor, version) {
  return filterValidItems(actor.items, version);
}

const migrations = {

  "2.4.0": async (version) => {

    const actors = getItemPileActorsOfLowerVersion(version);

    const actorUpdates = actors.map(a => {
      const flagData = {
        [CONSTANTS.FLAGS.PILE]: PileUtilities.cleanFlagData(PileUtilities.migrateFlagData(a)),
        [CONSTANTS.FLAGS.VERSION]: version
      }
      if (a.actorLink) {
        flagData["token"] = foundry.utils.deepClone(flagData);
      }
      return {
        _id: a.id,
        ...flagData
      };
    });

    if (actorUpdates.length) {
      console.log(`Item Piles | Migrating ${actorUpdates.length} actors to version ${version}...`)
    }

    await Actor.updateDocuments(actorUpdates);

    const { allTokensOnScenes, validTokensOnScenes } = getItemPileTokensOfLowerVersion(version);

    for (const [sceneId, tokens] of validTokensOnScenes) {
      const scene = game.scenes.get(sceneId)
      const updates = [];
      for (const token of tokens) {
        const flagData = {
          [CONSTANTS.FLAGS.PILE]: PileUtilities.cleanFlagData(PileUtilities.migrateFlagData(token.actor)),
          [CONSTANTS.FLAGS.VERSION]: version,
        }
        updates.push({
          _id: token.id,
          ...flagData,
          actorData: {
            ...flagData
          }
        });
      }
      console.log(`Item Piles | Migrating ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);
      await scene.updateEmbeddedDocuments("Token", updates);
    }

    const invalidTokensOnScenes = allTokensOnScenes.map(([scene, tokens]) => [
      scene,
      tokens.filter(token => {
        try {
          const actorFlagVersion = getProperty(token, CONSTANTS.FLAGS.VERSION) || "1.0.0";
          return !token.actor || isNewerVersion(version, actorFlagVersion);
        } catch (err) {
          return true;
        }
      })
    ]).filter(([_, tokens]) => tokens.length);

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
          _id: token.id,
          actorLink: false,
          actorId: tokenActor.id,
          actorData: {
            ...flagData,
            items: []
          },
          ...flagData
        }

        for (let itemData of token.actorData?.items ?? []) {
          const item = await Item.implementation.create(itemData, { temporary: true });
          update.actorData.items.push(item.toObject());
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

    const items = filterValidItems(game.items);

    const itemUpdates = items.map(item => {
      const flags = getProperty(item, CONSTANTS.FLAGS.ITEM);
      flags.infiniteQuantity = "default";
      return PileUtilities.updateItemData(item, { flags }, { version, returnUpdate: true });
    });

    if (itemUpdates.length) {
      console.log(`Item Piles | Migrating ${itemUpdates.length} items to version ${version}...`)
    }

    await Item.updateDocuments(itemUpdates);

    const actors = getItemPileActorsOfLowerVersion(version);

    const actorItemUpdates = actors.map(actor => {

      const itemPileItems = getActorValidItems(actor, version)

      return {
        actor,
        items: itemPileItems.map(item => {
          const flags = getProperty(item, CONSTANTS.FLAGS.ITEM);
          flags.infiniteQuantity = "default";
          return PileUtilities.updateItemData(item, { flags }, { version, returnUpdate: true });
        })
      }

    }).filter(update => update.items.length);

    if (actorItemUpdates.length) {
      console.log(`Item Piles | Migrating ${actorItemUpdates.length} item pile actors' items to version ${version}...`)
    }

    for (const { actor, items } of actorItemUpdates) {
      await actor.updateEmbeddedDocuments("Item", items);
    }

    const { validTokensOnScenes } = getItemPileTokensOfLowerVersion(version);

    for (const [sceneId, tokens] of validTokensOnScenes) {

      const updates = tokens.map(token => {
        const itemPileItems = getActorValidItems(token.actor, version);
        return {
          token,
          update: {
            [CONSTANTS.FLAGS.VERSION]: version,
            actorData: {
              [CONSTANTS.FLAGS.VERSION]: version,
            }
          },
          items: itemPileItems.map(item => {
            const flags = PileUtilities.getItemFlagData(item);
            flags.infiniteQuantity = "default";
            return PileUtilities.updateItemData(item, { flags }, { version, returnUpdate: true });
          })
        }
      });

      console.log(`Item Piles | Migrating ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);

      for (const { token, update, items } of updates) {
        await token.update(update);
        await token.actor.updateEmbeddedDocuments("Item", items)
      }

    }

  },

  "2.6.1": async (version) => {

    const actors = getItemPileActorsOfLowerVersion(version);

    const actorUpdates = actors.map(a => {
      const flags = getProperty(a, CONSTANTS.FLAGS.PILE);
      if (flags?.itemTypePriceModifiers) {
        flags.itemTypePriceModifiers = flags.itemTypePriceModifiers.map(priceModifier => {
          const custom = Object.keys(CONFIG.Item.typeLabels).indexOf(priceModifier.type) === -1;
          priceModifier.category = custom ? priceModifier.type : "";
          priceModifier.type = custom ? "custom" : priceModifier.type;
          return priceModifier;
        })
      }
      const flagData = {
        [CONSTANTS.FLAGS.PILE]: flags,
        [CONSTANTS.FLAGS.VERSION]: version
      }
      if (a.actorLink) {
        flagData["token"] = foundry.utils.deepClone(flagData);
      }
      return {
        _id: a.id,
        ...flagData
      };
    });

    if (actorUpdates.length) {
      console.log(`Item Piles | Migrating ${actorUpdates.length} actors to version ${version}...`)
    }

    await Actor.updateDocuments(actorUpdates);

    const { validTokensOnScenes } = getItemPileTokensOfLowerVersion(version);

    for (const [sceneId, tokens] of validTokensOnScenes) {
      const scene = game.scenes.get(sceneId)
      const updates = [];
      for (const token of tokens) {
        const flags = getProperty(token, CONSTANTS.FLAGS.PILE);
        if (flags?.itemTypePriceModifiers) {
          flags.itemTypePriceModifiers = flags.itemTypePriceModifiers.map(priceModifier => {
            const custom = Object.keys(CONFIG.Item.typeLabels).indexOf(priceModifier.type) === -1;
            priceModifier.category = custom ? priceModifier.type : "";
            priceModifier.type = custom ? "custom" : priceModifier.type;
            return priceModifier;
          })
        }
        const flagData = {
          [CONSTANTS.FLAGS.PILE]: flags,
          [CONSTANTS.FLAGS.VERSION]: version,
        }
        updates.push({
          _id: token.id,
          ...flagData,
          actorData: {
            ...flagData
          }
        });
      }
      console.log(`Item Piles | Migrating ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);
      await scene.updateEmbeddedDocuments("Token", updates);
    }

  }

};
