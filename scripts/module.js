import CONSTANTS from "./constants.js";
import registerSettings from "./settings.js";
import { registerSocket } from "./socket.js";
import API from "./api.js";
import * as lib from "./lib/lib.js";
import { ItemPileConfig } from "./formapplications/itemPileConfig.js";
import { registerLibwrappers } from "./libwrapper.js";

Hooks.once("init", () => {

    registerSettings();
    registerLibwrappers();

    Hooks.once("socketlib.ready", registerSocket);
    Hooks.on("canvasReady", module._canvasReady);
    Hooks.on("createToken", module._createPile);
    Hooks.on("deleteToken", module._deletePile);
    Hooks.on("dropCanvasData", module._dropCanvasData);
    Hooks.on("createItem", module._pileInventoryChanged);
    Hooks.on("deleteItem", module._pileInventoryChanged);
    Hooks.on("getActorSheetHeaderButtons", module._insertItemPileHeaderButtons);
    Hooks.on("renderTokenHUD", module._renderPileHUD);

    Hooks.on("preCreateItemPile", (...args) => console.log("preCreateItemPile", ...args));
    Hooks.on("createItemPile", (...args) => console.log("createItemPile", ...args));

    Hooks.on("preUpdateItemPile", (...args) => console.log("preUpdateItemPile", ...args));
    Hooks.on("updateItemPile", (...args) => console.log("updateItemPile", ...args));

    Hooks.on("preDeleteItemPile", (...args) => console.log("preDeleteItemPile", ...args));
    Hooks.on("deleteItemPile", (...args) => console.log("deleteItemPile", ...args));

    Hooks.on("closeItemPile", (...args) => console.log("closeItemPile", ...args));
    Hooks.on("lockItemPile", (...args) => console.log("lockItemPile", ...args));
    Hooks.on("unlockItemPile", (...args) => console.log("unlockItemPile", ...args));
    Hooks.on("openItemPile", (...args) => console.log("openItemPile", ...args));

    window.ItemPiles = {
        API
    }

});

Hooks.once("ready", () => {
    if(!game.modules.get('lib-wrapper')?.active && game.user.isGM){
        throw lib.custom_error("Item Piles requires the 'libWrapper' module. Please install and activate it.")
    }
    Hooks.callAll("itemPilesReady");
})

const module = {

    async _pileInventoryChanged(item) {
        if (!item?.parent?.token) return;
        return API.refreshPile(item.parent.token);
    },

    async _canvasReady(canvas) {
        for(const token of canvas.tokens.placeables){
            await API._initializePile(token.document);
        }
    },

    async _createPile(doc) {
        if(!API.isValidPile(doc)) return;
        Hooks.callAll("createItemPile", doc, API._getFreshFlags(doc));
        return API._initializePile(doc);
    },

    async _deletePile(doc){
        if(!API.isValidPile(doc)) return;
        Hooks.callAll("deleteItemPile", doc);
        return API._rerenderPileInventoryApplication(doc.uuid, true);
    },

    _renderPileHUD(app, html) {

        const document = app?.object?.document;

        const pileData = document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);

        if (!document || !pileData?.enabled) return;

        const container = $(`<div class="col right" style="right:-130px;"></div>`);

        if (pileData.isContainer) {

            const lock_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleLocked")}"><i class="fas fa-lock${pileData.locked ? "" : "-open"}"></i></div>`);

            lock_button.click(async function () {
                $(this).find('.fas').toggleClass('fa-lock').toggleClass('fa-lock-open');
                await API.togglePileLocked(document);
            });

            container.append(lock_button);

            const open_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleClosed")}"><i class="fas fa-box${pileData.closed ? "" : "-open"}"></i></div>`);

            open_button.click(async function () {
                $(this).find('.fas').toggleClass('fa-box').toggleClass('fa-box-open');
                await API.togglePileClosed(document);
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
}
