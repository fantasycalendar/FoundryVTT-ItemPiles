import CONSTANTS from "./constants.js";
import { ItemPileAttributeEditor } from "./formapplications/itemPileAttributeEditor.js";

export default function registerSettings(){

    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "openExtractableAttributesEditor", {
        name: "ITEM-PILES.Setting.Attributes.Title",
        label: "ITEM-PILES.Setting.Attributes.Label",
        hint: "ITEM-PILES.Setting.Attributes.Hint",
        icon: "fas fa-coins",
        type: ItemPileAttributeEditor,
        restricted: true
    });

    game.settings.register(CONSTANTS.MODULE_NAME, "extractableAttributes", {
        scope: "world",
        config: false,
        default: [
            {
                name: "Platinum Coins",
                path: "data.currency.pp",
                img: "icons/commodities/currency/coin-inset-snail-silver.webp"
            },
            {
                name: "Gold Coins",
                path: "data.currency.gp",
                img: "icons/commodities/currency/coin-embossed-crown-gold.webp"
            },
            {
                name: "Electrum Coins",
                path: "data.currency.ep",
                img: "icons/commodities/currency/coin-inset-copper-axe.webp"
            },
            {
                name: "Silver Coins",
                path: "data.currency.sp",
                img: "icons/commodities/currency/coin-engraved-moon-silver.webp"
            },
            {
                name: "Copper Coins",
                path: "data.currency.cp",
                img: "icons/commodities/currency/coin-engraved-waves-copper.webp"
            }
        ],
        type: Array
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