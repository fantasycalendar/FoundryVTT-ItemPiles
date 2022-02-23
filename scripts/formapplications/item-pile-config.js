import CONSTANTS from "../constants.js";
import API from "../api.js";
import * as lib from "../lib/lib.js";
import { CurrenciesEditor, ItemFiltersEditor, PriceModifiersEditor } from "./base-config-dialog.js";

export class ItemPileConfig extends FormApplication {

    constructor(actor) {
        super();
        this.document = actor?.token ?? actor;
        this.pileData = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, lib.getItemPileData(this.document));
        this.actorPriceOverridesEditor = false;
        this.currenciesEditor = false;
        this.itemFiltersEditor = false;
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "item-piles-config"],
            template: `${CONSTANTS.PATH}templates/item-pile-config.html`,
            width: 430,
            resizable: true,
            tabs: [{ navSelector: ".tabs", contentSelector: ".tab-body", initial: "mainsettings" }]
        });
    }

    get title() {
        return `${game.i18n.localize("ITEM-PILES.ItemPileConfig.Title")}: ${this.document.data.name}`
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

        html.find("input").keydown(function(e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                $(this).change();
                return false;
            }
        });

        this.activateMainListeners(html);
        this.activateSharingListeners(html);
        this.activateMerchantListeners(html);
    }

    activateMainListeners(html){

        const self = this;
        const enabledCheckbox = html.find('input[name="enabled"]');
        const scaleCheckbox = html.find('input[name="overrideSingleItemScale"]');
        const displayOneCheckbox = html.find('input[name="displayOne"]');
        const containerCheckbox = html.find('input[name="isContainer"]');
        const overrideItemFiltersEnabledCheckbox = html.find('.item-piles-config-override-item-filters-checkbox');
        const overrideCurrenciesEnabledCheckbox = html.find('.item-piles-config-override-currencies-checkbox');

        const slider = html.find(".item-piles-scaleRange");
        const input = html.find(".item-piles-scaleInput");

        enabledCheckbox.change(async function () {
            let isEnabled = $(this).is(":checked");
            const existingData = lib.getItemPileData(self.document);
            if (isEnabled && !existingData?.enabled) {
                const isLinked = self.document instanceof Actor
                    ? self.document.data.token.actorLink
                    : self.document.isLinked;
                if (isLinked) {
                    const doContinue = await Dialog.confirm({
                        title: game.i18n.localize("ITEM-PILES.Dialogs.LinkedActorWarning.Title"),
                        content: lib.dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.LinkedActorWarning.Content") }),
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
            slider.parent().toggleClass("item-piles-disabled", isDisabled);
        }).change();

        displayOneCheckbox.change(function () {
            let isEnabled = $(this).is(":checked");
            let isScale = scaleCheckbox.is(":checked");
            let isContainer = containerCheckbox.is(":checked");

            slider.prop('disabled', !isEnabled || !isScale);
            input.prop('disabled', !isEnabled || !isScale);
            slider.parent().toggleClass("item-piles-disabled", !isEnabled || !isScale);

            scaleCheckbox.prop('disabled', !isEnabled);
            scaleCheckbox.parent().toggleClass("item-piles-disabled", !isEnabled);

            html.find('input[name="showItemName"]').prop('disabled', !isEnabled);
            html.find('input[name="showItemName"]').parent().toggleClass("item-piles-disabled", !isEnabled);

            html.find(".display-one-warning").css("display", isEnabled && isContainer ? "block" : "none");
            self.setPosition();
        }).change();

        containerCheckbox.change(function () {
            let isEnabled = $(this).is(":checked");
            let isDisplayOne = displayOneCheckbox.is(":checked");
            html.find(".display-one-warning").css("display", isEnabled && isDisplayOne ? "block" : "none");
        }).change();

        overrideCurrenciesEnabledCheckbox.change(function () {
            let isChecked = $(this).is(":checked");
            if (isChecked) {
                self.pileData.overrideCurrencies = game.settings.get(CONSTANTS.MODULE_NAME, "currencies");
            }
            html.find(".item-piles-config-configure-override-currencies").prop('disabled', !isChecked);
        })

        html.find(".item-piles-config-configure-override-currencies").click(function () {
            self.showCurrenciesEditor();
        })

        overrideItemFiltersEnabledCheckbox.change(function () {
            let isChecked = $(this).is(":checked");
            if (isChecked) {
                self.pileData.overrideItemFilters = game.settings.get(CONSTANTS.MODULE_NAME, "itemFilters");
            }
            html.find(".item-piles-config-configure-override-item-filters").prop('disabled', !isChecked);
        })

        html.find(".item-piles-config-configure-override-item-filters").click(function () {
            self.showItemFiltersEditor();
        })

        html.find('input[type="range"]').on("input", function () {
            $(this).next().val($(this).val());
        })

        html.find('input[type="range"]').next().on("change", function () {
            $(this).prev().val($(this).val());
        })

    }

    activateSharingListeners(html){
        const self = this;
        const takeAllButtonCheckbox = html.find('input[name="takeAllEnabled"]');
        const shareItemsEnabledCheckbox = html.find('input[name="shareItemsEnabled"]');
        const shareAttributesEnabledCheckbox = html.find('input[name="shareCurrenciesEnabled"]');

        shareItemsEnabledCheckbox.change(function () {
            const isDisabled = shareItemsEnabledCheckbox.is(":checked") || shareAttributesEnabledCheckbox.is(":checked");
            takeAllButtonCheckbox.prop("disabled", isDisabled).parent().toggleClass("item-piles-disabled", isDisabled);
            if (isDisabled && takeAllButtonCheckbox.is(':checked')) {
                takeAllButtonCheckbox.prop('checked', false)
            }
        });

        shareAttributesEnabledCheckbox.change(function () {
            const isDisabled = shareItemsEnabledCheckbox.is(":checked") || shareAttributesEnabledCheckbox.is(":checked");
            takeAllButtonCheckbox.prop("disabled", isDisabled).parent().toggleClass("item-piles-disabled", isDisabled);
            if (isDisabled && takeAllButtonCheckbox.is(':checked')) {
                takeAllButtonCheckbox.prop('checked', false)
            }
        }).change();

        html.find(".item-piles-config-reset-sharing-data").click(function () {
            self.resetSharingData();
        })

    }

    activateMerchantListeners(html){
        const self = this;
        const enabledOpenTimesCheck = html.find('.item-piles-config-open-times-enable');
        const openTimesContainer = html.find('.item-piles-open-times-container')
        const configurePriceModifiers = html.find('.item-piles-config-configure-override-price-modifiers');

        enabledOpenTimesCheck.change(function () {
            const isEnabled = enabledOpenTimesCheck.is(":checked");
            openTimesContainer.find('input').prop("disabled", !isEnabled).parent().parent().parent().toggleClass("item-piles-disabled", !isEnabled);
        }).change();

        configurePriceModifiers.click(function(){
            self.showActorPriceOverrides();
        })

    }

    async showActorPriceOverrides() {
        if (this.actorPriceOverridesEditor) {
            return this.actorPriceOverridesEditor.render(false, { focus: true });
        }
        const [promise, UI] = PriceModifiersEditor.show(this.pileData.overridePriceModifiers ?? []);
        this.actorPriceOverridesEditor = UI;
        promise.then(newSettings => {
            this.actorPriceOverridesEditor = false;
            if (newSettings) {
                this.pileData.overridePriceModifiers = newSettings;
            }
        });
    }

    async showCurrenciesEditor() {
        if (this.currenciesEditor) {
            return this.currenciesEditor.render(false, { focus: true });
        }
        const [promise, UI] = CurrenciesEditor.show(this.pileData.overrideCurrencies);
        this.currenciesEditor = UI;
        promise.then(newSettings => {
            this.currenciesEditor = false;
            if (newSettings) {
                this.pileData.overrideCurrencies = newSettings;
            }
        });
    }

    async showItemFiltersEditor() {
        if (this.itemFiltersEditor) {
            return this.itemFiltersEditor.render(false, { focus: true });
        }
        const [promise, UI] = ItemFiltersEditor.show(this.pileData.overrideItemFilters);
        this.itemFiltersEditor = UI;
        promise.then(newSettings => {
            this.itemFiltersEditor = false;
            if (newSettings) {
                this.pileData.overrideItemFilters = newSettings;
            }
        });
    }

    async resetSharingData() {
        return new Dialog({
            title: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
            content: lib.dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Content") }),
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Confirm"),
                    callback: () => {
                        lib.clearItemPileSharingData(this.document);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("No")
                }
            },
            default: "cancel"
        }).render(true);
    }

    async _updateObject(event, formData) {

        const pileSettings = {};
        for (let [path, value] of Object.entries(formData)) {
            setProperty(pileSettings, path, value)
        }

        let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        const data = foundry.utils.mergeObject(defaults, pileSettings);

        const overrideCurrenciesChecked = this.element.find('.item-piles-config-override-currencies-checkbox').is(":checked");
        data.overrideCurrencies = overrideCurrenciesChecked ? this.pileData.overrideCurrencies : false;

        const overrideItemFiltersChecked = this.element.find('.item-piles-config-override-item-filters-checkbox').is(":checked");
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
        if (this.currenciesEditor) {
            this.currenciesEditor.close();
        }
        if (this.itemFiltersEditor) {
            this.itemFiltersEditor.close();
        }
    }

}