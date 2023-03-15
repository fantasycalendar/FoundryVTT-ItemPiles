export default {

  "VERSION": "1.0.4",

  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "character",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "system.quantity.value",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  "ITEM_PRICE_ATTRIBUTE": "system.price",

  // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "career,container,critical,disease,injury,mutation,prayer,psychology,talent,skill,spell,trait,extendedTest,vehicleMod,cargo"
    }
  ],

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type"],

  // This function is an optional system handler that specifically transforms an item's price into a more unified numeric format
  "ITEM_COST_TRANSFORMER": (item, currencies) => {
    let overallCost = 0;
    const prices = getProperty(item, "system.price");
    for (const currency of currencies) {
      const currencyType = currency.abbreviation.toLowerCase().replace("{#}", "");
      if (prices?.[currencyType]) {
        overallCost += prices[currencyType] * currency.exchangeRate;
      }
    }
    return overallCost;
  },

  // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
  // In the case of attributes, the path is relative to the "actor.system"
  // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
  "CURRENCIES": [
    {
      type: "item",
      name: "Gold Crown",
      img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
      abbreviation: "{#}GC",
      data: {
        item: {
          "name": "Gold Crown",
          "type": "money",
          "img": "icons/commodities/currency/coin-embossed-crown-gold.webp",
          "system": {
            "quantity": { "type": "Number", "label": "Quantity", "value": 1 },
            "encumbrance": { "type": "Number", "label": "Encumbrance", "value": 0.005 },
            "coinValue": { "label": "Value (in d)", "type": "Number", "value": 240 },
            "source": { "type": "String", "label": "Source" }
          }
        }
      },
      primary: true,
      exchangeRate: 1
    },
    {
      type: "item",
      name: "Silver Shilling",
      img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
      abbreviation: "{#}SS",
      data: {
        item: {
          "name": "Silver Shilling",
          "type": "money",
          "img": "icons/commodities/currency/coin-engraved-moon-silver.webp",
          "system": {
            "quantity": { "type": "Number", "label": "Quantity", "value": 1 },
            "encumbrance": { "type": "Number", "label": "Encumbrance", "value": 0.01 },
            "coinValue": { "label": "Value (in d)", "type": "Number", "value": 12 },
            "source": { "type": "String", "label": "Source" }
          }
        }
      },
      primary: false,
      exchangeRate: 0.1
    },
    {
      type: "item",
      name: "Brass Penny",
      img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
      abbreviation: "{#}BP",
      data: {
        item: {
          "name": "Brass Penny",
          "type": "money",
          "img": "icons/commodities/currency/coin-engraved-waves-copper.webp",
          "system": {
            "quantity": { "type": "Number", "label": "Quantity", "value": 1 },
            "encumbrance": { "type": "Number", "label": "Encumbrance", "value": 0.01 },
            "coinValue": { "label": "Value (in d)", "type": "Number", "value": 1 },
            "source": { "type": "String", "label": "Source" }
          }
        }
      },
      primary: false,
      exchangeRate: 0.01
    }],

  CSS_VARIABLES: {
    "even-color": "#554d40",
    "odd-color": "#2f2920",
    "input-text-color": "#fff"
  }
}
