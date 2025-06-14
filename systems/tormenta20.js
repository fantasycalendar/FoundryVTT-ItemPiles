export default {

	"VERSION": "1.0.3",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "character",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "",

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.qtd",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.preco",

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "magia,poder,classe"
		},
		{
			"path": "system.tipoUso",
			"filters": "nat"
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
			name: "Ouro",
			img: "icons/commodities/currency/coin-embossed-insect-gold.webp",
			abbreviation: "{#}O",
			data: {
				path: "system.dinheiro.to",
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "attribute",
			name: "Prata",
			img: "icons/commodities/currency/coin-embossed-unicorn-silver.webp",
			abbreviation: "{#}P",
			data: {
				path: "system.dinheiro.tp",
			},
			primary: false,
			exchangeRate: 0.1
		},
		{
			type: "attribute",
			name: "Cobre",
			img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
			abbreviation: "{#}C",
			data: {
				path: "system.dinheiro.tc",
			},
			primary: false,
			exchangeRate: 0.01
		}
	]
}
