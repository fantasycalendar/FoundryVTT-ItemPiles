import CONSTANTS from "../constants.js";
import API from "../api.js";
import { ItemPileAttributeEditor } from "./itemPileAttributeEditor.js";
import * as lib from "../lib/lib.js";
import { ItemPileFiltersEditor } from "./itemPileFiltersEditor.js";

export class ItemPileConfig extends FormApplication {

    constructor(actor) {
        super();
        this.document = actor?.token ?? actor;
        this.pileData = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, lib.getItemPileData(this.document));
        this.attributeEditor = false;
        this.itemFiltersEditor = false;
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
        data.flagData = foundry.utils.mergeObject(foundry.utils.duplicate(data), foundry.utils.duplicate(this.pileData));
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        const enabledCheckbox = html.find('input[name="enabled"]');
        const scaleCheckbox = html.find('input[name="overrideSingleItemScale"]');
        const displayOneCheckbox = html.find('input[name="displayOne"]');
        const containerCheckbox = html.find('input[name="isContainer"]');
        const overrideItemFiltersEnabledCheckbox = html.find('.item-pile-config-override-item-filters-checkbox');
        const overrideAttributesEnabledCheckbox = html.find('.item-pile-config-override-attributes-checkbox');

        const slider = html.find(".item-piles-scaleRange");
        const input = html.find(".item-piles-scaleInput");

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
            html.find(".item-pile-config-configure-override-attributes").prop('disabled', !isChecked);
        })

        html.find(".item-pile-config-configure-override-attributes").click(function () {
            self.showAttributeEditor();
        })

        overrideItemFiltersEnabledCheckbox.change(function() {
            let isChecked = $(this).is(":checked");
            if (isChecked) {
                self.pileData.overrideItemFilters = game.settings.get(CONSTANTS.MODULE_NAME, "itemFilters");
            }
            html.find(".item-pile-config-configure-override-item-filters").prop('disabled', !isChecked);
        })

        html.find(".item-pile-config-configure-override-item-filters").click(function () {
            self.showItemFiltersEditor();
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
            if(newSettings) {
                this.pileData.overrideAttributes = newSettings;
            }
        });
    }

    async showItemFiltersEditor() {
        if (this.itemFiltersEditor) {
            return this.itemFiltersEditor.render(false, { focus: true });
        }
        const [promise, UI] = ItemPileFiltersEditor.showForPile(this.pileData.overrideItemFilters);
        this.itemFiltersEditor = UI;
        promise.then(newSettings => {
            this.itemFiltersEditor = false;
            if(newSettings) {
                console.log(newSettings)
                this.pileData.overrideItemFilters = newSettings;
            }
        });
    }

    async _updateObject(event, formData) {

        let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        const data = foundry.utils.mergeObject(defaults, formData);

        const overrideAttributesChecked = this.element.find('.item-pile-config-override-attributes-checkbox').is(":checked");
        data.overrideAttributes = overrideAttributesChecked ? this.pileData.overrideAttributes : false;

        const overrideItemFiltersChecked = this.element.find('.item-pile-config-override-item-filters-checkbox').is(":checked");
        data.overrideItemFilters = overrideItemFiltersChecked ? this.pileData.overrideItemFilters : false;

        data.deleteWhenEmpty = {
            "default": "default",
            "true": true,
            "false": false
        }[data.deleteWhenEmpty];

        API.updateItemPile(this.document, data).then(() => {
            API.rerenderItemPileInventoryApplication(this.document.uuid);
        });

    }

    async close(...args) {
        super.close(...args);
        if (this.attributeEditor) {
            this.attributeEditor.close();
        }
        if (this.itemFiltersEditor) {
            this.itemFiltersEditor.close();
        }
    }

}