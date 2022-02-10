// Item Piles Definitions for Foundry VTT Game System Dungeonslayers 4

export default {
    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "character",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "data.quantity",

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_FILTERS": [
        {
            "path": "type",
            "filters": "spell,talent,racialAbility,language,alphabet,specialCreatureAbility"
        }
    ],

    // Item similarities determines how item piles detect similarities and differences in the system
    "ITEM_SIMILARITIES": ["name", "type"],

    // Currencies in item piles are a list of names, attribute paths, and images - the attribute path is relative to the actor.data
    "CURRENCIES": [
        {
            name: "DS4.CharacterCurrencyGold",
            path: "data.currency.gold",
            img: "icons/commodities/currency/coin-embossed-crown-gold.webp"
        },
        {
            name: "DS4.CharacterCurrencySilver",
            path: "data.currency.silver",
            img: "icons/commodities/currency/coin-inset-snail-silver.webp"
        },
        {
            name: "DS4.CharacterCurrencyCopper",
            path: "data.currency.copper",
            img: "icons/commodities/currency/coin-inset-copper-axe.webp"
        }
    ]
}