import CONSTANTS from "./constants/constants.js";
import SETTINGS from "./constants/settings.js";
import * as Helpers from "./helpers/helpers.js";
import { SYSTEMS } from "./systems.js";
import SettingsShim from "./applications/settings-interface/settings-app.js";

export default function registerSettings() {
  
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
  
  checkSystem();
  
}

async function applyDefaultSettings() {
  const settings = SETTINGS.GET_SYSTEM_DEFAULTS();
  for (const [name, data] of Object.entries(settings)) {
    await Helpers.setSetting(name, data.default);
  }
}

export async function checkSystem() {
  
  await Helpers.wait(1000);
  
  if (Helpers.getSetting(SETTINGS.PRECONFIGURED_SYSTEM)) return;
  
  if (!SYSTEMS.HAS_SYSTEM_SUPPORT) {
    
    if (Helpers.getSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) return;
    
    let settingsValid = true;
    for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT())) {
      settingsValid = settingsValid && Helpers.getSetting(name).length !== (new data.type).length
    }
    
    if (settingsValid) return;
    
    await Helpers.setSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN, true);
    
    return Dialog.prompt({
      title: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Title"),
      content: dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Content") }),
      callback: () => {
      }
    });
    
  }
  
  if (Helpers.getSetting(SETTINGS.SYSTEM_FOUND)) return;
  
  await Helpers.setSetting(SETTINGS.SYSTEM_FOUND, true);
  
  if (Helpers.getSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) {
    
    return new Dialog({
      title: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Title"),
      content: Helpers.dialogLayout({
        message: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Content"),
        icon: "fas fa-search"
      }),
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Confirm"),
          callback: () => {
            applyDefaultSettings();
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No")
        }
      },
      default: "cancel"
    }).render(true);
    
  }
  
  return applyDefaultSettings();
}