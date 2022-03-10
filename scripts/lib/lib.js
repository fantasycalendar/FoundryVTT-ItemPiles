import {CONSTANTS, MODULE_SETTINGS} from "../constants.js";
import {getDocument, getUuid} from "./utils.js";

export function getItemFlagData(item) {
    return getFlagData(getDocument(item), CONSTANTS.ITEM_FLAGS, CONSTANTS.ITEM_DEFAULTS);
}

export function getItemPileData(target) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    return getFlagData(inDocument, CONSTANTS.PILE_FLAGS, CONSTANTS.PILE_DEFAULTS);
}

function getFlagData(inDocument, flag, defaults) {
    defaults = foundry.utils.duplicate(defaults);
    const flags = inDocument.getFlag(CONSTANTS.MODULE_NAME, flag) ?? {};
    const data = foundry.utils.duplicate(flags);
    return foundry.utils.mergeObject(defaults, data);
}

export function getItemPileTokenImage(target, {data = false, items = false, currencies = false} = {}) {

    const pileDocument = getDocument(target);

    data = data || getItemPileData(pileDocument);

    let originalImg;
    if (pileDocument instanceof TokenDocument) {
        originalImg = pileDocument.data.img;
    } else {
        originalImg = pileDocument.data.token.img;
    }

    if (!isValidItemPile(pileDocument)) return originalImg;

    items = items || getActorItems(pileDocument).map(item => item.toObject());
    currencies = currencies || getFormattedActorCurrencies(pileDocument);

    const numItems = items.length + currencies.length;

    let img;

    if (data.displayOne && numItems === 1) {
        img = items.length > 0
            ? items[0].img
            : currencies[0].img;
    } else if (data.displayOne && numItems > 1) {
        img = (pileDocument.actor ?? pileDocument).data.token.img;
    }

    if (data.isContainer) {

        img = data.lockedImage || data.closedImage || data.openedImage || data.emptyImage;

        if (data.locked && data.lockedImage) {
            img = data.lockedImage;
        } else if (data.closed && data.closedImage) {
            img = data.closedImage;
        } else if (data.emptyImage && isItemPileEmpty(pileDocument)) {
            img = data.emptyImage;
        } else if (data.openedImage) {
            img = data.openedImage;
        }

    }

    return img || originalImg;

}

export function getItemPileTokenScale(target, {data = false, items = false, currencies = false} = {}) {

    const pileDocument = getDocument(target);

    data = data || getItemPileData(pileDocument);

    let baseScale;
    if (pileDocument instanceof TokenDocument) {
        baseScale = pileDocument.data.scale;
    } else {
        baseScale = pileDocument.data.token.scale;
    }

    items = items || getActorItems(pileDocument);
    currencies = currencies || getFormattedActorCurrencies(pileDocument);

    const numItems = items.length + currencies.length;

    if (!isValidItemPile(pileDocument, data) || data.isContainer || !data.displayOne || !data.overrideSingleItemScale || numItems > 1 || numItems === 0) return baseScale;

    return data.singleItemScale;

}

export function getItemPileName(target, {data = false, items = false, currencies = false} = {}) {

    const pileDocument = getDocument(target);

    data = data || getItemPileData(pileDocument);

    items = items || getActorItems(pileDocument);
    currencies = currencies || getFormattedActorCurrencies(pileDocument);

    const numItems = items.length + currencies.length;

    let name;
    if (pileDocument instanceof TokenDocument) {
        name = pileDocument.data.name;
    } else {
        name = pileDocument.data.token.name;
    }

    if (!isValidItemPile(pileDocument, data) || data.isContainer || !data.displayOne || !data.showItemName || numItems > 1 || numItems === 0) return name;

    const item = items.length > 0
        ? items[0]
        : currencies[0];

    return item.name;

}

export function findSimilarItem(items, findItem) {

    const itemSimilarities = MODULE_SETTINGS.ITEM_SIMILARITIES;

    const findItemId = findItem?.id ?? findItem?._id;

    return items.find(item => {
        const itemId = item.id ?? item._id;
        if (itemId === findItemId) {
            return true;
        }

        const itemData = item instanceof Item ? item.data : item;
        for (const path of itemSimilarities) {
            if (getProperty(itemData, path) !== getProperty(findItem, path)) {
                return false;
            }
        }

        return true;
    });
}


export function getActorItems(target, itemFilters = false) {
    const pileItemFilters = itemFilters ? itemFilters : getActorItemFilters(target)
    const inDocument = getDocument(target);
    const targetActor = inDocument instanceof TokenDocument
        ? inDocument.actor
        : inDocument;

    return Array.from(targetActor.items).filter(item => !isItemInvalid(inDocument, item, pileItemFilters));

}

export function getPlayersForItemPile(target) {
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    if (!isValidItemPile(inDocument)) return [];
    return Array.from(game.users).filter(u => (u.active || !pileData.activePlayers) && u.character);
}

export function isItemInvalid(target, item, itemFilters = false) {
    const pileItemFilters = itemFilters ? itemFilters : getActorItemFilters(target)
    const itemData = item instanceof Item ? item.data : item;
    for (const filter of pileItemFilters) {
        if (!hasProperty(itemData, filter.path)) continue;
        const attributeValue = getProperty(itemData, filter.path);
        if (filter.filters.has(attributeValue)) {
            return attributeValue;
        }
    }
    return false;
}

export function getActorItemFilters(target) {
    if (!target) return cleanItemFilters(foundry.utils.duplicate(MODULE_SETTINGS.ITEM_FILTERS));
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    return isValidItemPile(inDocument) && pileData?.overrideItemFilters
        ? cleanItemFilters(pileData.overrideItemFilters)
        : cleanItemFilters(MODULE_SETTINGS.ITEM_FILTERS);
}

/**
 * Cleans item filters and prepares them for use in above functions
 *
 * @param {Array} itemFilters
 * @returns {Array}
 */
export function cleanItemFilters(itemFilters) {
    return itemFilters ? foundry.utils.duplicate(itemFilters).map(filter => {
        filter.path = filter.path.trim();
        filter.filters = Array.isArray(filter.filters) ? filter.filters
            : filter.filters.split(',').map(string => string.trim());
        filter.filters = new Set(filter.filters)
        return filter;
    }) : [];
}

export function isValidItemPile(target, data = false) {
    const inDocument = getDocument(target);
    const documentActor = inDocument instanceof TokenDocument ? inDocument.actor : inDocument;
    return inDocument && !inDocument.destroyed && documentActor && (data || getItemPileData(inDocument))?.enabled;
}

export function isItemPileEmpty(target) {

    const inDocument = getDocument(target);

    const targetActor = inDocument instanceof TokenDocument
        ? inDocument.actor
        : inDocument;

    if (!targetActor) return false;

    const hasNoItems = getActorItems(inDocument).length === 0;
    const hasNoCurrencies = getFormattedActorCurrencies(inDocument).length === 0;

    return isValidItemPile(targetActor) && hasNoItems && hasNoCurrencies;

}

export function getActorCurrencyList(target) {
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    return (pileData.overrideCurrencies || MODULE_SETTINGS.CURRENCIES).map(currency => {
        currency.name = game.i18n.has(currency.name) ? game.i18n.localize(currency.name) : currency.name;
        return currency;
    });
}

export function getActorCurrencies(target) {
    const inDocument = getDocument(target);
    return Object.fromEntries(getActorCurrencies(inDocument).map(currency => {
        return [currency, getProperty(currency, target)];
    }))
}

export function getFormattedActorCurrencies(target, {currencyList = false, getAll = false} = {}) {
    const inDocument = getDocument(target);
    const targetActor = inDocument?.actor ?? inDocument;
    const currencies = currencyList || getActorCurrencyList(targetActor);
    return currencies
        .filter(currency => {
            return hasProperty(targetActor.data, currency.path) && (Number(getProperty(targetActor.data, currency.path)) > 0 || getAll);
        }).map((currency, index) => {
            const localizedName = game.i18n.has(currency.name) ? game.i18n.localize(currency.name) : currency.name;
            const quantity = Number(getProperty(targetActor.data, currency.path) ?? 0);
            return {
                name: localizedName,
                path: currency.path,
                img: currency.img,
                quantity: quantity,
                index: index
            }
        });
}

function getRelevantTokensAndActor(target) {

    const inDocument = getDocument(target);

    let documentActor;
    let documentTokens = [];

    if (inDocument instanceof Actor) {
        documentActor = inDocument;
        if (inDocument.token) {
            documentToken.push(inDocument?.token);
        } else {
            documentTokens = canvas.tokens.placeables.filter(token => token.document.actor === documentActor).map(token => token.document);
        }
    } else {
        documentActor = inDocument.actor;
        if (inDocument.isLinked) {
            documentTokens = canvas.tokens.placeables.filter(token => token.document.actor === documentActor).map(token => token.document);
        } else {
            documentTokens.push(inDocument);
        }
    }

    return [documentActor, documentTokens]

}

export async function updateItemPileData(target, flagData, tokenData) {

    if (!tokenData) tokenData = {};

    const [documentActor, documentTokens] = getRelevantTokensAndActor(target);

    const targetItems = getActorItems(documentActor, flagData.itemFilters);
    const targetCurrencies = getFormattedActorCurrencies(documentActor, {currencyList: flagData.currencies});

    const data = {data: flagData, items: targetItems, currencies: targetCurrencies};

    const updates = documentTokens.map(tokenDocument => {
        const newTokenData = foundry.utils.mergeObject(tokenData, {
            "img": getItemPileTokenImage(tokenDocument, data),
            "scale": getItemPileTokenScale(tokenDocument, data),
            "name": getItemPileName(tokenDocument, data),
        });
        return {
            "_id": tokenDocument.id,
            ...newTokenData,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_FLAGS}`]: flagData
        }
    });

    await canvas.scene.updateEmbeddedDocuments("Token", updates);

    return documentActor.update({
        [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_FLAGS}`]: flagData,
        [`token.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_FLAGS}`]: flagData
    });

}


/* -------------------------- Sharing Methods ------------------------- */


export function getItemQuantity(item) {
    const itemData = item instanceof Item ? item.data : item;
    return Number(getProperty(itemData, MODULE_SETTINGS.ITEM_QUANTITY_ATTRIBUTE) ?? 0);
}


export function getItemPileSharingData(target) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    return foundry.utils.duplicate(inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_FLAGS) ?? {});
}

export function updateItemPileSharingData(target, data) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    const sharingData = foundry.utils.duplicate(inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_FLAGS) ?? {});
    const finalData = foundry.utils.mergeObject(sharingData, data);
    return inDocument.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_FLAGS, finalData);
}

export function clearItemPileSharingData(target) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    return inDocument.unsetFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_FLAGS);
}

export async function setItemPileSharingData(sourceUuid, targetUuid, {items = [], currencies = []} = {}) {

    const source = await fromUuid(sourceUuid);
    const target = await fromUuid(targetUuid);

    const sourceActor = source?.actor ?? source;
    const targetActor = target?.actor ?? target;

    const sourceIsItemPile = isValidItemPile(sourceActor);
    const targetIsItemPile = isValidItemPile(targetActor);

    if (sourceIsItemPile && targetIsItemPile) return;

    if (items.length) {
        items = items.map(itemData => {
            setProperty(itemData.item, MODULE_SETTINGS.ITEM_QUANTITY_ATTRIBUTE, itemData.quantity);
            return itemData.item;
        })
    }

    if (!Array.isArray(currencies) && typeof currencies === "object") {
        currencies = Object.entries(currencies).map(entry => {
            return {
                path: entry[0],
                quantity: entry[1]
            }
        })
    }

    if (sourceIsItemPile) {

        if (isItemPileEmpty(sourceIsItemPile)) {
            return clearItemPileSharingData(sourceIsItemPile);
        }

        const sharingData = addToItemPileSharingData(sourceActor, targetActor.uuid, {items, currencies});

        return updateItemPileSharingData(sourceActor, sharingData);

    }

    const sharingData = removeFromItemPileSharingData(targetActor, sourceActor.uuid, {items, currencies});

    return updateItemPileSharingData(targetActor, sharingData);

}

export function addToItemPileSharingData(itemPile, actorUuid, {
    sharingData = false,
    items = [],
    currencies = []
} = {}) {

    const pileData = getItemPileData(itemPile);

    let pileSharingData = {};
    if (!sharingData && ((pileData.shareItemsEnabled && items.length) || (pileData.shareCurrenciesEnabled && currencies.length))) {
        pileSharingData = getItemPileSharingData(itemPile);
    }

    if (pileData.shareItemsEnabled && items.length) {

        if (!pileSharingData.items) {
            pileSharingData.items = [];
        }

        for (const item of items) {

            let existingItem = findSimilarItem(pileSharingData.items, item);

            if (!existingItem) {
                let itemIndex = pileSharingData.items.push({
                    name: item.name,
                    type: item.type,
                    img: item.img,
                    actors: [{uuid: actorUuid, quantity: 0}]
                })
                existingItem = pileSharingData.items[itemIndex - 1];
            } else if (!existingItem.actors) {
                existingItem.actors = [];
            }

            let actorData = existingItem.actors.find(data => data.uuid === actorUuid);

            const itemQuantity = getItemQuantity(item);
            if (!actorData) {
                if (itemQuantity > 0) {
                    existingItem.actors.push({uuid: actorUuid, quantity: itemQuantity})
                }
            } else {
                actorData.quantity += itemQuantity;
                if (actorData.quantity <= 0) {
                    existingItem.actors.splice(existingItem.actors.indexOf(actorData), 1);
                }
                if (existingItem.actors.length === 0) {
                    pileSharingData.items.splice(pileSharingData.items.indexOf(existingItem), 1)
                }
            }

        }

    }

    if (pileData.shareCurrenciesEnabled && currencies.length) {

        if (!pileSharingData.currencies) {
            pileSharingData.currencies = [];
        }

        for (const currency of currencies) {

            let existingCurrency = pileSharingData.currencies.find(sharingCurrency => sharingCurrency.path === currency.path);

            if (!existingCurrency) {
                let itemIndex = pileSharingData.currencies.push({
                    path: currency.path,
                    actors: [{uuid: actorUuid, quantity: 0}]
                })
                existingCurrency = pileSharingData.currencies[itemIndex - 1];
            } else {
                if (!existingCurrency.actors) {
                    existingCurrency.actors = [];
                }
            }

            let actorData = existingCurrency.actors.find(data => data.uuid === actorUuid);

            if (!actorData) {
                if (currency.quantity > 0) {
                    existingCurrency.actors.push({uuid: actorUuid, quantity: currency.quantity})
                }
            } else {
                actorData.quantity += currency.quantity;
                if (actorData.quantity <= 0) {
                    existingCurrency.actors.splice(existingCurrency.actors.indexOf(actorData), 1);
                }
                if (existingCurrency.actors.length === 0) {
                    pileSharingData.currencies.splice(pileSharingData.currencies.indexOf(existingCurrency), 1)
                }
            }

        }

    }

    return pileSharingData;

}

export function removeFromItemPileSharingData(itemPile, actorUuid, {items = [], currencies = []} = {}) {

    items = items.map(item => {
        setProperty(item, MODULE_SETTINGS.ITEM_QUANTITY_ATTRIBUTE, getItemQuantity(item) * -1)
        return item;
    });

    currencies = currencies.map(currency => {
        currency.quantity = currency.quantity * -1;
        return currency;
    });

    return addToItemPileSharingData(itemPile, actorUuid, {items, currencies});

}

export function getItemPileItemsForActor(pile, recipient, floor = false) {

    const pileData = getItemPileData(pile);
    const pileItems = getActorItems(pile);

    const players = getPlayersForItemPile(pile);
    const pileSharingData = getItemPileSharingData(pile);
    const storedItems = pileSharingData.items ?? [];

    const recipientUuid = getUuid(recipient);

    return pileItems.map(item => {

        const quantity = getItemQuantity(item);
        let data = {
            id: item.id,
            name: item.name,
            type: item.type,
            img: item.data?.img ?? "",
            currentQuantity: 1,
            quantity: quantity,
            shareLeft: quantity,
            previouslyTaken: 0,
            toShare: pileData.shareItemsEnabled && recipientUuid,
            visible: true
        };

        if (data.toShare) {

            const foundItem = findSimilarItem(storedItems, item);

            let totalShares = quantity;
            if (foundItem) {
                totalShares += foundItem.actors.reduce((acc, actor) => {
                    return acc + actor.quantity;
                }, 0);
            }

            let totalActorShare = totalShares / players.length;
            if (!Number.isInteger(totalActorShare) && !floor) {
                totalActorShare += 1;
            }

            const takenBefore = foundItem?.actors?.find(actor => actor.uuid === recipientUuid);
            data.previouslyTaken = takenBefore ? takenBefore.quantity : 0;

            data.shareLeft = Math.max(0, Math.min(quantity, Math.floor(totalActorShare - data.previouslyTaken)));

        }

        return data;

    });

}

export function getItemPileCurrenciesForActor(pile, recipient, floor) {

    const pileData = getItemPileData(pile);
    const pileCurrencies = getFormattedActorCurrencies(pile, {getAll: !recipient});

    const players = getPlayersForItemPile(pile);
    const pileSharingData = getItemPileSharingData(pile);
    const storedCurrencies = pileSharingData.currencies ?? [];

    const recipientUuid = getUuid(recipient);

    return pileCurrencies.filter(currency => {
        return !recipient || hasProperty(recipient?.data ?? {}, currency.path);
    }).map((currency, index) => {

        currency.currentQuantity = 1;
        currency.shareLeft = currency.quantity;
        currency.toShare = pileData.shareCurrenciesEnabled && !!recipientUuid;
        currency.previouslyTaken = 0;
        currency.index = index;
        currency.visible = true;

        if (currency.toShare) {

            const foundCurrency = storedCurrencies.find(storedCurrency => storedCurrency.path === currency.path);

            let totalShares = currency.quantity;
            if (foundCurrency) {
                totalShares += foundCurrency.actors.reduce((acc, actor) => acc + actor.quantity, 0);
            }

            let totalActorShare = totalShares / players.length;
            if (!Number.isInteger(totalActorShare) && !floor) {
                totalActorShare += 1;
            }

            const takenBefore = foundCurrency?.actors?.find(actor => actor.uuid === recipientUuid);
            currency.previouslyTaken = takenBefore ? takenBefore.quantity : 0;

            currency.shareLeft = Math.max(0, Math.min(currency.quantity, Math.floor(totalActorShare - currency.previouslyTaken)));

        }

        return currency;

    });

}


/* -------------------------- Merchant Methods ------------------------- */


export function isValidMerchant(target, data = false) {
    const inDocument = getDocument(target);
    return isValidItemPile(target, data) && (data || getItemPileData(inDocument))?.isMerchant;
}

export function getItemPriceData(item, merchant = false, actor = false) {

    const currencyList = getActorCurrencyList(merchant);
    const {priceModifier} = merchant ? getMerchantModifiersForActor(merchant, actor) : {priceModifier: 100};

    const itemData = item instanceof Item ? item.data : item;

    const price = getProperty(itemData, `flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.ITEM_FLAGS}`);

    if (price) {
        price.originalCost = price.cost;
        price.cost = Math.floor(price.cost * priceModifier);
        return price;
    }

    const cost = getProperty(item.data, MODULE_SETTINGS.ITEM_PRICE_ATTRIBUTE);

    const primaryCurrency = currencyList.find(currency => currency.primary);

    return {
        attribute: true,
        img: primaryCurrency.img,
        name: primaryCurrency.name,
        path: primaryCurrency.path,
        originalCost: cost,
        cost: Math.floor(cost * priceModifier)
    }

}

export function getMerchantModifiersForActor(merchant, actor = false) {
    const pileData = getItemPileData(merchant);
    const actorSpecificModifiers = pileData?.overridePriceModifiers?.find(data => data.actor === getUuid(actor));
    const priceModifier = (actorSpecificModifiers?.priceModifier || pileData.priceModifier || 100) / 100;
    const sellModifier = (actorSpecificModifiers?.sellModifier || pileData.sellModifier || 100) / 100;
    return {
        priceModifier,
        sellModifier
    }
}

export function getMerchantItemsForActor(merchant, actor = false) {

    const pileItems = getActorItems(merchant);

    return pileItems.map(item => {
        return {
            id: item.id,
            name: item.name,
            type: item.type,
            img: item.data?.img ?? "",
            quantity: getItemQuantity(item),
            price: getItemPriceData(item, merchant, actor),
            visible: true
        }
    });

}