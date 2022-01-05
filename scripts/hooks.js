import CONSTANTS from "./constants.js";

const prefix = (str) => (strs, ...exprs) => `${str}-${strs.reduce((a, c, i) => a + exprs[i - 1] + c)}`
const module = prefix(CONSTANTS.MODULE_NAME);

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
        PRE_TURN_INTO: module`preTurnIntoItemPile`,
        TURN_INTO: module`turnIntoItemPile`,
        PRE_REVERT_FROM: module`preRevertFromItemPile`,
        REVERT_FROM: module`revertFromItemPile`
    },
    ITEM: {
        PRE_DROP_DETERMINED: module`preDropItemDetermined`,
        PRE_DROP: module`preDropItem`,
        DROP: module`dropItem`,
        PRE_TRANSFER: module`preTransferItem`,
        TRANSFER: module`transferItem`,
        PRE_ADD: module`preAddItem`,
        ADD: module`addItem`,
        PRE_REMOVE: module`preRemoveItem`,
        REMOVE: module`removeItem`,
        PRE_TRANSFER_ALL: module`preTransferAllItems`,
        TRANSFER_ALL: module`transferAllItems`,
    },
    ATTRIBUTE: {
        PRE_TRANSFER: module`preTransferAttribute`,
        TRANSFER: module`transferAttribute`,
        PRE_ADD: module`preAddAttribute`,
        ADD: module`addAttribute`,
        PRE_REMOVE: module`preRemoveAttribute`,
        REMOVE: module`removeAttribute`,
        PRE_TRANSFER_ALL: module`preTransferAllAttributes`,
        TRANSFER_ALL: module`transferAllAttributes`,
    }
}