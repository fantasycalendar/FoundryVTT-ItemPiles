import CONSTANTS from "../constants.js";
import API from "../api.js";

export function isGMConnected() {
    return !!Array.from(game.users).find(user => user.isGM && user.active);
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function debug(msg, args = "") {
    if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) console.log(`DEBUG | Item Piles | ${msg}`, args)
}

export function custom_notify(message) {
    message = `Item Piles | ${message}`;
    ui.notifications.notify(message);
    console.log(message.replace("<br>", "\n"));
}

export function custom_warning(warning, notify = false) {
    warning = `Item Piles | ${warning}`;
    if (notify) ui.notifications.warn(warning);
    console.warn(warning.replace("<br>", "\n"));
}

export function custom_error(error, notify = true) {
    error = `Item Piles | ${error}`;
    if (notify) ui.notifications.error(error);
    return new Error(error.replace("<br>", "\n"));
}

export function isVersion9() {
    return isNewerVersion((game?.version ?? game.data.version), "9.00");
}

export function getTokensAtLocation(position) {
    const tokens = [...canvas.tokens.placeables];
    return tokens.filter(token => {
        return position.x >= token.x && position.x < (token.x + (token.data.width * canvas.grid.size))
            && position.y >= token.y && position.y < (token.y + (token.data.height * canvas.grid.size));
    });
}

export function distance_between_rect(p1, p2) {

    const x1 = p1.x;
    const y1 = p1.y;
    const x1b = p1.x + p1.w;
    const y1b = p1.y + p1.h;

    const x2 = p2.x;
    const y2 = p2.y;
    const x2b = p2.x + p2.w;
    const y2b = p2.y + p2.h;

    const left = x2b < x1;
    const right = x1b < x2;
    const bottom = y2b < y1;
    const top = y1b < y2;

    if (top && left) {
        return distance_between({ x: x1, y: y1b }, { x: x2b, y: y2 });
    } else if (left && bottom) {
        return distance_between({ x: x1, y: y1 }, { x: x2b, y: y2b });
    } else if (bottom && right) {
        return distance_between({ x: x1b, y: y1 }, { x: x2, y: y2b });
    } else if (right && top) {
        return distance_between({ x: x1b, y: y1b }, { x: x2, y: y2 });
    } else if (left) {
        return x1 - x2b;
    } else if (right) {
        return x2 - x1b;
    } else if (bottom) {
        return y1 - y2b;
    } else if (top) {
        return y2 - y1b;
    }

    return 0;

}

export function distance_between(a, b) {
    return new Ray(a, b).distance;
}

export function grids_between_tokens(a, b) {
    return Math.floor(distance_between_rect(a, b) / canvas.grid.size) + 1
}

export function tokens_close_enough(a, b, maxDistance) {
    const distance = grids_between_tokens(a, b);
    return maxDistance >= distance;
}

export function findSimilarItem(items, findItem) {

    const itemSimilarities = API.ITEM_SIMILARITIES;

    const findItemId = findItem?.id ?? findItem?._id;

    return items.find(item => {
        const itemId = item.id ?? item._id;
        if (itemId === findItemId) return true;

        const itemData = item instanceof Item ? item.data : item;
        for (const path of itemSimilarities) {
            if (getProperty(itemData, path) !== getProperty(findItem, path)) return false;
        }

        return true;
    });
}

export async function getToken(documentUuid) {
    const document = await fromUuid(documentUuid);
    return document?.token ?? document;
}

export function is_UUID(inId) {
    return typeof inId === "string"
        && (inId.match(/\./g) || []).length
        && !inId.endsWith(".");
}

export function getUuid(target) {
    // If it's an actor, get its TokenDocument
    // If it's a token, get its Document
    // If it's a TokenDocument, just use it
    // Otherwise fail
    const document = getDocument(target);
    return document?.uuid ?? false;
}

export function getDocument(target) {
    if (target instanceof foundry.abstract.Document) return target;
    return target?.document;
}

export function is_real_number(inNumber) {
    return !isNaN(inNumber)
        && typeof inNumber === "number"
        && isFinite(inNumber);
}

export function dialogLayout({ title="Item Piles", message, icon = "fas fa-exclamation-triangle", extraHtml = "" }={}){
    return `
    <div class="item-piles-dialog">
        <p><i style="font-size:3rem;" class="${icon}"></i></p>
        <p style="margin-bottom: 1rem"><strong style="font-size:1.2rem;">${title}</strong></p>
        <p>${message}</p>
        ${extraHtml}
    </div>
    `;
}


export function getItemPileData(target) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    try {
        let data = foundry.utils.duplicate(inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA));
        if (!data) return {};
        let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);
        return foundry.utils.mergeObject(defaults, data);
    } catch (err) {
        return {};
    }
}

export function getItemPileTokenImage(target, { data = false, items = false, currencies = false } = {}) {

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
    currencies = currencies || getActorCurrencies(pileDocument);

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

export function getItemPileTokenScale(target, { data = false, items = false, currencies = false } = {}) {

    const pileDocument = getDocument(target);

    data = data || getItemPileData(pileDocument);

    let baseScale;
    if (pileDocument instanceof TokenDocument) {
        baseScale = pileDocument.data.scale;
    } else {
        baseScale = pileDocument.data.token.scale;
    }

    items = items || getActorItems(pileDocument);
    currencies = currencies || getActorCurrencies(pileDocument);

    const numItems = items.length + currencies.length;

    if (!isValidItemPile(pileDocument, data) || data.isContainer || !data.displayOne || !data.overrideSingleItemScale || numItems > 1 || numItems === 0) return baseScale;

    return data.singleItemScale;

}

export function getItemPileName(target, { data = false, items = false, currencies = false } = {}) {

    const pileDocument = getDocument(target);

    data = data || getItemPileData(pileDocument);

    items = items || getActorItems(pileDocument);
    currencies = currencies || getActorCurrencies(pileDocument);

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


export function getActorItems(target, itemFilters = false) {

    const pileItemFilters = itemFilters || getActorItemFilters(target);

    const inDocument = getDocument(target);
    const targetActor = inDocument instanceof TokenDocument
        ? inDocument.actor
        : inDocument;

    return Array.from(targetActor.items).filter(item => !isItemInvalid(inDocument, item, pileItemFilters));

}

export function isActiveGM(user) {
    return user.active && user.isGM;
}

export function getActiveGMs() {
    return game.users.filter(isActiveGM);
}

export function isResponsibleGM() {
    if (!game.user.isGM) return false;
    return !getActiveGMs().some(other => other.data._id < game.user.data._id);
}

export function getPlayersForItemPile(target) {
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    if (!isValidItemPile(inDocument)) return [];
    return Array.from(game.users).filter(u => (u.active || !pileData.activePlayers) && u.character);
}

export function isItemInvalid(target, item, itemFilters = false) {
    const pileItemFilters = itemFilters || getActorItemFilters(target);
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
    if (!target) return API.ITEM_FILTERS;
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    return isValidItemPile(inDocument) && pileData?.overrideItemFilters
        ? cleanItemFilters(pileData.overrideItemFilters)
        : API.ITEM_FILTERS;
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
        filter.filters = new Set(filter.filters.split(',').map(string => string.trim()));
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
    const hasNoCurrencies = getActorCurrencies(inDocument).length === 0;

    return isValidItemPile(targetActor) && hasNoItems && hasNoCurrencies;

}

export function getActorCurrencyList(target) {
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    return pileData.overrideCurrencies || API.CURRENCIES;
}

export function getActorCurrencies(target, { currencyList = false, getAll = false } = {}) {
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
    const targetCurrencies = getActorCurrencies(documentActor, { currencyList: flagData.currencies });

    const data = { data: flagData, items: targetItems, currencies: targetCurrencies };

    const updates = documentTokens.map(tokenDocument => {
        const newTokenData = foundry.utils.mergeObject(tokenData, {
            "img": getItemPileTokenImage(tokenDocument, data),
            "scale": getItemPileTokenScale(tokenDocument, data),
            "name": getItemPileName(tokenDocument, data),
        });
        return {
            "_id": tokenDocument.id,
            ...newTokenData,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: flagData
        }
    });

    await canvas.scene.updateEmbeddedDocuments("Token", updates);

    return documentActor.update({
        [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: flagData,
        [`token.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: flagData
    });

}


/* -------------------------- Sharing Methods ------------------------- */


export function getItemQuantity(item) {
    const itemData = item instanceof Item ? item.data : item;
    return Number(getProperty(itemData, API.ITEM_QUANTITY_ATTRIBUTE) ?? 0);
}


export function getItemPileSharingData(target) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    return foundry.utils.duplicate(inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_DATA) ?? {});
}

export function updateItemPileSharingData(target, data) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    const sharingData = foundry.utils.duplicate(inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_DATA) ?? {});
    const finalData = foundry.utils.mergeObject(sharingData, data);
    return inDocument.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_DATA, finalData);
}

export function clearItemPileSharingData(target) {
    let inDocument = getDocument(target);
    if (inDocument instanceof TokenDocument) {
        inDocument = inDocument?.actor;
    }
    return inDocument.unsetFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_DATA);
}

export async function setItemPileSharingData(sourceUuid, targetUuid, { items = [], currencies = [] } = {}) {

    const source = await fromUuid(sourceUuid);
    const target = await fromUuid(targetUuid);

    const sourceActor = source?.actor ?? source;
    const targetActor = target?.actor ?? target;

    const sourceIsItemPile = isValidItemPile(sourceActor);
    const targetIsItemPile = isValidItemPile(targetActor);

    if (sourceIsItemPile && targetIsItemPile) return;

    if (items.length) {
        items = items.map(itemData => {
            setProperty(itemData.item, API.ITEM_QUANTITY_ATTRIBUTE, itemData.quantity);
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

        const sharingData = addToItemPileSharingData(sourceActor, targetActor.uuid, { items, currencies });

        return updateItemPileSharingData(sourceActor, sharingData);

    }

    const sharingData = removeFromItemPileSharingData(targetActor, sourceActor.uuid, { items, currencies });

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
                    actors: [{ uuid: actorUuid, quantity: 0 }]
                })
                existingItem = pileSharingData.items[itemIndex - 1];
            } else if (!existingItem.actors) {
                existingItem.actors = [];
            }

            let actorData = existingItem.actors.find(data => data.uuid === actorUuid);

            const itemQuantity = getItemQuantity(item);
            if (!actorData) {
                if (itemQuantity > 0) {
                    existingItem.actors.push({ uuid: actorUuid, quantity: itemQuantity })
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
                    actors: [{ uuid: actorUuid, quantity: 0 }]
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
                    existingCurrency.actors.push({ uuid: actorUuid, quantity: currency.quantity })
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

export function removeFromItemPileSharingData(itemPile, actorUuid, { items = [], currencies = [] } = {}) {

    items = items.map(item => {
        setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, getItemQuantity(item) * -1)
        return item;
    });

    currencies = currencies.map(currency => {
        currency.quantity = currency.quantity * -1;
        return currency;
    });

    return addToItemPileSharingData(itemPile, actorUuid, { items, currencies });

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
            toShare: pileData.shareItemsEnabled && recipientUuid
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
    const pileCurrencies = getActorCurrencies(pile, { getAll: !recipient });

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
