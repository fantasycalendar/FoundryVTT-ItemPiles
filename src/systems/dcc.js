export default {

	"VERSION": "1.0.0",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "Player",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "", 

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.value",

	// Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "spell,skill"
		},
	],

	// This function is an optional system handler that specifically transforms an item when it is added to actors
	"ITEM_TRANSFORMER": async (itemData) => {
		// Transferred items should become unequipped
		if (itemData?.system?.equipped) {
			itemData.system.equipped = false;
		}
		// Transferring spells doesn't make a lot of sense, but if it happens the lost flag and mercurial effect should be cleared
		["lost", "mercurialEffect"].forEach(key => {
			if (itemData?.system?.[key] !== undefined) {
				delete itemData.system[key];
			}
		});
		return itemData;
	},

	// This function is an optional system handler that specifically transforms an item's price into a more unified numeric format
	"ITEM_COST_TRANSFORMER": (item, currencies) => {
		let overallCost = 0;
		currencies.forEach((currency, index) => {
			let denominationCost = Number(foundry.utils.getProperty(item, currency.data.path.replace("system.currency.", "system.value.")));
			if (!isNaN(denominationCost)) {
				overallCost += denominationCost * currency.exchangeRate;
			}
		})
		return overallCost ?? 0;
	},

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type"],

	// Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
	// In the case of attributes, the path is relative to the "actor.system"
	// In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
	"CURRENCIES": [
		{
			type: "attribute",
			name: "DCC.CurrencyPP",
			img: "icons/commodities/currency/coin-inset-snail-silver.webp",
			abbreviation: "{#}Pp",
			data: {
				path: "system.currency.pp",
			},
			primary: false,
			exchangeRate: 100
		},
		{
			type: "attribute",
			name: "DCC.CurrencyEP",
			img: "icons/commodities/currency/coin-inset-copper-axe.webp",
			abbreviation: "{#} Ep",
			data: {
				path: "system.currency.ep",
			},
			primary: false,
			exchangeRate: 10
		},
		{
			type: "attribute",
			name: "DCC.CurrencyGP",
			img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
			abbreviation: "{#} Gp",
			data: {
				path: "system.currency.gp",
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "attribute",
			name: "DCC.CurrencySP",
			img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
			abbreviation: "{#} Sp",
			data: {
				path: "system.currency.sp",
			},
			primary: false,
			exchangeRate: 0.1
		},
		{
			type: "attribute",
			name: "DCC.CurrencyCP",
			img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
			abbreviation: "{#} Cp",
			data: {
				path: "system.currency.cp",
			},
			primary: false,
			exchangeRate: 0.01
		}
	],
}
