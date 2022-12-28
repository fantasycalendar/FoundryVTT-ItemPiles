import CONSTANTS from "./constants.js";

const prefix = (string) => (strings, ...expressions) => `${string}-${strings.reduce((a, c, i) => a + expressions[i - 1] + c)}`
const module = prefix(CONSTANTS.MODULE_NAME);

const HOOKS = {
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
  },
  GENERIC: {
    ITEM_DRAG_START: module`itemDragStart`,
    ITEM_DROP: module`itemDrop`,
  }
}

export default HOOKS;
