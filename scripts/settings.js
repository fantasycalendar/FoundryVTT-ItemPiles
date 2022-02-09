import { CurrenciesEditor } from "./formapplications/currencies-editor.js";
import { SYSTEMS } from "./systems.js";
import * as lib from "./lib/lib.js";
import { ItemFiltersEditor } from "./formapplications/item-filters-editor.js";
import migrations from "./migrations.js";
import { ItemSimilaritiesEditor } from "./formapplications/item-similarities-editor.js";
import CONSTANTS from "./constants.js";


const debounceReload = foundry.utils.debounce(() => {
    window.location.reload();
}, 100);

function defaultSettings() {
    return {
        "currencies": {
            scope: "world",
            config: false,
            default: SYSTEMS.DATA ? SYSTEMS.DATA.CURRENCIES : [],
            type: Array
        },
        "itemFilters": {
            scope: "world",
            config: false,
            default: SYSTEMS.DATA ? SYSTEMS.DATA.ITEM_FILTERS : [],
            type: Array
        },
        "actorClassType": {
            name: "ITEM-PILES.Setting.ActorClass.Title",
            hint: "ITEM-PILES.Setting.ActorClass.Label",
            scope: "world",
            config: true,
            default: SYSTEMS.DATA ? SYSTEMS.DATA.ACTOR_CLASS_TYPE : game.system.template.Actor.types[0],
            type: String
        },
        "itemQuantityAttribute": {
            name: "ITEM-PILES.Setting.Quantity.Title",
            hint: "ITEM-PILES.Setting.Quantity.Label",
            scope: "world",
            config: true,
            default: SYSTEMS.DATA ? SYSTEMS.DATA.ITEM_QUANTITY_ATTRIBUTE : "",
            type: String
        },
        "itemPriceAttribute": {
            name: "ITEM-PILES.Setting.Price.Title",
            hint: "ITEM-PILES.Setting.Price.Label",
            scope: "world",
            config: true,
            default: SYSTEMS.DATA ? SYSTEMS.DATA.ITEM_PRICE_ATTRIBUTE : "",
            type: String
        },
        "itemSimilarities": {
            name: "ITEM-PILES.Setting.ItemSimilarities.Title",
            hint: "ITEM-PILES.Setting.ItemSimilarities.Label",
            scope: "world",
            config: false,
            default: SYSTEMS.DATA ? SYSTEMS.DATA.ITEM_SIMILARITIES : ['name', 'type'],
            type: Array
        }
    }
}

const otherSettings = {

    "outputToChat": {
        name: "ITEM-PILES.Setting.OutputToChat.Title",
        hint: "ITEM-PILES.Setting.OutputToChat.Label",
        scope: "world",
        config: true,
        default: 1,
        choices: [
            "ITEM-PILES.Setting.OutputToChat.Off",
            "ITEM-PILES.Setting.OutputToChat.Public",
            "ITEM-PILES.Setting.OutputToChat.SelfGM",
            "ITEM-PILES.Setting.OutputToChat.Blind",
        ],
        type: Number
    },

    "deleteEmptyPiles": {
        name: "ITEM-PILES.Setting.DeleteEmptyPiles.Title",
        hint: "ITEM-PILES.Setting.DeleteEmptyPiles.Label",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    },

    "enableTrading": {
        name: "ITEM-PILES.Setting.EnableTrading.Title",
        hint: "ITEM-PILES.Setting.EnableTrading.Hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        onChange: debounceReload
    },

    "showTradeButton": {
        name: "ITEM-PILES.Setting.ShowTradeButton.Title",
        hint: "ITEM-PILES.Setting.ShowTradeButton.Hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        onChange: debounceReload
    },

    "invertSheetOpen": {
        name: "ITEM-PILES.Setting.InvertSheetOpen.Title",
        hint: "ITEM-PILES.Setting.InvertSheetOpen.Label",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    },

    "hideActorHeaderText": {
        name: "ITEM-PILES.Setting.HideActorHeaderText.Title",
        hint: "ITEM-PILES.Setting.HideActorHeaderText.Label",
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
        onChange: debounceReload
    },

    "preloadFiles": {
        name: "ITEM-PILES.Setting.PreloadFiles.Title",
        hint: "ITEM-PILES.Setting.PreloadFiles.Label",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    },

    "defaultItemPileActorID": {
        scope: "world",
        config: false,
        default: "",
        type: String
    },

    "debug": {
        name: "ITEM-PILES.Setting.Debug.Title",
        hint: "ITEM-PILES.Setting.Debug.Label",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    },

    "debugHooks": {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    },

    "systemFound": {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    },

    "systemNotFoundWarningShown": {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    }
}

export function registerSettings() {

    const freshCopy = !game.settings.storage.get("world").getSetting(`${CONSTANTS.MODULE_NAME}.debug`);

    const hasFlagMigrationVersion = !!game.settings.storage.get("world").getSetting(`${CONSTANTS.MODULE_NAME}.flagMigrationVersion`);

    game.settings.register(CONSTANTS.MODULE_NAME, "flagMigrationVersion", {
        scope: "world",
        config: false,
        default: !hasFlagMigrationVersion && freshCopy ? migrations.latestFlagVersion : "1.0.0",
        type: String
    });

    const hasSettingMigrationVersion = !!game.settings.storage.get("world").getSetting(`${CONSTANTS.MODULE_NAME}.settingMigrationVersion`);

    game.settings.register(CONSTANTS.MODULE_NAME, "settingMigrationVersion", {
        scope: "world",
        config: false,
        default: !hasSettingMigrationVersion && freshCopy ? migrations.latestSettingVersion : "1.0.0",
        type: String
    });

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "resetAllSettings", {
        name: "ITEM-PILES.Setting.Reset.Title",
        label: "ITEM-PILES.Setting.Reset.Label",
        hint: "ITEM-PILES.Setting.Reset.Hint",
        icon: "fas fa-coins",
        type: ResetSettingsDialog,
        restricted: true
    });

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "openCurrenciesEditor", {
        name: "ITEM-PILES.Setting.Currencies.Title",
        label: "ITEM-PILES.Setting.Currencies.Label",
        hint: "ITEM-PILES.Setting.Currencies.Hint",
        icon: "fas fa-coins",
        type: CurrenciesEditor,
        restricted: true
    });

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "openItemFiltersEditor", {
        name: "ITEM-PILES.Setting.ItemFilters.Title",
        label: "ITEM-PILES.Setting.ItemFilters.Label",
        hint: "ITEM-PILES.Setting.ItemFilters.Hint",
        icon: "fas fa-list-ul",
        type: ItemFiltersEditor,
        restricted: true
    });

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "openItemSimilaritiesEditor", {
        name: "ITEM-PILES.Setting.ItemSimilarities.Title",
        label: "ITEM-PILES.Setting.ItemSimilarities.Label",
        hint: "ITEM-PILES.Setting.ItemSimilarities.Hint",
        icon: "fas fa-list-ul",
        type: ItemSimilaritiesEditor,
        restricted: true
    });

    const settings = defaultSettings();
    for (const [name, data] of Object.entries(settings)) {
        game.settings.register(CONSTANTS.MODULE_NAME, name, data);
    }

    for (const [name, data] of Object.entries(otherSettings)) {
        game.settings.register(CONSTANTS.MODULE_NAME, name, data);
    }
}

class ResetSettingsDialog extends FormApplication {
    constructor(...args) {
        super(...args);
        return new Dialog({
            title: game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Title"),
            content: `<p style="margin-bottom:1rem;">${game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Content")}</p>`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Confirm"),
                    callback: async () => {
                        await applyDefaultSettings();
                        window.location.reload();
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ITEM-PILES.Dialogs.Cancel")
                }
            },
            default: "cancel"
        })
    }
}

async function applyDefaultSettings() {
    const settings = defaultSettings();
    for (const [name, data] of Object.entries(settings)) {
        await game.settings.set(CONSTANTS.MODULE_NAME, name, data.default);
    }
}

export async function checkSystem(){

    if(!SYSTEMS.DATA){

        if(game.settings.get(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown")) return;

        await game.settings.set(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown", true);

        return Dialog.prompt({
            title: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Title"),
            content: lib.dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Content") }),
            callback: () => {}
        });

    }

    if(game.settings.get(CONSTANTS.MODULE_NAME, "systemFound")) return;

    game.settings.set(CONSTANTS.MODULE_NAME, "systemFound", true);

    if(game.settings.get(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown")){

        return new Dialog({
            title: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Title"),
            content: lib.dialogLayout({ message: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Content"), icon: "fas fa-search" }),
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Confirm"),
                    callback: () => {
                        applyDefaultSettings();
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

    return applyDefaultSettings();
}

export function registerHandlebarHelpers(){

    Handlebars.registerHelper('concat', function(...args) {
        return args.filter(str => typeof str !== "object").join("");
    });

}