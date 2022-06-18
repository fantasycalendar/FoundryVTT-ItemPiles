export default {
  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "npc",

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
    // Currencies in item piles are a list of names, attribute paths, and images - the attribute path is relative to the actor.data
    "attributes": [
      {
        name: "PF1.CurrencyPlatinumP",
        path: "data.currency.pp",
        img: "systems/pf1/icons/items/inventory/coins-silver.jpg",
        primary: false,
        exchange: 10
      },
      {
        name: "PF1.CurrencyGoldP",
        path: "data.currency.gp",
        img: "systems/pf1/icons/items/inventory/coin-gold.jpg",
        primary: true,
        exchange: 1
      },
      {
        name: "PF1.CurrencySilverP",
        path: "data.currency.sp",
        img: "systems/pf1/icons/items/inventory/coin-silver.jpg",
        primary: false,
        exchange: 0.1
      },
      {
        name: "PF1.CurrencyCopperP",
        path: "data.currency.cp",
        img: "systems/pf1/icons/items/inventory/coin-copper.jpg",
        primary: false,
        exchange: 0.01
      }
    ],

    // While attribute currencies exist in character data, item currencies are items that act LIKE currencies
    "items": []
  }
}