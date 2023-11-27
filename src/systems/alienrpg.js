export default {
	"VERSION": "1.0.1",
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
	"CURRENCY_DECIMAL_DIGITS": 0.01,
	"ITEM_FILTERS": [{
		"path": "type",
		"filters": "talent,planet-system,skill-stunts,agenda,specialty,critical-injury"
	}],
	"ITEM_COST_TRANSFORMER": (item) => {
		let overallCost = getProperty(item, "system.attributes.cost.value");
		if (overallCost) {
			overallCost = overallCost.replace("$", "").replace(",", "");
		}
		return Number(overallCost) ?? 0;
	},
	"ITEM_SIMILARITIES": ["name", "type"],
	"ACTOR_CLASS_TYPE": "character",
	"ITEM_QUANTITY_ATTRIBUTE": "system.attributes.quantity.value",
	"ITEM_PRICE_ATTRIBUTE": "system.attributes.cost.value"
}
