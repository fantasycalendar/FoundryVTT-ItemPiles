const module_name = "item-piles";
const module_path = `modules/${module_name}/`;
const baseFlag = `flags.${module_name}.`

const CONSTANTS = {

  MODULE_NAME: module_name,
  PATH: module_path,

  FLAGS: {
    VERSION: baseFlag + "version",
    PILE: baseFlag + "data",
    LOG: baseFlag + "log",
    SHARING: baseFlag + "sharing",
    ITEM: baseFlag + "item",
    PUBLIC_TRADE_ID: baseFlag + "publicTradeId",
    TRADE_USERS: baseFlag + "tradeUsers",
    TEMPORARY_ITEM: baseFlag + "temporary_item"
  },

  ITEM_DEFAULTS: {
    // Merchants
    hidden: false,
    notForSale: false,
    infiniteQuantity: "default",
    displayQuantity: "default",
    free: false,
    keepZeroQuantity: false,
    disableNormalCost: false,
    cantBeSoldToMerchants: false,
    isService: false,
    macro: "",
    customCategory: "",
    prices: [],

    // Vaults
    vaultExpander: false,
    vaultSlot: null,
    addsCols: 0,
    addsRows: 0,
    x: null,
    y: null,
    width: 1,
    height: 1,
    canStack: "default"
  },

  PILE_TYPES: {
    PILE: "pile",
    CONTAINER: "container",
    MERCHANT: "merchant",
    VAULT: "vault"
  },

  VAULT_LOGGING_TYPES: {
    USER_ACTOR: "user_actor",
    USER: "user",
    ACTOR: "actor",
  },

  CUSTOM_PILE_TYPES: {},

  PILE_DEFAULTS: {
    // Core settings
    enabled: false,
    type: "pile",
    distance: 1,
    macro: "",
    deleteWhenEmpty: "default",
    canInspectItems: true,
    displayItemTypes: false,
    description: "",

    // Overrides
    overrideItemFilters: false,
    overrideCurrencies: false,

    // Token settings
    displayOne: false,
    showItemName: false,
    overrideSingleItemScale: false,
    singleItemScale: 1.0,

    // Sharing settings
    shareItemsEnabled: false,
    shareCurrenciesEnabled: true,
    takeAllEnabled: false,
    splitAllEnabled: true,
    activePlayers: false,

    // Container settings
    closed: false,
    locked: false,
    closedImage: "",
    closedImages: [],
    emptyImage: "",
    emptyImages: [],
    openedImage: "",
    openedImages: [],
    lockedImage: "",
    lockedImages: [],
    closeSound: "",
    closeSounds: [],
    openSound: "",
    openSounds: [],
    lockedSound: "",
    lockedSounds: [],
    unlockedSound: "",
    unlockedSounds: [],

    // Merchant settings
    merchantImage: "",
    infiniteQuantity: false,
    infiniteCurrencies: true,
    purchaseOnly: false,
    hideNewItems: false,
    hideItemsWithZeroCost: false,
    keepZeroQuantity: false,
    onlyAcceptBasePrice: true,
    displayQuantity: "yes",
    buyPriceModifier: 1,
    sellPriceModifier: 0.5,
    itemTypePriceModifiers: [],
    actorPriceModifiers: [],
    tablesForPopulate: [],
    openTimes: {
      enabled: false,
      status: "open",
      /*
      auto = rely on simple calendar
      open = always open
      closed = always closed
       */
      open: {
        hour: 9,
        minute: 0
      },
      close: {
        hour: 18,
        minute: 0
      },
    },
    closedDays: [],
    closedHolidays: [],

    // Vault settings
    cols: 10,
    rows: 5,
    vaultExpansion: false,
    baseExpansionCols: 0,
    baseExpansionRows: 0,
    vaultAccess: [],
    logVaultActions: false,
    vaultLogType: "user_actor",
    canStackItems: true
  }
}

CONSTANTS.ITEM_FORCED_UNIQUE_KEYS = ["vaultExpander", "isService"]
  .map(val => CONSTANTS.FLAGS.ITEM + "." + val);

const prefix = (string) => (strings, ...expressions) => `${string}-${strings.reduce((a, c, i) => a + expressions[i - 1] + c)}`
const module = prefix(CONSTANTS.MODULE_NAME);

CONSTANTS.HOOKS = {
  READY: module`ready`,
  RESET_SETTINGS: module`resetSettings`,
  PRE_TRANSFER_EVERYTHING: module`preTransferEverything`,
  TRANSFER_EVERYTHING: module`transferEverything`,
  PRE_OPEN_INTERFACE: module`preOpenInterface`,
  OPEN_INTERFACE: module`openInterface`,
  PRE_CLOSE_INTERFACE: module`preCloseInterface`,
  CLOSE_INTERFACE: module`closeInterface`,
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
    PRE_SPLIT_INVENTORY: module`preSplitItemPileContent`,
    SPLIT_INVENTORY: module`splitItemPileContent`,
    PRE_CLICK: module`preClickItemPile`,
    PRE_DIRECTORY_CLICK: module`preClickDirectoryItemPile`,
    PRE_RIGHT_CLICK_ITEM: module`preRightClickItem`
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
    PRE_CALC_TRADE: module`preCalculateTradeItems`,
    PRE_TRADE: module`preTradeItems`,
    TRADE: module`tradeItems`,
    PRE_GIVE: module`preGiveItem`,
    GIVE: module`giveItem`,
  },
  CURRENCY: {
    PRE_TRANSFER: module`preTransferCurrencies`,
    TRANSFER: module`transferCurrencies`,
    PRE_ADD: module`preAddCurrencies`,
    ADD: module`addCurrencies`,
    PRE_REMOVE: module`preRemoveCurrencies`,
    REMOVE: module`removeCurrencies`,
    PRE_TRANSFER_ALL: module`preTransferAllCurrencies`,
    TRANSFER_ALL: module`transferAllCurrencies`,
  },
  ATTRIBUTE: {
    PRE_TRANSFER: module`preTransferAttributes`,
    TRANSFER: module`transferAttributes`,
    PRE_SET: module`preSetAttributes`,
    SET: module`setAttributes`,
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

Object.freeze(CONSTANTS);

export default CONSTANTS;
