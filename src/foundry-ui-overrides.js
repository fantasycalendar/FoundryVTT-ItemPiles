import SETTINGS from "./constants/settings.js";
import * as Helpers from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";
import ItemEditor from "./applications/editors/item-editor/item-editor.js";
import CONSTANTS from "./constants/constants.js";

export default function registerUIOverrides() {
  Hooks.on("renderPlayerList", addTradeButton);
  Hooks.on("getActorDirectoryEntryContext", insertActorContextMenuItems);
  Hooks.on("getActorSheetHeaderButtons", insertActorHeaderButtons);
  Hooks.on("getItemSheetHeaderButtons", insertItemHeaderButtons);
  Hooks.on("renderSidebarTab", hideTemporaryItems);
  Hooks.on("renderTokenHUD", renderPileHUD);
}

function hideTemporaryItems(sidebar) {
  if (sidebar.tabName !== "items") return;
  Array.from(game.items).filter(item => {
      return getProperty(item.toObject(), CONSTANTS.FLAGS.TEMPORARY_ITEM);
    })
    .forEach(item => {
      const element = sidebar.element.find(`.directory-item[data-document-id="${item.id}"]`);
      if (!element.length) return;
      if (element.parent().children().length === 1) {
        return element.parent().empty();
      }
      element.find(`.directory-item[data-document-id="${item.id}"]`).remove();
    });
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
      return game.itempiles.renderItemPileInterface(actor, { userIds: users, useDefaultCharacter: true });
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

function renderPileHUD(app, html) {
  
  const document = app?.object?.document;
  
  if (!document) return;
  
  if (!PileUtilities.isValidItemPile(document)) return;
  
  const pileData = PileUtilities.getActorFlagData(document);
  
  const container = $(`<div class="col right" style="right:-130px;"></div>`);
  
  if (pileData.isContainer) {
    
    const lock_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleLocked")}"><i class="fas fa-lock${pileData.locked ? "" : "-open"}"></i></div>`);
    lock_button.click(async function () {
      $(this).find('.fas').toggleClass('fa-lock').toggleClass('fa-lock-open');
      await game.itempiles.toggleItemPileLocked(document);
    });
    container.append(lock_button);
    
    const open_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleClosed")}"><i class="fas fa-box${pileData.closed ? "" : "-open"}"></i></div>`);
    open_button.click(async function () {
      $(this).find('.fas').toggleClass('fa-box').toggleClass('fa-box-open');
      await game.itempiles.toggleItemPileClosed(document);
    });
    container.append(open_button);
  }
  
  const configure_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.Configure")}"><i class="fas fa-toolbox"></i></div>`);
  configure_button.click(async function () {
    ItemPileConfig.show(document);
  });
  container.append(configure_button);
  
  html.append(container)
  
}