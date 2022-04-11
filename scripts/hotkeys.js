import API from "./api.js";
import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";

export const hotkeyActionState = {
    get openPileInventory() {
        return (!hotkeyState.ctrlDown && !game.settings.get(CONSTANTS.MODULE_NAME, "invertSheetOpen")) || (hotkeyState.ctrlDown && game.settings.get(CONSTANTS.MODULE_NAME, "invertSheetOpen"));
    }
}

export const hotkeyState = {
    ctrlDown: false,
    altDown: false,
    shiftDown: false
}

export function registerHotkeysPre() {

    if (lib.isVersion9()) {

        game.keybindings.register(CONSTANTS.MODULE_NAME, "force-open-item-pile-inventory", {
            name: "Force open inventory",
            uneditable: [
                { key: "ControlLeft" },
            ],
            onDown: () => {
                hotkeyState.ctrlDown = true;
            },
            onUp: () => {
                hotkeyState.ctrlDown = false;
            },
            reservedModifiers: ["SHIFT", "ALT"]
        });

        game.keybindings.register(CONSTANTS.MODULE_NAME, "force-drop-item", {
            name: "Force drop item (GM only)",
            uneditable: [
                { key: "ShiftLeft" },
            ],
            onDown: () => {
                hotkeyState.shiftDown = true;
            },
            onUp: () => {
                hotkeyState.shiftDown = false;
            },
            reservedModifiers: ["ALT", "CONTROL"]
        });

        game.keybindings.register(CONSTANTS.MODULE_NAME, "force-drop-one-item", {
            name: "Force drop one item",
            uneditable: [
                { key: "AltLeft" },
            ],
            onDown: () => {
                hotkeyState.altDown = true;
            },
            onUp: () => {
                hotkeyState.altDown = false;
            },
            reservedModifiers: ["SHIFT", "CONTROL"]
        });

    }

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

            const pos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage);
            const tokens = lib.getTokensAtLocation(pos)
                .filter(token => {
                    const canView = token._canView(game.user);
                    const canSee = !token.data.hidden || game.user.isGM;
                    return !canView && canSee;
                });
            if (!tokens.length) return;
            tokens.sort((a, b) => b.zIndex - a.zIndex);
            const token = tokens[0].document;

            if (clicked === token) {
                clicked = false;
                return API._itemPileClicked(token);
            }

            clicked = token;
            setTimeout(() => {
                clicked = false;
            }, 500);
        });
    }

    if (!lib.isVersion9()) {

        window.addEventListener("keydown", (event) => {
            switch (event.code) {
                case "ControlLeft":
                    hotkeyState.ctrlDown = true;
                    break;
                case "ShiftLeft":
                    hotkeyState.shiftDown = true;
                    break;
                case "AltLeft":
                    hotkeyState.altDown = true;
                    break;
            }
        });

        window.addEventListener("keyup", (event) => {
            switch (event.code) {
                case "ControlLeft":
                    hotkeyState.ctrlDown = false;
                    break;
                case "ShiftLeft":
                    hotkeyState.shiftDown = false;
                    break;
                case "AltLeft":
                    hotkeyState.altDown = false;
                    break;
            }
        });

    }

}