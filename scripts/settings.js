import CONSTANTS from "./constants.js";
import { ItemPileAttributeEditor } from "./formapplications/itemPileAttributeEditor.js";
import { SYSTEMS } from "./systems.js";

function defaultSettings() {
    return {
        "dynamicAttributes": {
            scope: "world",
            config: false,
            default: SYSTEMS.DATA.DYNAMIC_ATTRIBUTES,
            type: Array
        },
        "actorClassType": {
            name: "ITEM-PILES.Setting.ActorClass.Title",
            hint: "ITEM-PILES.Setting.ActorClass.Label",
            scope: "world",
            config: true,
            default: SYSTEMS.DATA.ACTOR_CLASS_TYPE,
            type: String
        },
        "itemQuantityAttribute": {
            name: "ITEM-PILES.Setting.Quantity.Title",
            hint: "ITEM-PILES.Setting.Quantity.Label",
            scope: "world",
            config: true,
            default: SYSTEMS.DATA.ITEM_QUANTITY_ATTRIBUTE,
            type: String
        },
        "itemTypeAttribute": {
            name: "ITEM-PILES.Setting.ItemType.Title",
            hint: "ITEM-PILES.Setting.ItemType.Label",
            scope: "world",
            config: true,
            default: SYSTEMS.DATA.ITEM_TYPE_ATTRIBUTE,
            type: String
        },
        "itemTypeFilters": {
            name: "ITEM-PILES.Setting.ItemTypeFilters.Title",
            hint: "ITEM-PILES.Setting.ItemTypeFilters.Label",
            scope: "world",
            config: true,
            default: SYSTEMS.DATA.ITEM_TYPE_FILTERS,
            type: String
        },
        "deleteEmptyPiles": {
            name: "ITEM-PILES.Setting.DeleteEmptyPiles.Title",
            hint: "ITEM-PILES.Setting.DeleteEmptyPiles.Label",
            scope: "world",
            config: true,
            default: false,
            type: Boolean
        },
        "preloadFiles": {
            name: "ITEM-PILES.Setting.PreloadFiles.Title",
            hint: "ITEM-PILES.Setting.PreloadFiles.Label",
            scope: "client",
            config: true,
            default: true,
            type: Boolean
        }
    }
}

export default function registerSettings() {

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "resetAllSettings", {
        name: "ITEM-PILES.Setting.Reset.Title",
        label: "ITEM-PILES.Setting.Reset.Label",
        hint: "ITEM-PILES.Setting.Reset.Hint",
        icon: "fas fa-coins",
        type: ResetSettingsDialog,
        restricted: true
    });

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "openDynamicAttributesEditor", {
        name: "ITEM-PILES.Setting.Attributes.Title",
        label: "ITEM-PILES.Setting.Attributes.Label",
        hint: "ITEM-PILES.Setting.Attributes.Hint",
        icon: "fas fa-coins",
        type: ItemPileAttributeEditor,
        restricted: true
    });

    const settings = defaultSettings();
    for (const [name, data] of Object.entries(settings)) {
        game.settings.register(CONSTANTS.MODULE_NAME, name, data);
    }

    game.settings.register(CONSTANTS.MODULE_NAME, "defaultItemPileActorID", {
        scope: "world",
        config: false,
        default: "",
        type: String
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "debug", {
        name: "ITEM-PILES.Setting.Debug.Title",
        hint: "ITEM-PILES.Setting.Debug.Label",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "debugHooks", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });

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
                    callback: () => {
                        resetSettings();
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Cancel")
                }
            },
            default: "cancel"
        })
    }
}

async function resetSettings() {
    const settings = defaultSettings();
    for (const [name, data] of Object.entries(settings)) {
        await game.settings.set(CONSTANTS.MODULE_NAME, name, data.default);
    }
    window.location.reload();
}