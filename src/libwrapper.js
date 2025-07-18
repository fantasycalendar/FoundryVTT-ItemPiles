import CONSTANTS from "./constants/constants.js";
import PrivateAPI from "./API/private-api.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import * as Helpers from "./helpers/helpers.js";
import { hotkeyActionState } from "./hotkeys.js";
import { SYSTEMS } from "./systems.js";

export function registerLibwrappers() {

	libWrapper.register(CONSTANTS.MODULE_NAME, "CONFIG.Token.objectClass.prototype._onClickLeft2", function (wrapped, ...args) {
		if (PileUtilities.isValidItemPile(this.document) && hotkeyActionState.openPileInventory) {
			return PrivateAPI._itemPileClicked(this.document);
		}
		return wrapped(...args);
	}, "MIXED");

	const overrideMethod = CONSTANTS.IS_V13
		? `foundry.applications.sidebar.DocumentDirectory.prototype._onClickEntryName`
		: `DocumentDirectory.prototype._onClickEntryName`;

	libWrapper.register(CONSTANTS.MODULE_NAME, overrideMethod, function (wrapped, event) {
		event.preventDefault();
		const element = event.currentTarget;
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

	Hooks.on(CONSTANTS.HOOKS.PRE_RENDER_SHEET, (doc, forced, options) => {
		const renderItemPileInterface = forced && !options?.bypassItemPiles && PileUtilities.isValidItemPile(doc) && hotkeyActionState.openPileInventory;
		if (!renderItemPileInterface) return;
		game.itempiles.API.renderItemPileInterface(doc, { useDefaultCharacter: true });
		return false;
	})

	const actorSheetOverride = CONSTANTS.IS_V13
		? `foundry.applications.sheets.ActorSheet.prototype.render`
		: `ActorSheet.prototype.render`

	libWrapper.register(CONSTANTS.MODULE_NAME, actorSheetOverride, function (wrapped, forced, options, ...args) {
		const renderItemPileInterface = Hooks.call(CONSTANTS.HOOKS.PRE_RENDER_SHEET, this.document, forced, options) === false;
		if (this.state > Application.RENDER_STATES.NONE) {
			if (renderItemPileInterface) {
				wrapped(forced, options, ...args)
			} else {
				return wrapped(forced, options, ...args)
			}
		}
		if (renderItemPileInterface) return;
		return wrapped(forced, options, ...args);
	}, "MIXED");

	const dragDrop = CONSTANTS.IS_V13
		? "foundry.applications.ux.DragDrop.implementation"
		: "DragDrop.prototype.callback";

	libWrapper.register(CONSTANTS.MODULE_NAME, dragDrop, function (wrapped, event, type) {
		const result = wrapped(event, type)
		const hookType = {
			"dragstart": CONSTANTS.HOOKS.DRAG_DOCUMENT,
			"drop": CONSTANTS.HOOKS.DROP_DOCUMENT,
		}[type] ?? false;
		if (hookType) {
			try {
				const value = JSON.parse(event.dataTransfer.getData("text/plain"));
				Hooks.callAll(hookType, value);
			} catch (err) {
			}
		}
		return result;
	}, "WRAPPER");

}

export function registerSystemLibwrappers() {
	if (SYSTEMS.DATA.SHEET_OVERRIDES) {
		SYSTEMS.DATA.SHEET_OVERRIDES();
	}
}
