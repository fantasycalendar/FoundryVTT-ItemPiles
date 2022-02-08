export default {
    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "loot",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "data.quantity.value",

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_FILTERS": [
        {
            "path": "type",
            "filters": "action,spell,melee,lore,heritage,feat,effect,class,background,ancestry"
        }
    ],

    "ITEM_SIMILARITIES": ["name", "type", "data.temporary.value"],

    // Dynamic attributes are things like currencies or transferable powers that exist as editable number fields on character sheets
    "CURRENCIES": [
        {
            name: "PF1.CurrencyPlatinumP",
            path: "data.currency.pp",
            img: "systems/pf1/icons/items/inventory/coins-silver.jpg"
        },
        {
            name: "PF1.CurrencyGoldP",
            path: "data.currency.gp",
            img: "systems/pf1/icons/items/inventory/coin-gold.jpg"
        },
        {
            name: "PF1.CurrencySilverP",
            path: "data.currency.sp",
            img: "systems/pf1/icons/items/inventory/coin-silver.jpg"
        },
        {
            name: "PF1.CurrencyCopperP",
            path: "data.currency.cp",
            img: "systems/pf1/icons/items/inventory/coin-copper.jpg"
        }
    ]
}