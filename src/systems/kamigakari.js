export default {

  "VERSION": "1.0.0",

  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "character",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  "ITEM_PRICE_ATTRIBUTE": "system.price",

  // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "talent,attackOption,race,style,facade,bond"
    }
  ],

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type"],

  "CURRENCIES": [
    {
      type: "attribute",
      name: "KG.Money",
      img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
      abbreviation: "{#}G",
      data: {
        path: "system.attributes.money",
      },
      primary: true,
      exchangeRate: 1
    }
  ],

  "CURRENCY_DECIMAL_DIGITS": 0.01
}
