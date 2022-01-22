import CONSTANTS from "./constants.js";
import HOOKS from "./hooks.js";

import chatHandler from "./chathandler.js";
import API from "./api.js";
import * as lib from "./lib/lib.js";

import { ItemPileConfig } from "./formapplications/itemPileConfig.js";
import { registerSettings, checkSystem, migrateSettings, registerHandlebarHelpers } from "./settings.js";
import { registerSocket } from "./socket.js";
import { registerLibwrappers } from "./libwrapper.js";
import { registerHotkeysPre, registerHotkeysPost } from "./hotkeys.js";

Hooks.once("init", () => {

    registerSettings();
    registerLibwrappers();
    registerHotkeysPre();

    Hooks.once("socketlib.ready", registerSocket);
    Hooks.on("canvasReady", module._canvasReady);
    Hooks.on("createToken", module._createPile);
    Hooks.on("deleteToken", module._deletePile);
    Hooks.on("dropCanvasData", module._dropCanvasData);
    Hooks.on("updateActor", module._pileAttributeChanged);
    Hooks.on("createItem", module._pileInventoryChanged);
    Hooks.on("updateItem", module._pileInventoryChanged);
    Hooks.on("deleteItem", module._pileInventoryChanged);
    Hooks.on("getActorSheetHeaderButtons", module._insertItemPileHeaderButtons);
    Hooks.on("renderTokenHUD", module._renderPileHUD);

    Hooks.on(HOOKS.ITEM.TRANSFER, chatHandler._outputTransferItem.bind(chatHandler));
    Hooks.on(HOOKS.ATTRIBUTE.TRANSFER, chatHandler._outputTransferAttribute.bind(chatHandler));
    Hooks.on(HOOKS.TRANSFER_EVERYTHING, chatHandler._outputTransferEverything.bind(chatHandler));

    if (game.settings.get(CONSTANTS.MODULE_NAME, "debugHooks")) {
        for (let hook of Object.values(HOOKS)) {
            if (typeof hook === "string") {
                Hooks.on(hook, (...args) => lib.debug(`Hook called: ${hook}`, ...args));
                lib.debug(`Registered hook: ${hook}`)
            } else {
                for (let innerHook of Object.values(hook)) {
                    Hooks.on(innerHook, (...args) => lib.debug(`Hook called: ${innerHook}`, ...args));
                    lib.debug(`Registered hook: ${innerHook}`)
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
        let word = "install and activate";
        if(game.modules.get('lib-wrapper')) word = "activate";
        throw lib.custom_error(`Item Piles requires the 'libWrapper' module. Please ${word} it.`)
    }
    if (!game.modules.get('socketlib')?.active && game.user.isGM) {
        let word = "install and activate";
        if(game.modules.get('socketlib')) word = "activate";
        throw lib.custom_error(`Item Piles requires the 'socketlib' module. Please ${word} it.`)
    }

    if (!lib.isGMConnected()){
        lib.custom_warning(`Item Piles requires a GM to be connected for players to be able to loot item piles.`, true)
    }

    checkSystem();
    registerHotkeysPost();
    registerHandlebarHelpers();
    migrateSettings();
    Hooks.callAll(HOOKS.READY);
});

const debounceManager = {

    debounces: {},

    setDebounce(id, method){
        if(this.debounces[id]){
            return this.debounces[id];
        }
        this.debounces[id] = debounce(function(...args){
            delete debounceManager.debounces[id];
            return method(...args);
        }, 50);
        return this.debounces[id];
    }
};

const module = {

    async _pileAttributeChanged(actor, changes) {
        const target = actor?.token ?? actor;
        if (!lib.isValidItemPile(target)) return;
        const sourceAttributes = lib.getItemPileAttributeList(target);
        const validProperty = sourceAttributes.find(attribute => {
            return hasProperty(changes, attribute.path);
        });
        if (!validProperty) return;
        const targetUuid = target.uuid;
        return debounceManager.setDebounce(targetUuid, async function(uuid){
            const deleted = await API._checkItemPileShouldBeDeleted(uuid);
            await API._rerenderItemPileInventoryApplication(uuid, deleted);
            if (deleted || !lib.isResponsibleGM()) return;
            return API._refreshItemPile(uuid);
        })(targetUuid);
    },

    async _pileInventoryChanged(item) {
        let target = item?.parent;
        if (!target) return;
        target = target?.token ?? target;
        if (!lib.isValidItemPile(target)) return;
        const targetUuid = target.uuid;
        return debounceManager.setDebounce(targetUuid, async function(uuid){
            const deleted = await API._checkItemPileShouldBeDeleted(uuid);
            await API._rerenderItemPileInventoryApplication(uuid, deleted);
            if (deleted || !lib.isResponsibleGM()) return;
            return API._refreshItemPile(uuid);
        })(targetUuid);
    },

    async _canvasReady(canvas) {
        const tokens = [...canvas.tokens.placeables].map(token => token.document);
        for (const doc of tokens) {
            await API._initializeItemPile(doc);
            if(lib.isResponsibleGM()) {
                await API._refreshItemPile(doc.uuid);
            }
        }
    },

    async _createPile(tokenDoc) {
        if (!lib.isValidItemPile(tokenDoc)) return;
        const itemPileConfig = lib.getItemPileData(tokenDoc.actor)
        Hooks.callAll(HOOKS.PILE.CREATE, tokenDoc, itemPileConfig);
        await tokenDoc.update({
            "img": lib.getItemPileTokenImage(tokenDoc, itemPileConfig),
            "scale": lib.getItemPileTokenScale(tokenDoc, itemPileConfig),
            "name": lib.getItemPileName(tokenDoc, itemPileConfig),
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: itemPileConfig
        });
        await API._initializeItemPile(tokenDoc);
    },

    async _deletePile(doc) {
        if (!lib.isValidItemPile(doc)) return;
        Hooks.callAll(HOOKS.PILE.DELETE, doc);
        return API._rerenderItemPileInventoryApplication(doc.uuid, true);
    },

    _renderPileHUD(app, html) {

        const document = app?.object?.document;

        if (!document) return;

        if(!lib.isValidItemPile(document)) return;

        const pileData = lib.getItemPileData(document);

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

        if(!game.user.isGM) return;

        let obj = actorSheet.object;

        buttons.unshift({
            label: game.settings.get(CONSTANTS.MODULE_NAME, "hideActorHeaderText") ? "" : "ITEM-PILES.Defaults.Configure",
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