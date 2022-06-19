import CONSTANTS from "../constants/constants.js";

export function isGMConnected() {
  return !!Array.from(game.users).find(user => user.isGM && user.active);
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getSetting(key) {
  return game.settings.get(CONSTANTS.MODULE_NAME, key);
}

export function setSetting(key, value) {
  if (value === undefined) throw new Error("setSetting | value must not be undefined!")
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

export function dialogLayout({
                               title = "Item Piles",
                               message,
                               icon = "fas fa-exclamation-triangle",
                               extraHtml = ""
                             } = {}) {
  return `
    <div class="item-piles-dialog">
        <p><i style="font-size:3rem;" class="${icon}"></i></p>
        <p style="margin-bottom: 1rem"><strong style="font-size:1.2rem;">${title}</strong></p>
        <p>${message}</p>
        ${extraHtml}
    </div>
    `;
}

