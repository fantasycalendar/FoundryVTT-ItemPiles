import CONSTANTS from "./constants/constants.js";
import SETTINGS from "./constants/settings.js";
import { getSetting, setSetting } from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";

let oldSettings;
export default async function migrate() {
  
  oldSettings = game.settings.storage.get("world").filter(setting => setting.key.includes(CONSTANTS.MODULE_NAME))
  
  const sortedMigrations = Object.entries(migrations)
    .sort((a, b) => {
      return isNewerVersion(b[0], a[0]) ? -1 : 1;
    });
  
  for (const [version, migration] of sortedMigrations) {
    const migrationVersion = getSetting(SETTINGS.MIGRATION_VERSION);
    if (!isNewerVersion(version, migrationVersion)) continue;
    await migration();
  }
  
  const moduleVersion = game.modules.get(CONSTANTS.MODULE_NAME).version;
  await setSetting(SETTINGS.MIGRATION_VERSION, moduleVersion);
  
}

function findOldSettingValue(oldSettingKey) {
  return oldSettings.find(setting => setting.key.endsWith(oldSettingKey))?.value;
}

const migrations = {};