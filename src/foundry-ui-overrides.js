import * as Helpers from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import { isValidItemPile } from "./helpers/pile-utilities.js";
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";
import ItemEditor from "./applications/item-editor/item-editor.js";
import SETTINGS from "./constants/settings.js";
import CONSTANTS from "./constants/constants.js";
import UserSelectDialog from "./applications/dialogs/user-select-dialog/user-select-dialog.js";

export default function registerUIOverrides() {
  Hooks.on("renderPlayerList", addTradeButton);
  Hooks.on("getActorDirectoryEntryContext", insertActorContextMenuItems);
  Hooks.on("getActorSheetHeaderButtons", insertActorHeaderButtons);
  Hooks.on("getItemSheetHeaderButtons", insertItemHeaderButtons);
  Hooks.on("renderSidebarTab", hideTemporaryItems);
  Hooks.on("renderTokenHUD", renderPileHUD);
  Hooks.on("hoverToken", handleTokenBorders);
  Hooks.on("controlToken", handleTokenBorders);
  game.tooltip = new FastTooltipManager();
}

function handleTokenBorders(token) {
  if (!isValidItemPile(token)) return;
  const setting = Helpers.getSetting(SETTINGS.HIDE_TOKEN_BORDER);
  token.border.renderable = token.controlled ||
    (setting !== SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.EVERYONE && (
      setting === SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.SHOW
      ||
      (setting === SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.PLAYERS && game.user.isGM)
    ));
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
    game.itempiles.API.requestTrade();
  });
  html.append(button);
}

function insertActorContextMenuItems(html, menuItems) {

  menuItems.push({
    name: "Item Piles: " + game.i18n.localize("ITEM-PILES.ContextMenu.ShowToPlayers"),
    icon: `<i class="fas fa-eye"></i>`,
    callback: async (html) => {
      const actorId = html[0].dataset.documentId;
      const actor = game.actors.get(actorId);
      const activeUsers = Array.from(game.users).filter(u => u.active && u !== game.user).map(u => u.id);
      if (!activeUsers.length) {
        return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.NoPlayersActive"), true);
      }
      const users = await UserSelectDialog.show();
      if (!users || !users.length) return;
      Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ShownToPlayers", { actor_name: actor.name }))
      return game.itempiles.API.renderItemPileInterface(actor, { userIds: users, useDefaultCharacter: true });
    },
    condition: (html) => {
      const actorId = html[0].dataset.documentId;
      const actor = game.actors.get(actorId);
      return game.user.isGM && PileUtilities.isValidItemPile(actor);
    }
  }, {
    name: "Item Piles: " + game.i18n.localize("ITEM-PILES.ContextMenu.RequestTrade"),
    icon: `<i class="fas fa-handshake"></i>`,
    callback: (html) => {
      const actorId = html[0].dataset.documentId;
      const actor = game.actors.get(actorId);
      const user = Array.from(game.users).find(u => u.character === actor && u.active);
      return game.itempiles.API.requestTrade(user);
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

  if (!game.user.isGM || Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_BUTTON)) return;

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

  if (!game.user.isGM || Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_BUTTON)) return;

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

  if (PileUtilities.isItemPileContainer(document)) {

    const pileData = PileUtilities.getActorFlagData(document);

    const container = $(`<div class="col right" style="right:-130px;"></div>`);

    const lock_button = $(`<div class="control-icon item-piles" data-tooltip="${game.i18n.localize("ITEM-PILES.HUD.ToggleLocked")}"><i class="fas fa-lock${pileData.locked ? "" : "-open"}"></i></div>`);
    lock_button.click(async function () {
      $(this).find('.fas').toggleClass('fa-lock').toggleClass('fa-lock-open');
      await game.itempiles.API.toggleItemPileLocked(document);
    });
    container.append(lock_button);

    const open_button = $(`<div class="control-icon item-piles" data-tooltip="${game.i18n.localize("ITEM-PILES.HUD.ToggleClosed")}"><i class="fas fa-box${pileData.closed ? "" : "-open"}"></i></div>`);
    open_button.click(async function () {
      $(this).find('.fas').toggleClass('fa-box').toggleClass('fa-box-open');
      await game.itempiles.API.toggleItemPileClosed(document);
    });
    container.append(open_button);

    const configure_button = $(`<div class="control-icon item-piles" data-tooltip="${game.i18n.localize("ITEM-PILES.HUD.Configure")}"><i class="fas fa-toolbox"></i></div>`);
    configure_button.click(async function () {
      ItemPileConfig.show(document);
    });
    container.append(configure_button);

    html.append(container)

  }

}

class FastTooltipManager extends TooltipManager {

  /**
   * A cached reference to the global tooltip element
   * @type {HTMLElement}
   */
  tooltip = document.getElementById("tooltip");

  /**
   * A reference to the HTML element which is currently tool-tipped, if any.
   * @type {HTMLElement|null}
   */
  element = null;

  /**
   * An amount of margin which is used to offset tooltips from their anchored element.
   * @type {number}
   */
  static TOOLTIP_MARGIN_PX = 5;

  /**
   * The number of milliseconds delay which activates a tooltip on a "long hover".
   * @type {number}
   */
  static TOOLTIP_ACTIVATION_MS = 500;

  /**
   * The number of milliseconds delay which activates a tooltip on a "long hover".
   * @type {number}
   */
  static TOOLTIP_DEACTIVATION_MS = 500;

  /**
   * The directions in which a tooltip can extend, relative to its tool-tipped element.
   * @enum {string}
   */
  static TOOLTIP_DIRECTIONS = {
    UP: "UP",
    DOWN: "DOWN",
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    CENTER: "CENTER"
  };

  /**
   * Is the tooltip currently active?
   * @type {boolean}
   */
  #active = false;

  /**
   * A reference to a window timeout function when an element is activated.
   * @private
   */
  #activationTimeout;

  /**
   * A reference to a window timeout function when an element is deactivated.
   * @private
   */
  #deactivationTimeout;

  /**
   * An element which is pending tooltip activation if hover is sustained
   * @type {HTMLElement|null}
   */
  #pending;

  /* -------------------------------------------- */

  /**
   * Activate interactivity by listening for hover events on HTML elements which have a data-tooltip defined.
   */
  activateEventListeners() {
    document.body.addEventListener("pointerenter", this.#onActivate.bind(this), true);
    document.body.addEventListener("pointerleave", this.#onDeactivate.bind(this), true);
  }

  /* -------------------------------------------- */

  /**
   * Handle hover events which activate a tooltipped element.
   * @param {PointerEvent} event    The initiating pointerenter event
   */
  #onActivate(event) {
    if (Tour.tourInProgress) return; // Don't activate tooltips during a tour
    const element = event.target;
    if (!element.dataset.tooltip) {
      // Check if the element has moved out from underneath the cursor and pointerenter has fired on a non-child of the
      // tooltipped element.
      if (this.#active && !this.element.contains(element)) this.#startDeactivation();
      return;
    }

    // Don't activate tooltips if the element contains an active context menu
    if (element.matches("#context-menu") || element.querySelector("#context-menu")) return;

    // If the tooltip is currently active, we can move it to a new element immediately
    if (this.#active) this.activate(element);
    else this.#clearDeactivation();

    // Otherwise, delay activation to determine user intent
    this.#pending = element;
    this.#activationTimeout = window.setTimeout(() => {
      this.activate(element);
    }, Number(element?.dataset?.tooltipActivationSpeed) ?? this.constructor.TOOLTIP_ACTIVATION_MS);
  }

  /* -------------------------------------------- */

  /**
   * Handle hover events which deactivate a tooltipped element.
   * @param {PointerEvent} event    The initiating pointerleave event
   */
  #onDeactivate(event) {
    if (event.target !== (this.element ?? this.#pending)) return;
    this.#startDeactivation();
  }

  /* -------------------------------------------- */

  /**
   * Start the deactivation process.
   */
  #startDeactivation() {
    // Clear any existing activation workflow
    window.clearTimeout(this.#activationTimeout);
    this.#pending = this.#activationTimeout = null;

    // Delay deactivation to confirm whether some new element is now pending
    window.clearTimeout(this.#deactivationTimeout);
    this.#deactivationTimeout = window.setTimeout(() => {
      if (!this.#pending) this.deactivate();
    }, Number(this.element?.dataset?.tooltipDeactivationSpeed) ?? this.constructor.TOOLTIP_DEACTIVATION_MS);
  }

  /* -------------------------------------------- */

  /**
   * Clear any existing deactivation workflow.
   */
  #clearDeactivation() {
    window.clearTimeout(this.#deactivationTimeout);
    this.#pending = this.#deactivationTimeout = null;
  }
}
