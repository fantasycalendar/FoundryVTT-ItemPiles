import { CONSTANTS } from "./constants.js";
import * as lib from "./lib/lib.js";
import { SYSTEMS } from "./systems.js";
import SettingsShim from "./applications/settings/settings-app.js";

export default function registerSettings() {

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "configure-settings", {
        name: "ITEM-PILES.Settings.Configure.Title",
        label: "ITEM-PILES.Settings.Configure.Label",
        hint: "ITEM-PILES.Settings.Configure.Hint",
        icon: "fas fa-cog",
        type: SettingsShim,
        restricted: false
    });

    for (let [name, data] of Object.entries(CONSTANTS.SETTINGS.GET_DEFAULT())) {
        game.settings.register(CONSTANTS.MODULE_NAME, name, data);
    }

    checkSystem();

}
async function applyDefaultSettings() {
    const settings = CONSTANTS.SETTINGS.GET_DEFAULT();
    for (const [name, data] of Object.entries(settings)) {
        await lib.setSetting(name, data.default);
    }
}

export async function checkSystem() {

    await lib.wait(1000);

    if(lib.getSetting(CONSTANTS.SETTINGS.PRECONFIGURED_SYSTEM)) return;

    if (!SYSTEMS.HAS_SYSTEM_SUPPORT) {

        if (lib.getSetting(CONSTANTS.SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) return;

        let settingsValid = true;
        for (const [name, data] of Object.entries(CONSTANTS.SETTINGS.GET_DEFAULT())) {
            settingsValid = settingsValid && lib.getSetting(name).length !== (new data.type).length
        }

        if(settingsValid) return;

        await lib.setSetting(CONSTANTS.SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN, true);

        return Dialog.prompt({
            title: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Title"),
            content: dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Content") }),
            callback: () => {}
        });

    }

    if (lib.getSetting(CONSTANTS.SETTINGS.SYSTEM_FOUND)) return;

    await lib.setSetting(CONSTANTS.SETTINGS.SYSTEM_FOUND, true);

    if (lib.getSetting(CONSTANTS.SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) {

        return new Dialog({
            title: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Title"),
            content: lib.dialogLayout({
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