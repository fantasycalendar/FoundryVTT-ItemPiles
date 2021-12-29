import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import API from "./api.js";

export const SOCKET_HANDLERS = {
    UPDATE_DOCUMENT: "updateDocument",
    DROP: "drop",
    CREATE_PILE: "createPile",
    TRANSFER_ITEM: "transferItem",
    REMOVE_ITEM: "removeItem",
    ADD_ITEM: "addItem",
    TRANSFER_ALL_ITEMS: "transferAllItems",
};

export let itemPileSocket;

export function registerSocket() {
    lib.debug("Registered itemPileSocket");
    itemPileSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);
    itemPileSocket.register(SOCKET_HANDLERS.UPDATE_DOCUMENT, (...args) => API.updateDocument(...args))
    itemPileSocket.register(SOCKET_HANDLERS.DROP, (args) => API._handleDrop(args))
    itemPileSocket.register(SOCKET_HANDLERS.CREATE_PILE, (...args) => API._createPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ITEM, (...args) => API._transferItem(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REMOVE_ITEM, (...args) => API._removeItem(...args))
    itemPileSocket.register(SOCKET_HANDLERS.ADD_ITEM, (...args) => API._addItem(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, (...args) => API._transferAllItems(...args))
}
