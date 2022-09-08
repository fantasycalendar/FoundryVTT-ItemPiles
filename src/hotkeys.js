import CONSTANTS from "./constants/constants.js";
import * as Utilities from "./helpers/utilities.js";
import PrivateAPI from "./API/private-api.js";

export const hotkeyActionState = {
  get openPileInventory() {
    return (!hotkeyState.ctrlDown && !game.settings.get(CONSTANTS.MODULE_NAME, "invertSheetOpen"))
      || (hotkeyState.ctrlDown && game.settings.get(CONSTANTS.MODULE_NAME, "invertSheetOpen"));
  }
}

export const hotkeyState = {
  ctrlDown: false,
  altDown: false,
  shiftDown: false
}

export function registerHotkeysPre() {
  
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