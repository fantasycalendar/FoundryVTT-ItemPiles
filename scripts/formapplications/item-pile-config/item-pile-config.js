import { TJSDialog }          from '@typhonjs-fvtt/runtime/svelte/application';

import ItemPileConfigShell from './item-pile-config.svelte';
import {CONSTANTS, MODULE_SETTINGS} from "../../constants";
import * as lib from "../../lib/lib";
import PriceModifiersEditor from "../editors/price-modifiers-editor/price-modifiers-editor";
import CurrenciesEditor from "../editors/currency-editor/currencies-editor";
import ItemFiltersEditor from "../editors/item-filters-editor/item-filters-editor";
import {dialogLayout, getDocument} from "../../lib/utils";
import API from "../../api";

export default class ItemPileConfig extends TJSDialog {

    constructor(target, options = {}, dialogData = {}) {

        let document = getDocument(target?.token ?? target);
        let pileData = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, lib.getItemPileData(document));

        super({
            ...dialogData,
            title: `${game.i18n.localize("ITEM-PILES.ItemPileConfig.Title")}: ${document.data.name}`,
            id: `item-pile-config-${document.uuid}`,
            zIndex: 50,
            content: {
                class: ItemPileConfigShell,
                props: {
                    pileData
                }
            },
            autoClose: true, // Don't automatically close on button onclick.
            close: () => this.options.resolve?.(null)
        }, {
            width: 430,
            resizable: true,
            classes: ["sheet", "item-piles-config"],
            tabs: [{ navSelector: ".tabs", contentSelector: ".tab-body", initial: "mainsettings" }],
            ...options
        });
        this.document = document;
        this.overrideCurrencies = false;
        this.overrideItemFilters = false;
        this.overridePriceModifiers = pileData.overridePriceModifiers;
    }

    async showCurrenciesEditor() {
        const pileData = this.svelte.applicationShell.pileData;
        const data = pileData?.overrideCurrencies ?? MODULE_SETTINGS.CURRENCIES;
        return CurrenciesEditor.show(data, { id: `item-pile-config-${this.document.uuid}` })
            .then((result) => {
                this.overrideCurrencies = result;
            });
    }

    async showItemFiltersEditor() {
        const pileData = this.svelte.applicationShell.pileData;
        const data = pileData?.overrideItemFilters ?? MODULE_SETTINGS.ITEM_FILTERS;
        return ItemFiltersEditor.show(data, { id: `item-pile-config-${this.document.uuid}` })
            .then((result) => {
                this.overrideItemFilters = result;
            });
    }

    async showActorPriceOverrides() {
        const data = this.overridePriceModifiers || [];
        return PriceModifiersEditor.show(data, { id: `item-pile-config-${this.document.uuid}` })
            .then((result) => {
                this.overridePriceModifiers = result;
            });
    }

    async resetSharingData() {
        return new Dialog({
            title: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
            content: dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Content") }),
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Confirm"),
                    callback: () => {
                        lib.clearItemPileSharingData(this.svelte.applicationShell.document);
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

    async update(pileSettings){

        let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        const data = foundry.utils.mergeObject(defaults, pileSettings);

        data.overrideCurrencies = data.overrideCurrencies ? this.overrideCurrencies : false;
        data.overrideItemFilters = data.overrideItemFilters ? this.overrideItemFilters : false;
        data.overridePriceModifiers = this.overridePriceModifiers;

        data.deleteWhenEmpty = {
            "default": "default",
            "true": true,
            "false": false
        }[data.deleteWhenEmpty];

        API.updateItemPile(this.document, data).then(() => {
            API.rerenderItemPileInventoryApplication(this.document.uuid);
        });

    }

    static async show(document, options = {}, dialogData = {}) {
        return new Promise((resolve) => {
            options.resolve = resolve;
            new this(document, options, dialogData).render(true);
        })
    }
}