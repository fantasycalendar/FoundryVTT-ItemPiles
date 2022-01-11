import CONSTANTS from "../constants.js";
import API from "../api.js";
import { ItemPileAttributeEditor } from "./itemPileAttributeEditor.js";
import * as lib from "../lib/lib.js";
import { itemPileSocket } from "../socket.js";

export class ItemPileConfig extends FormApplication {

    constructor(actor) {
        super();
        this.document = actor?.token ?? actor;
        const flags = lib.getItemPileData(this.document);
        this.pileData = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, flags);
        this.attributeEditor = false;
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "item-pile-config"],
            template: `${CONSTANTS.PATH}templates/item-pile-config.html`,
            width: 430,
            height: "auto",
            resizable: false,
            tabs: [{ navSelector: ".tabs", contentSelector: ".tab-body", initial: "mainsettings" }]
        });
    }

    get title() {
        return `${game.i18n.localize("ITEM-PILES.Defaults.Title")}: ${this.document.data.name}`
    }

    static show(actor) {
        const document = actor?.token ?? actor;
        for (let app of Object.values(ui.windows)) {
            if (app instanceof this && app.document === document) {
                return app.render(false, { focus: true });
            }
        }
        return new ItemPileConfig(actor).render(true);
    }

    /* -------------------------------------------- */

    async getData(options) {
        let data = super.getData(options);
        data = foundry.utils.mergeObject(data, this.pileData);
        data.defaultItemTypeFilters = API.ITEM_TYPE_FILTERS.length
            ? "Defaults: " + Array.from(API.ITEM_TYPE_FILTERS).join(', ')
            : "Input item type filters...";
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        const enabledCheckbox = html.find('input[name="enabled"]');
        const scaleCheckbox = html.find('input[name="overrideSingleItemScale"]');
        const displayOneCheckbox = html.find('input[name="displayOne"]');
        const containerCheckbox = html.find('input[name="isContainer"]');
        const overrideAttributesEnabledCheckbox = html.find('.item-pile-config-override-attributes-checkbox');

        const slider = html.find("#scaleRange");
        const input = html.find("#scaleInput");

        enabledCheckbox.change(async function () {
            let isEnabled = $(this).is(":checked");
            const existingData = lib.getItemPileData(self.document);
            if(isEnabled && !existingData?.enabled) {
                const isLinked = self.document instanceof Actor
                    ? self.document.data.token.actorLink
                    : self.document.isLinked;
                if(isLinked){
                    const doContinue = await Dialog.confirm({
                        title: game.i18n.localize("ITEM-PILES.Dialogs.LinkedActorWarning.Title"),
                        content: lib.dialogWarning(game.i18n.localize("ITEM-PILES.Dialogs.LinkedActorWarning.Content")),
                        defaultYes: false
                    });
                    if (!doContinue) {
                        $(this).prop("checked", false);
                    }
                }
            }
        })

        scaleCheckbox.change(function () {
            let isDisabled = !$(this).is(":checked") || !displayOneCheckbox.is(":checked");
            slider.prop('disabled', isDisabled);
            input.prop('disabled', isDisabled);
            slider.parent().toggleClass("item-pile-disabled", isDisabled);
        }).change();

        displayOneCheckbox.change(function () {
            let isEnabled = $(this).is(":checked");
            let isScale = scaleCheckbox.is(":checked");
            let isContainer = containerCheckbox.is(":checked");

            slider.prop('disabled', !isEnabled || !isScale);
            input.prop('disabled', !isEnabled || !isScale);
            slider.parent().toggleClass("item-pile-disabled", !isEnabled || !isScale);

            scaleCheckbox.prop('disabled', !isEnabled);
            scaleCheckbox.parent().toggleClass("item-pile-disabled", !isEnabled);

            html.find(".display-one-warning").css("display", isEnabled && isContainer ? "block" : "none");
            self.setPosition();
        }).change();

        containerCheckbox.change(function () {
            let isEnabled = $(this).is(":checked");
            let isDisplayOne = displayOneCheckbox.is(":checked");
            html.find(".display-one-warning").css("display", isEnabled && isDisplayOne ? "block" : "none");
        }).change();

        overrideAttributesEnabledCheckbox.change(function () {
            let isChecked = $(this).is(":checked");
            if (isChecked) {
                self.pileData.overrideAttributes = game.settings.get(CONSTANTS.MODULE_NAME, "dynamicAttributes");
            }
        })

        html.find(".item-pile-config-configure-override-attributes").click(function () {
            self.showAttributeEditor();
        })

        slider.on("input", function () {
            input.val($(this).val());
        })
        input.change(function () {
            slider.slider('value', $(this).val());
        })
    }

    async showAttributeEditor() {
        if (this.attributeEditor) {
            return this.attributeEditor.render(false, { focus: true });
        }
        const [promise, UI] = ItemPileAttributeEditor.showForPile(this.pileData.overrideAttributes);
        this.attributeEditor = UI;
        promise.then(newSettings => {
            this.attributeEditor = false;
            this.pileData.overrideAttributes = newSettings;
        });
    }

    async _updateObject(event, formData) {

        let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        const data = foundry.utils.mergeObject(defaults, formData);

        const checked = this.element.find('.item-pile-config-override-attributes-checkbox').is(":checked");

        data.overrideAttributes = checked ? this.pileData.overrideAttributes : false;

        if (!formData.enabled) {
            setTimeout(canvas.tokens.hud.render(true), 250);
        }

        formData.deleteWhenEmpty = {
            "default": "default",
            "true": true,
            "false": false
        }[formData.deleteWhenEmpty];

        API.updateItemPile(this.document, data).then(() => {
            API.rerenderItemPileInventoryApplication(this.document.uuid);
        });

    }

    async close(...args) {
        super.close(...args);
        if (this.attributeEditor) {
            this.attributeEditor.close();
        }
    }

}