import CONSTANTS from "../constants.js";
import { managedPiles } from "../module.js";

export class ItemPileConfig extends FormApplication {

    constructor(actor) {
        super();
        this.document = actor?.token ?? actor;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "token-sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-config.html`,
            width: 430,
            height: "auto"
        });
    }

    get title() {
        return `${game.i18n.localize("ITEM-PILES.Defaults.Title")}: ${this.document.data.name}`
    }

    async getData(options) {
        const data = super.getData(options);
        data.pile_data = this.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        return data;
    }

    async _updateObject(event, formData) {

        const data = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, formData);

        if (this.document instanceof TokenDocument) {
            const pile = managedPiles.get(this.document.uuid);
            return pile.update(data);
        }

        return this.document.update({
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data,
            [`token.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data
        });

    }

}