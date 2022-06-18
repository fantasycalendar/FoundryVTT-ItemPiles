import { CONSTANTS } from "../constants.js";

export function getSetting(key, localize = false) {
    const value = game.settings.get(CONSTANTS.MODULE_NAME, key);
    if (localize) return game.i18n.localize(value);
    return value;
}

export function setSetting(key, value) {
    return game.settings.set(CONSTANTS.MODULE_NAME, key, value);
}

export function debug(msg, args = "") {
    if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) {
        console.log(`DEBUG | Item Piles | ${msg}`, args)
    }
}

export function custom_notify(message) {
    message = `Item Piles | ${message}`;
    ui.notifications.notify(message);
    console.log(message.replace("<br>", "\n"));
}

export function custom_warning(warning, notify = false) {
    warning = `Item Piles | ${warning}`;
    if (notify) {
        ui.notifications.warn(warning);
    }
    console.warn(warning.replace("<br>", "\n"));
}

export function custom_error(error, notify = true) {
    error = `Item Piles | ${error}`;
    if (notify) {
        ui.notifications.error(error);
    }
    return new Error(error.replace("<br>", "\n"));
}