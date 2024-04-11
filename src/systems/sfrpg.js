export default {

	"VERSION": "1.0.2",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "npc2",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "", 

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.price",

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "attack,buff,class,feat,race,spell"
		}
	],

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type"],

	"CURRENCIES": [
		{
			type: "attribute",
			name: "SFRPG.Currencies.Credits",
			img: "systems/sfrpg/icons/equipment/goods/credstick.webp",
			abbreviation: "{#}C",
			data: {
				path: "system.currency.credit",
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "attribute",
			name: "SFRPG.Currencies.UPBs",
			img: "systems/sfrpg/icons/equipment/goods/upb.webp",
			abbreviation: "{#} UBP",
			data: {
				path: "system.currency.upb",
			},
			primary: false,
			exchangeRate: 1
		}
	],

	"CURRENCY_DECIMAL_DIGITS": 0.01
}
