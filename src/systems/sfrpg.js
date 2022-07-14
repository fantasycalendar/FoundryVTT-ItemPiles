export default {

  "VERSION": "1.0.0",

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

  "CURRENCIES": {
    "Credits": [
      {
        type: "attribute",
        name: "SFRPG.Currencies.Credits",
        img: "systems/sfrpg/icons/equipment/goods/credstick.jpg",
        abbreviation: "{#}C",
        data: {
          path: "data.currency.credit",
        },
        primary: true,
        exchangeRate: 1
      }
    ],
    "Universal Polymer Base": [
      {
        type: "attribute",
        name: "SFRPG.Currencies.UPBs",
        img: "systems/sfrpg/icons/equipment/goods/upb.jpg",
        abbreviation: "{#} UBP",
        data: {
          path: "data.currency.upb",
        },
        primary: false,
        exchangeRate: 1
      }
    ]
  }
}