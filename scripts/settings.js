import CONSTANTS from "./constants.js";

const debouncedReload = debounce(() => {
    window.location.reload()
}, 100)

export default function registerSettings(){

    game.settings.register(CONSTANTS.MODULE_NAME, "debug", {
        name: "ITEM-PILES.Setting.Debug.Title",
        hint: "ITEM-PILES.Setting.Debug.Label",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "quantityAttribute", {
        name: "ITEM-PILES.Setting.Quantity.Title",
        hint: "ITEM-PILES.Setting.Quantity.Label",
        scope: "world",
        config: true,
        default: "data.quantity",
        type: String,
        onChange: debouncedReload
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "deleteEmptyPiles", {
        name: "ITEM-PILES.Setting.DeleteEmptyPiles.Title",
        hint: "ITEM-PILES.Setting.DeleteEmptyPiles.Label",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

}