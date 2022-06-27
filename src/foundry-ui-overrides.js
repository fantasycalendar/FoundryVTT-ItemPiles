import SETTINGS from "./constants/settings.js";
import * as Helpers from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";
import ItemEditor from "./applications/editors/item-editor/item-editor.js";

export default function registerUIOverrides() {
  Hooks.on("renderPlayerList", addTradeButton);
  Hooks.on("getActorDirectoryEntryContext", insertActorContextMenuItems);
  Hooks.on("getActorSheetHeaderButtons", insertActorHeaderButtons);
  Hooks.on("getItemSheetHeaderButtons", insertItemHeaderButtons);
}

function addTradeButton(app, html) {
  if (!Helpers.getSetting(SETTINGS.ENABLE_TRADING) || !Helpers.getSetting(SETTINGS.SHOW_TRADE_BUTTON)) return;
  
  const minimalUI = game.modules.get('minimal-ui')?.active;
  const classes = "item-piles-player-list-trade-button" + (minimalUI ? " item-piles-minimal-ui" : "")
  const text = !minimalUI ? " Request Trade" : ""
  const button = $(`<button type="button" class="${classes}"><i class="fas fa-handshake"></i>${text}</button>`)
  
  button.click(() => {
    game.itempiles.requestTrade();
  });
  html.append(button);
}

function insertActorContextMenuItems(html, menuItems) {
  
  menuItems.push({
    name: "ITEM-PILES.ContextMenu.ShowToPlayers",
    icon: `<i class="fas fa-eye"></i>`,
    callback: (html) => {
      const actorId = html[0].dataset.documentId;
      const actor = game.actors.get(actorId);
      const users = Array.from(game.users).filter(u => u.active).map(u => u.id);
      return game.itempiles.renderItemPileInterface(actor, { users, useDefaultCharacter: true });
    },
    condition: (html) => {
      const actorId = html[0].dataset.documentId;
      const actor = game.actors.get(actorId);
      return game.user.isGM && PileUtilities.isValidItemPile(actor);
    }
  }, {
    name: "ITEM-PILES.ContextMenu.RequestTrade",
    icon: `<i class="fas fa-handshake"></i>`,
    callback: (html) => {
      const actorId = html[0].dataset.documentId;
      const actor = game.actors.get(actorId);
      const user = Array.from(game.users).find(u => u.character === actor && u.active);
      return game.itempiles.requestTrade(user);
    },
    condition: (html) => {
      const actorId = html[0].dataset.documentId;
      const actor = game.actors.get(actorId);
      return Helpers.getSetting(SETTINGS.ENABLE_TRADING)
        && (game.user?.character !== actor || Array.from(game.users).find(u => u.character === actor && u.active));
    }
  });
}

function insertActorHeaderButtons(actorSheet, buttons) {
  
  if (!game.user.isGM) return;
  
  let obj = actorSheet.object;
  
  buttons.unshift({
    label: Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT) ? "" : "Configure",
    icon: "fas fa-box-open",
    class: "item-piles-config-button",
    onclick: () => {
      ItemPileConfig.show(obj);
    }
  })
}

function insertItemHeaderButtons(itemSheet, buttons) {
  
  if (!game.user.isGM) return;
  
  let obj = itemSheet.object;
  
  buttons.unshift({
    label: Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT) ? "" : "Configure",
    icon: "fas fa-box-open",
    class: "item-piles-config-button",
    onclick: () => {
      ItemEditor.show(obj);
    }
  })
}