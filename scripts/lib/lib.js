import CONSTANTS from "../constants.js";
import API from "../api.js";
import flagManager from "../flagManager.js";

export function isGMConnected(){
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

export function grids_between_tokens(a, b){
    return Math.floor(distance_between_rect(a, b) / canvas.grid.size) + 1
}

export function tokens_close_enough(a, b, maxDistance){
    const distance = grids_between_tokens(a, b);
    return maxDistance >= distance;
}

export function findSimilarItem(items, findItem) {
    for (const item of items) {
        if (item.id === (findItem.id ?? findItem._id) || (item.name === findItem.name && item.type === (findItem.type ?? findItem.data.type))) {
            return item;
        }
    }
    return false;
}

export async function getToken(documentUuid) {
    const document = await fromUuid(documentUuid);
    return document?.token ?? document;
}

export function is_UUID(inId) {
    return typeof inId === "string"
        && inId.startsWith("Scene")
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

export function getDocument(target){
    if(target instanceof foundry.abstract.Document) return target;
    return target?.document;
}

export function is_real_number(inNumber) {
    return !isNaN(inNumber)
        && typeof inNumber === "number"
        && isFinite(inNumber);
}

export function hasNonzeroAttribute(target, attribute){
    let inDocument = getDocument(target);
    const actor = inDocument instanceof TokenDocument
        ? inDocument.actor
        : inDocument;
    const attributeValue = Number(getProperty(actor.data, attribute) ?? 0);
    return hasProperty(actor.data, attribute) && attributeValue > 0;
}

export function dialogWarning(message, icon = "fas fa-exclamation-triangle"){
    return `<p class="item-piles-dialog">
        <i style="font-size:3rem;" class="${icon}"></i><br><br>
        <strong style="font-size:1.2rem;">Item Piles</strong>
        <br><br>${message}
    </p>`;
}


export function getItemPileData(target){
    let inDocument = getDocument(target);
    if(inDocument instanceof TokenDocument){
        inDocument = inDocument?.actor;
    }
    try{
        let data = foundry.utils.duplicate(flagManager.getFlags(inDocument));
        if(!data) return {};
        let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);
        return foundry.utils.mergeObject(defaults, data);
    }catch(err){
        return {};
    }
}

export function getItemPileTokenImage(target, data = false) {

    const pileDocument = getDocument(target);

    if (!data) {
        data = getItemPileData(pileDocument);
    }

    let originalImg;
    if(pileDocument instanceof TokenDocument){
        originalImg = pileDocument.actor.data.token.img;
    }else{
        originalImg = pileDocument.data.token.img;
    }

    if(!isValidItemPile(pileDocument)) return originalImg;

    const items = getItemPileItems(pileDocument);
    const attributes = getItemPileAttributes(pileDocument);

    const numItems = items.length + attributes.length;

    let img;

    if (data.displayOne && numItems === 1) {
        img = items.length > 0
            ? items[0].data.img
            : attributes[0].img;
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

export function getItemPileTokenScale(target, data) {

    const pileDocument = getDocument(target);

    if (!data) {
        data = getItemPileData(pileDocument);
    }

    let baseScale;
    if(pileDocument instanceof TokenDocument){
        baseScale = pileDocument.actor.data.token.scale;
    }else{
        baseScale = pileDocument.data.token.scale;
    }

    const items = getItemPileItems(pileDocument);
    const attributes = getItemPileAttributes(pileDocument);

    const numItems = items.length + attributes.length;

    if(!isValidItemPile(pileDocument, data) || data.isContainer || !data.displayOne || !data.overrideSingleItemScale || numItems > 1 || numItems === 0) return baseScale;

    return data.singleItemScale;

}

export function getItemPileName(target, data){

    const pileDocument = getDocument(target);

    if (!data) {
        data = getItemPileData(pileDocument);
    }

    const items = getItemPileItems(pileDocument);
    const attributes = getItemPileAttributes(pileDocument);

    const numItems = items.length + attributes.length;

    let name;
    if(pileDocument instanceof TokenDocument){
        name = pileDocument.actor.data.token.name;
    }else{
        name = pileDocument.data.token.name;
    }

    if(!isValidItemPile(pileDocument, data) || data.isContainer || !data.displayOne || !data.showItemName || numItems > 1 || numItems === 0) return name;

    const item = items.length > 0
        ? items[0]
        : attributes[0];

    return item.name;

}


export function getItemPileItems(target, itemFilters = false){

    const pileItemFilters = itemFilters || getDocumentItemFilters(target);

    const inDocument = getDocument(target);
    const targetActor = inDocument instanceof TokenDocument
        ? inDocument.actor
        : inDocument;

    return Array.from(targetActor.items).filter(item => !isItemInvalid(inDocument, item, pileItemFilters));

}

export function isActiveGM(user) {
    return user.active && user.isGM;
}

export function isResponsibleGM() {
    if (!game.user.isGM) return false;
    const connectedGMs = game.users.filter(isActiveGM);
    return !connectedGMs.some(other => other.data._id < game.user.data._id);
}

export function getPlayersForItemPile(target){
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    if(!isValidItemPile(inDocument)) return [];
    return Array.from(game.users).filter(u => (u.active || !pileData.activePlayers) && u.character);
}

export function isItemInvalid(target, item, itemFilters = false){
    const pileItemFilters = itemFilters || getDocumentItemFilters(target);
    const itemData = item instanceof Item ? item.data : item;
    for(const filter of pileItemFilters){
        if(!hasProperty(itemData, filter.path)) continue;
        const attributeValue = getProperty(itemData, filter.path);
        if (filter.filters.has(attributeValue)) {
            return attributeValue;
        }
    }
    return false;
}

export function getDocumentItemFilters(target){
    if(!target) return API.ITEM_FILTERS;
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
export function cleanItemFilters(itemFilters){
    return itemFilters ? foundry.utils.duplicate(itemFilters).map(filter => {
        filter.path = filter.path.trim();
        filter.filters = new Set(filter.filters.split(',').map(string => string.trim()));
        return filter;
    }) : [];
}

export function isValidItemPile(target, data = false){
    const inDocument = getDocument(target);
    const documentActor = inDocument instanceof TokenDocument ? inDocument.actor : inDocument;
    return inDocument && !inDocument.destroyed && documentActor && (data || getItemPileData(inDocument))?.enabled;
}

export function isItemPileEmpty(target) {

    const inDocument = getDocument(target);

    const targetActor = inDocument instanceof TokenDocument
        ? inDocument.actor
        : inDocument;

    if(!targetActor) return false;

    const hasNoItems = getItemPileItems(inDocument).length === 0;
    const hasEmptyAttributes = getItemPileAttributes(inDocument).length === 0;

    return hasNoItems && hasEmptyAttributes;

}

export function getItemPileAttributeList(target){
    const inDocument = getDocument(target);
    const pileData = getItemPileData(inDocument);
    return pileData.overrideAttributes || API.DYNAMIC_ATTRIBUTES;
}

export function getItemPileAttributes(target) {
    const inDocument = getDocument(target);
    const targetActor = inDocument?.actor ?? inDocument;
    const attributes = getItemPileAttributeList(targetActor);
    return attributes
        .filter(attribute => {
            return hasProperty(targetActor.data, attribute.path) && Number(getProperty(targetActor.data, attribute.path)) > 0;
        }).map(attribute => {
            const localizedName = game.i18n.has(attribute.name) ? game.i18n.localize(attribute.name) : attribute.name;
            const quantity = Number(getProperty(targetActor.data, attribute.path) ?? 1);
            return {
                name: localizedName,
                path: attribute.path,
                img: attribute.img,
                quantity: quantity
            }
        });
}

function getRelevantTokensAndActor(target){

    const inDocument = getDocument(target);

    let documentActor;
    let documentTokens = [];

    if(inDocument instanceof Actor){
        documentActor = inDocument;
        if(inDocument.token) {
            documentToken.push(inDocument?.token);
        }else{
            documentTokens = canvas.tokens.placeables.filter(token => token.document.actor === documentActor).map(token => token.document);
        }
    }else{
        documentActor = inDocument.actor;
        if(inDocument.isLinked){
            documentTokens = canvas.tokens.placeables.filter(token => token.document.actor === documentActor).map(token => token.document);
        }else{
            documentTokens.push(inDocument);
        }
    }

    return [documentActor, documentTokens]

}

export async function updateItemPileData(target, flagData, tokenData){

    if(!tokenData) tokenData = {};

    const [documentActor, documentTokens] = getRelevantTokensAndActor(target);

    const updates = documentTokens.map(tokenDocument => {
        const newTokenData = foundry.utils.mergeObject(tokenData, {
            "img": getItemPileTokenImage(tokenDocument, flagData),
            "scale": getItemPileTokenScale(tokenDocument, flagData),
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
        "token": {
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: flagData,
        }
    });

}























/* -------------------------- Sharing Methods ------------------------- */


export function getItemQuantity(item){
    return Number(getProperty(item?._id ? item : item.data, API.ITEM_QUANTITY_ATTRIBUTE) ?? 0);
}


export function getItemPileSharingData(target){
    let inDocument = getDocument(target);
    if(inDocument instanceof TokenDocument){
        inDocument = inDocument?.actor;
    }
    return foundry.utils.duplicate(inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_DATA) ?? {});
}

export function updateItemPileSharingData(target, data){
    let inDocument = getDocument(target);
    if(inDocument instanceof TokenDocument){
        inDocument = inDocument?.actor;
    }
    const sharingData = foundry.utils.duplicate(inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_DATA) ?? {});
    const finalData = foundry.utils.mergeObject(sharingData, data);
    return inDocument.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.SHARING_DATA, finalData);
}

export async function setItemPileSharingData(sourceUuid, targetUuid, items){

    const source = await fromUuid(sourceUuid);
    const target = await fromUuid(targetUuid);

    const sourceActor = source?.actor ?? source;
    const targetActor = target?.actor ?? target;

    const sourceIsItemPile = isValidItemPile(sourceActor);
    const targetIsItemPile = isValidItemPile(target);

    if(sourceIsItemPile && targetIsItemPile) return;

    items = items.map(itemData => {
        setProperty(itemData.item, API.ITEM_QUANTITY_ATTRIBUTE, itemData.quantity);
        return itemData.item;
    })

    if(sourceIsItemPile) {

        const pileData = getItemPileData(sourceActor);

        if (pileData.itemsFreeForAll) return;

        return addItemsToItemPileSharing(sourceActor, targetActor.uuid, items);

    }

    const pileData = getItemPileData(targetActor);

    if (pileData.itemsFreeForAll) return;

    return removeItemsFromItemPileSharing(targetActor, sourceActor.uuid, items);

}



export async function addItemsToItemPileSharing(itemPile, actorUuid, items){

    const itemPileData = getItemPileData(itemPile);

    let pileSharingData = {};

    if(!itemPileData.itemsFreeForAll) {

        pileSharingData = getItemPileSharingData(itemPile);

        if (!pileSharingData.items) {
            pileSharingData.items = [];
        }

        for (const item of items) {

            let existingItem = findSimilarItem(pileSharingData.items, item);

            const itemQuantity = getItemQuantity(item);

            if (!existingItem) {
                let itemIndex = pileSharingData.items.push({
                    name: item.name,
                    type: item.type,
                    actors: [{ uuid: actorUuid, quantity: 0 }]
                })
                existingItem = pileSharingData.items[itemIndex-1];
            }else{
                if (!existingItem.actors) {
                    existingItem.actors = [];
                }
            }

            let actorData = existingItem.actors.find(data => data.uuid === actorUuid);

            if (!actorData) {
                if(itemQuantity > 0) {
                    existingItem.actors.push({ uuid: actorUuid, quantity: itemQuantity })
                }
            } else {
                actorData.quantity += itemQuantity;
                if(actorData.quantity <= 0){
                    existingItem.actors.splice(existingItem.actors.indexOf(actorData), 1);
                }
            }

        }

    }

    return updateItemPileSharingData(itemPile, pileSharingData);

}

export async function removeItemsFromItemPileSharing(itemPile, actorUuid, items){

    const itemPileData = getItemPileData(itemPile);

    if(!itemPileData.itemsFreeForAll) {

        items = items.map(item => {
            setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, getItemQuantity(item) * -1)
            return item;
        });

    }

    return addItemsToItemPileSharing(itemPile, actorUuid, items);

}

export function getItemPileItemsForActor(pile, recipient){

    const pileData = getItemPileData(pile);
    const pileItems = getItemPileItems(pile);

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
            shareLeft: false
        };

        if(!pileData.itemsFreeForAll && recipientUuid) {

            const foundItem = findSimilarItem(storedItems, item);

            let totalShares = quantity;
            if(foundItem) {
                totalShares += foundItem.actors.reduce((acc, actor) => acc + actor.quantity, 0);
            }

            let totalActorShare = totalShares / players.length;
            if(!Number.isInteger(totalActorShare)){
                totalActorShare += 1;
            }

            let actorQuantity = foundItem.actors ? foundItem?.actors?.find(actor => actor.uuid === recipientUuid)?.quantity ?? 0 : 0;

            data.shareLeft = Math.min(quantity, Math.floor(totalActorShare - actorQuantity));

        }

        return data;

    });

}

export function getItemPileAttributesForActor(pile, recipient){

    const pileData = getItemPileData(pile);
    const pileAttributes = getItemPileAttributes(pile);

    const players = getPlayersForItemPile(pile);
    const pileSharingData = getItemPileSharingData(pile);
    const storedAttributes = pileSharingData.attributes ?? [];

    const recipientUuid = getUuid(recipient);

    return pileAttributes.filter(attribute => {
        return hasProperty(recipient?.data ?? {}, attribute.path);
    }).map(attribute => {

        attribute.shareLeft = false;
        attribute.currentQuantity = 1;

        if(!pileData.attributesFreeForAll && recipientUuid) {

            const foundAttribute = findSimilarItem(storedAttributes, attribute.path);

            let totalShares = attribute.quantity;
            if(foundAttribute) {
                totalShares += foundAttribute.actors.reduce((acc, actor) => acc + actor.quantity, 0);
            }

            let totalActorShare = totalShares / players.length;
            if(!Number.isInteger(totalActorShare)){
                totalActorShare += 1;
            }

            let actorQuantity = foundAttribute.actors ? foundAttribute?.actors?.find(actor => actor.uuid === recipientUuid)?.quantity ?? 0 : 0;

            attribute.shareLeft = Math.min(attribute.quantity, Math.floor(totalActorShare - actorQuantity));

        }

        return attribute;

    });

}

export function getItemPileSplittableItems(target, numTakers, itemFilters = false){

    const inDocument = getDocument(target);
    let targetActor = inDocument?.actor ?? inDocument;
    return getItemPileItems(targetActor, itemFilters)
        .map(item => item.toObject())
        .filter(item => {
            return getItemQuantity(item) / numTakers >= 1;
        }).map(item => {
            const toRemovePerActor = Math.floor(getItemQuantity(item) / numTakers);
            return {
                item,
                quantity: toRemovePerActor * numTakers
            };
        });

}

export function getItemPileSplittableAttributes(target, numTakers) {
    const inDocument = getDocument(target);
    let targetActor = inDocument?.actor ?? inDocument;
    return getItemPileAttributes(targetActor)
        .filter(attribute => {
            return attribute.quantity >= numTakers;
        }).map(attribute => {
            const toRemovePerActor = Math.floor(getProperty(targetActor.data, attribute.path) / numTakers);
            attribute.quantity = toRemovePerActor * numTakers;
            return attribute;
        });
}




