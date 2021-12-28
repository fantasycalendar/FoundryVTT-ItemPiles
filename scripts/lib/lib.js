import CONSTANTS from "../constants.js";

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function debug(msg, args = "") {
    if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) console.log(`DEBUG | Item Piles | ${msg}`, args)
}

export function custom_notify(message, notify = true) {
    message = `Item Piles | ${message}`;
    if (notify) ui.notifications.notify(message);
    console.log(message.replace("<br>", "\n"));
}

export function custom_warning(warning, notify = false) {
    warning = `Item Piles | ${warning}`;
    if (notify) ui.notifications.warn(warning);
    console.warn(warning.replace("<br>", "\n"));
}

export function custom_error(error, notify = true) {
    error = `Item Piles | ${error}`;
    if (notify) ui.notifications.error(error);
    return new Error(error.replace("<br>", "\n"));
}

export function getTokensAtLocation(position){
    return canvas.tokens.placeables.filter(token => {
        return position.x >= token.x && position.x < (token.x + (token.data.width * canvas.grid.size))
            && position.y >= token.y && position.y < (token.y + (token.data.height * canvas.grid.size));
    }).map(token => token.actor);
}

export function distance_between(a, b){
    return new Ray(a, b).distance;
}