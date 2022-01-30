import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";

export default class DropItemDialog extends FormApplication {

    constructor(resolve, droppedItem, itemPile) {
        super();
        this.resolve = resolve;
        this.droppedItem = droppedItem;
        this.itemPile = itemPile;
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.DropItem.Title"),
            classes: ["dialog"],
            template: `${CONSTANTS.PATH}templates/drop-item-dialog.html`,
            width: 430,
            height: "auto"
        });
    }

    static query(droppedItem, itemPile) {

        return new Promise(resolve => {
            new DropItemDialog(resolve, droppedItem, itemPile).render(true);
        });

    }

    async getData(options) {
        const data = super.getData(options);

        data.itemPile = this.itemPile;
        data.itemPileAtLocation = !!this.itemPile;
        data.droppedItem = this.droppedItem;
        data.itemQuantity = lib.getItemQuantity(this.droppedItem);
        data.itemQuantityMoreThanOne = data.itemQuantity > 1;

        return data;
    }

    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);
        const slider = html.find(".rangeSlider");
        const input = html.find(".rangeValue")
        slider.on("input", function () {
            input.val($(this).val());
        })
        input.keyup(function () {
            slider.val($(this).val());
        })
    }

    async _updateObject(event, formData) {

        if (event.submitter.value === "cancel") {
            return this.resolve(false);
        }

        formData.action = event.submitter.value;

        return this.resolve(formData);

    }

    async close(options) {
        await super.close(options);
        this.resolve(false);
    }

}