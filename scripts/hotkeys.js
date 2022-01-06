import { getTokensAtLocation } from "./lib/lib.js";
import API from "./api.js";

export function registerHotkeys(){

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
            const tokens = getTokensAtLocation(pos);
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

}