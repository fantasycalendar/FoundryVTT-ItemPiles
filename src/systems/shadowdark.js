export default {
    "VERSION": "1.0.0",

    "ACTOR_CLASS_TYPE": "Player",

    "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

    "ITEM_PRICE_ATTRIBUTE": "system.cost",

	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "script,Spell"
        }
    ],

    "ITEM_SIMILARITIES": [ "name", "type" ]
}