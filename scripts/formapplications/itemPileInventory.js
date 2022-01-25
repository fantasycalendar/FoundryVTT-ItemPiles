import CONSTANTS from "../constants.js";
import API from "../api.js";
import * as lib from "../lib/lib.js";
import { isPileInventoryOpenForOthers } from "../socket.js";
import HOOKS from "../hooks.js";
import { ItemPileConfig } from "./itemPileConfig.js";
import { addItemsToItemPileSharing, getItemPileAttributesForActor } from "../lib/lib.js";

export class ItemPileInventory extends FormApplication {

    /**
     *
     * @param pile
     * @param recipient
     * @param overrides
     */
    constructor(pile, recipient, overrides={}) {
        super();
        this.pile = pile;
        this.recipient = recipient;
        this.recipientActor = this.recipient?.actor ?? this.recipient;
        this.items = [];
        this.attributes = [];
        this.deleted = false;
        this.interactionId = randomID();
        this.overrides = overrides;
        this.pileData = lib.getItemPileData(this.pile);
        Hooks.callAll(HOOKS.PILE.OPEN_INVENTORY, this, pile, recipient, overrides);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.Inspect.Title"),
            classes: ["sheet", "item-pile-inventory-sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-inventory.html`,
            width: 500,
            height: "auto",
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-item-drop-container" }],
        });
    }

    static getActiveAppFromPile(inPileUuid, recipientUuid = false) {

        const openApps = Object.values(ui.windows).filter(app => {
            return app instanceof this
                && (app.pile.uuid === inPileUuid || app.pile.actor.uuid === inPileUuid)
                && (!recipientUuid || (app.recipient.uuid === recipientUuid || app.recipient?.actor?.uuid === recipientUuid))
        })

        if(openApps.length){
            return openApps;
        }

        return false;
    }

    static async rerenderActiveApp(inPileUuid, deleted = false) {
        const openApps = ItemPileInventory.getActiveAppFromPile(inPileUuid);
        if (!openApps) return false;
        for(const app of openApps) {
            app.saveItems();
            app.saveAttributes();
            app.deleted = deleted;
            app.render(true);
        }
        return true;
    }

    static async show(pile, recipient, overrides={}) {
        const pileUuid = await lib.getUuid(pile);
        const recipientUuid = recipient ? await lib.getUuid(recipient) : false;

        const app = ItemPileInventory.getActiveAppFromPile(pileUuid, recipientUuid);
        if (app) {
            app.pileData = lib.getItemPileData(app.pile);
            return app.render(true, { focus: true });
        }

        const result = Hooks.call(HOOKS.PILE.PRE_OPEN_INVENTORY, pile, recipient, overrides);
        if(result === false) return;

        return new ItemPileInventory(pile, recipient, overrides).render(true);
    }

    /* -------------------------------------------- */

    /** @override */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        const canConfigure = game.user.isGM;
        if (canConfigure) {
            buttons = [
                {
                    label: "ITEM-PILES.Inspect.OpenSheet",
                    class: "item-piles-open-actor-sheet",
                    icon: "fas fa-user",
                    onclick: () => {
                        const actor = this.pile.actor ?? this.pile;
                        actor.sheet.render(true, { focus: true });
                    }
                },
                {
                    label: "ITEM-PILES.HUD.Configure",
                    class: "item-piles-configure-pile",
                    icon: "fas fa-box-open",
                    onclick: () => {
                        const actor = this.pile.actor ?? this.pile;
                        ItemPileConfig.show(actor);
                    }
                },
            ].concat(buttons);
        }
        return buttons
    }

    saveItems() {

        // Get all of the items on the actor right now
        const newItems = this.getPileItemData();

        // If there are none, stop displaying them in the UI
        if (!newItems.length){
            this.items = [];
            return;
        }

        // Otherwise, loop through the old items
        for(let oldItem of this.items) {

            // If we find an item that was previously listed
            const foundItem = lib.findSimilarItem(newItems, oldItem);

            // We update the previously listed attribute to reflect this
            oldItem.currentQuantity = foundItem ? foundItem.currentQuantity : 0;
            oldItem.quantity = foundItem ? foundItem.quantity : 0;
            oldItem.shareLeft = foundItem ? foundItem.shareLeft : 0;

            // We then remove it from the incoming list, as we already have it
            newItems.splice(newItems.indexOf(foundItem), 1)

        }

        // Add the new items to the list
        this.items = this.items.concat(newItems);

    }

    getPileItemData() {
        return lib.getItemPileItemsForActor(this.pile, this.recipientActor);
    }

    saveAttributes() {

        // Get all of the attributes on the actor right now
        const newAttributes = this.getPileAttributeData();

        // If there are none, stop displaying them in the UI
        if (!newAttributes.length){
            this.attributes = [];
            return;
        }

        // Otherwise, loop through the old attributes
        for(let oldAttribute of this.attributes) {

            // If we find an attribute that was previously listed
            const foundAttribute = newAttributes.find(currentAttribute => currentAttribute.path === oldAttribute.path);

            // We update the previously listed attribute to reflect this
            oldAttribute.currentQuantity = foundAttribute ? foundAttribute.currentQuantity : 0;
            oldAttribute.quantity = foundAttribute ? foundAttribute.quantity : 0;
            oldAttribute.shareLeft = foundAttribute ? foundAttribute.shareLeft : 0;

            // We then remove it from the incoming list, as we already have it
            newAttributes.splice(newAttributes.indexOf(foundAttribute), 1)

        }

        // Add the new attributes to the list
        this.attributes = this.attributes.concat(newAttributes);

    }

    getPileAttributeData() {
        return lib.getItemPileAttributesForActor(this.pile, this.recipientActor);
    }

    _onDrop(event) {

        super._onDrop(event);

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        return API._dropData(canvas, data, { target: this.pile });

    }

    getData(options) {
        const data = super.getData(options);

        data.isDeleted = this.deleted;

        data.name = !data.isDeleted ? this.pile.name : "Nonexistent pile";

        if (this.deleted) {
            return data;
        }

        data.overrides = this.overrides;

        data.hasRecipient = !!this.recipient;
        data.recipient = this.recipient;
        data.isContainer = false;

        const pileData = lib.getItemPileData(this.pile);
        data.isContainer = pileData.isContainer;
        data.items = this.items.length ? this.items : this.getPileItemData();
        data.attributes = this.attributes.length ? this.attributes : this.getPileAttributeData();
        data.hasItems = API.getItemPileItems(this.pile).length > 0;
        data.hasAttributes = data?.attributes?.length;
        data.canInspectItems = pileData.canInspectItems || game.user.isGM;

        data.hasThings = data?.hasItems || data?.hasAttributes;

        data.isEmpty = lib.isItemPileEmpty(this.pile);

        data.buttons = [];

        if(data.hasRecipient){

            if(pileData.splitAllEnabled) {

                const num_players = Array.from(game.users).filter(u => (u.active || !pileData.activePlayers) && u.character && !u.isGM).length;

                data.buttons.push({
                    value: "splitAll",
                    icon: "far fa-handshake",
                    text: game.i18n.format("ITEM-PILES.Inspect.SplitAll", { num_players }),
                    disabled: !num_players,
                    type: "button"
                });

            }

            if(pileData.itemsFreeForAll && pileData.attributesFreeForAll && pileData.takeAllEnabled) {

                data.buttons.push({
                    value: "takeAll",
                    icon: "fas fa-fist-raised",
                    text: game.i18n.localize("ITEM-PILES.Inspect.TakeAll")
                });

            }

            if(pileData.isContainer && !this.overrides.remote){
                data.buttons.push({
                    value: "close",
                    icon: "fas fa-box",
                    text: game.i18n.localize("ITEM-PILES.Inspect.Close")
                })
            }
        }

        data.buttons.push({
            value: "leave",
            icon: "fas fa-sign-out-alt",
            text: game.i18n.localize("ITEM-PILES.Inspect.Leave")
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let self = this;
        let timer;
        html.find('img').mouseenter(function () {
            const element = $(this);

            timer = setTimeout(function () {
                self.previewImage(html, element);
            }, 300);
        });

        html.find('img').mouseleave(function () {
            self.clearImage(html);
            clearTimeout(timer);
        });

        html.find(".item-piles-clickable").click(function () {
            const itemId = $(this).closest(".item-piles-item-row").attr('data-item-id');
            self.previewItem(itemId);
        })

        html.find(".item-piles-take-button").click(function () {
            const itemId = $(this).closest(".item-piles-item-row").attr('data-item-id');
            const inputQuantity = $(this).closest(".item-piles-item-row").find(".item-piles-quantity").val();
            self.takeItem(itemId, inputQuantity);
        })

        html.find(".item-piles-attribute-take-button").click(function () {
            const attribute = $(this).closest(".item-piles-item-row").attr('data-attribute-path');
            const inputQuantity = $(this).closest(".item-piles-item-row").find(".item-piles-quantity").val();
            self.takeAttribute(attribute, inputQuantity);
        })

        html.find('button[name="splitAll"]').click(function () {
            self.splitAll();
        })
    }

    previewImage(html, element) {

        const src = element.prop("src");

        const pos = element.position();

        const imageContainer = html.find("#item-piles-preview-image");

        imageContainer.prop("src", src);

        let container = html.find("#item-piles-preview-container");

        setTimeout(() => {

            container.css({
                position: "absolute",
                top: (pos.top - (container.outerHeight() / 2)) + "px",
                left: (-container.outerWidth() - pos.left) + "px"
            }).fadeIn(150);

        }, 10)
    }

    clearImage(html) {
        html.find("#item-piles-preview-container").fadeOut(150);
    }

    async previewItem(itemId) {
        const item = this.pile.actor.items.get(itemId);
        if(game.user.isGM || item.data.permission[game.user.id] === 3){
            return item.sheet.render(true);
        }

        const cls = item._getSheetClass()
        const sheet = new cls(item, { editable: false })
        return sheet._render(true);
    }

    async takeItem(itemId, inputQuantity) {
        const item = this.pile.actor.items.get(itemId);
        let quantity = lib.getItemQuantity(item);
        quantity = Math.min(inputQuantity, quantity);
        return API.transferItems(this.pile, this.recipient, [{ _id: itemId, quantity }], { interactionId: this.interactionId });
    }

    async takeAttribute(attribute, inputQuantity) {
        let quantity = Number(getProperty(this.pile.actor.data, attribute) ?? 0);
        quantity = Math.min(inputQuantity, quantity);
        await API.transferAttributes(this.pile, this.recipient, { [attribute]: quantity }, { interactionId: this.interactionId });
    }

    async splitAll(){
        this.saveItems();
        this.saveAttributes();
    }

    async _updateObject(event, formData) {

        if (event.submitter.value === "takeAll") {
            API.transferEverything(this.pile, this.recipient, { interactionId: this.interactionId });
            return;
        }

        if (event.submitter.value === "close") {
            isPileInventoryOpenForOthers.query(this.pile).then((result) => {
                if (!result) API.closeItemPile(this.pile, this.recipient);
            });
        }

    }

}