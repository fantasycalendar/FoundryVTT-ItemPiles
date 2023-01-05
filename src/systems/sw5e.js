export default {
  VERSION: "1.0.0",

  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  ACTOR_CLASS_TYPE: "character",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  ITEM_QUANTITY_ATTRIBUTE: "system.quantity",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  ITEM_PRICE_ATTRIBUTE: "system.price",

  // Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  ITEM_FILTERS: [
    {
      path: "type",
      filters: "power,feat,class,subclass",
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
  // Item similarities determines how item piles detect similarities and differences in the system
  ITEM_SIMILARITIES: ["name", "type"],

  // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
  // In the case of attributes, the path is relative to the "actor.system"
  // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
  CURRENCIES: [
    {
      type: "attribute",
      name: "SW5E.CurrencyGC",
      img: "packs/Icons/Data Recording and Storage/CreditChip.webp",
      abbreviation: "{#}GC",
      data: {
        path: "system.currency",
      },
      primary: true,
      exchangeRate: 1,
    },
  ],
};
