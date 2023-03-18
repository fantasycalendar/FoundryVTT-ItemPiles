import CONSTANTS from "./constants/constants.js";
import { hotkeyActionState } from "./hotkeys.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import * as Helpers from "./helpers/helpers.js";

export default function registerLibwrappers() {

  libWrapper.register(CONSTANTS.MODULE_NAME, 'Token.prototype._onClickLeft2', function (wrapped, ...args) {
    return wrapped(...args);
  }, "MIXED");

  libWrapper.register(CONSTANTS.MODULE_NAME, `SidebarDirectory.prototype._onClickDocumentName`, function (wrapped, event) {
    event.preventDefault();
    const element = event.currentTarget;
    const documentId = element.parentElement.dataset.documentId;
    const document = this.constructor.collection.get(documentId);
    if (PileUtilities.isValidItemPile(document)) {
      const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_DIRECTORY_CLICK, document);
      if (hookResult === false) return false;
    }
    return wrapped(event);
  }, "MIXED");

  libWrapper.register(CONSTANTS.MODULE_NAME, `ActorSheet.prototype.render`, function (wrapped, forced, options) {
    if (PileUtilities.isValidItemPile(this.document) && hotkeyActionState.openPileInventory && !options?.bypassItemPiles) {
      game.itempiles.API.renderItemPileInterface(this.document, { useDefaultCharacter: true });
      return this;
    }
    return wrapped(forced);
  }, "MIXED");

}
