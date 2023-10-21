export default {

  "VERSION": "1.0.0",

  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "character",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "system.quantity.value",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  "ITEM_PRICE_ATTRIBUTE": "system.price.value",

  // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "species,career,specialization,ability,criticaldamage,criticalinjury,talent,homesteadupgrade,signatureability,forcepower"
    }
  ],

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type"],

  // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
  // In the case of attributes, the path is relative to the "actor.system"
  // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
  "CURRENCIES": [
    {
      "type": "attribute",
      "name": "Credits",
      "img": "systems/starwarsffg/images/mod-all.png",
      "abbreviation": "{#}cr",
      "data": {
        "path": "system.stats.credits.value"
      },
      "primary": true,
      "exchangeRate": 1,
      "index": 0,
      "id": "system.stats.credits.value"
    }
  ]
}
