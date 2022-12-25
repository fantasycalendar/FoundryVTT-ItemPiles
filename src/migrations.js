import CONSTANTS from "./constants/constants.js";
import SETTINGS from "./constants/settings.js";
import { custom_warning, getSetting, setSetting } from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";

let oldSettings;
export default async function runMigrations() {
  
  oldSettings = game.settings.storage.get("world").filter(setting => setting.key.includes(CONSTANTS.MODULE_NAME))
  
  const sortedMigrations = Object.entries(migrations)
    .sort((a, b) => {
      return isNewerVersion(b[0], a[0]) ? -1 : 1;
    });
  
  let currentMigrationVersion = getSetting(SETTINGS.MIGRATION_VERSION);
  for (const [version, migration] of sortedMigrations) {
    if (!isNewerVersion(version, currentMigrationVersion)) continue;
    console.log(`Item Piles | Migrating to version ${version}...`)
    try{
      await migration();
      currentMigrationVersion = version;
    }catch(err){
      console.error(err);
      custom_warning(`Something went wrong when migrating to version ${version}. Please check the console for the error!`, true)
    }
  }

  // await setSetting(SETTINGS.MIGRATION_VERSION, migrationVersion);
  
}

function findOldSettingValue(oldSettingKey) {
  return oldSettings.find(setting => setting.key.endsWith(oldSettingKey))?.value;
}

const migrations = {

  "2.4.0": async () => {

    const actors = Array.from(game.actors).filter(a => getProperty(a, CONSTANTS.FLAGS.PILE));

    const actorUpdates = actors.map(a => {
      return {
        _id: a.id,
        [CONSTANTS.FLAGS.PILE]: PileUtilities.cleanFlagData(PileUtilities.migrateFlagData(a))
      }
    });

    // console.log(actorUpdates)

    await Actor.updateDocuments(actorUpdates);

    const tokensOnScenes = Array.from(game.scenes)
      .map(scene => ([
        scene.id,
        Array.from(scene.tokens).filter(t => getProperty(t, CONSTANTS.FLAGS.PILE))
      ]))
      .filter(scene => scene[1].length)
    
    for(const [sceneId, tokens] of tokensOnScenes){
      const scene = game.scenes.get(sceneId)
      const updates = tokens.map(token => {
        const flags = PileUtilities.cleanFlagData(PileUtilities.migrateFlagData(token.actor));
        const update = {
          _id: token.id,
          [CONSTANTS.FLAGS.PILE]: flags
        }
        if(!token.actorLink){
          update["actorData." + CONSTANTS.FLAGS.PILE] = flags
        }
        return update;
      });
      // console.log(scene.id, updates)
      await scene.updateEmbeddedDocuments("Token", updates);
    }

  }

};