import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js"
import registerSettings from "./settings.js";
import { registerSocket } from "./socket.js";
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
    Hooks.on("getActorSheetHeaderButtons", module._insertItemPileHeaderButtons);
    Hooks.on("renderTokenHUD", module._renderPileHUD);

});

const module = {

    _renderPileHUD(app, html, data){

        const document = app?.object?.document;
        const flagData = document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        const pile = managedPiles.get(document?.uuid);

        if (!document || !flagData || !pile) return;

        const container = $(`<div class="col right" style="right:-130px;"></div>`);

        const locked = pile.isLocked ? "" : "-open";

        const lock_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleLocked")}"><i class="fas fa-lock${locked}"></i></div>`);

        lock_button.click(async function(){
            $(this).find('.fas').toggleClass('fa-lock').toggleClass('fa-lock-open');
            await pile.toggleLocked();
        });

        container.append(lock_button);

        const closed = pile.isClosed ? "" : "-open";

        const open_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.ToggleClosed")}"><i class="fas fa-box${closed}"></i></div>`);

        open_button.click(async function(){
            $(this).find('.fas').toggleClass('fa-box').toggleClass('fa-box-open');
            await pile.toggleClosed();
        });

        container.append(open_button);

        const configure_button = $(`<div class="control-icon item-piles" title="${game.i18n.localize("ITEM-PILES.HUD.Configure")}"><i class="fas fa-toolbox"></i></div>`);

        configure_button.click(async function(){
            new ItemPileConfig(document).render(true);
        });

        container.append(configure_button);

        html.append(container)

    },

    _insertItemPileHeaderButtons(actorSheet, buttons){

        let obj = actorSheet.object;

        if(!obj.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)) return;

        buttons.unshift({
            label: "ITEM-PILES.Defaults.Configure",
            icon: "fas fa-clock",
            class: "item-piles-config",
            onclick: () => {
                new ItemPileConfig(obj).render(true);
            }
        })
    },

    async _dropCanvasData(canvas, data){

        if(data.type !== "Item") return;

        const itemData = data.id ? game.items.get(data.id)?.toObject() : data.data;
        if(!itemData){
            throw lib.custom_error("Something went wrong when dropping this item!")
        }

        const altDown = game.keyboard.downKeys.has("AltLeft");

        const dropData = {
            itemData: itemData,
            actor: false,
            target: false,
            location: false,
            quantity: 1
        }

        if(data.tokenId){
            dropData.actor = canvas.tokens.get(data.tokenId).actor;
        } else if(data.actorId){
            dropData.actor = game.actors.get(data.actorId);
        }

        const [ x, y ] = canvas.grid.getTopLeft(data.x, data.y);

        let droppableDocuments = lib.getTokensAtLocation({ x, y })
            .filter(token => token.actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME))
            .map(token => managedPiles.get(token.document.uuid));

        let action;
        if(droppableDocuments.length > 0){
            droppableDocuments = droppableDocuments.filter(pile => !pile.isLocked);
            if(!droppableDocuments.length){
                return Dialog.prompt({
                    title: game.i18n.localize("ITEM-PILES.DropItem.Title"),
                    content: `<p>${game.i18n.localize("ITEM-PILES.DropItem.LockedWarning")}</p>`,
                    label: "OK",
                    callback: () => {},
                    rejectClose: false
                });
            }
        }

        const itemQuantity = getProperty(itemData, API.quantity_attribute) ?? 1;

        if(altDown){

            if(droppableDocuments.length){
                action = "addToPile";
            }

        }else if(itemQuantity > 1){

            const result = await DropDialog.query(itemData, droppableDocuments);

            if (!result) return;
            action = result.action;
            dropData.quantity = result.quantity;

        }

        if(action === "addToPile"){
            dropData.target = droppableDocuments[0].actor;
        }else{
            dropData.position = { x, y };
        }

        return API.handleDrop(dropData);
        
    },

    _canvasReady(){
        managedPiles.forEach((pile) => pile._disableEvents());
        managedPiles.clear();
        const tokens = canvas.tokens.placeables.filter((token) => token.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME));
        tokens.forEach(token => ItemPile.make(token.document));
    },

    _createPile(doc){
        if(!doc.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)) return;
        ItemPile.make(doc);
    },

    _updatePile(doc, changes){
        const pile = managedPiles.get(doc.uuid);
        if(!pile) return;
        pile.updated();
    },

    _deletePile(doc){
        const pile = managedPiles.get(doc.uuid);
        if(!pile) return;
        pile.remove();
    }
}
