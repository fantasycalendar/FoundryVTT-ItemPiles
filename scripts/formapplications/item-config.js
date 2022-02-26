import {CONSTANTS} from "../constants.js";
import * as lib from "../lib/lib.js";
import {getDocument} from "../lib/utils";

export class ItemConfig extends FormApplication {

    constructor(item) {
        super();
        this.document = getDocument(item);
        this.itemFlagData = foundry.utils.mergeObject(CONSTANTS.ITEM_DEFAULTS, lib.getItemFlagData(this.document));
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
        const document = getDocument(item);
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
        data.flagData = foundry.utils.mergeObject(foundry.utils.duplicate(data), foundry.utils.duplicate(this.itemFlagData));
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {


        const itemFlagData = {};
        for (let [path, value] of Object.entries(formData)) {
            setProperty(itemFlagData, path, value)
        }

        this.document.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.ITEM_FLAGS, itemFlagData);

    }

}