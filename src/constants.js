import {SYSTEMS} from "./systems.js";

const module_name = "item-piles";
const module_path = `modules/${module_name}/`;
const baseFlag = `flags.${module_name}.`

export const CONSTANTS = {

    MODULE_NAME: module_name,
    PATH: module_path,

    FLAGS: {
        PILE: baseFlag + "data",
        SHARING: baseFlag + "sharing",
        ITEM: baseFlag + "item"
    },

    ITEM_DEFAULTS: {
        override: false
    },

    PILE_DEFAULTS: {
        // Core settings
        enabled: false,
        distance: 1,
        macro: "",
        deleteWhenEmpty: "default",
        canInspectItems: true,

        // Overrides
        overrideItemFilters: false,
        overrideCurrencies: false,

        // Token settings
        displayOne: false,
        showItemName: false,
        overrideSingleItemScale: false,
        singleItemScale: 1.0,

        // Sharing settings
        shareItemsEnabled: false,
        shareCurrenciesEnabled: true,
        takeAllEnabled: false,
        splitAllEnabled: true,
        activePlayers: false,

        // Container settings
        container: {
            enabled: false,
            closed: false,
            locked: false,
            closedImage: "",
            emptyImage: "",
            openedImage: "",
            lockedImage: "",
            closeSound: "",
            openSound: "",
            lockedSound: "",
            unlockedSound: "",
        },

        // Merchant settings
        merchant: {
            enabled: false,
            priceModifier: 100,
            sellModifier: 50,
            overridePriceModifiers: [],
            openTimes: {
                enabled: false,
                open: {
                    hour: 9,
                    minute: 0
                },
                close: {
                    hour: 18,
                    minute: 0
                }
            }
        }
    },

    SETTINGS: {

        // Public settings
        OUTPUT_TO_CHAT: "outputToChat",
        DELETE_EMPTY_PILES: "deleteEmptyPiles",
        ENABLE_TRADING: "enableTrading",
        SHOW_TRADE_BUTTON: "showTradeButton",
        INVERT_SHEET_OPEN: "invertSheetOpen",
        HIDE_ACTOR_HEADER_TEXT: "hideActorHeaderText",
        PRELOAD_FILES: "preloadFiles",

        // Private Settings
        CURRENCIES: "currencies",
        ITEM_FILTERS: "itemFilters",
        ACTOR_CLASS_TYPE: "actorClassType",
        ITEM_QUANTITY_ATTRIBUTE: "itemQuantityAttribute",
        ITEM_PRICE_ATTRIBUTE: "itemPriceAttribute",
        ITEM_SIMILARITIES: "itemSimilarities",

        DEFAULT_ITEM_PILE_ACTOR_ID: "defaultItemPileActorID",
        DEBUG: "debug",
        DEBUG_HOOKS: "debugHooks",
        SYSTEM_FOUND: "systemFound",
        SYSTEM_NOT_FOUND_WARNING_SHOWN: "systemNotFoundWarningShown",
        PRECONFIGURED_SYSTEM: "preconfiguredSystem",

        GET_DEFAULT() {
            return foundry.utils.deepClone(CONSTANTS.SETTINGS.DEFAULTS())
        },

    }
}

CONSTANTS.SETTINGS.DEFAULTS = () => ({

    [CONSTANTS.SETTINGS.CURRENCIES]: {
        name: "ITEM-PILES.Settings.Currencies.Title",
        label: "ITEM-PILES.Settings.Currencies.Label",
        hint: "ITEM-PILES.Settings.Currencies.Hint",
        icon: "fa fa-money-bill-alt",
        application: "currencies",
        scope: "world",
        config: false,
        default: SYSTEMS.DATA.CURRENCIES,
        type: Object
    },

    [CONSTANTS.SETTINGS.ITEM_FILTERS]: {
        name: "ITEM-PILES.Settings.ItemFilters.Title",
        label: "ITEM-PILES.Settings.ItemFilters.Label",
        hint: "ITEM-PILES.Settings.ItemFilters.Hint",
        icon: "fa fa-filter",
        application: "item-filters",
        scope: "world",
        config: false,
        default: SYSTEMS.DATA.ITEM_FILTERS,
        type: Array
    },

    [CONSTANTS.SETTINGS.ITEM_SIMILARITIES]: {
        name: "ITEM-PILES.Settings.ItemSimilarities.Title",
        label: "ITEM-PILES.Settings.ItemSimilarities.Label",
        hint: "ITEM-PILES.Settings.ItemSimilarities.Hint",
        icon: "fa fa-equals",
        application: "item-similarities",
        scope: "world",
        config: false,
        default: SYSTEMS.DATA.ITEM_SIMILARITIES,
        type: Array
    },

    [CONSTANTS.SETTINGS.ACTOR_CLASS_TYPE]: {
        name: "ITEM-PILES.Settings.ActorClass.Title",
        hint: "ITEM-PILES.Settings.ActorClass.Hint",
        scope: "world",
        config: false,
        default: SYSTEMS.DATA.ACTOR_CLASS_TYPE,
        type: String
    },

    [CONSTANTS.SETTINGS.ITEM_QUANTITY_ATTRIBUTE]: {
        name: "ITEM-PILES.Settings.Quantity.Title",
        hint: "ITEM-PILES.Settings.Quantity.Hint",
        scope: "world",
        config: false,
        default: SYSTEMS.DATA.ITEM_QUANTITY_ATTRIBUTE,
        type: String
    },

    [CONSTANTS.SETTINGS.ITEM_PRICE_ATTRIBUTE]: {
        name: "ITEM-PILES.Settings.Price.Title",
        hint: "ITEM-PILES.Settings.Price.Hint",
        scope: "world",
        config: false,
        default: SYSTEMS.DATA.ITEM_PRICE_ATTRIBUTE,
        type: String
    },

    [CONSTANTS.SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID]: {
        scope: "world",
        config: false,
        default: "",
        type: String
    },

    [CONSTANTS.SETTINGS.SYSTEM_FOUND]: {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN]: {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.PRECONFIGURED_SYSTEM]: {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.OUTPUT_TO_CHAT]: {
        name: "ITEM-PILES.Settings.OutputToChat.Title",
        hint: "ITEM-PILES.Settings.OutputToChat.Hint",
        scope: "world",
        config: false,
        default: 1,
        choices: [
            "ITEM-PILES.Settings.OutputToChat.Off",
            "ITEM-PILES.Settings.OutputToChat.Public",
            "ITEM-PILES.Settings.OutputToChat.SelfGM",
            "ITEM-PILES.Settings.OutputToChat.Blind",
        ],
        type: Number
    },

    [CONSTANTS.SETTINGS.DELETE_EMPTY_PILES]: {
        name: "ITEM-PILES.Settings.DeleteEmptyPiles.Title",
        hint: "ITEM-PILES.Settings.DeleteEmptyPiles.Hint",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.ENABLE_TRADING]: {
        name: "ITEM-PILES.Settings.EnableTrading.Title",
        hint: "ITEM-PILES.Settings.EnableTrading.Hint",
        scope: "world",
        config: false,
        default: true,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.SHOW_TRADE_BUTTON]: {
        name: "ITEM-PILES.Settings.ShowTradeButton.Title",
        hint: "ITEM-PILES.Settings.ShowTradeButton.Hint",
        scope: "world",
        config: false,
        default: true,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.INVERT_SHEET_OPEN]: {
        name: "ITEM-PILES.Settings.InvertSheetOpen.Title",
        hint: "ITEM-PILES.Settings.InvertSheetOpen.Hint",
        scope: "client",
        config: false,
        default: false,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.HIDE_ACTOR_HEADER_TEXT]: {
        name: "ITEM-PILES.Settings.HideActorHeaderText.Title",
        hint: "ITEM-PILES.Settings.HideActorHeaderText.Hint",
        scope: "client",
        config: false,
        default: false,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.PRELOAD_FILES]: {
        name: "ITEM-PILES.Settings.PreloadFiles.Title",
        hint: "ITEM-PILES.Settings.PreloadFiles.Hint",
        scope: "client",
        config: false,
        default: true,
        type: Boolean
    },

    [CONSTANTS.SETTINGS.DEBUG]: {
        name: "ITEM-PILES.Settings.Debug.Title",
        hint: "ITEM-PILES.Settings.Debug.Hint",
        scope: "client",
        config: false,
        default: false,
        type: Boolean
    },


    [CONSTANTS.SETTINGS.DEBUG_HOOKS]: {
        name: "ITEM-PILES.Settings.DebugHooks.Title",
        hint: "ITEM-PILES.Settings.DebugHooks.Hint",
        scope: "client",
        config: false,
        default: false,
        type: Boolean
    },

});