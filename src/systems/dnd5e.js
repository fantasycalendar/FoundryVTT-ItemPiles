export default {

  "VERSION": "1.0.3",

  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "character",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  "ITEM_PRICE_ATTRIBUTE": "system.price.value",

  // Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "spell,feat,class,subclass,background"
    },
    {
      "path": "system.weaponType",
      "filters": "natural"
    }
  ],

  // This function is an optional system handler that specifically transforms an item when it is added to actors
  "ITEM_TRANSFORMER": async (itemData) => {
    ["equipped", "proficient", "prepared"].forEach(key => {
      if (itemData?.system?.[key] !== undefined) {
        delete itemData.system[key];
      }
    });
    setProperty(itemData, "system.attunement", Math.min(CONFIG.DND5E.attunementTypes.REQUIRED, itemData?.system?.attunement ?? 0));
    if (itemData.type === "spell") {
      try {
        const scroll = await Item.implementation.createScrollFromSpell(itemData);
        itemData = scroll.toObject();
      } catch (err) {
      }
    }
    return itemData;
  },

  // This function is an optional system handler that specifically transforms an item's price into a more unified numeric format
  "ITEM_COST_TRANSFORMER": (item, currencies) => {
    const overallCost = Number(getProperty(item, "system.price.value")) ?? 0;
    const priceDenomination = getProperty(item, "system.price.denomination");
    if (priceDenomination) {
      const currencyDenomination = currencies.find(currency => {
        return currency.abbreviation.toLowerCase().includes(priceDenomination);
      });
      if (currencyDenomination) {
        return overallCost * currencyDenomination.exchangeRate;
      }
    }
    return overallCost;
  },

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type"],

  // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
  // In the case of attributes, the path is relative to the "actor.system"
  // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
  "CURRENCIES": [
    {
      type: "attribute",
      name: "DND5E.CurrencyPP",
      img: "icons/commodities/currency/coin-inset-snail-silver.webp",
      abbreviation: "{#}PP",
      data: {
        path: "system.currency.pp"
      },
      primary: false,
      exchangeRate: 10
    },
    {
      type: "attribute",
      name: "DND5E.CurrencyGP",
      img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
      abbreviation: "{#}GP",
      data: {
        path: "system.currency.gp",
      },
      primary: true,
      exchangeRate: 1
    },
    {
      type: "attribute",
      name: "DND5E.CurrencyEP",
      img: "icons/commodities/currency/coin-inset-copper-axe.webp",
      abbreviation: "{#}EP",
      data: {
        path: "system.currency.ep",
      },
      primary: false,
      exchangeRate: 0.5
    },
    {
      type: "attribute",
      name: "DND5E.CurrencySP",
      img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
      abbreviation: "{#}SP",
      data: {
        path: "system.currency.sp",
      },
      primary: false,
      exchangeRate: 0.1
    },
    {
      type: "attribute",
      name: "DND5E.CurrencyCP",
      img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
      abbreviation: "{#}CP",
      data: {
        path: "system.currency.cp",
      },
      primary: false,
      exchangeRate: 0.01
    }
  ]
}
