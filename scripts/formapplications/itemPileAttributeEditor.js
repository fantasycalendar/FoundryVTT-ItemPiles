import CONSTANTS from "../constants.js";

export class ItemPileAttributeEditor extends FormApplication {

    constructor(...args) {
        super(...args);
        this.attributes = game.settings.get(CONSTANTS.MODULE_NAME, "extractableAttributes");
    }


    /* -------------------------------------------- */

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.AttributeEditor.Title"),
            classes: ["sheet", "item-pile-attribute-editor"],
            template: `${CONSTANTS.PATH}templates/attribute-editor.html`,
            width: 630,
            height: "auto",
            resizable: false
        });
    }


    async getData(options) {
        const data = super.getData(options);
        data.attributes = this.attributes;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        html.find('.item-pile-attribute-remove').click(function(){
            const index = Number($(this).closest('.item-pile-attribute-row').attr("data-attribute-index"));
            self.attributes.splice(index, 1);
            self.render(true);
        });
        html.find('button[name="newAttribute"]').click(function(){
            self.attributes.push({
                name: "",
                path: "",
                img: ""
            })
            self.render(true);
        });
    }

    async _updateObject(event, formData) {

        const newSettings = [];
        for(let [path, value] of Object.entries(formData)){
            setProperty(newSettings, path, value)
        }

        game.settings.set(CONSTANTS.MODULE_NAME, "extractableAttributes", newSettings);

    }

}