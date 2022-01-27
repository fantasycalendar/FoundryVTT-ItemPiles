import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";

export default class DropCurrencyDialog extends FormApplication {

    constructor(resolve, itemPile, dropper = false) {
        super();
        this.resolve = resolve;
        this.itemPile = itemPile;
        this.dropper = dropper;
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.DropCurrencies.Title"),
            classes: ["dialog"],
            template: `${CONSTANTS.PATH}templates/drop-currency-dialog.html`,
            width: 430,
            height: "auto"
        });
    }

    static query(itemPile, dropper = false) {

        return new Promise(resolve => {
            new DropCurrencyDialog(resolve, itemPile, dropper).render(true);
        });

    }

    async getData(options) {
        const data = super.getData(options);

        data.currencies = lib.getActorCurrencies(this.dropper, { currencyList: lib.getActorCurrencyList(this.itemPile) }).filter(currency => currency.quantity)

        return data;
    }

    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.item-piles-slider-group').each(function(){

            const slider = $(this).find(".item-piles-range-slider")
            const input = $(this).find(".item-piles-range-input")
            slider.on("input", function () {
                input.val($(this).val());
            })
            input.keyup(function () {
                slider.val($(this).val());
            });

        })
    }

    async _updateObject(event, formData) {

        if(!Array.isArray(formData.path)) formData.path = [formData.path]
        if(!Array.isArray(formData.quantity)) formData.quantity = [formData.quantity]

        const currencies = Object.fromEntries(formData.path.map((path, index) => {
            const quantity = Number(formData.quantity[index]);
            return quantity ? [path, quantity] : false;
        }).filter(Boolean));

        if (event.submitter.value === "cancel" || foundry.utils.isObjectEmpty(currencies)) {
            return this.resolve(false);
        }

        return this.resolve(currencies);

    }

    async close(options) {
        super.close(options);
        this.resolve(false);
    }

}