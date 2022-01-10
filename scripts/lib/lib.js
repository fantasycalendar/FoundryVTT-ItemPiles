import CONSTANTS from "../constants.js";
import API from "../api.js";

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

export function getUuid(target) {
    // If it's an actor, get its TokenDocument
    // If it's a token, get its Document
    // If it's a TokenDocument, just use it
    // Otherwise fail
    const document = target?.document ?? target;
    return document?.uuid ?? false;
}

export function is_real_number(inNumber) {
    return !isNaN(inNumber)
        && typeof inNumber === "number"
        && isFinite(inNumber);
}

export function hasNonzeroAttribute(target, attribute){
    const actor = target instanceof TokenDocument
        ? target.actor
        : target;
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


export function getItemPileData(inDocument){
    if(inDocument instanceof TokenDocument && inDocument?.data?.actorLink){
        inDocument = inDocument?.actor;
    }else if(inDocument instanceof Actor && inDocument.token){
        inDocument = inDocument?.token;
    }
    try{
        let data = inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        if(!data) return {};
        let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);
        return foundry.utils.mergeObject(defaults, data);
    }catch(err){
        return {};
    }
}

export async function updateItemPile(inDocument, flagData, tokenData){

    if(!tokenData) tokenData = {};

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

    const updates = documentTokens.map(tokenDocument => {
        const newTokenData = foundry.utils.mergeObject(tokenData, {
            "img": getItemPileTokenImage(tokenDocument, flagData),
            "scale": getItemPileTokenScale(tokenDocument, flagData),
        });
        return {
            "_id": tokenDocument.id,
            ...newTokenData,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: flagData
        }
    });

    await canvas.scene.updateEmbeddedDocuments("Token", updates);

    const newPrototypeTokenData = foundry.utils.mergeObject(tokenData, {
        "img": getItemPileTokenImage(documentActor, flagData),
        "scale": getItemPileTokenScale(documentActor, flagData),
    });

    return documentActor.update({
        [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: flagData,
        ...newPrototypeTokenData
    });

}

export function getItemPileTokenImage(pileDocument, data = false) {

    if (!data) {
        data = getItemPileData(pileDocument);
    }

    let img = pileDocument instanceof TokenDocument && pileDocument.data.actorLink
        ? pileDocument.actor.data.token.img
        : pileDocument.data.img;

    if(!isValidItemPile(pileDocument)) return img;

    const items = getItemPileItems(pileDocument);

    if (data.isContainer) {

        img = data.lockedImage || data.closedImage || data.openedImage || data.emptyImage || img;

        if (data.locked && data.lockedImage) {
            img = data.lockedImage;
        } else if (data.closed && data.closedImage) {
            img = data.closedImage;
        } else if (data.emptyImage && isItemPileEmpty(pileDocument)) {
            img = data.emptyImage;
        } else if (data.openedImage) {
            img = data.openedImage;
        }

    } else if (data.displayOne && items.length === 1) {

        img = items[0].data.img;

    }

    return img;

}

export function getItemPileTokenScale(pileDocument, data) {

    if (!data) {
        data = getItemPileData(pileDocument);
    }

    const baseScale = pileDocument instanceof TokenDocument && pileDocument.data.actorLink
        ? pileDocument.actor.data.token.scale
        : pileDocument.data.scale;

    if(!isValidItemPile(pileDocument, data)) return baseScale;

    const items = getItemPileItems(pileDocument);

    return data.displayOne && data.overrideSingleItemScale && items.length === 1
        ? data.singleItemScale
        : baseScale;

}

export function getItemPileItems(target, itemTypeFilters = false){
    if(!isValidItemPile(target)) return [];

    const pileItemFilters = Array.isArray(itemTypeFilters)
        ? new Set(itemTypeFilters)
        : new Set(getItemPileItemTypeFilters(target));

    const targetActor = target instanceof TokenDocument
        ? target.actor
        : target;

    return Array.from(targetActor.items).filter(item => {
        const itemType = getProperty(item.data, API.ITEM_TYPE_ATTRIBUTE);
        return !pileItemFilters.has(itemType);
    })
}

export function isValidItemPile(inDocument, data = false){
    const documentActor = inDocument instanceof TokenDocument ? inDocument.actor : inDocument;
    return inDocument && !inDocument.destroyed && documentActor && (data || getItemPileData(inDocument))?.enabled;
}

export function getItemPileItemTypeFilters(target){
    if(!isValidItemPile(target)) return [];
    const pileData = getItemPileData(target);
    return pileData.itemTypeFilters
        ? pileData.itemTypeFilters.split(',').map(str => str.trim().toLowerCase())
        : API.ITEM_TYPE_FILTERS;
}

export function isItemPileEmpty(target) {

    const targetActor = target instanceof TokenDocument
        ? target.actor
        : target;

    if(!targetActor) return false;

    const hasNoItems = getItemPileItems(target).length === 0;

    const attributes = getItemPileAttributes(target);
    const hasEmptyAttributes = attributes.filter(attribute => {
        return hasNonzeroAttribute(targetActor, attribute.path)
    }).length === 0;

    return hasNoItems && hasEmptyAttributes;

}

export function getItemPileAttributes(target){
    const pileData = getItemPileData(target);
    return pileData.overrideAttributes || API.DYNAMIC_ATTRIBUTES;
}
