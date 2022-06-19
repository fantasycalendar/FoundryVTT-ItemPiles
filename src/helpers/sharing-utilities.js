import CONSTANTS from "../constants/constants.js";
import * as Utilities from "./utilities.js"
import * as PileUtilities from "./pile-utilities.js"
import * as Util from "util";

export function getPlayersForItemPile(target) {
  const targetActor = Utilities.getActor(target);
  const pileData = PileUtilities.getActorFlagData(targetActor);
  if (!PileUtilities.isValidItemPile(targetActor)) return [];
  return Array.from(game.users).filter(u => (u.active || !pileData.activePlayers) && u.character);
}

export function getItemPileSharingData(target) {
  const targetActor = Utilities.getActor(target);
  return foundry.utils.duplicate(getProperty(targetActor, CONSTANTS.FLAGS.SHARING) ?? {});
}

export function updateItemPileSharingData(target, incomingSharingData) {
  const targetActor = Utilities.getActor(target);
  const currentSharingData = getItemPileSharingData(targetActor);
  const newSharingData = foundry.utils.mergeObject(currentSharingData, incomingSharingData);
  return targetActor.update({
    [CONSTANTS.FLAGS.SHARING]: newSharingData
  });
}

export function clearItemPileSharingData(target) {
  const targetActor = Utilities.getActor(target);
  return targetActor.update({
    [CONSTANTS.FLAGS.SHARING]: null
  });
}

export async function setItemPileSharingData(sourceUuid, targetUuid, { items = [], currencies = [] } = {}) {

  const sourceActor = Utilities.getActor(sourceUuid);
  const targetActor = Utilities.getActor(targetUuid);

  const sourceIsItemPile = PileUtilities.isValidItemPile(sourceActor);
  const targetIsItemPile = PileUtilities.isValidItemPile(targetActor);

  if (sourceIsItemPile && targetIsItemPile) return;

  if (items.length) {
    items = items.map(itemData => {
      setProperty(itemData.item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, itemData.quantity);
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

    if (PileUtilities.isItemPileEmpty(sourceIsItemPile)) {
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

  const pileData = PileUtilities.getActorFlagData(itemPile);

  let pileSharingData = {};
  if (!sharingData && ((pileData.shareItemsEnabled && items.length) || (pileData.shareCurrenciesEnabled && currencies.length))) {
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

  if (pileData.shareCurrenciesEnabled && currencies.length) {

    if (!pileSharingData.currencies) {
      pileSharingData.currencies = [];
    }

    for (const currency of currencies) {
      
      if (currency.type === "attribute") {

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

      } else {

        let existingCurrency = Utilities.findSimilarItem(pileSharingData.currencies, currency);

        if (!existingCurrency) {
          let itemIndex = pileSharingData.items.push({
            name: existingCurrency.name,
            type: existingCurrency.type,
            img: existingCurrency.img,
            actors: [{ uuid: actorUuid, quantity: 0 }]
          })
          existingCurrency = pileSharingData.items[itemIndex - 1];
        } else if (!existingCurrency.actors) {
          existingCurrency.actors = [];
        }

        let actorData = existingCurrency.actors.find(data => data.uuid === actorUuid);

        const itemQuantity = Utilities.getItemQuantity(existingCurrency);
        if (!actorData) {
          if (itemQuantity > 0) {
            existingCurrency.actors.push({ uuid: actorUuid, quantity: itemQuantity })
          }
        } else {
          actorData.quantity += itemQuantity;
          if (actorData.quantity <= 0) {
            existingCurrency.actors.splice(existingCurrency.actors.indexOf(actorData), 1);
          }
          if (existingCurrency.actors.length === 0) {
            pileSharingData.items.splice(pileSharingData.items.indexOf(existingCurrency), 1)
          }
        }
      }
    }
  }

  return pileSharingData;

}

export function removeFromItemPileSharingData(itemPile, actorUuid, { items = [], currencies = [] } = {}) {

  items = items.map(item => {
    setProperty(item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, getItemQuantity(item) * -1)
    return item;
  });

  currencies = currencies.map(currency => {
    currency.quantity = currency.quantity * -1;
    return currency;
  });

  return addToItemPileSharingData(itemPile, actorUuid, { items, currencies });

}

export function getItemPileItemsForActor(pile, recipient, floor = false) {

  const pileData = PileUtilities.getActorFlagData(pile);
  const pileItems = PileUtilities.getActorItems(pile);

  const players = getPlayersForItemPile(pile);
  const pileSharingData = getItemPileSharingData(pile);
  const storedItems = pileSharingData.items ?? [];

  const recipientUuid = getUuid(recipient);

  return pileItems.map(item => {

    const quantity = Utilities.getItemQuantity(item);
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

export function getItemPileCurrenciesForActor(pile, recipient, floor) {

  const pileData = PileUtilities.getActorFlagData(pile);
  const pileCurrencies = PileUtilities.getFormattedActorCurrencies(pile, { getAll: !recipient });

  const players = getPlayersForItemPile(pile);
  const pileSharingData = getItemPileSharingData(pile);
  const storedCurrencies = pileSharingData.currencies ?? [];

  const recipientUuid = Utilities.getUuid(recipient);

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

      const existingCurrency = currency.type === "attribute"
        ? storedCurrencies.find(storedCurrency => storedCurrency.path === currency.path)
        : Utilities.findSimilarItem(storedCurrencies, currency)

      let totalShares = currency.quantity;
      if (existingCurrency) {
        totalShares += existingCurrency.actors.reduce((acc, actor) => acc + actor.quantity, 0);
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