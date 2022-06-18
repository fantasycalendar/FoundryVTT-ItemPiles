import { CONSTANTS } from "./constants.js";
export default function registerSettings() {

    // game.settings.registerMenu(CONSTANTS.MODULE_NAME, "configure-settings", {
    //     name: "REST-RECOVERY.Settings.Configure.Title",
    //     label: "REST-RECOVERY.Settings.Configure.Label",
    //     hint: "REST-RECOVERY.Settings.Configure.Hint",
    //     icon: "fas fa-bed",
    //     type: SettingsShim,
    //     restricted: false
    // });

    for (let [name, data] of Object.entries(CONSTANTS.SETTINGS.GET_DEFAULT())) {
        game.settings.register(CONSTANTS.MODULE_NAME, name, data);
    }

}