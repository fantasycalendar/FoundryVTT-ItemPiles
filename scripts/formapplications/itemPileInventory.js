import CONSTANTS from "../constants.js";
import API from "../api.js";

export class ItemPileInventory extends FormApplication {

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
            width: 430,
            height: "auto"
        });
    }

    get title() {
        return `${game.i18n.localize("ITEM-PILES.Inspect.Title")}: ${this.pile.name}`
    }

    getData(options){
        const data = super.getData(options);

        data.pile = this.pile;

        return data;
    }

    async _updateObject(event, formData) {

        console.log(formData)

        API.transferAllItems(this.pile, this.actor);

    }

}