export default {
    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "character",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "data.qtd",

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_TYPE_ATTRIBUTE": "type",
    "ITEM_TYPE_FILTERS": "",

    // Dynamic attributes are things like currencies or transferable powers that exist as editable number fields on character sheets
    "DYNAMIC_ATTRIBUTES": [
        {
            name: "Ouro",
            path: "data.dinheiro.to",
            img: "icons/commodities/currency/coin-embossed-insect-gold.webp"
        },
        {
            name: "Prata",
            path: "data.dinheiro.tp",
            img: "icons/commodities/currency/coin-embossed-unicorn-silver.webp"
        },
        {
            name: "Cobre",
            path: "data.dinheiro.tc",
            img: "icons/commodities/currency/coin-engraved-waves-copper.webp"
        }
    ]
}