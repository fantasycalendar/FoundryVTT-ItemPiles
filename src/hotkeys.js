import CONSTANTS from "./constants/constants.js";
import * as Utilities from "./helpers/utilities.js";
import PrivateAPI from "./API/private-api.js";
import * as Helpers from "./helpers/helpers.js";

export const HOTKEYS = {
	FORCE_DEFAULT_SHEET: "force-open-item-pile-inventory",
	DROP: "force-drop-item",
	DROP_ONE: "force-drop-one-item",
	ROTATE_VAULT_ITEM: "rotate-vault-item",
}

export const hotkeyActionState = {
	get openPileInventory() {
		const down = game.keybindings.get(CONSTANTS.MODULE_NAME, HOTKEYS.FORCE_DEFAULT_SHEET).some(keybind => {
			return game.keyboard.downKeys.has(keybind?.key);
		});
		return (
			(!down && !game.settings.get(CONSTANTS.MODULE_NAME, "invertSheetOpen"))
			||
			(down && game.settings.get(CONSTANTS.MODULE_NAME, "invertSheetOpen"))
		);
	},

	get forceDropItem() {
		return game.keybindings.get(CONSTANTS.MODULE_NAME, HOTKEYS.DROP).some(key => {
			return game.keyboard.downKeys.has(key);
		});
	},

	get forceDropOneItem() {
		return game.keybindings.get(CONSTANTS.MODULE_NAME, HOTKEYS.DROP).some(key => {
			return game.keyboard.downKeys.has(key);
		});
	},

	shouldRotateVaultItem(event) {
		return game.keybindings.get(CONSTANTS.MODULE_NAME, HOTKEYS.ROTATE_VAULT_ITEM).some(data => {
			return data.key === event.key && (!data.modifiers.length || data.modifiers.some(modifier => {
				return game.keyboard.downKeys.has(modifier);
			}));
		})
	}
}

export function registerHotkeysPre() {

	game.keybindings.register(CONSTANTS.MODULE_NAME, HOTKEYS.FORCE_DEFAULT_SHEET, {
		name: "Force open inventory modifier",
		editable: [
			{ key: "ControlLeft" },
		]
	});

	game.keybindings.register(CONSTANTS.MODULE_NAME, HOTKEYS.DROP, {
		name: "Force drop item (GM only) modifier",
		editable: [
			{ key: "ShiftLeft" },
		]
	});

	game.keybindings.register(CONSTANTS.MODULE_NAME, HOTKEYS.DROP_ONE, {
		name: "Force drop one item modifier",
		editable: [
			{ key: "AltLeft" },
		]
	});

	game.keybindings.register(CONSTANTS.MODULE_NAME, HOTKEYS.ROTATE_VAULT_ITEM, {
		name: "Rotate vault item",
		editable: [
			{ key: "r" },
		]
	});

}

export function registerHotkeysPost() {

	if (!game.user.isGM) {
		let clicked = false;
		window.addEventListener("mousedown", (event) => {
			if (!canvas.ready) return;
			if (!(canvas.activeLayer instanceof TokenLayer)) return;
			if (game.activeTool !== "select") return;
			const hover = document.elementFromPoint(event.clientX, event.clientY);
			if (!hover || (hover.id !== "board")) return;
			if (event.button !== 0) return;

			const pos = Helpers.getCanvasMouse().getLocalPosition(canvas.app.stage);
			const tokens = Utilities.getTokensAtLocation(pos)
				.filter(token => {
					const canView = token._canView(game.user);
					const canSee = token.visible || game.user.isGM;
					return !canView && canSee;
				});
			if (!tokens.length) return;
			tokens.sort((a, b) => b.zIndex - a.zIndex);
			const token = Utilities.getDocument(tokens[0]);

			if (clicked === token) {
				clicked = false;
				return PrivateAPI._itemPileClicked(token);
			}

			clicked = token;
			setTimeout(() => {
				clicked = false;
			}, 500);
		});
	}
}
