// Item Piles Definitions for Foundry VTT Game System Dungeonslayers 4

export default {

  "VERSION": "1.0.0",

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

  // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
  // In the case of attributes, the path is relative to the "actor.data"
  // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
  "CURRENCIES": [
    {
      type: "attribute",
      name: "DS4.CharacterCurrencyGold",
      img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
      abbreviation: "{#}G",
      data: {
        path: "data.currency.gold",
      },
      primary: true,
      exchangeRate: 1
    },
    {
      type: "attribute",
      name: "DS4.CharacterCurrencySilver",
      img: "icons/commodities/currency/coin-inset-snail-silver.webp",
      abbreviation: "{#}S",
      data: {
        path: "data.currency.silver",
      },
      primary: false,
      exchangeRate: 0.1
    },
    {
      type: "attribute",
      name: "DS4.CharacterCurrencyCopper",
      img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
      abbreviation: "{#}C",
      data: {
        path: "data.currency.copper",
      },
      primary: false,
      exchangeRate: 0.01
    }
  ]
}