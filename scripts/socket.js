import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import API from "./api.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";

export const SOCKET_HANDLERS = {
    UPDATE_DOCUMENT: "updateDocument",
    DROP: "drop",
    TURN_INTO_PILE: "turnIntoPile",
    REVERT_FROM_PILE: "revertFromPile",
    CREATE_PILE: "createPile",
    TRANSFER_ITEM: "transferItem",
    REMOVE_ITEM: "removeItem",
    ADD_ITEM: "addItem",
    TRANSFER_ALL_ITEMS: "transferAllItems",
    RERENDER_PILE_INVENTORY: "rerenderPileInventory",
    QUERY_PILE_INVENTORY_OPEN: "queryPileInventoryOpen",
    RESPOND_PILE_INVENTORY_OPEN: "responsePileInventoryOpen",
    RERENDER_TOKEN_HUD: "rerenderTokenHud",
};

export let itemPileSocket;

export function registerSocket() {
    lib.debug("Registered itemPileSocket");
    itemPileSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);
    itemPileSocket.register(SOCKET_HANDLERS.UPDATE_DOCUMENT, (...args) => API.updateDocument(...args))
    itemPileSocket.register(SOCKET_HANDLERS.DROP, (args) => API._handleDrop(args))
    itemPileSocket.register(SOCKET_HANDLERS.TURN_INTO_PILE, (args) => API._turnTokenIntoItemPile(args))
    itemPileSocket.register(SOCKET_HANDLERS.REVERT_FROM_PILE, (args) => API._revertTokenFromItemPile(args))
    itemPileSocket.register(SOCKET_HANDLERS.CREATE_PILE, (...args) => API._createPile(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ITEM, (...args) => API._transferItem(...args))
    itemPileSocket.register(SOCKET_HANDLERS.REMOVE_ITEM, (...args) => API._removeItem(...args))
    itemPileSocket.register(SOCKET_HANDLERS.ADD_ITEM, (...args) => API._addItem(...args))
    itemPileSocket.register(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, (...args) => API._transferAllItems(...args))
    itemPileSocket.register(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, (...args) => API._rerenderPileInventoryApplication(...args))
    itemPileSocket.register(SOCKET_HANDLERS.QUERY_PILE_INVENTORY_OPEN, (...args) => isPileInventoryOpenForOthers.respond(...args))
    itemPileSocket.register(SOCKET_HANDLERS.RESPOND_PILE_INVENTORY_OPEN, (...args) => isPileInventoryOpenForOthers.handleResponse(...args))
    itemPileSocket.register(SOCKET_HANDLERS.RERENDER_TOKEN_HUD, (...args) => API._rerenderTokenHud(...args))
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

        itemPileSocket.executeForOthers(SOCKET_HANDLERS.QUERY_PILE_INVENTORY_OPEN, game.user.id, API.getUuid(inPile));

        setTimeout(this.resolve, 200);

        return promise;
    },

    async respond(inUserId, inPileUuid) {
        const pile = await API.getActor(inPileUuid);
        const app = ItemPileInventory.getActiveAppFromPile(pile);
        return itemPileSocket.executeAsUser(SOCKET_HANDLERS.RESPOND_PILE_INVENTORY_OPEN, inUserId, game.user.id, !!app);
    },

    handleResponse(inUserId, appOpen) {
        this.usersToRespond.delete(inUserId);
        this.isOpen = this.isOpen || appOpen;
        if(this.usersToRespond.size > 0) return;
        this.resolve(this.isOpen);
        this.usersToRespond = new Set();
        this.isOpen = false;
        this.resolve = () => {};
    }

}