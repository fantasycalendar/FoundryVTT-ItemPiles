import CONSTANTS from "./constants/constants.js";
import { custom_warning, getSetting } from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import SETTINGS from "./constants/settings.js";

let oldSettings;

function findOldSettingValue(oldSettingKey) {
  if (!oldSettings) {
    oldSettings = game.settings.storage.get("world").filter(setting => setting.key.startsWith(CONSTANTS.MODULE_NAME));
  }
  return oldSettings.find(setting => setting.key.endsWith(oldSettingKey))?.value;
}

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
const migrations = {

  "2.4.0": async (version) => {

    const actors = Array.from(game.actors).filter(a => {
      const actorFlagVersion = getProperty(a, CONSTANTS.FLAGS.VERSION) || "1.0.0";
      return getProperty(a, CONSTANTS.FLAGS.PILE)
        && isNewerVersion(version, actorFlagVersion)
    });

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

    const allTokensOnScenes = Array.from(game.scenes)
      .map(scene => ([
        scene.id,
        Array.from(scene.tokens).filter(t => getProperty(t, CONSTANTS.FLAGS.PILE) && !t.actorLink)
      ]))
      .filter(scene => scene[1].length)

    const validTokensOnScenes = allTokensOnScenes.map(([scene, tokens]) => [
      scene,
      tokens.filter(token => {
        try {
          const actorFlagVersion = getProperty(token, CONSTANTS.FLAGS.VERSION) || "1.0.0";
          return token.actor && isNewerVersion(version, actorFlagVersion);
        } catch (err) {
          return false;
        }
      })
    ]).filter(scene => scene[1].length)

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
    ]).filter(scene => scene[1].length)

    for (const [sceneId, tokens] of invalidTokensOnScenes) {

      const scene = game.scenes.get(sceneId);

      let updates = [];
      for (const token of tokens) {

        const flagData = {
          [CONSTANTS.FLAGS.PILE]: PileUtilities.cleanFlagData(PileUtilities.migrateFlagData(token)),
          [CONSTANTS.FLAGS.VERSION]: version,
        }

        const update = {
          _id: token.id,
          actorLink: false,
          actorId: game.actors.get(token.actorId) ? token.actorId : getSetting(SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID),
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

      console.log(`Item Piles | Fixing ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);

    }

    if (invalidTokensOnScenes.length && invalidTokensOnScenes.some(([sceneId]) => sceneId === game.user.viewedScene)) {
      ui.notifications.notify("Item Piles | Fixed some broken tokens on various scenes, refreshing...")
      setTimeout(() => {
        foundry.utils.debouncedReload();
      }, 1250);
    }
  }
};
