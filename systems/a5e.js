import CONSTANTS from "../src/constants/constants.js";

export default {

	"VERSION": "1.0.1",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "character",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "object",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "",

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.price",

	// Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "feature,maneuver,spell,background,culture,heritage,destiny"
		}
	],

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type"],

	"ITEM_TYPE_HANDLERS": {
		"GLOBAL": {
			[CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED]: ({ item }) => {
				return item.system.containerId ? item.system.containerId : "";
			},
			[CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED_PATH]: "system.containerId",
			[CONSTANTS.ITEM_TYPE_METHODS.CONTAINER_ID_GENERATOR]: ({ actor, containerId }) => {
				return `${actor.uuid}.Item.${containerId}`;
			},
			[CONSTANTS.ITEM_TYPE_METHODS.CONTAINER_ID_RETRIEVER]: ({ item }) => {
				return item.system.containerId.split(".").pop();
			},
			[CONSTANTS.ITEM_TYPE_METHODS.CONTAINER_TRANSFORMER]: ({ actor, map }) => {
				Object.values(map).forEach(data => {
					data.item.system.items = data.items.reduce((acc, item) => {
						let _id = foundry.utils.randomID();
						acc[_id] = {
							quantity: item.system.quantity,
							uuid: `${actor.uuid}.Item.${item._id}`
						}
						return acc;
					}, {})
				})
			}
		},
		"object": {
			[CONSTANTS.ITEM_TYPE_METHODS.HAS_CURRENCY]: true,
			[CONSTANTS.ITEM_TYPE_METHODS.CONTENTS]: ({ item }) => {
				return item?.containerItems ?? [];
			},
			[CONSTANTS.ITEM_TYPE_METHODS.TRANSFER]: ({ item, items }) => {
				const containerItems = item?.containerItems ?? [];
				for (const [_, containedData] of containerItems) {
					const item = fromUuidSync(containedData.uuid);
					if (!item) continue;
					items.push(item.toObject());
				}
			},
		}
	},

	// Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
	// In the case of attributes, the path is relative to the "actor.system"
	// In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
	"CURRENCIES": [
		{
			type: "attribute",
			name: "Platinum Pieces",
			img: "icons/commodities/currency/coin-inset-snail-silver.webp",
			abbreviation: "{#}PP",
			data: {
				path: "system.currency.pp"
			},
			primary: false,
			exchangeRate: 10
		},
		{
			type: "attribute",
			name: "Gold Pieces",
			img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
			abbreviation: "{#}GP",
			data: {
				path: "system.currency.gp",
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "attribute",
			name: "Electrum Pieces",
			img: "icons/commodities/currency/coin-inset-copper-axe.webp",
			abbreviation: "{#}EP",
			data: {
				path: "system.currency.ep",
			},
			primary: false,
			exchangeRate: 0.5
		},
		{
			type: "attribute",
			name: "Silver Pieces",
			img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
			abbreviation: "{#}SP",
			data: {
				path: "system.currency.sp",
			},
			primary: false,
			exchangeRate: 0.1
		},
		{
			type: "attribute",
			name: "Copper Pieces",
			img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
			abbreviation: "{#}CP",
			data: {
				path: "system.currency.cp",
			},
			primary: false,
			exchangeRate: 0.01
		}
	],

	"SHEET_OVERRIDES": () => {

		libWrapper.register(CONSTANTS.MODULE_NAME, `game.a5e.applications.ActorSheetA5e.prototype.render`, function (wrapped, forced, options, ...args) {
			const renderItemPileInterface = Hooks.call(CONSTANTS.HOOKS.PRE_RENDER_SHEET, this.actor, forced, options) === false;
			if (this._state > Application.RENDER_STATES.NONE) {
				if (renderItemPileInterface) {
					wrapped(forced, options, ...args)
				} else {
					return wrapped(forced, options, ...args)
				}
			}
			if (renderItemPileInterface) return;
			return wrapped(forced, options, ...args);
		}, "MIXED");

	}
};
