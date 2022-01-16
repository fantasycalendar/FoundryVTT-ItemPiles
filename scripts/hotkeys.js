import API from "./api.js";
import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";

export const hotkeyState = {
    ctrlDown: false
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
            reservedModifiers: ["SHIFT"]
        });

    }

}

export function registerHotkeysPost() {

    if(!game.user.isGM) {
        let clicked = false;
        window.addEventListener("mousedown", (event) => {
            if (!canvas.ready) return;
            if (!(canvas.activeLayer instanceof TokenLayer)) return;
            if (game.activeTool !== "select") return;
            const hover = document.elementFromPoint(event.clientX, event.clientY);
            if (!hover || (hover.id !== "board")) return;
            if (event.button !== 0) return;

            const pos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage);
            const tokens = lib.getTokensAtLocation(pos);
            if(!tokens.length) return;
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
            switch(event.code){
                case "ControlLeft":
                    hotkeyState.ctrlDown = true;
                    break;
            }
        });

        window.addEventListener("keyup", (event) => {
            switch(event.code){
                case "ControlLeft":
                    hotkeyState.ctrlDown = false;
                    break;
            }
        });

    }

}