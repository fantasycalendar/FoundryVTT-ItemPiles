import CONSTANTS from "./constants/constants.js";
import { hotkeyActionState } from "./hotkeys.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import PrivateAPI from "./API/private-api.js";

export default function registerLibwrappers() {
  
  libWrapper.register(CONSTANTS.MODULE_NAME, 'Token.prototype._onClickLeft2', function (wrapped, ...args) {
    if (PileUtilities.isValidItemPile(this.document) && hotkeyActionState.openPileInventory) {
      return PrivateAPI._itemPileClicked(this.document);
    }
    return wrapped(...args);
  }, "MIXED");
  
  libWrapper.register(CONSTANTS.MODULE_NAME, `SidebarDirectory.prototype._onClickDocumentName`, function (wrapped, event) {
    
    event.preventDefault();
    const element = event.currentTarget;
    const documentId = element.parentElement.dataset.documentId;
    const document = this.constructor.collection.get(documentId);
    
    if (PileUtilities.isValidItemPile(document) && hotkeyActionState.openPileInventory) {
      return game.itempiles.API.renderItemPileInterface(document, { useDefaultCharacter: true });
    }
    return wrapped(event);
  }, "MIXED");
  
}
