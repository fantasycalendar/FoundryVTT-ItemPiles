import CONSTANTS from "./constants/constants.js";
import { debug } from "./helpers/helpers.js";
import { stringIsUuid } from "./helpers/utilities.js";

export default class ItemPileSocket {

  static HANDLERS = {
    /**
     * Generic sockets
     */
    CALL_HOOK: "callHook",

    /**
     * Chat messages
     */
    PICKUP_CHAT_MESSAGE: "pickupChatMessage",
    SPLIT_CHAT_MESSAGE: "splitChatMessage",
    DISABLE_CHAT_TRADE_BUTTON: "disableChatTradeButton",

    /**
     * Item pile sockets
     */
    CREATE_PILE: "createItemPile",
    UPDATE_PILE: "updateItemPile",
    UPDATED_PILE: "updatedPile",
    DELETE_PILE: "deleteItemPile",
    TURN_INTO_PILE: "turnIntoPiles",
    REVERT_FROM_PILE: "revertFromPiles",
    REFRESH_PILE: "refreshItemPile",
    SPLIT_PILE: "splitItemPileContent",

    /**
     * UI sockets
     */
    RENDER_INTERFACE: "renderItemPileInterface",
    RERENDER_TOKEN_HUD: "rerenderTokenHud",
    RERENDER_PILE_APPLICATION: "rerenderItemPileApplication",
    QUERY_PILE_INVENTORY_OPEN: "queryItemPileInventoryOpen",
    RESPOND_PILE_INVENTORY_OPEN: "responseItemPileInventoryOpen",

    /**
     * Item & attribute sockets
     */
    DROP_ITEMS: "dropItems",
    ADD_ITEMS: "addItems",
    REMOVE_ITEMS: "removeItems",
    TRANSFER_ITEMS: "transferItems",
    TRANSFER_ALL_ITEMS: "transferAllItems",
    ADD_ATTRIBUTE: "addAttributes",
    REMOVE_ATTRIBUTES: "removeAttributes",
    TRANSFER_ATTRIBUTES: "transferAttributes",
    TRANSFER_ALL_ATTRIBUTES: "transferAllAttributes",
    TRANSFER_EVERYTHING: "transferEverything",

    /**
     * Trading sockets
     */
    TRADE_REQUEST_PROMPT: "tradePrompt",
    TRADE_REQUEST_CANCELLED: "tradeCancelled",
    TRADE_SPECTATE: "tradeSpectate",
    TRADE_CLOSED: "publicTradeClosed",
    PUBLIC_TRADE_UPDATE_ITEMS: "publicTradeUpdateItems",
    PUBLIC_TRADE_UPDATE_CURRENCIES: "publicTradeUpdateCurrencies",
    PUBLIC_TRADE_STATE: "publicTradeAcceptedState",
    PRIVATE_TRADE_UPDATE_ITEMS: "privateTradeUpdateItems",
    PRIVATE_TRADE_UPDATE_CURRENCIES: "privateTradeUpdateCurrencies",
    PRIVATE_TRADE_STATE: "privateTradeAcceptedState",
    TRADE_COMPLETED: "tradeCompleted",
  }

  static BINDINGS = {
    [this.HANDLERS.CALL_HOOK]: (hook, response, ...args) => callHook(hook, response, ...args),
    [this.HANDLERS.ADD_ITEMS]: (hook, response, ...args) => game.itempiles._addItems(hook, response, ...args),
    [this.HANDLERS.REMOVE_ITEMS]: (hook, response, ...args) => game.itempiles._removeItems(hook, response, ...args),
  }

  static socket;

  static initialize() {

    this.socket = globalThis.socketlib.registerModule(CONSTANTS.MODULE_NAME);

    for (let [key, callback] of Object.entries(this.BINDINGS)) {
      this.socket.register(key, callback);
      debug(`Registered itemPileSocket: ${key}`);
    }

  }

  static executeAsGM(handler, ...args) {
    return this.socket.executeAsGM(handler, ...args);
  }

  static executeAsUser(handler, userId, ...args) {
    return this.socket.executeAsUser(handler, userId, ...args);
  }

  static executeForAllGMs(handler, ...args) {
    return this.socket.executeForAllGMs(handler, ...args);
  }

  static executeForOtherGMs(handler, ...args) {
    return this.socket.executeForOtherGMs(handler, ...args);
  }

  static executeForEveryone(handler, ...args) {
    return this.socket.executeForEveryone(handler, ...args);
  }

  static executeForOthers(handler, ...args) {
    return this.socket.executeForOthers(handler, ...args);
  }

  static executeForUsers(handler, userIds, ...args) {
    return this.socket.executeForUsers(handler, userIds, ...args);
  }

}

async function callHook(hook, response, ...args) {
  const newArgs = [];
  for (let arg of args) {
    if (stringIsUuid(arg)) {
      const testArg = await fromUuid(arg);
      if (testArg) {
        arg = testArg;
      }
    }
    newArgs.push(arg);
  }
  return Hooks.callAll(hook, ...newArgs);
}