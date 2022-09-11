import CONSTANTS from "./constants/constants.js";
import SETTINGS from "./constants/settings.js";
import * as Helpers from "./helpers/helpers.js";
import { SYSTEMS } from "./systems.js";
import SettingsShim from "./applications/settings-app/settings-app.js";
import { TJSDialog } from "@typhonjs-fvtt/runtime/_dist/svelte/application/index.js";
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

async function applyDefaultSettings() {
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
  await Helpers.setSetting(SETTINGS.CURRENCIES, currencies);
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
          content: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Content"),
          icon: "fas fa-exclamation-triangle",
        }
      }
    });
    
    return Helpers.setSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN, true);
    
  }
  
  if (Helpers.getSetting(SETTINGS.SYSTEM_FOUND)) {
    const currentVersion = Helpers.getSetting(SETTINGS.SYSTEM_VERSION);
    const newVersion = SYSTEMS.DATA.VERSION;
    if (isNewerVersion(newVersion, currentVersion)) {
      const doThing = await TJSDialog.confirm({
        title: game.i18n.localize("ITEM-PILES.Dialogs.NewSystemVersion.Title"),
        content: {
          class: CustomDialog,
          props: {
            content: game.i18n.localize("ITEM-PILES.Dialogs.NewSystemVersion.Content"),
            icon: "fas fa-exclamation-triangle",
          }
        },
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize("ITEM-PILES.Dialogs.NewSystemVersion.Confirm")
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("No")
          }
        },
        modal: true,
        draggable: false,
        rejectClose: false,
        defaultYes: true,
        options: {
          height: "auto"
        }
      });
      if (doThing) {
        await Helpers.setSetting(SETTINGS.PRECONFIGURED_SYSTEM, true);
        return applyDefaultSettings();
      }
      return;
    }
  }
  
  if (Helpers.getSetting(SETTINGS.PRECONFIGURED_SYSTEM)) return;
  
  await Helpers.setSetting(SETTINGS.SYSTEM_FOUND, true);
  
  if (Helpers.getSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) {
    const doThing = await TJSDialog.confirm({
      title: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Title"),
      content: {
        class: CustomDialog,
        props: {
          content: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Content"),
          icon: "fas fa-exclamation-triangle",
        }
      },
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Confirm")
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No")
        }
      },
      modal: true,
      draggable: false,
      rejectClose: false,
      defaultYes: true,
      options: {
        height: "auto"
      }
    });
    if (!doThing) {
      return;
    }
  }
  
  await Helpers.setSetting(SETTINGS.PRECONFIGURED_SYSTEM, true);
  return applyDefaultSettings();
}