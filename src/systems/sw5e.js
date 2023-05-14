export default {
  VERSION: "1.0.1",

  ACTOR_CLASS_TYPE: "character",

  ITEM_QUANTITY_ATTRIBUTE: "system.quantity",

  ITEM_PRICE_ATTRIBUTE: "system.price.value",

  ITEM_FILTERS: [
    {
      path: "type",
      filters: "power,feat,class,archetype,background",
    },
    {
      path: "system.weaponType",
      filters: "natural",
    },
  ],

  ITEM_TRANSFORMER: async (itemData, actor = false) => {
    ["equipped", "proficient", "prepared"].forEach((key) => {
      if (itemData?.system?.[key] !== void 0) {
        delete itemData.system[key];
      }
    });
    setProperty(
      itemData,
      "system.attunement",
      Math.min(
        CONFIG.SW5E.attunementTypes.REQUIRED,
        itemData?.system?.attunement ?? 0
      )
    );
    return itemData;
  },

  ITEM_SIMILARITIES: ["name", "type"],

  CURRENCIES: [
    {
      type: "attribute",
      name: "SW5E.CurrencyGC",
      img: "systems/sw5e/packs/Icons/Data Recording and Storage/CreditChip.webp",
      abbreviation: "{#}GC",
      data: {
        path: "system.currency.gc",
      },
      primary: true,
      exchangeRate: 1,
    },
  ],
};
