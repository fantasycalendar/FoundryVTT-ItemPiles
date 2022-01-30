import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";

export default class DropCurrencyDialog extends FormApplication {

    constructor(resolve, {
        title,
        content,
        button,
        itemPile,
        dropper = false,
    }={}) {
        super();

        this._title = title ?? game.i18n.localize("ITEM-PILES.DropCurrencies.Title");
        this.content = content ?? game.i18n.localize("ITEM-PILES.DropCurrencies.Player");
        this.button = button ?? game.i18n.localize("ITEM-PILES.DropCurrencies.AddToPile")

        this.resolve = resolve;
        this.itemPile = itemPile;
        this.dropper = dropper;
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["dialog"],
            template: `${CONSTANTS.PATH}templates/drop-currency-dialog.html`,
            width: 430,
            height: "auto"
        });
    }

    get title(){
        return this._title;
    }

    static query(parameters) {

        return new Promise(resolve => {
            new DropCurrencyDialog(resolve, parameters).render(true);
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


        const currencies = Object.fromEntries(Object.entries(formData).filter(entry => entry[1]));

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