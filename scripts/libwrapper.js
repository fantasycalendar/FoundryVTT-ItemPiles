import API from "./api.js";
import CONSTANTS from "./constants.js";
import { hotkeyActionState } from "./hotkeys.js";
import * as lib from "./lib/lib.js";
import { ItemPileInventory } from "./formapplications/item-pile-inventory.js";

export function registerLibwrappers() {

    libWrapper.register(CONSTANTS.MODULE_NAME, 'Token.prototype._onClickLeft2', function (wrapped, ...args) {
        if (API.isValidItemPile(this.document) && hotkeyActionState.openPileInventory) {
            return API._itemPileClicked(this.document);
        }
        return wrapped(...args);
    });

    const actorSidebarMethodName = lib.isVersion9() ? "_onClickDocumentName" : "_onClickEntityName";

    libWrapper.register(CONSTANTS.MODULE_NAME, `SidebarDirectory.prototype.${actorSidebarMethodName}`, function (wrapped, event) {

        event.preventDefault();
        const element = event.currentTarget;
        const documentId = element.parentElement.dataset.documentId;
        const document = this.constructor.collection.get(documentId);

        if (API.isValidItemPile(document) && hotkeyActionState.openPileInventory) {
            return ItemPileInventory.show(document, game.user.character);
        }

        return wrapped(event);

    });

}
