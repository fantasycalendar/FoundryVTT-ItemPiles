import CONSTANTS from "./constants.js";
import { ItemPileAttributeEditor } from "./formapplications/itemPileAttributeEditor.js";
import { SYSTEMS } from "./systems.js";
import * as lib from "./lib/lib.js";

function defaultSettings(apply = false) {
    return {
        "dynamicAttributes": {
            scope: "world",
            config: false,
            default: apply && SYSTEMS.DATA ? SYSTEMS.DATA.DYNAMIC_ATTRIBUTES : [],
            type: Array
        },
        "actorClassType": {
            name: "ITEM-PILES.Setting.ActorClass.Title",
            hint: "ITEM-PILES.Setting.ActorClass.Label",
            scope: "world",
            config: true,
            default: apply && SYSTEMS.DATA ? SYSTEMS.DATA.ACTOR_CLASS_TYPE : game.system.template.Actor.types[0],
            type: String
        },
        "itemQuantityAttribute": {
            name: "ITEM-PILES.Setting.Quantity.Title",
            hint: "ITEM-PILES.Setting.Quantity.Label",
            scope: "world",
            config: true,
            default: apply && SYSTEMS.DATA ? SYSTEMS.DATA.ITEM_QUANTITY_ATTRIBUTE : "",
            type: String
        },
        "itemTypeAttribute": {
            name: "ITEM-PILES.Setting.ItemType.Title",
            hint: "ITEM-PILES.Setting.ItemType.Label",
            scope: "world",
            config: true,
            default: apply && SYSTEMS.DATA ? SYSTEMS.DATA.ITEM_TYPE_ATTRIBUTE : "",
            type: String
        },
        "itemTypeFilters": {
            name: "ITEM-PILES.Setting.ItemTypeFilters.Title",
            hint: "ITEM-PILES.Setting.ItemTypeFilters.Label",
            scope: "world",
            config: true,
            default: apply && SYSTEMS.DATA ? SYSTEMS.DATA.ITEM_TYPE_FILTERS : "",
            type: String
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

    game.settings.register(CONSTANTS.MODULE_NAME, "deleteEmptyPiles", {
        name: "ITEM-PILES.Setting.DeleteEmptyPiles.Title",
        hint: "ITEM-PILES.Setting.DeleteEmptyPiles.Label",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "preloadFiles", {
        name: "ITEM-PILES.Setting.PreloadFiles.Title",
        hint: "ITEM-PILES.Setting.PreloadFiles.Label",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });

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

    game.settings.register(CONSTANTS.MODULE_NAME, "systemFound", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });

    game.settings.register(CONSTANTS.MODULE_NAME, 'monksActiveTilesDropItemWarning', {
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
                        applyDefaultSettings();
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
    const settings = defaultSettings(true);
    for (const [name, data] of Object.entries(settings)) {
        await game.settings.set(CONSTANTS.MODULE_NAME, name, data.default);
    }
}

export async function checkSystem(){

    if(game.system.id === "dnd5e") return;

    if(!SYSTEMS.DATA){

        if(game.settings.get(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown")) return;

        await game.settings.set(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown", true);

        return Dialog.prompt({
            title: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Title"),
            content: lib.dialogWarning(game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Content")),
            callback: () => {}
        });

    }

    if(game.settings.get(CONSTANTS.MODULE_NAME, "systemFound")) return;

    game.settings.set(CONSTANTS.MODULE_NAME, "systemFound", true);

    if(game.settings.get(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown")){

        await new Dialog({
            title: game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Title"),
            content: lib.dialogWarning(game.i18n.localize("ITEM-PILES.Dialogs.SystemFound.Content"), "fas fa-search"),
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

    }else if(!game.settings.get(CONSTANTS.MODULE_NAME, "itemTypeAttribute")){

        applyDefaultSettings();

    }
}

export async function checkIncompatibilities(){


    if(game.settings.get('monks-active-tiles', 'drop-item') && !game.settings.get(CONSTANTS.MODULE_NAME, 'monksActiveTilesDropItemWarning')){
        await Dialog.prompt({
            title: "Module Incompatibility",
            content: lib.dialogWarning(`The module "Monks Active Tile Triggers" has a setting called "Drop Item on Canvas", which when enabled creates a tile when an item is dropped on the canvas. This clashes with Item Piles, and it is recommended you turn this setting off.`),
            label: "OK",
            callback: () => {
                game.settings.set(CONSTANTS.MODULE_NAME, 'monksActiveTilesDropItemWarning', true)
            }
        });
    }


}