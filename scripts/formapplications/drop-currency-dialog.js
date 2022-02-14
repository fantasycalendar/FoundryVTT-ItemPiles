import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";

export default class DropCurrencyDialog extends FormApplication {

    constructor(resolve, {
        title,
        content,
        button,
        target,
        source,
        existingCurrencies = false,
        includeAllCurrencies = false
    } = {}) {
        super();

        this._title = title ?? game.i18n.localize("ITEM-PILES.DropCurrencies.Title");
        this._content = content ?? game.i18n.localize("ITEM-PILES.DropCurrencies.Player");
        this._button = button ?? game.i18n.localize("ITEM-PILES.DropCurrencies.AddToPile")

        this.resolve = resolve;
        this.target = target;
        this.source = source;
        this.existingCurrencies = existingCurrencies;
        this.includeAllCurrencies = includeAllCurrencies;
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

    get title() {
        return this._title;
    }

    /**
     * @param parameters
     * @returns {Promise<Object/Boolean>}
     */
    static query(parameters) {
        return new Promise(resolve => {
            new DropCurrencyDialog(resolve, parameters).render(true);
        });
    }

    async getData(options) {
        const data = super.getData(options);

        data.source = this.source;
        data.target = this.target;

        let currencyList = { currencyList: lib.getActorCurrencyList(this.target), getAll: this.includeAllCurrencies };

        data.currencies = lib.getActorCurrencies(this.source, currencyList);

        if (!this.includeAllCurrencies) {
            data.currencies = data.currencies.filter(currency => currency.quantity)
        }

        data.currencies.map(currency => {
            currency.currentQuantity = 0;
            if (this.existingCurrencies) {
                const existingCurrency = this.existingCurrencies.find(existingCurrency => existingCurrency.path === currency.path);
                if (existingCurrency) {
                    currency.currentQuantity = existingCurrency.quantity;
                }
            }
            return currency;
        })

        data.includeAllCurrencies = this.includeAllCurrencies;
        data.content = this._content;
        data.button = this._button;

        return data;
    }

    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.item-piles-slider-group').each(function () {

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

        if (event.submitter.value === "cancel") {
            return this.resolve(false);
        }

        return this.resolve(formData);

    }

    async close(options) {
        super.close(options);
        this.resolve(false);
    }

}