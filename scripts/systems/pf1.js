export default {
    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "npc",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "data.quantity",

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_TYPE_ATTRIBUTE": "type",
    "ITEM_TYPE_FILTERS": "attack,buff,class,feat,race,spell",

    // Dynamic attributes are things like currencies or transferable powers that exist as editable number fields on character sheets
    "DYNAMIC_ATTRIBUTES": [
        {
            name: "Platinum Coins",
            path: "data.currency.pp",
            img: "systems/pf1/icons/items/inventory/coins-silver.jpg"
        },
        {
            name: "Gold Coins",
            path: "data.currency.gp",
            img: "systems/pf1/icons/items/inventory/coin-gold.jpg"
        },
        {
            name: "Silver Coins",
            path: "data.currency.sp",
            img: "systems/pf1/icons/items/inventory/coin-silver.jpg"
        },
        {
            name: "Copper Coins",
            path: "data.currency.cp",
            img: "systems/pf1/icons/items/inventory/coin-copper.jpg"
        }
    ]
}