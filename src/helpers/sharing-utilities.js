import CONSTANTS from "../constants/constants.js";
import * as Utilities from "./utilities.js"
import * as PileUtilities from "./pile-utilities.js"

/**
 * Gets the players that can interact with this item pile
 *
 * @param {Actor|TokenDocument|String} target
 * @returns {Array<User>}
 */
export function getPlayersForItemPile(target) {
  const targetActor = Utilities.getActor(target);
  if (!PileUtilities.isValidItemPile(targetActor)) return [];
  const pileData = PileUtilities.getActorFlagData(targetActor);
  return Array.from(game.users).filter(u => (u.active || !pileData.activePlayers) && u.character);
}

/**
 * Retrieves an item pile's sharing data
 *
 * @param {Actor|TokenDocument|String} target
 * @returns {Object}
 */
export function getItemPileSharingData(target) {
  const targetActor = Utilities.getActor(target);
  return foundry.utils.duplicate(getProperty(targetActor, CONSTANTS.FLAGS.SHARING) ?? {});
}

/**
 * Updates an item pile's sharing data
 *
 * @param {Actor|TokenDocument|String} target
 * @param {Object} incomingSharingData
 * @returns {Promise}
 */
export function updateItemPileSharingData(target, incomingSharingData) {
  const targetActor = Utilities.getActor(target);
  const currentSharingData = getItemPileSharingData(targetActor);
  const newSharingData = foundry.utils.mergeObject(currentSharingData, incomingSharingData);
  return targetActor.update({
    [CONSTANTS.FLAGS.SHARING]: newSharingData
  });
}

/**
 * Clears an item pile's sharing data
 *
 * @param {Actor|TokenDocument|String} target
 * @returns {Promise}
 */
export function clearItemPileSharingData(target) {
  const targetActor = Utilities.getActor(target);
  return targetActor.update({
    [CONSTANTS.FLAGS.SHARING]: null
  });
}

/**
 * Merges and resolves existing sharing data on a given item pile
 *
 * @param {String} sourceUuid
 * @param {String} targetUuid
 * @param {Array<Object>} [items]
 * @param {Array<Object>} [attributes]
 */
export async function setItemPileSharingData(sourceUuid, targetUuid, { items = [], attributes = [] } = {}) {
  
  const sourceActor = Utilities.getActor(sourceUuid);
  const targetActor = Utilities.getActor(targetUuid);
  
  const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);
  const targetIsItemPile = PileUtilities.isValidItemPile(targetActor);
  
  // If both the source and target are item piles, we want to ignore this execution
  if (sourceIsItemPile && targetIsItemPile) return;
  
  if (items.length) {
    items = items.map(itemData => {
      setProperty(itemData.item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, Math.abs(itemData.quantity));
      return itemData.item;
    })
  }
  
  if (!Array.isArray(attributes) && typeof attributes === "object") {
    attributes = Object.entries(attributes).map(entry => {
      return {
        path: entry[0],
        quantity: Math.abs(entry[1])
      }
    })
  }
  
  if (sourceIsItemPile) {
    
    if (PileUtilities.isItemPileEmpty(sourceIsItemPile)) {
      return clearItemPileSharingData(sourceIsItemPile);
    }
    
    const sharingData = addToItemPileSharingData(sourceActor, targetActor.uuid, { items, attributes });
    return updateItemPileSharingData(sourceActor, sharingData);
    
  }
  
  const sharingData = removeFromItemPileSharingData(targetActor, sourceActor.uuid, { items, attributes });
  return updateItemPileSharingData(targetActor, sharingData);
  
}

export function addToItemPileSharingData(itemPile, actorUuid, {
  sharingData = false,
  items = [],
  attributes = []
} = {}) {
  
  const pileData = PileUtilities.getActorFlagData(itemPile);
  
  let pileSharingData = {};
  if (!sharingData && ((pileData.shareItemsEnabled && items.length) || (pileData.shareCurrenciesEnabled && attributes.length))) {
    pileSharingData = getItemPileSharingData(itemPile);
  }
  
  if (pileData.shareItemsEnabled && items.length) {
    
    if (!pileSharingData.items) {
      pileSharingData.items = [];
    }
    
    for (const item of items) {
      
      let existingItem = Utilities.findSimilarItem(pileSharingData.items, item);
      
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
      
      const itemQuantity = Utilities.getItemQuantity(item);
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
  
  if (pileData.shareCurrenciesEnabled && attributes.length) {
    
    if (!pileSharingData.attributes) {
      pileSharingData.attributes = [];
    }
    
    for (const attribute of attributes) {
      
      let existingCurrency = pileSharingData.attributes.find(sharingCurrency => sharingCurrency.path === attribute.path);
      
      if (!existingCurrency) {
        let itemIndex = pileSharingData.attributes.push({
          path: attribute.path,
          actors: [{ uuid: actorUuid, quantity: 0 }]
        })
        existingCurrency = pileSharingData.attributes[itemIndex - 1];
      } else {
        if (!existingCurrency.actors) {
          existingCurrency.actors = [];
        }
      }
      
      let actorData = existingCurrency.actors.find(data => data.uuid === actorUuid);
      
      if (!actorData) {
        if (attribute.quantity > 0) {
          existingCurrency.actors.push({ uuid: actorUuid, quantity: attribute.quantity })
        }
      } else {
        actorData.quantity += attribute.quantity;
        if (actorData.quantity <= 0) {
          existingCurrency.actors.splice(existingCurrency.actors.indexOf(actorData), 1);
        }
        if (existingCurrency.actors.length === 0) {
          pileSharingData.attributes.splice(pileSharingData.attributes.indexOf(existingCurrency), 1)
        }
      }
    }
  }
  
  
  return pileSharingData;
  
}

export function removeFromItemPileSharingData(itemPile, actorUuid, { items = [], attributes = [] } = {}) {
  
  items = items.map(item => {
    setProperty(item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, Utilities.getItemQuantity(item) * -1)
    return item;
  });
  
  attributes = attributes.map(attribute => {
    attribute.quantity = attribute.quantity * -1;
    return attribute;
  });
  
  return addToItemPileSharingData(itemPile, actorUuid, { items, attributes });
  
}

export function getItemPileItemsForActor(pile, recipient, floor = false) {
  
  const pileData = PileUtilities.getActorFlagData(pile);
  
  const pileItems = PileUtilities.getActorItems(pile);
  
  const pileItemCurrencies = new Set(PileUtilities.getActorCurrencyItems(pile).map(item => item.id));
  
  const players = getPlayersForItemPile(pile);
  const pileSharingData = getItemPileSharingData(pile);
  const storedItems = pileSharingData.items ?? [];
  
  const recipientUuid = Utilities.getUuid(recipient);
  
  return pileItems.map(item => {
    
    const quantity = Utilities.getItemQuantity(item);
    
    const isCurrency = pileItemCurrencies.has(item.id);
    
    const data = {
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.data?.img ?? "",
      data: item.toObject(),
      currency: isCurrency,
      currentQuantity: 1,
      quantity: quantity,
      shareLeft: quantity,
      previouslyTaken: 0,
      toShare: isCurrency
        ? pileData.shareCurrenciesEnabled && recipientUuid
        : pileData.shareItemsEnabled && recipientUuid,
      visible: true
    };
    
    if (data.toShare) {
      
      const foundItem = Utilities.findSimilarItem(storedItems, item);
      
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

export function getItemPileAttributesForActor(pile, recipient, floor) {
  
  const pileData = PileUtilities.getActorFlagData(pile);
  const pileCurrencies = PileUtilities.getFormattedActorCurrencies(pile, { getAll: !recipient, attributesOnly: true });
  
  const players = getPlayersForItemPile(pile);
  const pileSharingData = getItemPileSharingData(pile);
  const storedCurrencies = pileSharingData.attributes ?? [];
  
  const recipientUuid = Utilities.getUuid(recipient);
  
  return pileCurrencies.filter(attribute => {
    return !recipient || hasProperty(recipient?.data ?? {}, attribute.path);
  }).map((attribute, index) => {
    
    attribute.currentQuantity = 1;
    attribute.shareLeft = attribute.quantity;
    attribute.toShare = pileData.shareCurrenciesEnabled && !!recipientUuid;
    attribute.previouslyTaken = 0;
    attribute.index = index;
    attribute.visible = true;
    
    if (attribute.toShare) {
      
      const existingCurrency = attribute.type === "attribute"
        ? storedCurrencies.find(storedCurrency => storedCurrency.path === attribute.path)
        : Utilities.findSimilarItem(storedCurrencies, attribute)
      
      let totalShares = attribute.quantity;
      if (existingCurrency) {
        totalShares += existingCurrency.actors.reduce((acc, actor) => acc + actor.quantity, 0);
      }
      
      let totalActorShare = totalShares / players.length;
      if (!Number.isInteger(totalActorShare) && !floor) {
        totalActorShare += 1;
      }
      
      const takenBefore = existingCurrency?.actors?.find(actor => actor.uuid === recipientUuid);
      attribute.previouslyTaken = takenBefore ? takenBefore.quantity : 0;
      
      attribute.shareLeft = Math.max(0, Math.min(attribute.quantity, Math.floor(totalActorShare - attribute.previouslyTaken)));
      
    }
    
    return attribute;
    
  });
  
}