import * as Utilities from "./utilities.js"
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "./helpers.js";

function getFlagData(inDocument, flag, defaults, existing = false) {
    const defaultFlags = foundry.utils.duplicate(defaults);
    const flags = existing || (getProperty(inDocument, flag) ?? {});
    const data = foundry.utils.duplicate(flags);
    return foundry.utils.mergeObject(defaultFlags, data);
}

export function getItemFlagData(item) {
    return getFlagData(Utilities.getDocument(item), CONSTANTS.FLAGS.ITEM, CONSTANTS.ITEM_DEFAULTS);
}

export function getActorFlagData(target, data = false) {
    return getFlagData(Utilities.getActor(target), CONSTANTS.FLAGS.PILE, CONSTANTS.PILE_DEFAULTS, data);
}

export function isValidItemPile(target, data = false) {
    const targetActor = Utilities.getActor(target);
    const pileData = getActorFlagData(targetActor, data);
    return targetActor && pileData?.enabled;
}

export function isItemPileContainer(target, data = false) {
    const targetActor = Utilities.getActor(target);
    const pileData = getActorFlagData(targetActor, data);
    return pileData?.enabled && pileData?.isContainer;
}

export function isItemPileMerchant(target, data = false) {
    const targetActor = Utilities.getActor(target);
    const pileData = getActorFlagData(targetActor, data);
    return pileData?.enabled && pileData?.isMerchant;
}

export function isItemPileClosed(target, data = false) {
    const targetActor = Utilities.getActor(target);
    const pileData = getActorFlagData(targetActor, data);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    return pileData.closed;
}

export function isItemPileLocked(target, data = false) {
    const targetActor = Utilities.getActor(target);
    const pileData = getActorFlagData(targetActor, data);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    return pileData.locked;
}

export function isItemPileEmpty(target) {

    const targetActor = Utilities.getActor(target);
    if (!targetActor) return false;

    const validItemPile = isValidItemPile(targetActor);
    if (!validItemPile) return false;

    const hasNoItems = getActorItems(targetActor).length === 0;
    const hasNoAttributes = getActorCurrencies(targetActor).length === 0;

    return validItemPile && hasNoItems && hasNoAttributes;

}

export function shouldItemPileBeDeleted(targetUuid) {

    const target = Utilities.fromUuidFast(targetUuid);

    if (!(target instanceof TokenDocument)) return false;

    if (!isItemPileEmpty(target)) return false;

    const pileData = getActorFlagData(target);

    return {
        "default": Helpers.getSetting("deleteEmptyPiles"), "true": true, "false": false
    }[pileData?.deleteWhenEmpty ?? "default"];

}

export function getActorItems(target, { itemFilters = false } = {}) {
    const actor = Utilities.getActor(target);
    const actorItemFilters = itemFilters ? cleanItemFilters(itemFilters) : getActorItemFilters(actor);
    const currencies = getActorCurrencies(actor).map(entry => entry.id);
    return actor.items.filter(item => currencies.indexOf(item.id) === -1 && !isItemInvalid(actor, item, actorItemFilters));
}

export function getActorCurrencies(target, { forActor = false, currencyList = false, getAll = false } = {}) {
    const actor = Utilities.getActor(target);
    const actorItems = Array.from(actor.items);
    currencyList = currencyList || getActorCurrencyList(forActor || actor);
    let currencies = currencyList.map((currency, index) => {
        if (currency.type === "attribute") {
            return {
                ...currency,
                quantity: getProperty(actor, currency.data.path) ?? 0,
                path: currency.data.path,
                id: currency.data.path,
                index
            }
        }
        const item = Utilities.findSimilarItem(actorItems, currency.data.item);
        return {
            ...currency, quantity: item ? Utilities.getItemQuantity(item) : 0, id: item?.id || null, item, index
        }
    });
    if (!getAll) {
        currencies = currencies.filter(currency => currency.quantity);
    }
    return currencies;
}

export function getActorPrimaryCurrency(target) {
    const actor = Utilities.getActor(target);
    return getActorCurrencies(actor).find(currency => currency.primary);
}

export function getActorCurrencyList(target, pileData = false) {
    const targetActor = Utilities.getActor(target);
    pileData = getActorFlagData(targetActor, pileData);
    return (pileData.overrideCurrencies || game.itempiles.API.CURRENCIES).map(currency => {
        currency.name = game.i18n.localize(currency.name);
        return currency;
    });
}


export function getActorItemFilters(target, pileData = false) {
    if (!target) return cleanItemFilters(game.itempiles.API.ITEM_FILTERS);
    const targetActor = Utilities.getActor(target);
    pileData = getActorFlagData(targetActor, pileData);
    return isValidItemPile(targetActor, pileData) && pileData?.overrideItemFilters ? cleanItemFilters(pileData.overrideItemFilters) : cleanItemFilters(game.itempiles.API.ITEM_FILTERS);
}

export function cleanItemFilters(itemFilters) {
    return itemFilters ? foundry.utils.duplicate(itemFilters).map(filter => {
        filter.path = filter.path.trim();
        filter.filters = Array.isArray(filter.filters) ? filter.filters : filter.filters.split(',').map(string => string.trim());
        filter.filters = new Set(filter.filters)
        return filter;
    }) : [];
}

export function isItemInvalid(targetActor, item, itemFilters = false) {
    const pileItemFilters = itemFilters ? itemFilters : getActorItemFilters(targetActor)
    const itemData = item instanceof Item ? item.toObject() : item;
    for (const filter of pileItemFilters) {
        if (!hasProperty(itemData, filter.path)) continue;
        const attributeValue = getProperty(itemData, filter.path);
        if (filter.filters.has(attributeValue)) {
            return attributeValue;
        }
    }
    return false;
}

export function isItemCurrency(item, { target = false } = {}) {
    const actor = Utilities.getActor(target ? target : item.parent);
    const currencies = getActorCurrencies(actor, { getAll: true })
        .filter(currency => currency.type === "item")
        .map(item => item.data.item);
    return !!Utilities.findSimilarItem(currencies, item);
}


export function getItemPileTokenImage(token, { data = false, items = false, currencies = false } = {}) {

    const pileDocument = Utilities.getDocument(token);

    const itemPileData = getActorFlagData(pileDocument, data);

    let originalImg;
    if (pileDocument instanceof TokenDocument) {
        originalImg = pileDocument.texture.src;
    } else {
        originalImg = pileDocument.prototypeToken.texture.src;
    }

    if (!isValidItemPile(pileDocument)) return originalImg;

    items = items || getActorItems(pileDocument).map(item => item.toObject());
    currencies = currencies || getActorCurrencies(pileDocument);

    const numItems = items.length + currencies.length;

    let img;

    if (itemPileData.displayOne && numItems === 1) {
        img = items.length > 0 ? items[0].img : currencies[0].img;
    } else if (itemPileData.displayOne && numItems > 1) {
        img = (pileDocument.actor ?? pileDocument).prototypeToken.texture.src;
    }

    if (itemPileData.isContainer) {

        img = itemPileData.lockedImage || itemPileData.closedImage || itemPileData.openedImage || itemPileData.emptyImage;

        if (itemPileData.locked && itemPileData.lockedImage) {
            img = itemPileData.lockedImage;
        } else if (itemPileData.closed && itemPileData.closedImage) {
            img = itemPileData.closedImage;
        } else if (itemPileData.emptyImage && isItemPileEmpty(pileDocument)) {
            img = itemPileData.emptyImage;
        } else if (itemPileData.openedImage) {
            img = itemPileData.openedImage;
        }

    }

    return img || originalImg;

}

export function getItemPileTokenScale(target, { data = false, items = false, currencies = false } = {}) {

    const pileDocument = Utilities.getDocument(target);

    let itemPileData = getActorFlagData(pileDocument, data);

    let baseScale;
    if (pileDocument instanceof TokenDocument) {
        baseScale = pileDocument.texture.scaleX;
    } else {
        baseScale = pileDocument.prototypeToken.texture.scaleX;
    }

    if (!isValidItemPile(pileDocument, itemPileData)) {
        return baseScale;
    }

    items = items || getActorItems(pileDocument);
    currencies = currencies || getActorCurrencies(pileDocument);

    const numItems = items.length + currencies.length;

    if (itemPileData.isContainer || !itemPileData.displayOne || !itemPileData.overrideSingleItemScale || numItems > 1 || numItems === 0) {
        return baseScale;
    }

    return itemPileData.singleItemScale;

}

export function getItemPileName(target, { data = false, items = false, currencies = false } = {}) {

    const pileDocument = Utilities.getDocument(target);

    const itemPileData = getActorFlagData(pileDocument, data);

    let name = pileDocument instanceof TokenDocument
        ? pileDocument.name
        : pileDocument.prototypeToken.name;

    if (!isValidItemPile(pileDocument, itemPileData)) {
        return name;
    }

    items = items || getActorItems(pileDocument);
    currencies = currencies || getActorCurrencies(pileDocument);

    const numItems = items.length + currencies.length;

    if (itemPileData.isContainer || !itemPileData.displayOne || !itemPileData.showItemName || numItems > 1 || numItems === 0) {
        return name;
    }

    const item = items.length > 0 ? items[0] : currencies[0];

    return item.name;

}

function getRelevantTokensAndActor(target) {

    const relevantDocument = Utilities.getDocument(target);

    let documentActor;
    let documentTokens = [];

    if (relevantDocument instanceof Actor) {
        documentActor = relevantDocument;
        if (relevantDocument.token) {
            documentTokens.push(relevantDocument?.token);
        } else {
            documentTokens = canvas.tokens.placeables.filter(token => token.document.actor === documentActor).map(token => token.document);
        }
    } else {
        documentActor = relevantDocument.actor;
        if (relevantDocument.isLinked) {
            documentTokens = canvas.tokens.placeables.filter(token => token.document.actor === documentActor).map(token => token.document);
        } else {
            documentTokens.push(relevantDocument);
        }
    }

    return [documentActor, documentTokens]

}

export async function updateItemPileData(target, flagData, tokenData) {

    if (!flagData) flagData = getActorFlagData(target);
    if (!tokenData) tokenData = {};

    let [documentActor, documentTokens] = getRelevantTokensAndActor(target);

    const items = getActorItems(documentActor, { itemFilters: flagData.overrideItemFilters });
    const currencies = getActorCurrencies(documentActor, { currencyList: flagData.overrideCurrencies });

    const pileData = { data: flagData, items, currencies };

    const updates = documentTokens.map(tokenDocument => {
        const newTokenData = foundry.utils.mergeObject(tokenData, {
            "img": getItemPileTokenImage(tokenDocument, pileData),
            "scale": getItemPileTokenScale(tokenDocument, pileData),
            "name": getItemPileName(tokenDocument, pileData),
        });
        const data = {
            "_id": tokenDocument.id, ...newTokenData
        };
        if (!foundry.utils.isEmpty(flagData)) {
            data[CONSTANTS.FLAGS.PILE] = flagData;
        }
        if (!tokenDocument.actorLink) {
            data["actorData." + CONSTANTS.FLAGS.PILE] = flagData;
            if (tokenDocument.actor === documentActor) {
                documentActor = false;
            }
        }
        return data;
    });

    if (canvas.scene && !foundry.utils.isEmpty(updates)) {
        await canvas.scene.updateEmbeddedDocuments("Token", updates);
    }

    if (!foundry.utils.isEmpty(flagData) && documentActor) {
        await documentActor.update({
            [CONSTANTS.FLAGS.PILE]: flagData, [`token.${CONSTANTS.FLAGS.PILE}`]: flagData
        });
    }

    return true;
}

export async function updateItemData(item, update) {
    const flagData = foundry.utils.mergeObject(getItemFlagData(item), update.flags ?? {});
    return item.update({
        ...update?.data ?? {}, [CONSTANTS.FLAGS.ITEM]: flagData
    });
}

/* -------------------------- Merchant Methods ------------------------- */

export function getMerchantModifiersForActor(merchant, { item = false, actor = false, pileFlagData = false } = {}) {

    let {
        buyPriceModifier, sellPriceModifier, itemTypePriceModifiers, actorPriceModifiers
    } = getActorFlagData(merchant, pileFlagData);

    if (item) {
        const itemTypePriceModifier = itemTypePriceModifiers.find(priceData => priceData.type === item.type);
        if (itemTypePriceModifier) {
            buyPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.buyPriceModifier : buyPriceModifier * itemTypePriceModifier.buyPriceModifier;
            sellPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.sellPriceModifier : sellPriceModifier * itemTypePriceModifier.sellPriceModifier;
        }
    }

    if (actor && actorPriceModifiers) {
        const actorSpecificModifiers = actorPriceModifiers?.find(data => data.actorUuid === Utilities.getUuid(actor));
        if (actorSpecificModifiers) {
            buyPriceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.buyPriceModifier : buyPriceModifier * actorSpecificModifiers.buyPriceModifier;
            sellPriceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.sellPriceModifier : sellPriceModifier * actorSpecificModifiers.sellPriceModifier;
        }
    }

    return {
        buyPriceModifier, sellPriceModifier
    }
}

function getPriceArray(totalCost, currencies) {

    const smallestExchangeRate = Math.min(...currencies.map(currency => currency.exchangeRate));
    const decimals = smallestExchangeRate.toString().split(".")[1].length;

    let fraction = Helpers.roundToDecimals(totalCost % 1, decimals);
    let cost = Math.round(totalCost - fraction);

    const prices = [];

    let skipPrimary = false;
    const primaryCurrency = currencies.find(currency => currency.primary)
    if (cost) {
        skipPrimary = true;
        prices.push({
            ...primaryCurrency,
            cost: cost,
            baseCost: cost,
            maxCurrencyCost: totalCost,
            string: primaryCurrency.abbreviation.replace('{#}', cost)
        });
    }

    for (const currency of currencies) {

        if (currency === primaryCurrency && skipPrimary) continue;

        const numCurrency = Math.floor(Helpers.roundToDecimals(fraction / currency.exchangeRate, decimals));

        fraction = Helpers.roundToDecimals(fraction - (numCurrency * currency.exchangeRate), decimals);

        prices.push({
            ...currency,
            cost: Math.round(numCurrency),
            baseCost: Math.round(numCurrency),
            maxCurrencyCost: Math.ceil(totalCost / currency.exchangeRate),
            string: currency.abbreviation.replace("{#}", numCurrency)
        });
    }

    prices.sort((a, b) => b.exchangeRate - a.exchangeRate);

    return prices;
}

export function getItemPrices(item, {
    seller = false, buyer = false, sellerFlagData = false, buyerFlagData = false, itemFlagData = false, quantity = 1
} = {}) {

    let priceData = [];

    buyerFlagData = getActorFlagData(buyer, buyerFlagData);
    if (!buyerFlagData?.enabled || !buyerFlagData?.isMerchant) {
        buyerFlagData = false;
    }

    sellerFlagData = getActorFlagData(seller, sellerFlagData);
    if (!sellerFlagData?.enabled || !sellerFlagData?.isMerchant) {
        sellerFlagData = false;
    }

    itemFlagData = itemFlagData || getItemFlagData(item);

    let merchant = sellerFlagData ? seller : buyer;

    if (merchant === buyer && itemFlagData.cantBeSoldToMerchants) {
        priceData.push({
            free: false,
            basePrices: [],
            basePriceString: "",
            prices: [],
            priceString: "",
            totalCost: 0,
            baseCost: 0,
            primary: true,
            maxQuantity: 0,
            quantity
        })
        return priceData;
    }

    // Retrieve the item price modifiers
    let modifier = 1;
    if (sellerFlagData) {

        modifier = getMerchantModifiersForActor(seller, {
            item, actor: buyer, pileFlagData: sellerFlagData
        }).buyPriceModifier;

    } else if (buyerFlagData) {

        modifier = getMerchantModifiersForActor(buyer, {
            item, actor: seller, pileFlagData: buyerFlagData
        }).sellPriceModifier;

    }

    if (!modifier) {
        return priceData;
    }

    const overallCost = getProperty(item.toObject(), game.itempiles.API.ITEM_PRICE_ATTRIBUTE);

    const disableNormalCost = itemFlagData.disableNormalCost && !sellerFlagData.onlyAcceptBasePrice;
    const hasOtherPrices = itemFlagData.prices.filter(priceGroup => priceGroup.length).length > 0;

    const currencyList = getActorCurrencyList(merchant);
    const currencies = getActorCurrencies(merchant, { currencyList, getAll: true });

    // In order to easily calculate an item's total worth, we can use the smallest exchange rate and convert all prices
    // to it, in order have a stable form of exchange calculation
    const smallestExchangeRate = Math.min(...currencies.map(currency => currency.exchangeRate));
    const decimals = smallestExchangeRate.toString().split(".")[1].length;

    if (itemFlagData?.free || (!disableNormalCost && (overallCost === 0 || overallCost < smallestExchangeRate) && !hasOtherPrices)) {
        priceData.push({
            free: true,
            basePrices: [],
            basePriceString: "",
            prices: [],
            priceString: "",
            totalCost: 0,
            baseCost: 0,
            primary: true,
            maxQuantity: Infinity,
            quantity
        })
        return priceData;
    }

    // !(itemFlagData.disableNormalCost || (merchant === buyer && sellerFlagData.onlyAcceptBasePrice)) &&

    // If the item does include its normal cost, we calculate that here
    if (overallCost >= smallestExchangeRate && (!itemFlagData.disableNormalCost || (merchant === buyer && buyerFlagData.onlyAcceptBasePrice))) {

        // Base prices is the displayed price, without quantity taken into account
        const baseCost = Helpers.roundToDecimals(overallCost * modifier, decimals);
        const basePrices = getPriceArray(baseCost, currencies);

        // Prices is the cost with the amount of quantity taken into account, which may change the number of the different
        // types of currencies it costs (eg, an item wouldn't cost 1 gold and 100 silver, it would cost 11 gold
        let totalCost = Helpers.roundToDecimals(overallCost * modifier * quantity, decimals);
        let prices = getPriceArray(totalCost, currencies);

        if (baseCost) {

            priceData.push({
                basePrices,
                basePriceString: basePrices.filter(price => price.cost).map(price => price.string).join(" "),
                prices,
                priceString: prices.filter(price => price.cost).map(price => price.string).join(" "),
                totalCost,
                baseCost,
                primary: true,
                maxQuantity: 0,
                quantity
            });

        }
    }

    // If the item has custom prices, we include them here
    if (itemFlagData.prices.length && !(merchant === buyer && buyerFlagData.onlyAcceptBasePrice)) {

        priceData = priceData.concat(itemFlagData.prices.map(priceGroup => {
            const prices = priceGroup.map(price => {
                const itemModifier = price.fixed ? 1 : modifier;
                const cost = Math.round(price.quantity * itemModifier * quantity);
                const baseCost = Math.round(price.quantity * itemModifier);
                price.name = game.i18n.localize(price.name);
                return {
                    ...price,
                    cost,
                    baseCost,
                    modifier: itemModifier,
                    priceString: cost ? price.abbreviation.replace("{#}", cost) : "",
                    basePriceString: baseCost ? price.abbreviation.replace("{#}", baseCost) : ""
                };
            });

            return {
                prices,
                priceString: prices.filter(price => price.priceString).map(price => price.priceString).join(" "),
                basePriceString: prices.filter(price => price.basePriceString).map(price => price.basePriceString).join(" "),
                maxQuantity: 0,
                quantity
            }
        }));
    }

    const buyerInfiniteCurrencies = buyerFlagData?.infiniteCurrencies;
    const buyerInfiniteQuantity = buyerFlagData?.infiniteQuantity;

    // If there's a buyer, we also calculate how many of the item the buyer can afford
    if (!buyer) return priceData;

    const recipientCurrencies = getActorCurrencies(buyer, { currencyList });
    const totalCurrencies = recipientCurrencies.map(currency => currency.quantity * currency.exchangeRate).reduce((acc, num) => acc + num, 0);

    // For each price group, check for properties and items and make sure that the actor can afford it
    for (const priceGroup of priceData) {
        priceGroup.maxQuantity = Infinity;
        if (priceGroup.baseCost !== undefined) {
            if (buyerInfiniteCurrencies) continue;
            priceGroup.maxQuantity = Math.floor(totalCurrencies / priceGroup.baseCost);
            priceGroup.prices.forEach(price => {
                price.maxQuantity = priceGroup.maxQuantity;
            });
        } else {
            if (buyerInfiniteQuantity) continue;
            for (const price of priceGroup.prices) {
                if (price.type === "attribute") {
                    const attributeQuantity = Number(getProperty(buyer, price.data.path));
                    price.buyerQuantity = attributeQuantity;

                    if (price.percent) {
                        const percent = Math.min(1, price.baseCost / 100);
                        const percentQuantity = Math.max(0, Math.floor(attributeQuantity * percent));
                        price.maxQuantity = Math.floor(attributeQuantity / percentQuantity);
                        price.baseCost = !buyer ? price.baseCost : percentQuantity;
                        price.cost = !buyer ? price.cost : percentQuantity * quantity;
                        price.quantity = !buyer ? price.quantity : percentQuantity;
                    } else {
                        price.maxQuantity = Math.floor(attributeQuantity / price.baseCost);
                    }

                    priceGroup.maxQuantity = Math.min(priceGroup.maxQuantity, price.maxQuantity)

                } else {
                    const foundItem = Utilities.findSimilarItem(buyer.items, price.data.item);
                    const itemQuantity = foundItem ? Utilities.getItemQuantity(foundItem) : 0;
                    price.buyerQuantity = itemQuantity;

                    if (price.percent) {
                        const percent = Math.min(1, price.baseCost / 100);
                        const percentQuantity = Math.max(0, Math.floor(itemQuantity * percent));
                        price.maxQuantity = Math.floor(itemQuantity / percentQuantity);
                        price.baseCost = !buyer ? price.baseCost : percentQuantity;
                        price.cost = !buyer ? price.cost : percentQuantity * quantity;
                        price.quantity = !buyer ? price.quantity : percentQuantity;
                    } else {
                        price.maxQuantity = Math.floor(itemQuantity / price.baseCost);
                    }

                    priceGroup.maxQuantity = Math.min(priceGroup.maxQuantity, price.maxQuantity);
                }
            }
        }
    }

    return priceData;
}

export function getPricesForItems(itemsToBuy, {
    seller = false, buyer = false, sellerFlagData = false, buyerFlagData = false
} = {}) {

    sellerFlagData = getActorFlagData(seller, sellerFlagData);
    if (!sellerFlagData?.enabled || !sellerFlagData?.isMerchant) {
        sellerFlagData = false;
    }

    buyerFlagData = getActorFlagData(buyer, buyerFlagData);
    if (!buyerFlagData?.enabled || !buyerFlagData?.isMerchant) {
        buyerFlagData = false;
    }

    const merchant = sellerFlagData ? seller : buyer;
    const currencyList = getActorCurrencyList(merchant);
    const currencies = getActorCurrencies(merchant, { currencyList, getAll: true });
    const smallestExchangeRate = Math.min(...currencies.map(currency => currency.exchangeRate));
    const decimals = smallestExchangeRate.toString().split(".")[1].length;

    const recipientCurrencies = getActorCurrencies(buyer, { currencyList, getAll: true });

    const buyerInfiniteCurrencies = buyerFlagData?.infiniteCurrencies;

    const paymentData = itemsToBuy.map(data => {
            const prices = getItemPrices(data.item, {
                seller, buyer, sellerFlagData, buyerFlagData, itemFlagData: data.itemFlagData, quantity: data.quantity || 1
            })[data.paymentIndex || 0];
            return {
                ...prices, item: data.item
            };
        })
        .reduce((priceData, priceGroup) => {

            if (!priceGroup.maxQuantity) return priceData;

            if (priceGroup.primary) {

                priceData.totalCurrencyCost = Helpers.roundToDecimals(priceData.totalCurrencyCost + priceGroup.totalCost, decimals);
                priceData.primary = true;

            } else {

                for (const price of priceGroup.prices) {

                    let existingPrice = priceData.otherPrices.find(otherPrice => {
                        return otherPrice.id === price.id || (otherPrice.name === price.name && otherPrice.img === price.img && otherPrice.type === price.type);
                    });

                    if (existingPrice) {
                        existingPrice.cost += price.cost;
                    } else {
                        const index = priceData.otherPrices.push(price);
                        existingPrice = priceData.otherPrices[index - 1];
                        existingPrice.quantity = 0;
                    }

                    existingPrice.quantity += price.cost;
                    existingPrice.buyerQuantity -= price.cost;

                    if (existingPrice.buyerQuantity < 0) {
                        priceData.canBuy = false;
                    }
                }
            }

            priceData.buyerReceive.push({
                type: "item",
                name: priceGroup.item.name,
                img: priceGroup.item.img,
                quantity: priceGroup.quantity,
                item: priceGroup.item,
            });

            return priceData;

        }, {
            totalCurrencyCost: 0, canBuy: true, primary: false, finalPrices: [], otherPrices: [],

            buyerReceive: [], buyerChange: [], sellerReceive: []
        });

    if (paymentData.totalCurrencyCost) {

        // The price array that we need to fill
        const prices = getPriceArray(paymentData.totalCurrencyCost, recipientCurrencies);

        // This is the target price amount we need to hit
        let priceLeft = paymentData.totalCurrencyCost;

        // Starting from the smallest currency increment in the price
        for (let i = prices.length - 1; i >= 0; i--) {

            const price = prices[i];

            const buyerPrice = {
                ...price,
                buyerQuantity: buyerInfiniteCurrencies ? Infinity : price.quantity,
                quantity: 0,
                isCurrency: true
            }

            if (price.type === "item") {
                buyerPrice.item = price.data.item;
            }

            // If we have met the price target (or exceeded it, eg, we need change), populate empty entry
            if (priceLeft <= 0 || !price.cost) {
                paymentData.finalPrices.push(buyerPrice);
                continue;
            }

            // If the buyer does not have enough to cover the cost, put what we can into it, otherwise all of it
            buyerPrice.quantity = buyerPrice.buyerQuantity < price.cost ? buyerPrice.buyerQuantity : price.cost;

            // If it's the primary currency
            if (price.primary) {
                // And the buyer has enough of the primary currency to cover the rest of the price, use that
                const totalCurrencyValue = Helpers.roundToDecimals(buyerPrice.buyerQuantity * price.exchangeRate, decimals);
                if (totalCurrencyValue > priceLeft) {
                    buyerPrice.quantity = Math.ceil(priceLeft);
                }
            }

            paymentData.finalPrices.push(buyerPrice);

            // Then adjust the remaining price - if this goes below zero, we will need change back
            priceLeft = Helpers.roundToDecimals(priceLeft - (buyerPrice.quantity * price.exchangeRate), decimals);

        }

        // If there's STILL some remaining price (eg, we haven't been able to scrounge up enough currency to pay for it)
        // we can start using the larger currencies, such as platinum in D&D 5e
        while (priceLeft > 0) {

            // We then need to loop through each price, and check if we have any more left over
            for (const buyerPrice of paymentData.finalPrices) {

                // If we don't, look for the next one
                let buyerCurrencyQuantity = buyerPrice.buyerQuantity - buyerPrice.quantity;
                if (!buyerCurrencyQuantity) continue;

                // Otherwise, add enough to cover the remaining cost
                const newQuantity = Math.ceil(Math.min(buyerCurrencyQuantity, priceLeft / buyerPrice.exchangeRate));
                buyerPrice.quantity += newQuantity;
                priceLeft = Helpers.roundToDecimals(priceLeft - (newQuantity * buyerPrice.exchangeRate), decimals);

                if (priceLeft <= 0) break;

            }

            if (priceLeft > 0) {
                paymentData.finalPrices = paymentData.finalPrices.sort((a, b) => b.exchangeRate - a.exchangeRate);
            } else {
                break;
            }
        }

        paymentData.finalPrices = paymentData.finalPrices.sort((a, b) => b.exchangeRate - a.exchangeRate);

        // Since the change will be negative, we'll need to flip it, since this is what we'll get back
        let change = Math.abs(priceLeft);
        for (const currency of currencies) {

            if (!change) break;

            // Get the remaining price, and normalize it to this currency
            let numCurrency = Math.floor(Helpers.roundToDecimals(change / currency.exchangeRate, decimals));
            change = Helpers.roundToDecimals(change - (numCurrency * currency.exchangeRate), decimals);

            // If there's some currencies to be gotten back
            if (numCurrency) {
                // We check if we've paid with this currency
                const payment = paymentData.finalPrices.find(payment => {
                    return payment.id === currency.id || (payment.name === currency.name && payment.img === currency.img && payment.type === currency.type);
                });
                if (!payment) continue;

                // If we have paid with this currency, and we're getting some back, we can do one of two things:
                if ((payment.quantity - numCurrency) >= 0) {
                    // Either just subtract it from the total paid if some of our payment will still remain
                    // IE, the change we got back didn't cancel out the payment
                    payment.quantity -= numCurrency;
                } else {
                    // Or if it does cancel out our payment, we add that to the change we'll get back and remove the payment entirely
                    paymentData.buyerChange.push({
                        ...currency, isCurrency: true, quantity: numCurrency - payment.quantity
                    });
                    payment.quantity = 0;
                }
            }
        }

        // Copy the final currencies that the seller will get
        paymentData.sellerReceive = paymentData.finalPrices.map(price => {
            return { ...price };
        });

        // But, we'll need to make sure they have enough change to _give_ to the buyer
        // We collate the total amount of change needed
        let changeNeeded = paymentData.buyerChange.reduce((acc, change) => {
            const currency = currencies.find(currency => {
                return change.id === currency.id || (change.name === currency.name && change.img === currency.img && change.type === currency.type);
            });
            return acc + currency.quantity >= change.quantity ? 0 : (change.quantity - currency.quantity) * change.exchangeRate;
        }, 0);

        // If the seller needs give the buyer some change, we'll modify the payment they'll get to cover for it
        if (changeNeeded) {

            // If the seller is being given enough of the primary currency to cover for the cost, we use that
            const primaryCurrency = paymentData.sellerReceive.find(price => price.primary && (price.quantity * price.exchangeRate) > changeNeeded);
            if (primaryCurrency) {
                primaryCurrency.quantity--;
                changeNeeded -= 1 * primaryCurrency.exchangeRate;
            } else {
                // Otherwise, we'll use the biggest currency we can find to cover for it
                const biggestCurrency = paymentData.sellerReceive.find(price => price.quantity && (price.quantity * price.exchangeRate) > changeNeeded);
                biggestCurrency.quantity--;
                changeNeeded -= 1 * biggestCurrency.exchangeRate;
            }

            changeNeeded = Math.abs(changeNeeded);

            // Then loop through each currency and add enough currency so that the total adds up
            for (const currency of paymentData.sellerReceive) {
                if (!changeNeeded) break;
                let numCurrency = Math.floor(Helpers.roundToDecimals(changeNeeded / currency.exchangeRate, decimals));
                changeNeeded = Helpers.roundToDecimals(changeNeeded - (numCurrency * currency.exchangeRate), decimals);
                currency.quantity += numCurrency;
            }
        }
    }

    paymentData.finalPrices = paymentData.finalPrices.concat(paymentData.otherPrices);
    paymentData.sellerReceive = paymentData.sellerReceive.concat(paymentData.otherPrices);

    paymentData.basePriceString = paymentData.finalPrices
        .filter(price => price.cost)
        .map(price => {
            let abbreviation = price.abbreviation;
            if (price.percent && abbreviation.includes("%")) {
                abbreviation = abbreviation.replaceAll("%", "")
            }
            return abbreviation.replace("{#}", price.cost)
        }).join(" ");

    delete paymentData.otherPrices;

    return paymentData;

}