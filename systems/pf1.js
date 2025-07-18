export default {

	"VERSION": "1.1.0",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "npc",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "loot",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "weapon", 

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "equipment",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.price",

	// This function is an optional system handler that specifically transforms an item's price into a more unified numeric format
	"ITEM_COST_TRANSFORMER": (item, currencies) => {
		// Account for wand charges, broken condition, and other traits that are not reflected in base price.
		return item.getValue({ sellValue: 1.0, single: true });
	},

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "attack,buff,class,feat,race,spell"
		}
	],

	
	"UNSTACKABLE_ITEM_TYPES": ["container"],

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type", "system.subType", "system.masterwork", "system.enh", "system.armor.enh"],

	// Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
	// In the case of attributes, the path is relative to the "actor.system"
	// In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
	"CURRENCIES": [
		{
			type: "attribute",
			name: "PF1.Currency.Full.pp",
			img: "systems/pf1/icons/items/inventory/coins-silver.jpg",
			abbreviation: "{#}P",
			data: {
				path: "system.currency.pp",
			},
			primary: false,
			exchangeRate: 10
		},
		{
			type: "attribute",
			name: "PF1.Currency.Full.gp",
			img: "systems/pf1/icons/items/inventory/coin-gold.jpg",
			abbreviation: "{#}G",
			data: {
				path: "system.currency.gp",
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "attribute",
			name: "PF1.Currency.Full.sp",
			img: "systems/pf1/icons/items/inventory/coin-silver.jpg",
			abbreviation: "{#}S",
			data: {
				path: "system.currency.sp",
			},
			primary: false,
			exchangeRate: 0.1
		},
		{
			type: "attribute",
			name: "PF1.Currency.Full.cp",
			img: "systems/pf1/icons/items/inventory/coin-copper.jpg",
			abbreviation: "{#}C",
			data: {
				path: "system.currency.cp",
			},
			primary: false,
			exchangeRate: 0.01
		}
	]
};
