export default {

	"VERSION": "1.0.1",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "pc",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "", 

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.basic.quantity",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "flags.item-piles.system.price",

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "ability, lasting-damage, power-shift, recursion, skill, tag"
		}
	],

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type"],

	// Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
	// In the case of attributes, the path is relative to the "actor.system"
	// In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
	"CURRENCIES": [
		{
			type: "attribute",
			name: "Adamantine pieces",
			img: "icons/commodities/currency/coin-embossed-ruby-gold.webp",
			abbreviation: "{#} ap",
			data: {
				path: "system.settings.equipment.currency.quantity6"
			},
			primary: false,
			exchangeRate: 1000
		},
		{
			type: "attribute",
			name: "Mithral pieces",
			img: "icons/commodities/currency/coin-embossed-unicorn-silver.webp",
			abbreviation: "{#} mp",
			data: {
				path: "system.settings.equipment.currency.quantity5"
			},
			primary: false,
			exchangeRate: 100
		},
		{
			type: "attribute",
			name: "Platinum pieces",
			img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
			abbreviation: "{#} pp",
			data: {
				path: "system.settings.equipment.currency.quantity4"
			},
			primary: false,
			exchangeRate: 10
		},
		{
			type: "attribute",
			name: "Gold pieces",
			img: "icons/commodities/currency/coins-plain-gold.webp",
			abbreviation: "{#} gp",
			data: {
				path: "system.settings.equipment.currency.quantity3"
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "attribute",
			name: "Silver pieces",
			img: "icons/commodities/currency/coins-engraved-face-silver.webp",
			abbreviation: "{#} sp",
			data: {
				path: "system.settings.equipment.currency.quantity2"
			},
			primary: false,
			exchangeRate: 0.1
		},
		{
			type: "attribute",
			name: "Copper pieces",
			img: "icons/commodities/currency/coins-engraved-copper.webp",
			abbreviation: "{#} cp",
			data: {
				path: "system.settings.equipment.currency.quantity1"
			},
			primary: false,
			exchangeRate: 0.01
		}
	]
}
