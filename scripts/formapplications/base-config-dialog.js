import CONSTANTS from "../constants.js";

const template_path = `${CONSTANTS.PATH}templates/editors`;

class BaseConfigDialog extends FormApplication {

    /**
     *
     * @param {Boolean/Object} data
     * @param {Boolean/Function} resolve
     */
    constructor(data = false, resolve = false) {
        super();
        this.resolve = resolve;
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 630,
            height: "auto",
            resizable: false
        });
    }

    static show(data = false) {
        let resolve;
        const promise = new Promise(_resolve => {
            resolve = _resolve;
        });
        return [promise, new this(data, resolve).render(true)]
    }

    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        html.find('.item-piles-input-remove').click(function () {
            const parent = $(this).closest('.item-piles-input-row');
            const index = Number(parent.attr("data-index"));
            self.data.splice(index, 1);
            parent.remove();
            self.setPosition();
        });
        html.find('.item-pile-add-new-entry').click(function () {
            debugger;
            self.data.push(self.baseData);
            self.render(true);
        });
    }

    getData(options) {
        const data = super.getData(options);
        data.data = this.data;
        return data;
    }

    async _updateObject(event, formData) {

        if (event.submitter.value === "cancel") {
            return this.resolve ? this.resolve(false) : false;
        }

        const newSettings = [];
        for (let [path, value] of Object.entries(formData)) {
            setProperty(newSettings, path, value)
        }

        if (this.resolve) {
            return this.resolve(newSettings);
        }

        return game.settings.set(CONSTANTS.MODULE_NAME, this.settingName, newSettings);

    }

    async close(options) {
        if (this.resolve) {
            this.resolve(false)
        }
        return super.close(options)
    }

}

export class ItemFiltersEditor extends BaseConfigDialog {

    settingName = "itemFilters"

    baseData = {
        path: "",
        filters: ""
    }

    constructor(data, resolve) {
        super(data, resolve);
        this.data = typeof data === "object" ?
            foundry.utils.duplicate(data)
            : game.settings.get(CONSTANTS.MODULE_NAME, this.settingName);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.FilterEditor.Title"),
            classes: ["sheet", "item-pile-filters-editor"],
            template: `${template_path}/item-filters-editor.html`
        });
    }

}

export class CurrenciesEditor extends BaseConfigDialog {

    settingName = "currencies"

    baseData = {
        name: "",
        path: "",
        img: "",
        exchange: 1,
        primary: false,
    }

    constructor(data, resolve) {
        super(data, resolve);
        this.data = typeof data === "object" ?
            foundry.utils.duplicate(data)
            : game.settings.get(CONSTANTS.MODULE_NAME, this.settingName);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.CurrenciesEditor.Title"),
            classes: ["sheet", "item-pile-currencies-editor"],
            template: `${template_path}/currencies-editor.html`
        });
    }

    async _updateObject(event, formData) {

        if (event.submitter.value === "cancel") {
            return this.resolve ? this.resolve() : false;
        }

        const newSettings = [];
        for (let [path, value] of Object.entries(formData)) {
            if(path === "primary") continue;
            setProperty(newSettings, path, value)
        }

        this.element.find('.item-piles-input-editor-list').each(function(index){
            const isChecked = $(this).find('.item-piles-input-primary-currency').is(":checked");
            setProperty(newSettings, `${index}.primary`, isChecked);
        });

        if (this.resolve) {
            return this.resolve(newSettings);
        }

        return game.settings.set(CONSTANTS.MODULE_NAME, this.settingName, newSettings);

    }

}

export class ItemSimilaritiesEditor extends BaseConfigDialog {

    settingName = "itemSimilarities"
    baseData = ""

    constructor(data, resolve) {
        super(data, resolve);
        this.data = typeof data === "object" ?
            foundry.utils.duplicate(data)
            : game.settings.get(CONSTANTS.MODULE_NAME, this.settingName);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.SimilaritiesEditor.Title"),
            classes: ["sheet", "item-pile-similarities-editor"],
            template: `${template_path}/similarities-editor.html`,
            width: 400
        });
    }

}

export class PriceModifiersEditor extends BaseConfigDialog {

    baseData = {
        actor: "",
        priceModifier: 100,
        sellModifier: 50
    }

    constructor(data, resolve) {
        super(data, resolve);
        this.data = typeof data === "object" ?
            foundry.utils.duplicate(data)
            : game.settings.get(CONSTANTS.MODULE_NAME, this.settingName);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.PriceModifiersEditor.Title"),
            classes: ["sheet", "item-pile-price-modifiers-editor"],
            template: `${template_path}/price-modifiers-editor.html`,
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-drop-container" }],
        });
    }

    async _onDrop(event) {

        super._onDrop(event);

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        if (data.type !== "Actor") return;

        this.data.push({
            actor: data.id,
            priceModifier: 100,
            sellModifier: 50
        });

        this.render(false);

    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".item-piles-actor-name-clickable").click(function(){
            const id = $(this).next().val();
            game.actors.get(id).sheet.render(true);
        })

        html.find('input[type="range"]').on("input", function () {
            $(this).next().val($(this).val());
        })

        html.find('input[type="range"]').next().on("change", function () {
            $(this).prev().val($(this).val());
        })
    }

    getData(options) {
        const data = super.getData(options);

        data.data = foundry.utils.duplicate(this.data).map(priceData => {
            const actor = game.actors.get(priceData.actor);
            if(!actor) return false;
            priceData.actor = actor;
            return priceData;
        }).filter(Boolean);

        return data;
    }

    async _updateObject(event, formData) {

        const newSettings = [];
        for (let [path, value] of Object.entries(formData)) {
            setProperty(newSettings, path, value)
        }

        console.log(newSettings)

        return this.resolve(newSettings);

    }

}