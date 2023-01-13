import CONSTANTS from "./constants/constants.js";
import { custom_warning } from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";

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

    const tokensOnScenes = Array.from(game.scenes)
      .map(scene => ([
        scene.id,
        Array.from(scene.tokens).filter(t => {
          const actorFlagVersion = getProperty(t, CONSTANTS.FLAGS.VERSION) || "1.0.0";
          try {
            return getProperty(t, CONSTANTS.FLAGS.PILE)
              && isNewerVersion(version, actorFlagVersion)
              && !t.actorLink
              && t.actor;
          } catch (err) {
            return false;
          }
        })
      ]))
      .filter(scene => scene[1].length)

    for (const [sceneId, tokens] of tokensOnScenes) {
      const scene = game.scenes.get(sceneId)
      const updates = [];
      for (const token of tokens) {
        try {
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
        } catch (err) {
          ui.notifications.warn(`Item Piles | Corrupted token detected: token with ID ${token.id} on scene ${scene.name}!`);
          console.log(`"Item Piles | You can run "fromUuidSync("${token.uuid}").delete()" to remove the faulty token`);
          console.error(err);
        }
      }
      console.log(`Item Piles | Migrating ${updates.length} tokens on scene "${sceneId}" to version ${version}...`);
      await scene.updateEmbeddedDocuments("Token", updates);
    }

  }

};
