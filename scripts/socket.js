import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import API from "./api.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";

export const SOCKET_HANDLERS = {
    /**
     * Generic sockets
     */
    CALL_HOOK: "callHook",

    /**
     * Item pile sockets
     */
    CREATE_PILE: "createItemPile",
    UPDATE_PILE: "updateItemPile",
    UPDATED_PILE: "updatedPile",
    DELETE_PILE: "deleteItemPile",
    TURN_INTO_PILE: "turnIntoPile",
    REVERT_FROM_PILE: "revertFromPile",
    REFRESH_PILE: "refreshItemPile",

    /**
     * UI sockets
     */
    RERENDER_TOKEN_HUD: "rerenderTokenHud",
    RERENDER_PILE_INVENTORY: "rerenderPileInventory",
    QUERY_PILE_INVENTORY_OPEN: "queryPileInventoryOpen",
    RESPOND_PILE_INVENTORY_OPEN: "responsePileInventoryOpen",

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
};

export let itemPileSocket;

export function registerSocket() {
    lib.debug("Registered itemPileSocket");
    itemPileSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);

    /**
     * Generic socket
     */
    itemPileSocket.register(SOCKET_HANDLERS.CALL_HOOK, (hook, ...args) => callHook(hook, ...args))

    /**
     * Item pile sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.CREATE_PILE, (...args) => API._createItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.UPDATE_PILE, (...args) => API._updateItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.UPDATED_PILE, (...args) => API._updatedItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.DELETE_PILE, (...args) => API._deleteItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TURN_INTO_PILE, (...args) => API._turnTokenIntoItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REVERT_FROM_PILE, (...args) => API._revertTokenFromItemPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REFRESH_PILE, (...args) => API._refreshItemPile(...args))

    /**
     * UI sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.RERENDER_TOKEN_HUD, (...args) => API._rerenderTokenHud(...args))
    itemPileSocket.register(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, (...args) => API._rerenderItemPileInventoryApplication(...args))
    itemPileSocket.register(SOCKET_HANDLERS.QUERY_PILE_INVENTORY_OPEN, (...args) => isPileInventoryOpenForOthers.respond(...args))
    itemPileSocket.register(SOCKET_HANDLERS.RESPOND_PILE_INVENTORY_OPEN, (...args) => isPileInventoryOpenForOthers.handleResponse(...args))

    /**
     * Item & attribute sockets
     */
    itemPileSocket.register(SOCKET_HANDLERS.DROP_ITEMS, (args) => API._dropItems(args))
    itemPileSocket.register(SOCKET_HANDLERS.ADD_ITEMS, (...args) => API._addItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REMOVE_ITEMS, (...args) => API._removeItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ITEMS, (...args) => API._transferItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, (...args) => API._transferAllItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.ADD_ATTRIBUTE, (...args) => API._addAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REMOVE_ATTRIBUTES, (...args) => API._removeAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ATTRIBUTES, (...args) => API._transferAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ALL_ATTRIBUTES, (...args) => API._transferAllAttributes(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_EVERYTHING, (...args) => API._transferEverything(...args))
}

async function callHook(inHookName, ...args) {
    return Hooks.callAll(inHookName, ...args);
}

export const isPileInventoryOpenForOthers = {

    query(inPile) {
        const promise = new Promise(resolve => {
            this.resolve = resolve;
        });

        this.usersToRespond = new Set(game.users
            .filter(user => user.active && user !== game.user)
            .map(user => user.id));
        this.isOpen = false;

        itemPileSocket.executeForOthers(SOCKET_HANDLERS.QUERY_PILE_INVENTORY_OPEN, game.user.id, lib.getUuid(inPile));

        setTimeout(this.resolve, 200);

        return promise;
    },

    async respond(inUserId, inPileUuid) {
        const app = ItemPileInventory.getActiveAppFromPile(inPileUuid);
        return itemPileSocket.executeAsUser(SOCKET_HANDLERS.RESPOND_PILE_INVENTORY_OPEN, inUserId, game.user.id, !!app);
    },

    handleResponse(inUserId, appOpen) {
        this.usersToRespond.delete(inUserId);
        this.isOpen = this.isOpen || appOpen;
        if (this.usersToRespond.size > 0) return;
        this.resolve(this.isOpen);
        this.usersToRespond = new Set();
        this.isOpen = false;
        this.resolve = () => {
        };
    }

}