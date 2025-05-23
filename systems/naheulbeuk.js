export default {

	"VERSION": "1.0.0",

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

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.prix",

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "ape,attaque,competence,coup,etat,metier,origine,region,sort,trait"
		}
	],

	// This function is an optional system handler that specifically transforms an item when it is added to actors
	"ITEM_TRANSFORMER": async (itemData) => {
		["equipe"].forEach(key => {
			if (itemData?.system?.[key] !== undefined) {
				delete itemData.system[key];
			}
		});
		return itemData;
	},

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type"],

	// Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
	// In the case of attributes, the path is relative to the "actor.system"
	// In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
	"CURRENCIES": [
		{
			type: "item",
			name: "Pièce d'argent",
			img: "systems/naheulbeuk/assets/from-rexard-icons/Tresors/tresor%20(101).webp",
			abbreviation: "{#}PA",
			data: {
				uuid: "Compendium.naheulbeuk.trucs.BTUFKc6sEbJLmlas"
			},
			primary: false,
			exchangeRate: 10
		},
		{
			type: "item",
			name: "Pièce d'or",
			img: "systems/naheulbeuk/assets/from-rexard-icons/Tresors/tresor%20(52).webp",
			abbreviation: "{#}PO",
			data: {
				uuid: "Compendium.naheulbeuk.trucs.AKuErwzQ6wDxtzyp"
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "item",
			name: "Lingot de Thrytil",
			img: "systems/naheulbeuk/assets/from-rexard-icons/Objets/Materiaux/objet%20(291).webp",
			abbreviation: "{#}LT",
			data: {
				uuid: "Compendium.naheulbeuk.trucs.tOTNc2WYpkyf2Yyl"
			},
			primary: false,
			exchangeRate: 0.01
		},
		{
			type: "item",
			name: "Lingot de Berylium",
			img: "systems/naheulbeuk/assets/from-rexard-icons/Objets/Materiaux/objet%20(252).webp",
			abbreviation: "{#}LB",
			data: {
				uuid: "Compendium.naheulbeuk.trucs.r4qLXqXaIIdyKzOf"
			},
			primary: false,
			exchangeRate: 0.002
		}
	]
}
