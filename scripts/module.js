import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js"
import registerSettings from "./settings.js";
import { itemPileSocket, registerSocket, SOCKET_HANDLERS } from "./socket.js";
import API from "./api.js";
import { ItemPileConfig } from "./formapplications/itemPileConfig.js";
import ItemPile from "./itemPile.js";
import DropDialog from "./formapplications/dropDialog.js";

export const managedPiles = new Map();
export const preloadedImages = new Set();

Hooks.once("init", () => {

    registerSettings();

    Hooks.once("socketlib.ready", registerSocket);
    Hooks.on("dropCanvasData", module._dropCanvasData);
    Hooks.on("canvasReady", module._canvasReady);
    Hooks.on("createToken", module._createPile);
    Hooks.on("updateToken", module._updatePile);
    Hooks.on("deleteToken", module._deletePile);
    Hooks.on("createItem", module._pileInventoryChanged);
    Hooks.on("deleteItem", module._pileInventoryChanged);
    Hooks.on("getActorSheetHeaderButtons", module._insertItemPileHeaderButtons);
    Hooks.on("renderTokenHUD", module._renderPileHUD);

});

const module = {

    _pileInventoryChanged(item) {
        if (!item.parent?.token) return;
        API.updatePile(item.parent);
    },

    _renderPileHUD(app, html, data) {

        const document = app?.object?.document;
        const pile = managedPiles.get(document?.uuid);

        if (!document || !pile || !document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled) return;

        const container = $(`<div class="col right" style="right:-130px;"></div>`);

        if (pile.isContainer) {

            const lock_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleLocked")}"><i class="fas fa-lock${pile.isLocked ? "" : "-open"}"></i></div>`);

            lock_button.click(async function () {
                $(this).find('.fas').toggleClass('fa-lock').toggleClass('fa-lock-open');
                await pile.toggleLocked();
            });

            container.append(lock_button);

            const open_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleClosed")}"><i class="fas fa-box${pile.isClosed ? "" : "-open"}"></i></div>`);

            open_button.click(async function () {
                $(this).find('.fas').toggleClass('fa-box').toggleClass('fa-box-open');
                await pile.toggleClosed();
            });

            container.append(open_button);
        }

        const configure_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.Configure")}"><i class="fas fa-toolbox"></i></div>`);

        configure_button.click(async function () {
            new ItemPileConfig(document).render(true);
        });

        container.append(configure_button);

        html.append(container)

    },

    _insertItemPileHeaderButtons(actorSheet, buttons) {

        let obj = actorSheet.object;

        buttons.unshift({
            label: "ITEM-PILES.Defaults.Configure",
            icon: "fas fa-box-open",
            class: "item-piles-config",
            onclick: () => {
                new ItemPileConfig(obj).render(true);
            }
        })
    },

    async _dropCanvasData(canvas, data) {

        return API.dropData(canvas, data);

    },

    _canvasReady() {
        managedPiles.forEach((pile) => pile._disableEvents());
        managedPiles.clear();
        const tokens = canvas.tokens.placeables.filter((token) => token.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled);
        const piles = tokens.map(token => ItemPile.make(token.document));
        if(game.user.isGM){
            piles.forEach(pile => pile.update());
        }
    },

    _createPile(doc) {
        if (!doc.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled) return;
        ItemPile.make(doc);
    },

    _updatePile(doc) {
        const pile = managedPiles.get(doc.uuid);
        if (!pile) return;
        pile.updated();
    },

    _deletePile(doc) {
        const pile = managedPiles.get(doc.uuid);
        if (!pile) return;
        pile.remove();
    }
}
