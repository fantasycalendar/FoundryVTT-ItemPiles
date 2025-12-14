export default {
	"VERSION": "1.0.2",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "character",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "item",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "weapon",

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "armor",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.attributes.quantity.value",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.attributes.cost.value",

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [{
		"path": "type",
		"filters": "talent,planet-system,skill-stunts,agenda,specialty,critical-injury,spacecraftweapons,spacecraftmods,spacecraft-crit,colony-initiative"
	}],

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type"],

	// Currencies in item piles - Alien RPG uses a cash attribute on character/synthetic actors
	"CURRENCIES": [
		{
			"type": "attribute",
			"name": "Dollar",
			"img": "",
			"abbreviation": "${#}",
			"data": {
				"path": "system.general.cash.value"
			},
			"primary": true,
			"exchangeRate": 1
		}
	],

	// Currency can have decimal values (e.g., $1.50)
	"CURRENCY_DECIMAL_DIGITS": 0.01,

	// This function transforms item prices from strings (e.g., "$100" or "100,000") into numeric format
	"ITEM_COST_TRANSFORMER": (item) => {
		let overallCost = foundry.utils.getProperty(item, "system.attributes.cost.value");
		if (overallCost) {
			overallCost = overallCost.replace("$", "").replace(",", "");
		}
		return Number(overallCost) ?? 0;
	}
}
