export default {
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
  ],
  "SECONDARY_CURRENCIES": [],
  "CURRENCY_DECIMAL_DIGITS": 1,
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "species,career,specialization,ability,criticaldamage,criticalinjury,talent,homesteadupgrade,signatureability,forcepower"
    }
  ],
  "ITEM_SIMILARITIES": ["name", "type"],
  "UNSTACKABLE_ITEM_TYPES": [],
  "ACTOR_CLASS_TYPE": "character",
  "ITEM_QUANTITY_ATTRIBUTE": "system.quantity.value",
  "ITEM_PRICE_ATTRIBUTE": "system.price.value",
  "QUANTITY_FOR_PRICE_ATTRIBUTE": "flags.item-piles.system.quantityForPrice"
}
