import CONSTANTS from "../constants.js";
import API from "../api.js";
import * as lib from "../lib/lib.js";
import { isPileInventoryOpenForOthers } from "../socket.js";

export class ItemPileInventory extends FormApplication {

    static getActiveAppFromPile(inPileUuid) {
        for(let app of Object.values(ui.windows)){
            if(app instanceof this && app.pileUuid === inPileUuid){
                return app;
            }
        }
        return false;
    }

    static async rerenderActiveApp(inPileUuid, deleted = false){
        const app = ItemPileInventory.getActiveAppFromPile(inPileUuid);
        if(!app) return false;
        app.saveItems();
        app.deleted = deleted;
        app.render(true);
        return true;
    }

    constructor(pile, actor = false) {
        super();
        this.pileActor = pile;
        this.pileToken = pile.token;
        this.pileUuid = pile.uuid;
        this.actor = actor;
        this.items = [];
        this.deleted = false;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.Inspect.Title"),
            classes: ["sheet", "item-pile-inventory-sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-inventory.html`,
            width: 450,
            height: "auto",
            dragDrop: [{dragSelector: null, dropSelector: ".item-piles-item-drop-container"}],
        });
    }

    saveItems(){
        let self = this;
        this.items = [];

        let pileItems = Array.from(this.pileActor.items);

        if(!pileItems.length) return;

        this.element.find(".item-piles-item-row").each(function(){

            const id = $(this).attr("data-item-id");
            const type = $(this).attr("data-item-type");
            const name = $(this).find('.item-piles-name').text();
            const img = $(this).find('.item-piles-img').attr('src');

            const foundItem = self.pileActor.items.get(id) ?? lib.getSimilarItem(pileItems, name, type);

            const itemQuantity = foundItem ? $(this).find('input').val() : 1;
            const maxQuantity = foundItem ? (getProperty(foundItem.data, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1) : 0;

            const currentQuantity = Math.min(maxQuantity, Math.max(itemQuantity, 1));

            self.items.push({ id, name, type, img, currentQuantity, maxQuantity });

        });

        const newItems = this.getPileItemData();
        newItems.filter(newItem => !this.items.find(item => item.id === newItem.id) && !lib.getSimilarItem(this.items, newItem.name, newItem.type))
            .forEach(newItem => this.items.push(newItem));

    }

    _onDrop(event){

        super._onDrop(event);

        // Try to extract the data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        }
        catch (err) {
            return false;
        }

        return API.dropData(canvas, data, { target: this.pileToken });

    }

    getPileItemData(){
        return Array.from(this.pileActor.items).map(item => {
            return {
                id: item.id,
                name: item.name,
                type: item.type,
                img: item.data?.img ?? "",
                currentQuantity: 1,
                maxQuantity: getProperty(item.data, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1
            };
        });
    }

    getData(options){
        const data = super.getData(options);

        data.isDeleted = this.deleted;

        data.name = !data.isDeleted ? this.pileToken.name : "Nonexistent pile";

        data.actor = this.actor;

        if(!data.isDeleted) {
            data.hasItems = Array.from(this.pileActor.items).length > 0;
            data.items = this.items.length ? this.items : this.getPileItemData();
        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let self = this;
        let timer;
        html.find('img').mouseenter(function(){
            const element = $(this);
            timer = setTimeout(function(){
                self.previewImage(html, element);
            }, 300);
        });
        html.find('img').mouseleave(function(){
            self.clearImage(html);
            clearTimeout(timer);
        });

        html.find(".item-piles-take-button").click(function(){
            self.takeItem($(this).parent());
        })
    }

    previewImage(html, element){
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

    clearImage(html){
        html.find("#item-piles-preview-container")
            .fadeOut(150);
    }

    async takeItem(element){
        this.saveItems();
        const itemId = element.attr('data-item-id');
        const inputQuantity = element.find(".item-piles-quantity").val();
        const item = this.pileActor.items.get(itemId);
        const maxQuantity = getProperty(item.data, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1;
        await API.transferItem(this.pileActor, this.actor, itemId, { quantity: Math.min(inputQuantity, maxQuantity) });
    }

    async _updateObject(event, formData) {

        if(event.submitter.value === "takeAll"){
            return await API.transferAllItems(this.pileActor, this.actor);
        }

        if(event.submitter.value === "close"){
            return isPileInventoryOpenForOthers.query(this.pileActor).then((result) => {
                if(!result) API.closePile(this.pileToken);
            });
        }

    }

}