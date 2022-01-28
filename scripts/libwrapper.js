import API from "./api.js";
import CONSTANTS from "./constants.js";
import { hotkeyState } from "./hotkeys.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";

export function registerLibwrappers() {

    libWrapper.register(CONSTANTS.MODULE_NAME, 'Token.prototype._onClickLeft2', function (wrapped, ...args) {
        if (API.isValidItemPile(this.document) && !hotkeyState.ctrlDown) {
            return API._itemPileClicked(this.document);
        }
        return wrapped(...args);
    });

    libWrapper.register(CONSTANTS.MODULE_NAME, 'SidebarDirectory.prototype._onClickDocumentName', function (wrapped, event) {

        event.preventDefault();
        const element = event.currentTarget;
        const documentId = element.parentElement.dataset.documentId;
        const document = this.constructor.collection.get(documentId);

        if (API.isValidItemPile(document) && !hotkeyState.ctrlDown) {
            return ItemPileInventory.show(document, game.user.character);
        }

        return wrapped(event);

    });

}
