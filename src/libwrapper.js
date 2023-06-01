import CONSTANTS from "./constants/constants.js";
import PrivateAPI from "./API/private-api.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import * as Helpers from "./helpers/helpers.js";
import { hotkeyActionState } from "./hotkeys.js";

export default function registerLibwrappers() {

  libWrapper.register(CONSTANTS.MODULE_NAME, 'Token.prototype._onClickLeft2', function (wrapped, ...args) {
    if (PileUtilities.isValidItemPile(this.document) && hotkeyActionState.openPileInventory) {
      return PrivateAPI._itemPileClicked(this.document);
    }
    return wrapped(...args);
  }, "MIXED");

  const versionIsEleven = foundry.utils.isNewerVersion(game.version, "10.999");

  const overrideMethod = versionIsEleven
    ? `DocumentDirectory.prototype._onClickEntryName`
    : `SidebarDirectory.prototype._onClickDocumentName`;

  libWrapper.register(CONSTANTS.MODULE_NAME, overrideMethod, function (wrapped, event) {
    event.preventDefault();
    if (!(this instanceof Compendium)) {
      const documentId = element.parentElement.dataset.documentId;
      const document = this.constructor.collection.get(documentId);
      if (PileUtilities.isValidItemPile(document)) {
        const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_DIRECTORY_CLICK, document);
        if (hookResult === false) return false;
      }
    }
    return wrapped(event);
  }, "MIXED");

  libWrapper.register(CONSTANTS.MODULE_NAME, `ActorSheet.prototype.render`, function (wrapped, forced, options, ...args) {
    const renderItemPileInterface = forced && !options?.bypassItemPiles && PileUtilities.isValidItemPile(this.document) && hotkeyActionState.openPileInventory;
    if (this._state > Application.RENDER_STATES.NONE) {
      if (renderItemPileInterface) {
        wrapped(forced, options, ...args)
      } else {
        return wrapped(forced, options, ...args)
      }
    }
    if (renderItemPileInterface) {
      game.itempiles.API.renderItemPileInterface(this.document, { useDefaultCharacter: true });
      return;
    }
    return wrapped(forced, options, ...args);
  }, "MIXED");

}
