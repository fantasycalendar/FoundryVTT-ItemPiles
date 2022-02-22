import CONSTANTS from "./constants.js";
import HOOKS from "./hooks.js";

import flagManager from "./flagManager.js";
import chatHandler from "./chathandler.js";
import API from "./api.js";
import * as lib from "./lib/lib.js";
import { getActorCurrencies, getActorItems } from "./lib/lib.js";

import { ItemPileConfig } from "./formapplications/item-pile-config.js";
import { checkSystem, migrateSettings, registerHandlebarHelpers, registerSettings } from "./settings.js";
import { registerSocket } from "./socket.js";
import { registerLibwrappers } from "./libwrapper.js";
import { registerHotkeysPost, registerHotkeysPre } from "./hotkeys.js";
import { TradeAPI } from "./trade-api.js";

Hooks.once("init", async () => {

    registerSettings();
    registerLibwrappers();
    registerHotkeysPre();

    Hooks.once("socketlib.ready", registerSocket);
    Hooks.on("canvasReady", module._canvasReady);
    Hooks.on("preCreateToken", module._preCreatePile);
    Hooks.on("createToken", module._createPile);
    Hooks.on("deleteToken", module._deletePile);
    Hooks.on("dropCanvasData", module._dropData);
    Hooks.on("updateActor", module._pileCurrencyChanged);
    Hooks.on("createItem", module._pileInventoryChanged);
    Hooks.on("updateItem", module._pileInventoryChanged);
    Hooks.on("deleteItem", module._pileInventoryChanged);
    Hooks.on("getActorSheetHeaderButtons", module._insertItemPileHeaderButtons);
    Hooks.on("getActorDirectoryEntryContext", module._handleActorContextMenu);
    Hooks.on("renderTokenHUD", module._renderPileHUD);

    chatHandler.init();

    if (game.settings.get(CONSTANTS.MODULE_NAME, "enableTrading") && game.settings.get(CONSTANTS.MODULE_NAME, "showTradeButton")) {
        Hooks.on("renderPlayerList", (app, html) => {
            const minimalUI = game.modules.get('minimal-ui')?.active;
            const classes = "item-piles-player-list-trade-button" + (minimalUI ? " item-piles-minimal-ui" : "")
            const text = !minimalUI ? " Request Trade" : ""
            const button = $(`<button type="button" class="${classes}"><i class="fas fa-handshake"></i>${text}</button>`)
            button.click(() => {
                TradeAPI.requestTrade();
            });
            html.append(button);
        })
    }

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

Hooks.once("ready", async () => {

    if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
        let word = "install and activate";
        if (game.modules.get('lib-wrapper')) word = "activate";
        throw lib.custom_error(`Item Piles requires the 'libWrapper' module. Please ${word} it.`)
    }
    if (!game.modules.get('socketlib')?.active && game.user.isGM) {
        let word = "install and activate";
        if (game.modules.get('socketlib')) word = "activate";
        throw lib.custom_error(`Item Piles requires the 'socketlib' module. Please ${word} it.`)
    }

    if (!lib.isGMConnected()) {
        lib.custom_warning(`Item Piles requires a GM to be connected for players to be able to loot item piles.`, true)
    }

    await flagManager.migrateDocuments();

    checkSystem();
    registerHotkeysPost();
    registerHandlebarHelpers();
    migrateSettings();
    Hooks.callAll(HOOKS.READY);

});

const debounceManager = {

    debounces: {},

    setDebounce(id, method) {
        if (this.debounces[id]) {
            return this.debounces[id];
        }
        this.debounces[id] = debounce(function (...args) {
            delete debounceManager.debounces[id];
            return method(...args);
        }, 50);
        return this.debounces[id];
    }
};

const module = {

    async _pileCurrencyChanged(actor, changes) {
        const target = actor?.token ?? actor;
        if (!lib.isValidItemPile(target)) return;
        const sourceCurrencies = lib.getActorCurrencyList(target);
        const validCurrency = sourceCurrencies.find(currency => {
            return hasProperty(changes, currency.path);
        });
        if (!validCurrency) return;
        const targetUuid = target.uuid;
        return debounceManager.setDebounce(targetUuid, async function (uuid) {
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
        return debounceManager.setDebounce(targetUuid, async function (uuid) {
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
        }
    },

    async _preCreatePile(document) {
        if (!document.isLinked) {
            document.data.update({
                [`actorData.flags.${CONSTANTS.MODULE_NAME}.-=${CONSTANTS.SHARING_DATA}`]: null
            });
        }
    },

    async _createPile(tokenDoc) {
        if (!lib.isResponsibleGM()) return;
        if (!lib.isValidItemPile(tokenDoc)) return;
        setTimeout(async () => {
            const itemPileConfig = lib.getItemPileData(tokenDoc.actor)
            Hooks.callAll(HOOKS.PILE.CREATE, tokenDoc, itemPileConfig);

            const targetItems = getActorItems(tokenDoc.actor);
            const targetCurrencies = getActorCurrencies(tokenDoc.actor);
            const data = { data: itemPileConfig, items: targetItems, currencies: targetCurrencies };

            await tokenDoc.update({
                "img": lib.getItemPileTokenImage(tokenDoc, data),
                "scale": lib.getItemPileTokenScale(tokenDoc, data),
                "name": lib.getItemPileName(tokenDoc, data),
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: itemPileConfig
            });
            await API._initializeItemPile(tokenDoc);
        }, 50)
    },

    async _deletePile(doc) {
        if (!lib.isValidItemPile(doc)) return;
        Hooks.callAll(HOOKS.PILE.DELETE, doc);
        return API._rerenderItemPileInventoryApplication(doc.uuid, true);
    },

    _renderPileHUD(app, html) {

        const document = app?.object?.document;

        if (!document) return;

        if (!lib.isValidItemPile(document)) return;

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

        if (!game.user.isGM) return;

        let obj = actorSheet.object;

        buttons.unshift({
            label: game.settings.get(CONSTANTS.MODULE_NAME, "hideActorHeaderText") ? "" : "ITEM-PILES.Defaults.Configure",
            icon: "fas fa-box-open",
            class: "item-piles-config-button",
            onclick: () => {
                ItemPileConfig.show(obj);
            }
        })
    },

    async _dropData(canvas, data) {
        return API._dropData(canvas, data);
    },

    _handleActorContextMenu(html, menuItems) {

        menuItems.push({
            name: "ITEM-PILES.ContextMenu.ShowToPlayers",
            icon: `<i class="fas fa-eye"></i>`,
            callback: (html) => {
                const actorId = html[0].dataset.documentId;
                const actor = game.actors.get(actorId);
                const users = Array.from(game.users).filter(u => u.active).map(u => u.id);
                return API.openItemPileInventory(actor, users, { useDefaultCharacter: true });
            },
            condition: (html) => {
                const actorId = html[0].dataset.documentId;
                const actor = game.actors.get(actorId);
                return game.user.isGM && API.isValidItemPile(actor);
            }
        }, {
            name: "ITEM-PILES.ContextMenu.RequestTrade",
            icon: `<i class="fas fa-handshake"></i>`,
            callback: (html) => {
                const actorId = html[0].dataset.documentId;
                const actor = game.actors.get(actorId);
                const user = Array.from(game.users).find(u => u.character === actor && u.active);
                return TradeAPI.requestTrade(user);
            },
            condition: (html) => {
                const actorId = html[0].dataset.documentId;
                const actor = game.actors.get(actorId);
                return game.settings.get(CONSTANTS.MODULE_NAME, "enableTrading")
                    && (game.user?.character !== actor || Array.from(game.users).find(u => u.character === actor && u.active));
            }
        });
    }
}