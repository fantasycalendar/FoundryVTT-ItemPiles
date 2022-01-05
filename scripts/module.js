import CONSTANTS from "./constants.js";
import registerSettings from "./settings.js";
import { registerSocket } from "./socket.js";
import API from "./api.js";
import * as lib from "./lib/lib.js";
import { ItemPileConfig } from "./formapplications/itemPileConfig.js";
import { registerLibwrappers } from "./libwrapper.js";
import { HOOKS } from "./hooks.js";

Hooks.once("init", () => {

    registerSettings();
    registerLibwrappers();

    Hooks.once("socketlib.ready", registerSocket);
    Hooks.on("canvasReady", module._canvasReady);
    Hooks.on("createToken", module._createPile);
    Hooks.on("deleteToken", module._deletePile);
    Hooks.on("dropCanvasData", module._dropCanvasData);
    Hooks.on("updateActor", module._pileAttributeChanged);
    Hooks.on("createItem", module._pileInventoryChanged);
    Hooks.on("deleteItem", module._pileInventoryChanged);
    Hooks.on("getActorSheetHeaderButtons", module._insertItemPileHeaderButtons);
    Hooks.on("renderTokenHUD", module._renderPileHUD);

    if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) {
        for (let hook of Object.values(HOOKS)) {
            if (typeof hook === "string") {
                Hooks.on(hook, (...args) => lib.debug(hook, ...args));
                lib.debug(hook)
            } else {
                for (let innerHook of Object.values(hook)) {
                    Hooks.on(innerHook, (...args) => lib.debug(innerHook, ...args));
                    lib.debug(innerHook)
                }
            }
        }
    }

    window.ItemPiles = {
        API
    }

});

Hooks.once("ready", () => {
    if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
        throw lib.custom_error("Item Piles requires the 'libWrapper' module. Please install and activate it.")
    }
    Hooks.callAll(HOOKS.READY);
    //new ItemPileAttributeEditor().render(true)
})

const module = {

    async _pileAttributeChanged(actor, changes) {
        const target = actor?.token ?? actor;
        if (!API.isValidItemPile(target)) return;
        const validProperty = API.DYNAMIC_ATTRIBUTES.find(attribute => {
            return hasProperty(changes, attribute.path);
        });
        if (!validProperty) return;
        await API._rerenderItemPileInventoryApplication(target.uuid);
        return API.refreshItemPile(target);
    },

    _pileInventoryChanged: debounce(async (item) => {
        const target = item?.parent;
        if (!target) return;
        if (!API.isValidItemPile(target)) return;
        const deleted = await API._checkItemPileShouldBeDeleted(target.uuid);
        if (deleted) {
            return API.deleteItemPile(target);
        }
        await API._rerenderItemPileInventoryApplication(target.uuid);
        return API.refreshItemPile(target);
    }, 100),

    async _canvasReady(canvas) {
        for (const token of canvas.tokens.placeables) {
            await API._initializeItemPile(token.document);
        }
    },

    async _createPile(doc) {
        if (!API.isValidItemPile(doc)) return;
        Hooks.callAll(HOOKS.PILE.CREATE, doc, API._getFreshFlags(doc));
        return API._initializeItemPile(doc);
    },

    async _deletePile(doc) {
        if (!API.isValidItemPile(doc)) return;
        Hooks.callAll(HOOKS.PILE.DELETE, doc);
        return API._rerenderItemPileInventoryApplication(doc.uuid, true);
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
                await API.toggleItemPileLocked(document);
            });

            container.append(lock_button);

            const open_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleClosed")}"><i class="fas fa-box${pileData.closed ? "" : "-open"}"></i></div>`);

            open_button.click(async function () {
                $(this).find('.fas').toggleClass('fa-box').toggleClass('fa-box-open');
                await API.toggleItemPileClosed(document);
            });

            container.append(open_button);
        }

        const configure_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.Configure")}"><i class="fas fa-toolbox"></i></div>`);

        configure_button.click(async function () {
            ItemPileConfig.show(document);
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
                ItemPileConfig.show(obj);
            }
        })
    },

    async _dropCanvasData(canvas, data) {
        return API._dropDataOnCanvas(canvas, data);
    },
}
