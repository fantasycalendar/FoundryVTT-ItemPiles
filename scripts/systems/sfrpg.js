export default {
    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "npc2",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "data.quantity",

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_FILTERS": [
        {
            "path": "type",
            "filters": "attack,buff,class,feat,race,spell"
        }
    ],

    // Item similarities determines how item piles detect similarities and differences in the system
    "ITEM_SIMILARITIES": ["name", "type"],

    // Currencies in item piles are a list of names, attribute paths, and images - the attribute path is relative to the actor.data
    "CURRENCIES": [
        {
            name: "SFRPG.Currencies.Credits",
            path: "data.currency.credit",
            img: "systems/sfrpg/icons/equipment/goods/credstick.jpg"
        },
        {
            name: "SFRPG.Currencies.UPBs",
            path: "data.currency.upb",
            img: "systems/sfrpg/icons/equipment/goods/upb.jpg"
        }
    ]
}