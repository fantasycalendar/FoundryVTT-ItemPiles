import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import API from "./api.js";

export const SOCKET_HANDLERS = {
    UPDATE_DOCUMENT: "updateDocument",
    DROP: "drop",
};

export let itemPileSocket;

export function registerSocket() {
    lib.debug("Registered itemPileSocket");
    itemPileSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);
    itemPileSocket.register(SOCKET_HANDLERS.UPDATE_DOCUMENT, (...args) => API.updateDocument(...args))
    itemPileSocket.register(SOCKET_HANDLERS.DROP, (args) => API.handleDrop(args))
}
