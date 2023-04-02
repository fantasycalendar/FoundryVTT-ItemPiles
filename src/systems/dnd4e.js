export default {

    "VERSION": "1.0.4",
  
    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "Player Character",
  
    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",
  
    // The item price attribute is the path to the attribute on each item that determine how much it costs
    "ITEM_PRICE_ATTRIBUTE": "system.price",
  
    // Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_FILTERS": [
      {
        "path": "type",
        "filters": "classFeats,feat,raceFeats,pathFeats,destinyFeats,ritual,power"
      }
    ],
  
    // This function is an optional system handler that specifically transforms an item when it is added to actors
    "ITEM_TRANSFORMER": async (itemData) => {
      ["equipped", "proficient", "prepared"].forEach(key => {
        if (itemData?.system?.[key] !== undefined) {
          delete itemData.system[key];
        }
      });
      setProperty(itemData, "system.attunement", false);
       return itemData;
    },
    
    // Item similarities determines how item piles detect similarities and differences in the system
    "ITEM_SIMILARITIES": ["name", "type"],
  
    // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
    // In the case of attributes, the path is relative to the "actor.system"
    // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
    "CURRENCIES": [
      {
        type: "attribute",
        name: "DND4EBETA.CurrencyAD",
        img: "icons/commodities/gems/gem-faceted-round-white.webp",
        abbreviation: "{#}AD",
        data: {
          path: "system.currency.ad"
        },
        primary: false,
        exchangeRate: 10000
      },
      {
        type: "attribute",
        name: "DND4EBETA.CurrencyPP",
        img: "icons/commodities/currency/coin-inset-snail-silver.webp",
        abbreviation: "{#}PP",
        data: {
          path: "system.currency.pp"
        },
        primary: false,
        exchangeRate: 100
      },
      {
        type: "attribute",
        name: "DND4EBETA.CurrencyGP",
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
        name: "DND4EBETA.CurrencySP",
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
        name: "DND4EBETA.CurrencyCP",
        img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
        abbreviation: "{#}CP",
        data: {
          path: "system.currency.cp",
        },
        primary: false,
        exchangeRate: 0.01
      },
      {
        type: "attribute",
        name: "DND4EBETA.RitualCompAR",
        img: "icons/commodities/materials/bowl-powder-teal.webp",
        abbreviation: "{#}AR",
        data: {
          path: "system.ritualcomp.ar",
        },
        primary: false,
        exchangeRate: 1
      },
      {
        type: "attribute",
        name: "DND4EBETA.RitualCompMS",
        img: "icons/commodities/materials/bowl-liquid-white.webp",
        abbreviation: "{#}MS",
        data: {
          path: "system.ritualcomp.ms",
        },
        primary: false,
        exchangeRate: 1
      },
      {
        type: "attribute",
        name: "DND4EBETA.RitualCompRH",
        img: "icons/commodities/materials/plant-sprout-seed-brown-green.webp",
        abbreviation: "{#}RH",
        data: {
          path: "system.ritualcomp.rh",
        },
        primary: false,
        exchangeRate: 1
      },
      {
        type: "attribute",
        name: "DND4EBETA.RitualCompSI",
        img: "icons/commodities/materials/bowl-liquid-red.webp",
        abbreviation: "{#}SI",
        data: {
          path: "system.ritualcomp.si",
        },
        primary: false,
        exchangeRate: 1
      },
      {
        type: "attribute",
        name: "DND4EBETA.RitualCompRS",
        img: "icons/commodities/gems/gem-faceted-cushion-teal.webp",
        abbreviation: "{#}RS",
        data: {
          path: "system.ritualcomp.rs",
        },
        primary: false,
        exchangeRate: 1
      }
    ]
  }
  