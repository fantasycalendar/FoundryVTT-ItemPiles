import CONSTANTS from "../constants.js";
import API from "../api.js";
import * as lib from "../lib/lib.js";

export class ItemConfig extends FormApplication {

    constructor(item) {
        super();
        this.document = lib.getDocument(item);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "item-piles-config"],
            template: `${CONSTANTS.PATH}templates/item-config.html`,
            width: 430,
            resizable: true,
            tabs: [{ navSelector: ".tabs", contentSelector: ".tab-body", initial: "mainsettings" }]
        });
    }

    get title() {
        return `${game.i18n.localize("ITEM-PILES.ItemConfig.Title")}: ${this.document.data.name}`
    }

    static show(item) {
        const document = lib.getDocument(item);
        for (let app of Object.values(ui.windows)) {
            if (app instanceof this && app.document === document) {
                return app.render(false, { focus: true });
            }
        }
        return new ItemConfig(item).render(true);
    }

    /* -------------------------------------------- */

    async getData(options) {
        let data = super.getData(options);
        data.enabled = true;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        console.log(formData);
    }

}