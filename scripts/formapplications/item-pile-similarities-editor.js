import CONSTANTS from "../constants.js";

export class ItemPileSimilaritiesEditor extends FormApplication {

    constructor() {
        super();
        this.similarities = game.settings.get(CONSTANTS.MODULE_NAME, "itemSimilarities");
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.SimilaritiesEditor.Title"),
            classes: ["sheet", "item-pile-similarities-editor"],
            template: `${CONSTANTS.PATH}templates/similarities-editor.html`,
            width: 400,
            height: "auto",
            resizable: false
        });
    }

    async getData(options) {
        const data = super.getData(options);
        data.similarities = this.similarities;
        return data;
    }

    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        html.find('.item-pile-similarities-remove').click(function () {
            const index = Number($(this).closest('.item-pile-similarities-row').attr("data-similarities-index"));
            self.similarities.splice(index, 1);
            $(this).closest('.item-pile-similarities-row').remove();
            self.rerender();
        });
        html.find('button[name="newPath"]').click(function () {
            self.similarities.push("")
            self.render(true);
        });
    }

    rerender() {
        const self = this;
        this.element.find('.item-pile-similarities-row').each(function (index) {
            if (index === 0) return;
            self.similarities[index - 1] = $(this).find('.item-pile-similarities-path-input').val()
        });
        return this.render(true);
    }

    async _updateObject(event, formData) {

        const newSettings = [];
        for (let [path, value] of Object.entries(formData)) {
            setProperty(newSettings, path, value)
        }

        game.settings.set(CONSTANTS.MODULE_NAME, "itemSimilarities", newSettings);

    }

}