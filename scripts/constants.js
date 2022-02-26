const module_name = "item-piles";
const module_path = `modules/${module_name}/`;

export const CONSTANTS = {
    MODULE_NAME: module_name,
    PATH: module_path,
    PILE_FLAGS: "data",
    SHARING_FLAGS: "sharing",
    ITEM_FLAGS: "item",
    PILE_DEFAULTS: {
        // Core settings
        enabled: false,
        distance: 1,
        macro: "",
        deleteWhenEmpty: "default",
        canInspectItems: true,

        // Overrides
        overrideItemFilters: false,
        overrideCurrencies: false,

        // Token settings
        displayOne: false,
        showItemName: false,
        overrideSingleItemScale: false,
        singleItemScale: 1.0,

        // Container settings
        isContainer: false,
        closed: false,
        locked: false,
        closedImage: "",
        emptyImage: "",
        openedImage: "",
        lockedImage: "",
        closeSound: "",
        openSound: "",
        lockedSound: "",
        unlockedSound: "",

        // Sharing settings
        shareItemsEnabled: false,
        shareCurrenciesEnabled: true,
        takeAllEnabled: false,
        splitAllEnabled: true,
        activePlayers: false,

        // Merchant settings
        isMerchant: false,
        priceModifier: 100,
        sellModifier: 50,
        overridePriceModifiers: [],
        openTimes: {
            enabled: false,
            open: {
                hour: 9,
                minute: 0
            },
            close: {
                hour: 18,
                minute: 0
            }
        },
    },
    ITEM_DEFAULTS: {
        override: false
    }
}

export const SOCKET_HANDLERS = {
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
   RERENDER_PILE_INVENTORY: "rerenderItemPileInventory",
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
   PUBLIC: {
      TRADE_UPDATE_ITEMS: "publicTradeUpdateItems",
      TRADE_UPDATE_CURRENCIES: "publicTradeUpdateCurrencies",
      TRADE_STATE: "publicTradeAcceptedState",
   },
   PRIVATE: {
      TRADE_UPDATE_ITEMS: "privateTradeUpdateItems",
      TRADE_UPDATE_CURRENCIES: "privateTradeUpdateCurrencies",
      TRADE_STATE: "privateTradeAcceptedState",
   },
   TRADE_COMPLETED: "tradeCompleted",
};

export const MODULE_SETTINGS = {

   get ACTOR_CLASS_TYPE()
   {
      return game.settings.get(CONSTANTS.MODULE_NAME, "actorClassType");
   },

   /**
    * The currencies used in this system
    *
    * @returns {Array<{name: String, currency: String, img: String, exchange: Number, primary: Boolean}>}
    */
   get CURRENCIES()
   {
      return game.settings.get(CONSTANTS.MODULE_NAME, "currencies");
   },

   /**
    * The attribute used to track the price of items in this system
    *
    * @returns {string}
    */
   get ITEM_PRICE_ATTRIBUTE()
   {
      return game.settings.get(CONSTANTS.MODULE_NAME, "itemPriceAttribute");
   },

   /**
    * The attribute used to track the quantity of items in this system
    *
    * @returns {String}
    */
   get ITEM_QUANTITY_ATTRIBUTE()
   {
      return game.settings.get(CONSTANTS.MODULE_NAME, "itemQuantityAttribute");
   },

   /**
    * The filters for item types eligible for interaction within this system
    *
    * @returns {Array<{name: String, filters: String}>}
    */
   get ITEM_FILTERS()
   {
      return game.settings.get(CONSTANTS.MODULE_NAME, "itemFilters");
   },

   /**
    * The attributes for detecting item similarities
    *
    * @returns {Array<String>}
    */
   get ITEM_SIMILARITIES()
   {
      return game.settings.get(CONSTANTS.MODULE_NAME, "itemSimilarities");
   }

}

const prefix = (string) => (strings, ...expressions) => `${string}-${strings.reduce((a, c, i) => a + expressions[i - 1] + c)}`
const module = prefix(module_name);

export const HOOKS = {
   READY: module`ready`,
   PRE_TRANSFER_EVERYTHING: module`preTransferEverything`,
   TRANSFER_EVERYTHING: module`transferEverything`,
   PILE: {
      PRE_CREATE: module`preCreateItemPile`,
      CREATE: module`createItemPile`,
      PRE_UPDATE: module`preUpdateItemPile`,
      UPDATE: module`updateItemPile`,
      PRE_DELETE: module`preDeleteItemPile`,
      DELETE: module`deleteItemPile`,
      PRE_CLOSE: module`preCloseItemPile`,
      CLOSE: module`closeItemPile`,
      PRE_OPEN: module`preOpenItemPile`,
      OPEN: module`openItemPile`,
      PRE_LOCK: module`preLockItemPile`,
      LOCK: module`lockItemPile`,
      PRE_UNLOCK: module`preUnlockItemPile`,
      UNLOCK: module`unlockItemPile`,
      PRE_RATTLE: module`preRattleItemPile`,
      RATTLE: module`rattleItemPile`,
      PRE_TURN_INTO: module`preTurnIntoItemPiles`,
      TURN_INTO: module`turnIntoItemPiles`,
      PRE_REVERT_FROM: module`preRevertFromItemPiles`,
      REVERT_FROM: module`revertFromItemPiles`,
      PRE_OPEN_INVENTORY: module`preOpenItemPileInventory`,
      OPEN_INVENTORY: module`openItemPileInventory`,
      PRE_SPLIT_INVENTORY: module`preSplitItemPileContent`,
      SPLIT_INVENTORY: module`splitItemPileContent`,
   },
   ITEM: {
      PRE_DROP_DETERMINED: module`preDropItemDetermined`,
      PRE_DROP: module`preDropItem`,
      DROP: module`dropItem`,
      PRE_TRANSFER: module`preTransferItems`,
      TRANSFER: module`transferItems`,
      PRE_ADD: module`preAddItems`,
      ADD: module`addItems`,
      PRE_REMOVE: module`preRemoveItems`,
      REMOVE: module`removeItems`,
      PRE_TRANSFER_ALL: module`preTransferAllItems`,
      TRANSFER_ALL: module`transferAllItems`,
   },
   ATTRIBUTE: {
      PRE_TRANSFER: module`preTransferAttributes`,
      TRANSFER: module`transferAttributes`,
      PRE_ADD: module`preAddAttributes`,
      ADD: module`addAttributes`,
      PRE_REMOVE: module`preRemoveAttributes`,
      REMOVE: module`removeAttributes`,
      PRE_TRANSFER_ALL: module`preTransferAllAttributes`,
      TRANSFER_ALL: module`transferAllAttributes`,
   },
   TRADE: {
      STARTED: module`tradeStarted`,
      COMPLETE: module`tradeComplete`
   }
}