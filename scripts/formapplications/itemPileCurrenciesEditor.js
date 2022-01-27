import CONSTANTS from "../constants.js";

export class ItemPileCurrenciesEditor extends FormApplication {

    constructor(pileCurrencies = false, resolve = false) {
        super();
        this.resolve = resolve;
        this.currencies = pileCurrencies || game.settings.get(CONSTANTS.MODULE_NAME, "currencies");
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.CurrenciesEditor.Title"),
            classes: ["sheet", "item-pile-currencies-editor"],
            template: `${CONSTANTS.PATH}templates/currencies-editor.html`,
            width: 630,
            height: "auto",
            resizable: false
        });
    }

    static showForPile(pileCurrencies) {
        let resolve;
        const promise = new Promise(_resolve => {
            resolve = _resolve;
        });
        return [promise, new ItemPileCurrenciesEditor(foundry.utils.duplicate(pileCurrencies), resolve).render(true)]
    }

    async getData(options) {
        const data = super.getData(options);
        data.currencies = this.currencies;
        return data;
    }

    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        html.find('.item-pile-currency-remove').click(function () {
            const index = Number($(this).closest('.item-pile-currency-row').attr("data-currency-index"));
            self.currencies.splice(index, 1);
            $(this).closest('.item-pile-currency-row').remove();
            self.rerender();
        });
        html.find('button[name="newCurrency"]').click(function () {
            self.currencies.push({
                name: "",
                path: "",
                img: ""
            })
            self.rerender();
        });
    }

    rerender(){
        const self = this;
        this.element.find('.item-pile-currency-row').each(function(index){
            if(index === 0) return;
            self.currencies[index-1] = {
                name: $(this).find('.item-pile-currency-name-input').val(),
                path: $(this).find('.item-pile-currency-path-input').val(),
                img: $(this).find('.item-pile-currency-img-input').val()
            }
        });
        return this.render(true);
    }

    async _updateObject(event, formData) {

        const newSettings = [];
        for (let [path, value] of Object.entries(formData)) {
            setProperty(newSettings, path, value)
        }

        if (!this.resolve) {
            game.settings.set(CONSTANTS.MODULE_NAME, "currencies", newSettings);
        } else {
            this.resolve(newSettings);
        }

    }

    async close(...args){
        if(this.resolve){
            this.resolve()
        }
        return super.close(...args)
    }

}