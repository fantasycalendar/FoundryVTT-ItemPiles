import CONSTANTS from "./constants/constants.js";
import SETTINGS from "./constants/settings.js";
import * as Helpers from "./helpers/helpers.js";
import { SYSTEMS } from "./systems.js";
import SettingsShim from "./applications/settings-app/settings-app.js";

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

async function applyDefaultSettings() {
  const settings = SETTINGS.GET_SYSTEM_DEFAULTS();
  for (const [name, data] of Object.entries(settings)) {
    await Helpers.setSetting(name, data.default);
  }
  await Helpers.setSetting(SETTINGS.SYSTEM_VERSION, SYSTEMS.DATA.VERSION);
  await patchCurrencySettings();
}

export async function patchCurrencySettings(){
  const currencies = Helpers.getSetting(SETTINGS.CURRENCIES);
  for(let currency of currencies){
    if(currency.type !== "item" || !currency.data.uuid || currency.data.item) continue;
    const item = await fromUuid(currency.data.uuid);
    if(!item) continue;
    currency.data.item = item.toObject();
  }
  await Helpers.setSetting(SETTINGS.CURRENCIES, currencies);
}

export async function checkSystem() {
  
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
  
  if (Helpers.getSetting(SETTINGS.SYSTEM_FOUND)){
    const currentVersion = Helpers.getSetting(SETTINGS.SYSTEM_VERSION);
    const newVersion = SYSTEMS.DATA.VERSION;
    if(isNewerVersion(newVersion, currentVersion)){
      return new Dialog({
        title: game.i18n.localize("ITEM-PILES.Dialogs.NewSystemVersion.Title"),
        content: Helpers.dialogLayout({
          message: game.i18n.localize("ITEM-PILES.Dialogs.NewSystemVersion.Content"),
        }),
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize("ITEM-PILES.Dialogs.NewSystemVersion.Confirm"),
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
    return;
  }
  
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