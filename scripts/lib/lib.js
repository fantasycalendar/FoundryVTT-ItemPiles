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

export function getSimilarItem(items, { itemId, itemName, itemType }={}) {
    for (const item of items) {
        if (item.id === itemId || (item.name === itemName && item.type === itemType)) {
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
        originalImg = pileDocument.data.actorLink
            ? pileDocument.actor.data.token.img
            : pileDocument.data.img;
    }else{
        originalImg = pileDocument.data.token.img;
    }

    if(!isValidItemPile(pileDocument)) return originalImg;

    const items = getValidDocumentItems(pileDocument);
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
        baseScale = pileDocument.data.actorLink
            ? pileDocument.actor.data.token.scale
            : pileDocument.data.scale;
    }else{
        baseScale = pileDocument.data.token.scale;
    }

    const items = getValidDocumentItems(pileDocument);
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

    const items = getValidDocumentItems(pileDocument);
    const attributes = getItemPileAttributes(pileDocument);

    const numItems = items.length + attributes.length;

    if(!isValidItemPile(pileDocument, data) || data.isContainer || !data.displayOne || !data.showItemName || numItems > 1 || numItems === 0) return pileDocument.name;

    const item = items.length > 0
        ? items[0]
        : attributes[0];

    return item.name;

}


export function getValidDocumentItems(target, itemFilters = false){

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
        filter.path = filter.path.trim().toLowerCase();
        filter.filters = new Set(filter.filters.split(',').map(string => string.trim().toLowerCase()));
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

    const hasNoItems = getValidDocumentItems(inDocument).length === 0;
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
    let targetActor = inDocument?.actor ?? inDocument;
    const attributes = getItemPileAttributeList(targetActor);
    return attributes
        .filter(attribute => {
            return hasProperty(targetActor.data, attribute.path) && Number(getProperty(targetActor.data, attribute.path)) > 0;
        }).map(attribute => {
            const localizedName = game.i18n.has(attribute.name) ? game.i18n.localize(attribute.name) : attribute.name;
            return {
                name: localizedName,
                path: attribute.path,
                img: attribute.img,
                quantity: Number(getProperty(targetActor.data, attribute.path) ?? 1)
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