export default {
    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "npc",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "data.quantity",

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_FILTERS": [
        {
            "path": "type",
            "filters": "spell,strength,weakness,mastery,species,culture,ancestry,education,resource,npcfeature,moonsign,language,culturelore,statuseffect,spelleffect"
        }
    ],

    // Item similarities determines how item piles detect similarities and differences in the system
    "ITEM_SIMILARITIES": ["name", "type", "data.sufferedDamage", "data.quality"],

    // Currencies in item piles are a list of names, attribute paths, and images - the attribute path is relative to the actor.data
    "CURRENCIES": [
        {
            name: "Telare",
            path: "data.currency.T",
            img: "icons/commodities/currency/coins-assorted-mix-platinum.webp"
        },
        {
            name: "Lunare",
            path: "data.currency.L",
            img: "icons/commodities/currency/coin-embossed-unicorn-silver.webp"
        },
        {
            name: "Solare",
            path: "data.currency.S",
            img: "icons/commodities/currency/coins-assorted-mix-copper.webp"
        }
    ]
}