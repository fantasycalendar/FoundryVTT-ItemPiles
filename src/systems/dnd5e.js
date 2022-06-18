export default {
  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "character",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "data.quantity",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  "ITEM_PRICE_ATTRIBUTE": "data.price",

  // Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "spell,feat,class"
    },
    {
      "path": "data.weaponType",
      "filters": "natural"
    }
  ],

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type"],

  "CURRENCIES": {
    // Currencies in item piles are a list of names, attribute paths, and images - the attribute path is relative to the actor.data
    "attributes": [
      {
        name: "DND5E.CurrencyPP",
        path: "data.currency.pp",
        img: "icons/commodities/currency/coin-inset-snail-silver.webp",
        primary: false,
        exchange: 10
      },
      {
        name: "DND5E.CurrencyGP",
        path: "data.currency.gp",
        img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
        primary: true,
        exchange: 1
      },
      {
        name: "DND5E.CurrencyEP",
        path: "data.currency.ep",
        img: "icons/commodities/currency/coin-inset-copper-axe.webp",
        primary: false,
        exchange: 0.5
      },
      {
        name: "DND5E.CurrencySP",
        path: "data.currency.sp",
        img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
        primary: false,
        exchange: 0.1
      },
      {
        name: "DND5E.CurrencyCP",
        path: "data.currency.cp",
        img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
        primary: false,
        exchange: 0.01
      }
    ],

    // While attribute currencies exist in character data, item currencies are items that act LIKE currencies
    "items": []
  }
}