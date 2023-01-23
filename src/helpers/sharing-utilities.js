import CONSTANTS from "../constants/constants.js";
import * as Utilities from "./utilities.js"
import * as PileUtilities from "./pile-utilities.js"

export function getActivePlayers(onlyActive = false) {
  return Array.from(game.users).filter(u => (u.active || !onlyActive) && u.character);
}

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
  return getActivePlayers(pileData.activePlayers);
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
 * @param {Actor|TokenDocument|foundry.abstract.Document|String} target
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
      Utilities.setItemQuantity(itemData.item, Math.abs(itemData.quantity));
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

  const pileCurrencies = PileUtilities.getActorCurrencies(itemPile, { getAll: true });

  const filteredItems = items.filter(item => !pileCurrencies.some(currency => item.id !== currency.id));
  const currencies = items.filter(item => !pileCurrencies.some(currency => item.id === currency.id));

  let pileSharingData = {};
  if (!sharingData && ((pileData.shareItemsEnabled && filteredItems.length) || (pileData.shareCurrenciesEnabled && (attributes.length || currencies.length)))) {
    pileSharingData = getItemPileSharingData(itemPile);
  }

  if ((pileData.shareItemsEnabled && filteredItems.length) || (pileData.shareCurrenciesEnabled && currencies.length)) {

    if (!pileSharingData.items) {
      pileSharingData.items = [];
    }

    for (const item of filteredItems.concat(currencies)) {

      let existingItem = Utilities.findSimilarItem(pileSharingData.items, item);

      if (!existingItem) {
        let itemIndex = pileSharingData.items.push(Utilities.setSimilarityProperties({
          actors: [{ uuid: actorUuid, quantity: 0 }]
        }, item))
        existingItem = pileSharingData.items[itemIndex - 1];
      } else if (!existingItem.actors) {
        existingItem.actors = [];
        existingItem._id = item.id;
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
    Utilities.setItemQuantity(item, Utilities.getItemQuantity(item) * -1)
    return item;
  });

  attributes = attributes.map(attribute => {
    attribute.quantity = attribute.quantity * -1;
    return attribute;
  });

  return addToItemPileSharingData(itemPile, actorUuid, { items, attributes });

}

export function getItemSharesLeftForActor(pile, item, recipient, {
  currentQuantity = null,
  floor = null,
  players = null,
  shareData = null
} = {}) {

  if (item instanceof String) {
    item = pile.items.get(item);
  }
  let previouslyTaken = 0;
  let recipientUuid = Utilities.getUuid(recipient);
  currentQuantity = currentQuantity ?? Math.abs(Utilities.getItemQuantity(item));
  let totalShares = currentQuantity;

  shareData = shareData ?? getItemPileSharingData(pile);
  if (shareData?.items?.length) {
    const foundItem = Utilities.findSimilarItem(shareData.items, item);
    if (foundItem) {
      totalShares = foundItem.actors.reduce((acc, actor) => acc + actor.quantity, currentQuantity);
      const quantityTakenBefore = foundItem.actors.find(actor => actor.uuid === recipientUuid);
      previouslyTaken = quantityTakenBefore ? quantityTakenBefore.quantity : 0;
    }
  }

  players = players ?? getPlayersForItemPile(pile).length;
  let totalActorShare = totalShares / players;
  if (!Number.isInteger(totalActorShare) && !floor) {
    totalActorShare += 1;
  }

  return Math.max(0, Math.min(currentQuantity, Math.floor(totalActorShare - previouslyTaken)));

}

export function getAttributeSharesLeftForActor(pile, path, recipient, {
  currentQuantity = null,
  floor = null,
  players = null,
  shareData = null
} = {}) {

  let previouslyTaken = 0;
  let recipientUuid = Utilities.getUuid(recipient);
  currentQuantity = currentQuantity ?? Number(getProperty(pile, path) ?? 0);
  let totalShares = currentQuantity;

  shareData = shareData ?? getItemPileSharingData(pile);
  if (shareData?.attributes?.length) {
    const existingCurrency = shareData.attributes.find(storedCurrency => storedCurrency.path === path);
    if (existingCurrency) {
      totalShares = existingCurrency.actors.reduce((acc, actor) => acc + actor.quantity, currentQuantity);

      const quantityTakenBefore = existingCurrency?.actors?.find(actor => actor.uuid === recipientUuid);
      previouslyTaken = quantityTakenBefore ? quantityTakenBefore.quantity : 0;
    }
  }

  players = players ?? getPlayersForItemPile(pile).length;
  let totalActorShare = totalShares / players;
  if (!Number.isInteger(totalActorShare) && !floor) {
    totalActorShare += 1;
  }

  return Math.max(0, Math.min(currentQuantity, Math.floor(totalActorShare - previouslyTaken)));

}
