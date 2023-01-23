import CONSTANTS from "./constants/constants.js";
import SETTINGS from "./constants/settings.js";
import * as Helpers from "./helpers/helpers.js";
import { SYSTEMS } from "./systems.js";
import SettingsShim from "./applications/settings-app/settings-app.js";
import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import CustomDialog from "./applications/components/CustomDialog.svelte";

export function registerSettings() {

  game.settings.registerMenu(CONSTANTS.MODULE_NAME, "configure-settings", {
    name: "ITEM-PILES.Settings.Configure.Title",
    label: "ITEM-PILES.Settings.Configure.Label",
    hint: "ITEM-PILES.Settings.Configure.Hint",
    icon: "fas fa-cog",
    type: SettingsShim,
    restricted: false
  });

  for (let [name, data] of Object.entries(SETTINGS.GET_DEFAULT())) {
    game.settings.register(CONSTANTS.MODULE_NAME, name, data);
  }

}

export async function applyDefaultSettings() {
  const settings = SETTINGS.GET_SYSTEM_DEFAULTS();
  for (const [name, data] of Object.entries(settings)) {
    await Helpers.setSetting(name, data.default);
  }
  await Helpers.setSetting(SETTINGS.SYSTEM_VERSION, SYSTEMS.DATA.VERSION);
  await patchCurrencySettings();
}

export async function patchCurrencySettings() {
  const currencies = Helpers.getSetting(SETTINGS.CURRENCIES);
  for (let currency of currencies) {
    if (currency.type !== "item" || !currency.data.uuid || currency.data.item) continue;
    const item = await fromUuid(currency.data.uuid);
    if (!item) continue;
    currency.data.item = item.toObject();
  }
  return Helpers.setSetting(SETTINGS.CURRENCIES, currencies);
}

export function applySystemSpecificStyles(data = false) {
  const defaultCssVariables = foundry.utils.deepClone(SETTINGS.DEFAULT_CSS_VARIABLES);
  const cssVariables = data || Helpers.getSetting(SETTINGS.CSS_VARIABLES);
  const mergedCssVariables = foundry.utils.mergeObject(defaultCssVariables, cssVariables)
  const root = document.documentElement;
  for (const [style, val] of Object.entries(mergedCssVariables)) {
    if (!val) {
      root.style.removeProperty(`--item-piles-${style}`)
    } else {
      root.style.setProperty(`--item-piles-${style}`, val);
    }
  }
}

export async function checkSystem() {

  if (!SYSTEMS.HAS_SYSTEM_SUPPORT) {

    if (Helpers.getSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) return;

    let settingsValid = true;
    for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT())) {
      settingsValid = settingsValid && Helpers.getSetting(name).length !== (new data.type).length
    }

    if (settingsValid) return;

    TJSDialog.prompt({
      title: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Title"),
      content: {
        class: CustomDialog,
        props: {
          content: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Content")
        }
      }
    });

    return Helpers.setSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN, true);

  }

  await Helpers.setSetting(SETTINGS.SYSTEM_FOUND, true);

  if (Helpers.getSetting(SETTINGS.SYSTEM_FOUND) || SYSTEMS.DATA.INTEGRATION) {
    const currentVersion = Helpers.getSetting(SETTINGS.SYSTEM_VERSION);
    const newVersion = SYSTEMS.DATA.VERSION;
    Helpers.debug(`Comparing system version - Current: ${currentVersion} - New: ${newVersion}`)
    if (isNewerVersion(newVersion, currentVersion)) {
      Helpers.debug(`Applying system settings for ${game.system.name}`)
      await applyDefaultSettings();
    }
    return;
  }

  if (Helpers.getSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) {
    Helpers.custom_notify(game.i18n.localize("ITEM-PILES.Notifications.SystemSupportFound"));
  }

  return applyDefaultSettings();
}
