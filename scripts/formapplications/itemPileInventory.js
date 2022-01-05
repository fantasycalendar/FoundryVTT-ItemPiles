import CONSTANTS from "../constants.js";
import API from "../api.js";
import * as lib from "../lib/lib.js";
import { isPileInventoryOpenForOthers } from "../socket.js";

export class ItemPileInventory extends FormApplication {

    /**
     *
     * @param pile
     * @param recipient
     */
    constructor(pile, recipient) {
        super();
        this.pile = pile;
        this.recipient = recipient;
        this.recipientActor = this.recipient?.actor ?? this.recipient;
        this.items = [];
        this.attributes = [];
        this.deleted = false;
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.Inspect.Title"),
            classes: ["sheet", "item-pile-inventory-sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-inventory.html`,
            width: 450,
            height: "auto",
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-item-drop-container" }],
        });
    }

    static getActiveAppFromPile(inPileUuid) {
        for (let app of Object.values(ui.windows)) {
            if (app instanceof this && (app.pile.uuid === inPileUuid || app.pile.actor.uuid === inPileUuid)) {
                return app;
            }
        }
        return false;
    }

    static async rerenderActiveApp(inPileUuid, deleted = false) {
        const app = ItemPileInventory.getActiveAppFromPile(inPileUuid);
        if (!app) return false;
        app.saveItems();
        app.saveAttributes();
        app.deleted = deleted;
        app.render(true);
        return true;
    }

    static async show(pile, recipient) {
        const uuid = await lib.getUuid(pile);
        const app = ItemPileInventory.getActiveAppFromPile(uuid);
        if (app) {
            return app.render(true, { focus: true });
        }
        return new ItemPileInventory(pile, recipient).render(true);
    }

    /* -------------------------------------------- */

    saveItems() {
        let self = this;
        this.items = [];

        let pileItems = Array.from(this.pile.actor.items);

        if (!pileItems.length) return;

        this.element.find(".item-piles-item-row:not(.item-piles-attribute-row)").each(function () {

            let id = $(this).attr("data-item-id");
            const type = $(this).attr("data-item-type");
            const name = $(this).find('.item-piles-name').text();
            const img = $(this).find('.item-piles-img').attr('src');

            const foundItem = self.pile.actor.items.get(id) ?? lib.getSimilarItem(pileItems, { itemName: name, itemType: type });

            id = foundItem ? foundItem.id : id;
            const itemQuantity = foundItem ? $(this).find('input').val() : 1;
            const maxQuantity = foundItem ? (getProperty(foundItem.data, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1) : 0;

            const currentQuantity = Math.min(maxQuantity, Math.max(itemQuantity, 1));

            const hasRecipient = !!self.recipient;

            if (hasRecipient) {
                self.items.push({ id, name, type, img, currentQuantity, maxQuantity, hasRecipient });
            }

        });

        const newItems = this.getPileItemData();
        newItems.filter(newItem => !this.items.find(item => item.id === newItem.id) && !lib.getSimilarItem(this.items, { itemName: newItem.name, itemType: newItem.type }))
            .forEach(newItem => this.items.push(newItem));

    }

    getPileItemData() {
        return Array.from(this.pile.actor.items).map(item => {
            return {
                id: item.id,
                name: item.name,
                type: item.type,
                img: item.data?.img ?? "",
                currentQuantity: 1,
                maxQuantity: getProperty(item.data, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1,
                hasRecipient: !!this.recipient
            };
        })
    }

    saveAttributes() {

        let self = this;
        this.attributes = [];

        this.element.find(".item-piles-attribute-row").each(function () {

            const path = $(this).attr("data-attribute-path");
            const name = $(this).find('.item-piles-name').text();
            const img = $(this).find('.item-piles-img').attr('src');

            const itemQuantity = $(this).find('input').val();
            const maxQuantity = getProperty(self.pile.actor.data, path) ?? 0;

            const currentQuantity = Math.min(maxQuantity, Math.max(itemQuantity, 0));

            const hasRecipient = !!self.recipient;

            if (hasRecipient) {
                self.attributes.push({ name, path, img, currentQuantity, maxQuantity, hasRecipient });
            }

        });

        const newAttributes = this.getPileAttributeData();
        newAttributes.filter(newAttribute => !this.attributes.find(attribute => attribute.path === newAttribute.path))
            .forEach(newAttribute => this.attributes.push(newAttribute));

    }

    validAttribute(attribute) {
        return getProperty(this.pile.actor.data, attribute)
            && (!this.recipientActor || hasProperty(this.recipientActor.data, attribute));
    }

    getPileAttributeData() {
        const attributes = API.getPileAttributes(this.pile);
        return attributes.map(attribute => {
            if (!this.validAttribute(attribute.path)) return false;
            return {
                name: attribute.name,
                path: attribute.path,
                img: attribute.img,
                currentQuantity: 1,
                maxQuantity: getProperty(this.pile.actor.data, attribute.path) ?? 1,
                hasRecipient: !!this.recipient
            }
        }).filter(Boolean);
    }

    _onDrop(event) {

        super._onDrop(event);

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        return API._dropDataOnCanvas(canvas, data, { target: this.pile });

    }

    getData(options) {
        const data = super.getData(options);

        data.isDeleted = this.deleted;

        data.name = !data.isDeleted ? this.pile.name : "Nonexistent pile";

        data.hasRecipient = !!this.recipient;
        data.recipient = this.recipient;
        data.isContainer = false;

        if (!data.isDeleted) {

            const pileData = lib.getItemPileData(this.pile);
            data.isContainer = pileData.isContainer;
            data.items = this.items.length ? this.items : this.getPileItemData();
            data.attributes = this.attributes.length ? this.attributes : this.getPileAttributeData();
            data.hasItems = Array.from(this.pile.actor.items).length > 0;
            data.hasAttributes = data?.attributes?.length;
        }

        data.isEmpty = API.isItemPileEmpty(this.pile);

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

        html.find(".item-piles-take-button").click(function () {
            self.takeItem($(this).parent());
        })

        html.find(".item-piles-attribute-take-button").click(function () {
            self.takeAttribute($(this).parent());
        })
    }

    previewImage(html, element) {
        const src = element.prop("src");

        const pos = element.position();

        html.find("#item-piles-preview-image").prop("src", src);

        let container = html.find("#item-piles-preview-container");
        container.css({
            position: "absolute",
            top: (pos.top - (container.outerHeight() / 2)) + "px",
            left: (-container.outerWidth() - pos.left) + "px"
        }).fadeIn(150);
    }

    clearImage(html) {
        html.find("#item-piles-preview-container").fadeOut(150);
    }

    async takeItem(element) {
        this.saveItems();
        this.saveAttributes();
        const itemId = element.attr('data-item-id');
        const inputQuantity = element.find(".item-piles-quantity").val();
        const item = this.pile.actor.items.get(itemId);
        const maxQuantity = getProperty(item.data, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1;
        const quantity = Math.min(inputQuantity, maxQuantity);
        await API.transferItems(this.pile, this.recipient, [{ _id: itemId, quantity }]);
    }

    async takeAttribute(element) {
        this.saveItems();
        this.saveAttributes();
        const attribute = element.attr('data-attribute-path');
        const inputQuantity = element.find(".item-piles-quantity").val();
        const maxQuantity = getProperty(this.pile.actor.data, attribute) ?? 0;
        const quantity = Math.min(inputQuantity, maxQuantity);
        await API.transferAttributes(this.pile, this.recipient, { [attribute]: quantity });
    }

    async _updateObject(event, formData) {

        if (event.submitter.value === "takeAll") {
            return await API.transferEverything(this.pile, this.recipient);
        }

        if (event.submitter.value === "close") {
            return isPileInventoryOpenForOthers.query(this.pile).then((result) => {
                if (!result) API.closeItemPile(this.pile);
            });
        }

    }

}