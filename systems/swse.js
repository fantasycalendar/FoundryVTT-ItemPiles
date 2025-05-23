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
	"ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "affiliation,background,class,beast quality,destiny,feat,forcePower,forceRegimen,forceSecret,forceTechnique,species,talent,template,trait,vehicleSystem"
		}
	],

	"ITEM_PRICE_ATTRIBUTE": "system.cost",

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["type", "name", "strippable", "hasPrerequisites", "modifiable", "hasLevels"],

	"CURRENCIES": [
		{
			type: "attribute",
			name: "Credits",
			img: "icons/svg/coins.svg",
			abbreviation: "{#}C",
			data: {
				path: "system.credits",
			},
			primary: true,
			exchangeRate: 1
		}
	],

	"CURRENCY_DECIMAL_DIGITS": 0.01
}
