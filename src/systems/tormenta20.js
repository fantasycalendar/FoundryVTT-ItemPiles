export default {
  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "character",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "data.qtd",

  // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "magia, poder, classe"
    },
    {
      "path": "data.tipoUso",
      "filters": "nat"
    }
  ],

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type"],

  "CURRENCIES": {
    // Currencies in item piles are a list of names, attribute paths, and images - the attribute path is relative to the actor.data
    "attributes": [
      {
        name: "Ouro",
        path: "data.dinheiro.to",
        img: "icons/commodities/currency/coin-embossed-insect-gold.webp",
        primary: false,
        exchange: 10
      },
      {
        name: "Prata",
        path: "data.dinheiro.tp",
        img: "icons/commodities/currency/coin-embossed-unicorn-silver.webp",
        primary: true,
        exchange: 1
      },
      {
        name: "Cobre",
        path: "data.dinheiro.tc",
        img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
        primary: false,
        exchange: 0.1
      }
    ],

    // While attribute currencies exist in character data, item currencies are items that act LIKE currencies
    "items": []
  }
}