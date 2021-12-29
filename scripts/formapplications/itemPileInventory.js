import CONSTANTS from "../constants.js";
import API from "../api.js";

export class ItemPileInventory extends FormApplication {

    static getActiveApplicationForPile(inPile) {
        for(let app of Object.values(ui.windows)){
            if(app instanceof this && app.pile === inPile){
                return app;
            }
        }
        return false;
    }

    constructor(pile, actor) {
        super();
        this.pile = pile;
        this.actor = actor;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "token-sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-inventory.html`,
            width: 450,
            height: "auto"
        });
    }

    get title() {
        return `${game.i18n.localize("ITEM-PILES.Inspect.Title")}: ${this.pile.name}`
    }

    getData(options){
        const data = super.getData(options);

        data.pile = this.pile;
        data.hasItems = Array.from(this.pile.items).length > 0;
        data.items = Array.from(this.pile.items).map(item => {
            return {
                id: item.id,
                name: item.name,
                img: item.data.img,
                quantity: getProperty(item.data, API.quantity_attribute) ?? 1
            }
        })

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
        const itemId = element.attr('data-item-id');
        const inputQuantity = element.find(".item-piles-quantity").val();
        const item = this.pile.items.get(itemId);
        const maxQuantity = getProperty(item.data, API.quantity_attribute) ?? 1;
        await API.transferItem(this.pile, this.actor, itemId, Math.min(inputQuantity, maxQuantity));
    }

    async _updateObject(event, formData) {

        if(event.submitter.value === "cancel"){
            return;
        }

        await API.transferAllItems(this.pile, this.actor);
    }

}