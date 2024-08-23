import GiveItems from "../applications/dialogs/give-items-dialog/give-items-dialog.js";
import PrivateAPI from "../API/private-api.js";

export default {

	"VERSION": "1.0.7",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "character",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "loot",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "weapon",

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "equipment",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.price.value",

	// Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "spell,feat,class,subclass,background"
		},
		{
			"path": "system.type.value",
			"filters": "natural"
		}
	],

	// This function is an optional system handler that specifically transforms an item when it is added to actors
	"ITEM_TRANSFORMER": async (itemData) => {
		["equipped", "proficient", "prepared"].forEach(key => {
			if (itemData?.system?.[key] !== undefined) {
				delete itemData.system[key];
			}
		});
		foundry.utils.setProperty(itemData, "system.attunement", Math.min(CONFIG.DND5E.attunementTypes.REQUIRED, itemData?.system?.attunement ?? 0));
		if (itemData.type === "spell") {
			try {
				const scroll = await Item.implementation.createScrollFromSpell(itemData);
				itemData = scroll.toObject();
			} catch (err) {
			}
		}
		return itemData;
	},

	// This function is an optional system handler that specifically transforms an item's price into a more unified numeric format
	"ITEM_COST_TRANSFORMER": (item, currencies) => {
		const overallCost = Number(foundry.utils.getProperty(item, "system.price.value")) ?? 0;
		const priceDenomination = foundry.utils.getProperty(item, "system.price.denomination");
		if (priceDenomination) {
			const currencyDenomination = currencies
				.filter(currency => currency.type === "attribute")
				.find(currency => {
					return currency.data.path.toLowerCase().endsWith(priceDenomination);
				});
			if (currencyDenomination) {
				return overallCost * currencyDenomination.exchangeRate;
			}
		}
		return overallCost ?? 0;
	},

	"PRICE_MODIFIER_TRANSFORMER": ({
		buyPriceModifier,
		sellPriceModifier,
		actor = false,
		actorPriceModifiers = []
	} = {}) => {

		const modifiers = {
			buyPriceModifier,
			sellPriceModifier
		};

		if (!actor) return modifiers;

		const groupModifiers = actorPriceModifiers
			.map(data => ({ ...data, actor: fromUuidSync(data.actorUuid) }))
			.filter(data => {
				return data.actor && data.actor.type === "group" && data.actor.system.members.some(member => member === actor)
			});

		modifiers.buyPriceModifier = groupModifiers.reduce((acc, data) => {
			return data.override ? data.buyPriceModifier ?? acc : acc * data.buyPriceModifier;
		}, buyPriceModifier);

		modifiers.sellPriceModifier = groupModifiers.reduce((acc, data) => {
			return data.override ? data.sellPriceModifier ?? acc : acc * data.sellPriceModifier;
		}, sellPriceModifier);

		return modifiers;

	},

	"PILE_DEFAULTS": {
		merchantColumns: [{
			label: "<i class=\"fa-solid fa-shield\"></i>",
			path: "system.equipped",
			formatting: "{#}",
			buying: false,
			selling: true,
			mapping: {
				"true": "✔",
				"false": ""
			}
		}, {
			label: "Rarity",
			path: "system.rarity",
			formatting: "{#}",
			buying: true,
			selling: true,
			mapping: {
				"common": "DND5E.ItemRarityCommon",
				"uncommon": "DND5E.ItemRarityUncommon",
				"rare": "DND5E.ItemRarityRare",
				"veryRare": "DND5E.ItemRarityVeryRare",
				"legendary": "DND5E.ItemRarityLegendary",
				"artifact": "DND5E.ItemRarityArtifact"
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
			name: "DND5E.CurrencyPP",
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
			name: "DND5E.CurrencyGP",
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
			name: "DND5E.CurrencyEP",
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
			name: "DND5E.CurrencySP",
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
			name: "DND5E.CurrencyCP",
			img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
			abbreviation: "{#}CP",
			data: {
				path: "system.currency.cp",
			},
			primary: false,
			exchangeRate: 0.01
		}
	],

	"VAULT_STYLES": [
		{
			path: "system.rarity",
			value: "artifact",
			styling: {
				"box-shadow": "inset 0px 0px 7px 0px rgba(255,191,0,1)"
			}
		},
		{
			path: "system.rarity",
			value: "legendary",
			styling: {
				"box-shadow": "inset 0px 0px 7px 0px rgba(255,119,0,1)"
			}
		},
		{
			path: "system.rarity",
			value: "veryRare",
			styling: {
				"box-shadow": "inset 0px 0px 7px 0px rgba(255,0,247,1)"
			}
		},
		{
			path: "system.rarity",
			value: "rare",
			styling: {
				"box-shadow": "inset 0px 0px 7px 0px rgba(0,136,255,1)"
			}
		},
		{
			path: "system.rarity",
			value: "uncommon",
			styling: {
				"box-shadow": "inset 0px 0px 7px 0px rgba(0,255,9,1)"
			}
		}
	],

	"SYSTEM_HOOKS": () => {

		Hooks.on("dnd5e.getItemContextOptions", (item, options) => {
			options.push({
				name: "Give to character",
				icon: "<i class='fa fa-user'></i>",
				callback: async () => {
					const result = await GiveItems.show(item);
					if (!result) return;
					PrivateAPI._giveItem({
						itemData: {
							item: item.toObject(),
							quantity: result.quantity
						},
						source: item.parent.uuid,
						target: result.target,
						secret: result.secret,
					}, { skipQuantityDialog: true })
				},
				condition: !game.itempiles.API.isItemInvalid(item)
			})
		});

	}
}
