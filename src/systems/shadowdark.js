export default {

    "VERSION": "1.0.0",

    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    "ACTOR_CLASS_TYPE": "Player",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

    // The item price attribute is the path to the attribute on each item that determine how much it costs
    "ITEM_PRICE_ATTRIBUTE": "system.cost",

    // Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    "ITEM_FILTERS": [
        {
            "path": "type",
            "filters": "Ancestry,Background,Boon,Class Ability,Class,Deity,Effect,Language,NPC Attack,NPC Special Attack,NPC Spell,NPC Feature,Property,Spell,Talent"
        },
    ],

    // Item similarities determines how item piles detect similarities and differences in the system
    "ITEM_SIMILARITIES": ["name", "type"],

    // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
    // In the case of attributes, the path is relative to the "actor.system"
    // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
    "CURRENCIES": [
        {
            type: "attribute",
            name: "SHADOWDARK.CurrencyGP",
            img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
            abbreviation: "{#}GP",
            data: {
                path: "system.coins.gp",
            },
            primary: true,
            exchangeRate: 1
        },
        {
            type: "attribute",
            name: "SHADOWDARK.CurrencySP",
            img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
            abbreviation: "{#}SP",
            data: {
                path: "system.coins.sp",
            },
            primary: false,
            exchangeRate: 0.1
        },
        {
            type: "attribute",
            name: "SHADOWDARK.CurrencyCP",
            img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
            abbreviation: "{#}CP",
            data: {
                path: "system.coins.cp",
            },
            primary: false,
            exchangeRate: 0.01
        }
    ],

    // This function is an optional system handler that specifically transforms an item's price into a more unified numeric format
    "ITEM_COST_TRANSFORMER": (item, currencies) => {
        const cost = getProperty(item, "system.cost") ?? {};
        let totalCost = 0;
        for (const costDenomination in cost) {
            const subCost = Number(getProperty(cost, costDenomination)) ?? 0;
            if (subCost === 0) {
                continue;
            }

            const currencyDenomination = currencies
                .filter(currency => currency.type === "attribute")
                .find(currency => {
                    return currency.data.path.toLowerCase().endsWith(costDenomination);
                });

            totalCost += subCost * currencyDenomination?.exchangeRate ?? 1;
        }

        return totalCost;
    },
}