export default {

  "VERSION": "1.0.3",

  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "creature",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  "ITEM_PRICE_ATTRIBUTE": "system.value",

  // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [
    {
      "path": "type",
      "filters": "feature,ancestry,path,talent,spell"
    }
  ],

	"PILE_DEFAULTS": {
		merchantColumns: [{
			label: "DL.Availability",
			path: "system.availability",
			formatting: "{#}",
			buying: true,
			selling: true,
			mapping: {
				"C": "DL.AvailabilityC",
				"U": "DL.AvailabilityU",
				"R": "DL.AvailabilityR",
				"E": "DL.AvailabilityE",
			}
		}]
	},

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type"],

  // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
  // In the case of attributes, the path is relative to the "actor.system"
  // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
  "CURRENCIES": [
    {
      type: "attribute",
      name: "Gold Crowns",
      img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
      abbreviation: "{#} gc",
      data: {
        path: "system.wealth.gc",
      },
      primary: false,
      exchangeRate: 10
    },
    {
      type: "attribute",
      name: "Silver Shillings",
      img: "icons/commodities/currency/coin-inset-compass-silver.webp",
      abbreviation: "{#} ss",
      data: {
        path: "system.wealth.ss",
      },
      primary: true,
      exchangeRate: 1
    },
    {
      type: "attribute",
      name: "Copper Pennies",
      img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
      abbreviation: "{#} cp",
      data: {
        path: "system.wealth.cp",
      },
      primary: false,
      exchangeRate: 0.1
    },
    {
      type: "attribute",
      name: "Bits",
      img: "icons/commodities/currency/coins-assorted-mix-platinum.webp",
      abbreviation: "{#} bits",
      data: {
        path: "system.wealth.bits",
      },
      primary: false,
      exchangeRate: 0.01
    },
  ],

  "CURRENCY_DECIMAL_DIGITS": 0.01
}
