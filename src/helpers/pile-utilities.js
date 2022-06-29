import * as Utilities from "./utilities.js"
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "./helpers.js";

function getFlagData(inDocument, flag, defaults) {
  const defaultFlags = foundry.utils.duplicate(defaults);
  const flags = getProperty(inDocument.data, flag) ?? {};
  const data = foundry.utils.duplicate(flags);
  return foundry.utils.mergeObject(defaultFlags, data);
}

export function getItemFlagData(item) {
  return getFlagData(Utilities.getDocument(item), CONSTANTS.FLAGS.ITEM, CONSTANTS.ITEM_DEFAULTS);
}

export function getActorFlagData(target) {
  return getFlagData(Utilities.getActor(target), CONSTANTS.FLAGS.PILE, CONSTANTS.PILE_DEFAULTS);
}

export function isValidItemPile(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = data || getActorFlagData(targetActor);
  return targetActor && pileData?.enabled;
}

export function isItemPileContainer(target) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor);
  return pileData?.enabled && pileData?.isContainer;
}

export function isItemPileMerchant(target) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor);
  return pileData?.enabled && pileData?.isMerchant;
}

export function isItemPileClosed(target) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor);
  if (!pileData?.enabled || !pileData?.isContainer) return false;
  return pileData.closed;
}

export function isItemPileLocked(target) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor);
  if (!pileData?.enabled || !pileData?.isContainer) return false;
  return pileData.locked;
}

export function shouldItemPileBeDeleted(targetUuid) {
  
  const target = Utilities.fromUuidFast(targetUuid);
  
  if (!(target instanceof TokenDocument)) return false;
  
  const pileData = getActorFlagData(target);
  
  const shouldDelete = {
    "default": Helpers.getSetting("deleteEmptyPiles"),
    "true": true,
    "false": false
  }[pileData?.deleteWhenEmpty ?? "default"]
  
  return pileData?.enabled && shouldDelete && isItemPileEmpty(target);
  
}

export function getActorItems(target, { itemFilters = false, itemCurrencies = true } = {}) {
  const targetActor = Utilities.getActor(target);
  const pileItemFilters = itemFilters ? itemFilters : getActorItemFilters(targetActor);
  const currencyItems = getActorCurrencyItems(targetActor);
  let actorItems = Array.from(targetActor.items);
  if (!itemCurrencies) {
    actorItems = actorItems.filter(item => currencyItems.indexOf(item) === -1);
  }
  return actorItems.filter(item => !isItemInvalid(targetActor, item, pileItemFilters));
}

export function getActorCurrencyItems(target, { currencyFilters = false } = {}) {
  const targetActor = Utilities.getActor(target)
  const targetItems = Array.from(targetActor.items);
  const currencyItemList = (currencyFilters || getActorCurrencyData(targetActor)?.items || []).map(item => item.data);
  return targetItems.filter(item => {
    return Utilities.findSimilarItem(currencyItemList, item);
  });
}

export function isItemCurrency(item, { currencyFilters = false, target = false }={}){
  if(!target && !currencyFilters){
    target = item.parent;
  }
  if(target){
    const targetActor = Utilities.getActor(target);
    currencyFilters = (getActorCurrencyData(targetActor)?.items || []).map(item => item.data);
  }
  return !!Utilities.findSimilarItem(currencyFilters, item);
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

export function getActorItemFilters(target) {
  if (!target) return cleanItemFilters(foundry.utils.duplicate(game.itempiles.ITEM_FILTERS));
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor);
  return isValidItemPile(targetActor) && pileData?.overrideItemFilters
    ? cleanItemFilters(pileData.overrideItemFilters)
    : cleanItemFilters(game.itempiles.ITEM_FILTERS);
}


export function cleanItemFilters(itemFilters) {
  return itemFilters ? foundry.utils.duplicate(itemFilters).map(filter => {
    filter.path = filter.path.trim();
    filter.filters = Array.isArray(filter.filters) ? filter.filters : filter.filters.split(',').map(string => string.trim());
    filter.filters = new Set(filter.filters)
    return filter;
  }) : [];
}

export function getActorCurrencyData(target) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor);
  return (pileData.overrideCurrencies || game.itempiles.CURRENCIES);
}

export function getActorCurrencyAttributes(target) {
  const targetActor = Utilities.getActor(target)
  const pileData = getActorFlagData(targetActor);
  const currencyData = pileData.overrideCurrencies || game.itempiles.CURRENCIES;
  return currencyData?.attributes.map(currency => {
    currency.name = game.i18n.localize(currency.name);
    return currency;
  }) ?? [];
}

export function getActorAttributes(target) {
  const targetActor = Utilities.getActor(target)
  return getActorCurrencyAttributes(targetActor);
}

export function getFormattedActorAttributes(target, { currencyList = false, getAll = false } = {}) {
  const targetActor = Utilities.getActor(target)
  const currencies = currencyList || getActorCurrencyAttributes(targetActor);
  return currencies.filter(currency => {
    return getAll || hasProperty(targetActor.data, currency.path) && Number(getProperty(targetActor.data, currency.path)) > 0;
  }).map((currency, index) => {
    return {
      name: game.i18n.has(currency.name) ? game.i18n.localize(currency.name) : currency.name,
      path: currency.path,
      img: currency.img,
      quantity: Number(getProperty(targetActor.data, currency.path) ?? 0),
      index: index
    };
  });
}

export function isItemPileEmpty(target) {
  
  const targetActor = Utilities.getActor(target);
  if (!targetActor) return false;
  
  const validItemPile = isValidItemPile(targetActor);
  if (!validItemPile) return false;
  
  const hasNoItems = getActorItems(targetActor).length === 0;
  const hasNoCurrencies = getFormattedActorAttributes(targetActor).length === 0;
  
  return validItemPile && hasNoItems && hasNoCurrencies;
  
}


export function getItemPileTokenImage(token, { data = false, items = false, currencies = false } = {}) {
  
  const tokenDocument = Utilities.getDocument(token);
  
  const itemPileData = data || getActorFlagData(tokenDocument);
  
  let originalImg;
  if (tokenDocument instanceof TokenDocument) {
    originalImg = tokenDocument.data.img;
  } else {
    originalImg = tokenDocument.data.token.img;
  }
  
  if (!isValidItemPile(tokenDocument)) return originalImg;
  
  items = items || getActorItems(tokenDocument).map(item => item.toObject());
  currencies = currencies || getFormattedActorAttributes(tokenDocument);
  
  const numItems = items.length + currencies.length;
  
  let img;
  
  if (itemPileData.displayOne && numItems === 1) {
    img = items.length > 0
      ? items[0].img
      : currencies[0].img;
  } else if (itemPileData.displayOne && numItems > 1) {
    img = (tokenDocument.actor ?? tokenDocument).data.token.img;
  }
  
  if (itemPileData.isContainer) {
    
    img = itemPileData.lockedImage || itemPileData.closedImage || itemPileData.openedImage || itemPileData.emptyImage;
    
    if (itemPileData.locked && itemPileData.lockedImage) {
      img = itemPileData.lockedImage;
    } else if (itemPileData.closed && itemPileData.closedImage) {
      img = itemPileData.closedImage;
    } else if (itemPileData.emptyImage && isItemPileEmpty(tokenDocument)) {
      img = itemPileData.emptyImage;
    } else if (itemPileData.openedImage) {
      img = itemPileData.openedImage;
    }
    
  }
  
  return img || originalImg;
  
}

export function getItemPileTokenScale(target, { data = false, items = false, currencies = false } = {}) {
  
  const pileDocument = Utilities.getDocument(target);
  
  let itemPileData = data || getActorFlagData(pileDocument);
  
  let baseScale;
  if (pileDocument instanceof TokenDocument) {
    baseScale = pileDocument.data.scale;
  } else {
    baseScale = pileDocument.data.token.scale;
  }
  
  if (!isValidItemPile(pileDocument, itemPileData)) {
    return baseScale;
  }
  
  items = items || getActorItems(pileDocument);
  currencies = currencies || getFormattedActorAttributes(pileDocument);
  
  const numItems = items.length + currencies.length;
  
  if (itemPileData.isContainer || !itemPileData.displayOne || !itemPileData.overrideSingleItemScale || numItems > 1 || numItems === 0) {
    return baseScale;
  }
  
  return itemPileData.singleItemScale;
  
}

export function getItemPileName(target, { data = false, items = false, currencies = false } = {}) {
  
  const pileDocument = Utilities.getDocument(target);
  
  const itemPileData = data || getActorFlagData(pileDocument);
  
  let name;
  if (pileDocument instanceof TokenDocument) {
    name = pileDocument.data.name;
  } else {
    name = pileDocument.data.token.name;
  }
  
  if (!isValidItemPile(pileDocument, itemPileData)) {
    return name;
  }
  
  items = items || getActorItems(pileDocument);
  currencies = currencies || getFormattedActorAttributes(pileDocument);
  
  const numItems = items.length + currencies.length;
  
  if (itemPileData.isContainer || !itemPileData.displayOne || !itemPileData.showItemName || numItems > 1 || numItems === 0) {
    return name;
  }
  
  const item = items.length > 0
    ? items[0]
    : currencies[0];
  
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
  
  const [documentActor, documentTokens] = getRelevantTokensAndActor(target);
  
  const targetItems = getActorItems(documentActor, { itemFilters: flagData.itemFilters });
  const attributes = getFormattedActorAttributes(documentActor, { currencyList: flagData.currencies });
  
  const pileData = { data: flagData, items: targetItems, currencies: attributes };
  
  const updates = documentTokens.map(tokenDocument => {
    const newTokenData = foundry.utils.mergeObject(tokenData, {
      "img": getItemPileTokenImage(tokenDocument, pileData),
      "scale": getItemPileTokenScale(tokenDocument, pileData),
      "name": getItemPileName(tokenDocument, pileData),
    });
    return {
      "_id": tokenDocument.id,
      ...newTokenData,
      [CONSTANTS.FLAGS.PILE]: flagData
    }
  });
  
  await canvas.scene.updateEmbeddedDocuments("Token", updates);
  
  return documentActor.update({
    [CONSTANTS.FLAGS.PILE]: flagData,
    [`token.${CONSTANTS.FLAGS.PILE}`]: flagData
  });
  
}

export async function updateItemData(item, flagData){
  return item.update({
    [CONSTANTS.FLAGS.ITEM]: foundry.utils.mergeObject(getItemFlagData(item), flagData)
  });
}

/* -------------------------- Merchant Methods ------------------------- */

export function getItemPriceData(item, merchant = false, actor = false) {
  
  const currencyList = getActorCurrencyData(merchant);
  const { buyPriceModifier } = merchant ? getMerchantModifiersForActor(merchant, { item, actor }) : {
    buyPriceModifier: 1
  };
  
  const itemData = item instanceof Item ? item.toObject() : item;
  const itemFlagData = getItemFlagData(itemData);
  
  if (itemFlagData.enabled) {
    if (itemFlagData.prices.length) {
      return itemFlagData.prices.map(price => {
        price.originalCost = price.cost;
        if (!price.static) {
          price.cost = Math.floor(price.cost * buyPriceModifier);
        }
        return price;
      });
    } else if (itemFlagData.free) {
      return [];
    }
  }
  
  const primaryCurrency = currencyList.attributes.find(attribute => attribute.primary) ?? currencyList.items.find(item => item.primary);
  const cost = getProperty(item.data, game.itempiles.ITEM_PRICE_ATTRIBUTE);
  
  return [{
    ...primaryCurrency,
    originalCost: cost,
    cost: Math.floor(cost * buyPriceModifier)
  }];
  
}

export function getMerchantModifiersForActor(merchant, { item = false, actor = false } = {}) {
  const pileData = getActorFlagData(merchant);
  let { buyPriceModifier, sellPriceModifier, itemTypePriceModifiers, actorPriceModifiers } = pileData;
  
  if (item) {
    const itemTypePriceModifier = itemTypePriceModifiers.find(priceData => priceData.type === item.type);
    if (itemTypePriceModifier) {
      buyPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.buyPriceModifier : buyPriceModifier * itemTypePriceModifier.buyPriceModifier;
      sellPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.sellPriceModifier : sellPriceModifier * itemTypePriceModifier.sellPriceModifier;
    }
  }
  
  if (actor) {
    const actorSpecificModifiers = actorPriceModifiers?.find(data => data.actorUuid === Utilities.getUuid(actor));
    if (actorSpecificModifiers) {
      buyPriceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.buyPriceModifier : buyPriceModifier * actorSpecificModifiers.buyPriceModifier;
      sellPriceModifier = actorSpecificModifiers.override ? actorSpecificModifiers.sellPriceModifier : sellPriceModifier * actorSpecificModifiers.sellPriceModifier;
    }
  }
  
  return {
    buyPriceModifier,
    sellPriceModifier
  }
}

export function getMerchantItemsForActor(merchant, actor = false) {
  
  const pileItems = getActorItems(merchant, { itemCurrencies: false });
  
  return pileItems.map(item => {
    const quantity = Utilities.getItemQuantity(item);
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.data?.img ?? "",
      quantity: quantity,
      currentQuantity: quantity,
      prices: getItemPriceData(item, merchant, actor),
      visible: true,
      item
    }
  });
  
}