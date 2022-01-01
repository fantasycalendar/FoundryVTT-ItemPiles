import CONSTANTS from "./constants.js";

const debouncedReload = debounce(() => {
    window.location.reload()
}, 100)

export default function registerSettings(){

    game.settings.register(CONSTANTS.MODULE_NAME, "currencyAttributes", {
        name: "ITEM-PILES.Setting.Currency.Title",
        hint: "ITEM-PILES.Setting.Currency.Label",
        scope: "world",
        config: true,
        default: "data.currency.pp,data.currency.gp,data.currency.ep,data.currency.sp,data.currency.cp",
        type: String
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "itemQuantityAttribute", {
        name: "ITEM-PILES.Setting.Quantity.Title",
        hint: "ITEM-PILES.Setting.Quantity.Label",
        scope: "world",
        config: true,
        default: "data.quantity",
        type: String
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "itemTypeAttribute", {
        name: "ITEM-PILES.Setting.ItemType.Title",
        hint: "ITEM-PILES.Setting.ItemType.Label",
        scope: "world",
        config: true,
        default: "type",
        type: String
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "itemTypeFilters", {
        name: "ITEM-PILES.Setting.ItemTypeFilters.Title",
        hint: "ITEM-PILES.Setting.ItemTypeFilters.Label",
        scope: "world",
        config: true,
        default: "spell,feat,class",
        type: String
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "deleteEmptyPiles", {
        name: "ITEM-PILES.Setting.DeleteEmptyPiles.Title",
        hint: "ITEM-PILES.Setting.DeleteEmptyPiles.Label",
        scope: "world",
        config: true,
        default: true,
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

    game.settings.register(CONSTANTS.MODULE_NAME, "debug", {
        name: "ITEM-PILES.Setting.Debug.Title",
        hint: "ITEM-PILES.Setting.Debug.Label",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "defaultItemPileActorID", {
        scope: "world",
        config: false,
        default: "",
        type: String
    });

}