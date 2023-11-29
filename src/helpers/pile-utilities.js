import CONSTANTS from "../constants/constants.js";
import { SYSTEMS } from "../systems.js";
import SETTINGS from "../constants/settings.js";
import { cachedActorCurrencies, cachedCurrencyList, cachedFilterList } from "./caches.js";
import { hotkeyActionState } from "../hotkeys.js";
import * as Utilities from "./utilities.js"
import * as Helpers from "./helpers.js";
import * as CompendiumUtilities from "./compendium-utilities.js";


function getFlagData(inDocument, flag, defaults, existing = false) {
  const defaultFlags = foundry.utils.duplicate(defaults);
  const flags = existing || (getProperty(inDocument, flag) ?? {});
  let data = { ...flags };
  if (flag === CONSTANTS.FLAGS.PILE) {
    data = migrateFlagData(inDocument, data);
  }
  return foundry.utils.mergeObject(defaultFlags, data);
}

export function migrateFlagData(document, data = false) {

  let flags = data || getProperty(document, CONSTANTS.FLAGS.PILE);

  if (flags.type) {
    return flags;
  }

  if (flags.isMerchant) {
    flags.type = CONSTANTS.PILE_TYPES.MERCHANT;
  } else if (flags.isContainer) {
    flags.type = CONSTANTS.PILE_TYPES.CONTAINER;
  } else {
    flags.type = CONSTANTS.PILE_TYPES.PILE;
  }

  return flags;

}

export function canItemStack(item, targetActor) {
  const itemData = item instanceof Item ? item.toObject() : item;
  if (!Utilities.isItemStackable(itemData)) return false;
  const itemFlagData = getItemFlagData(itemData);
  const actorFlagData = getActorFlagData(targetActor);
  if (typeof actorFlagData.canStackItems === "boolean") {
    actorFlagData.canStackItems = "yes";
  }
  if (actorFlagData.canStackItems === "always" || actorFlagData.canStackItems === "alwaysno") {
    return actorFlagData.canStackItems === "always";
  }
  return {
    "default": actorFlagData.canStackItems === "yes",
    "yes": true,
    "no": false
  }[itemFlagData?.canStack ?? "default"] && !(actorFlagData.type === CONSTANTS.PILE_TYPES.VAULT && itemFlagData.vaultExpander);
}

export function getItemFlagData(item, data = false) {
  return getFlagData(Utilities.getDocument(item), CONSTANTS.FLAGS.ITEM, { ...CONSTANTS.ITEM_DEFAULTS }, data);
}

/**
 *
 * @param target
 * @param data
 * @returns {Object<CONSTANTS.PILE_DEFAULTS>}
 */
export function getActorFlagData(target, data = false) {
  const defaults = foundry.utils.mergeObject(
    { ...CONSTANTS.PILE_DEFAULTS },
    { ...(Helpers.getSetting(SETTINGS.PILE_DEFAULTS) ?? {}) }
  );
  target = Utilities.getActor(target);
  if (target?.token) {
    target = target.token;
  }
  return getFlagData(target, CONSTANTS.FLAGS.PILE, defaults, data);
}

export function isValidItemPile(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  return targetActor && pileData?.enabled;
}

export function isRegularItemPile(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  return targetActor && pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.PILE;
}

export function isItemPileContainer(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.CONTAINER;
}

export function isItemPileLootable(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  return targetActor && pileData?.enabled && (pileData?.type === CONSTANTS.PILE_TYPES.PILE || pileData?.type === CONSTANTS.PILE_TYPES.CONTAINER);
}

export function isItemPileVault(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.VAULT;
}

export function isItemPileMerchant(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  return pileData?.enabled && pileData?.type === CONSTANTS.PILE_TYPES.MERCHANT;
}

export function isItemPileClosed(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  if (!pileData?.enabled || pileData?.type !== CONSTANTS.PILE_TYPES.CONTAINER) return false;
  return pileData.closed;
}

export function isItemPileLocked(target, data = false) {
  const targetActor = Utilities.getActor(target);
  const pileData = getActorFlagData(targetActor, data);
  if (!pileData?.enabled || pileData?.type !== CONSTANTS.PILE_TYPES.CONTAINER) return false;
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

  const target = Utilities.getToken(targetUuid);

  if (!(target instanceof Token)) return false;

  const targetDocument = Utilities.getDocument(target);

  const pileData = getActorFlagData(targetDocument);

  if (!isItemPileLootable(targetDocument, pileData) || !isItemPileEmpty(targetDocument)) {
    return false;
  }

  if (typeof pileData?.deleteWhenEmpty === "boolean") {
    return pileData?.deleteWhenEmpty;
  }

  return {
    "default": Helpers.getSetting("deleteEmptyPiles"), "true": true, "false": false
  }[pileData?.deleteWhenEmpty ?? "default"];

}

export function getItemPileActors(filter = false) {
  return Array.from(game.actors).filter((a) => {
    return getProperty(a, CONSTANTS.FLAGS.PILE)?.enabled && (filter ? filter(a) : true);
  });
}

export function getItemPileTokens(filter = false) {

  const allTokensOnScenes = Array.from(game.scenes)
    .map(scene => ([
      scene.id,
      Array.from(scene.tokens).filter(t => {
        return getProperty(t, CONSTANTS.FLAGS.PILE)?.enabled && !t.actorLink;
      })
    ]))
    .filter(([_, tokens]) => tokens.length)

  const validTokensOnScenes = allTokensOnScenes.map(([scene, tokens]) => [
    scene,
    tokens.filter((token) => {
      return filter ? !filter(token) : true;
    })
  ]).filter(([_, tokens]) => tokens.length);

  const mappedValidTokens = Object.fromEntries(validTokensOnScenes);

  const invalidTokensOnScenes = allTokensOnScenes.map(([scene, tokens]) => [
    scene,
    tokens.filter(token => {
      if (mappedValidTokens[scene.id] && mappedValidTokens[scene.id].includes(token)) return false;
      try {
        return filter ? filter(token) : false;
      } catch (err) {
        return true;
      }
    })
  ]).filter(([_, tokens]) => tokens.length);

  return { invalidTokensOnScenes, validTokensOnScenes };
}

export function getActorItems(target, { itemFilters = false, getItemCurrencies = false } = {}) {
  const actor = Utilities.getActor(target);
  const actorItemFilters = itemFilters ? cleanItemFilters(itemFilters) : getActorItemFilters(actor);
  const currencies = (actor
    ? getActorCurrencies(actor, { getAll: true })
    : game.itempiles.API.CURRENCIES.concat(game.itempiles.API.SECONDARY_CURRENCIES))
    .map(entry => entry.id);
  return actor.items.filter(item => (getItemCurrencies || currencies.indexOf(item.id) === -1) && !isItemInvalid(actor, item, actorItemFilters));
}

// Lots happening here, but in essence, it gets the actor's currencies, and creates an array of them
export function getActorCurrencies(target, {
  forActor = false,
  currencyList = false,
  getAll = false,
  secondary = true
} = {}) {
  const actor = Utilities.getActor(target);
  const actorUuid = Utilities.getUuid(actor.uuid)
  const actorItems = actor ? Array.from(actor.items) : [];
  const cached = cachedActorCurrencies.get(actorUuid)
  currencyList = cached ? false : currencyList || getCurrencyList(forActor || actor);
  // Loop through each currency and match it against the actor's data
  let currencies = cached || (currencyList.map((currency, index) => {
    if (currency.type === "attribute" || !currency.type) {
      const path = currency?.data?.path ?? currency?.path;
      return {
        ...currency,
        quantity: 0,
        path: path,
        id: path,
        index
      }
    }
    const itemData = CompendiumUtilities.getItemFromCache(currency.data.uuid) || currency.data.item || false;
    if (!itemData) return false;
    const item = Utilities.findSimilarItem(actorItems, itemData);
    // If the item exists on the actor, use the item's ID, so that we can match it against the actual item on the actor
    currency.data.item = itemData;
    currency.data.item._id = item?.id ?? itemData._id;
    return {
      ...currency,
      quantity: 0,
      id: item?.id ?? item?._id ?? itemData._id ?? null,
      item,
      index
    }
  })).filter(Boolean);

  cachedActorCurrencies.set(actorUuid, currencies);

  currencies = currencies.map(currency => {
    currency.quantity = currency.type === "attribute"
      ? getProperty(actor, currency.path)
      : Utilities.getItemQuantity(currency.item);
    return currency;
  });

  if (!getAll) {
    currencies = currencies.filter(currency => currency.quantity > 0);
  }

  if (!secondary) {
    currencies = currencies.filter(currency => !currency.secondary);
  }

  return currencies;
}

export function getActorPrimaryCurrency(target) {
  const actor = Utilities.getActor(target);
  return getActorCurrencies(actor, { getAll: true }).find(currency => currency.primary);
}

export function getCurrencyList(target = false, pileData = false) {
  let targetUuid = false;
  if (target) {
    targetUuid = Utilities.getUuid(target);
    if (cachedCurrencyList.has(targetUuid)) {
      return cachedCurrencyList.get(targetUuid)
    }
    const targetActor = Utilities.getActor(target);
    pileData = getActorFlagData(targetActor, pileData);
  }

  const primaryCurrencies = (pileData?.overrideCurrencies || game.itempiles.API.CURRENCIES);
  const secondaryCurrencies = (pileData?.overrideSecondaryCurrencies || game.itempiles.API.SECONDARY_CURRENCIES).map(currency => {
    currency.secondary = true;
    return currency;
  });

  const currencies = primaryCurrencies.concat(secondaryCurrencies);

  const currencyList = currencies.map(currency => {
    currency.name = game.i18n.localize(currency.name);
    return currency;
  });
  if (target) {
    cachedCurrencyList.set(targetUuid, currencyList);
  }
  return currencyList;
}

export function getActorItemFilters(target, pileData = false) {
  if (!target) return cleanItemFilters(game.itempiles.API.ITEM_FILTERS);
  const targetUuid = Utilities.getUuid(target);
  if (cachedFilterList.has(targetUuid)) {
    return cachedFilterList.get(targetUuid)
  }
  const targetActor = Utilities.getActor(target);
  pileData = getActorFlagData(targetActor, pileData);
  const itemFilters = isValidItemPile(targetActor, pileData) && pileData?.overrideItemFilters
    ? cleanItemFilters(pileData.overrideItemFilters)
    : cleanItemFilters(game.itempiles.API.ITEM_FILTERS);
  cachedFilterList.set(targetUuid, itemFilters);
  return itemFilters;
}

export function cleanItemFilters(itemFilters) {
  return itemFilters ? foundry.utils.duplicate(itemFilters).map(filter => {
    filter.path = filter.path.trim();
    filter.filters = (Array.isArray(filter.filters) ? filter.filters : filter.filters.split(','))
      .map(string => {
        if (typeof string === "boolean") return string;
        const str = string.trim();
        if (str.toLowerCase() === "true" || str.toLowerCase() === "false") {
          return str.toLowerCase() === "true";
        }
        return str;
      });
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

export async function checkItemType(targetActor, item, {
  errorText = "ITEM-PILES.Errors.DisallowedItemDrop",
  warningTitle = "ITEM-PILES.Dialogs.TypeWarning.Title",
  warningContent = "ITEM-PILES.Dialogs.TypeWarning.DropContent",
  runTransformer = true
} = {}) {

  const disallowedType = isItemInvalid(targetActor, item);
  if (disallowedType) {
    if (!game.user.isGM) {
      return Helpers.custom_warning(game.i18n.format(errorText, { type: disallowedType }), true)
    }

    if (SYSTEMS.DATA.ITEM_TRANSFORMER && runTransformer) {
      item = await SYSTEMS.DATA.ITEM_TRANSFORMER(item);
    }

    const newDisallowedType = isItemInvalid(targetActor, item);

    if (newDisallowedType && !hotkeyActionState.forceDropItem) {
      const force = await Dialog.confirm({
        title: game.i18n.localize(warningTitle),
        content: `<p class="item-piles-dialog">${game.i18n.format(warningContent, { type: newDisallowedType })}</p>`,
        defaultYes: false
      });
      if (!force) {
        return false;
      }
    }
  } else {
    if (SYSTEMS.DATA.ITEM_TRANSFORMER && runTransformer) {
      item = await SYSTEMS.DATA.ITEM_TRANSFORMER(item);
    }
  }

  return item;

}

export function isItemCurrency(item, { target = false, actorCurrencies = false } = {}) {
  const currencies = (actorCurrencies || getActorCurrencies(item.parent || false, {
    forActor: target,
    getAll: true
  }))
    .filter(currency => currency.type === "item")
    .map(item => item.data.item);

  return !!Utilities.findSimilarItem(currencies, item);
}

export function getItemCurrencyData(item, { target = false, actorCurrencies = false }) {
  return (actorCurrencies || getActorCurrencies(item?.parent || false, {
    forActor: target,
    getAll: true,
    combine: true
  }))
    .filter(currency => currency.type === "item")
    .find(currency => {
      return item.name === currency.data.item.name && item.type === currency.data.item.type;
    })
}

export function getItemPileTokenImage(token, {
  data = false,
  items = false,
  currencies = false
} = {}, overrideImage = null) {

  const pileDocument = Utilities.getDocument(token);

  const itemPileData = getActorFlagData(pileDocument, data);

  const originalImg = overrideImage ?? (pileDocument instanceof TokenDocument
      ? pileDocument.texture.src
      : pileDocument.prototypeToken.texture.src
  );

  if (!isValidItemPile(pileDocument, itemPileData) || !isItemPileLootable(pileDocument, itemPileData)) return originalImg;

  items = items || getActorItems(pileDocument);
  currencies = currencies || getActorCurrencies(pileDocument);

  const numItems = items.length + currencies.length;

  let img = originalImg;

  if (itemPileData.type === CONSTANTS.PILE_TYPES.CONTAINER) {

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

  } else if (itemPileData.displayOne && numItems === 1) {

    img = items.length > 0 ? items[0].img : currencies[0].img;

  } else if (itemPileData.displayOne && numItems > 1) {

    img = originalImg;

  }

  return img || originalImg;

}

export function getItemPileTokenScale(target, {
  data = false,
  items = false,
  currencies = false
} = {}, overrideScale = null) {

  const pileDocument = Utilities.getDocument(target);

  let itemPileData = getActorFlagData(pileDocument, data);

  const baseScale = overrideScale ?? (pileDocument instanceof TokenDocument
      ? pileDocument.texture.scaleX
      : pileDocument.prototypeToken.texture.scaleX
  );

  if (!isValidItemPile(pileDocument, itemPileData) || !isItemPileLootable(pileDocument, itemPileData)) {
    return baseScale;
  }

  items = items || getActorItems(pileDocument);
  currencies = currencies || getActorCurrencies(pileDocument);

  const numItems = items.length + currencies.length;

  if (itemPileData?.type === CONSTANTS.PILE_TYPES.CONTAINER || !itemPileData.displayOne || !itemPileData.overrideSingleItemScale || numItems > 1 || numItems === 0) {
    return baseScale;
  }

  return itemPileData.singleItemScale;

}

export function getItemPileName(target, { data = false, items = false, currencies = false } = {}, overrideName = null) {

  const pileDocument = Utilities.getDocument(target);

  const itemPileData = getActorFlagData(pileDocument, data);

  let name = overrideName ?? (pileDocument instanceof TokenDocument ? pileDocument.name : pileDocument.prototypeToken.name);

  if (!isValidItemPile(pileDocument, itemPileData) || !isItemPileLootable(pileDocument, itemPileData)) {
    return name;
  }

  items = items || getActorItems(pileDocument);
  currencies = currencies || getActorCurrencies(pileDocument);

  const numItems = items.length + currencies.length;

  if (itemPileData?.type === CONSTANTS.PILE_TYPES.CONTAINER || !itemPileData.displayOne || !itemPileData.showItemName || numItems > 1 || numItems === 0) {
    return name;
  }

  const item = items.length > 0 ? items[0] : currencies[0];
  const quantity = (items.length > 0 ? Utilities.getItemQuantity(item) : currencies[0]?.quantity) ?? 1

  return item.name + (quantity > 1 ? " x " + quantity : "");

}

export function shouldEvaluateChange(target, changes) {
  const flags = getActorFlagData(target, getProperty(changes, CONSTANTS.FLAGS.PILE) ?? {});
  if (!isValidItemPile(target, flags)) return false;
  return (flags.type === CONSTANTS.PILE_TYPES.CONTAINER && (flags.closedImage || flags.emptyImage || flags.openedImage || flags.lockedImage))
    || flags.displayOne || flags.showItemName || flags.overrideSingleItemScale;
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

  if (!target) return;

  if (!flagData) flagData = getActorFlagData(target);
  if (!tokenData) tokenData = {};
  tokenData = foundry.utils.mergeObject(tokenData, {});

  let [documentActor, documentTokens] = getRelevantTokensAndActor(target);

  const items = getActorItems(documentActor, { itemFilters: flagData.overrideItemFilters });
  const actorCurrencies = (flagData.overrideCurrencies || []).concat(flagData.overrideSecondaryCurrencies || []);
  const currencies = getActorCurrencies(documentActor, { currencyList: actorCurrencies });

  const pileData = { data: flagData, items, currencies };

  flagData = cleanFlagData(flagData);

  const updates = documentTokens.map(tokenDocument => {
    const overrideImage = getProperty(tokenData, "texture.src") ?? getProperty(tokenData, "img");
    const overrideScale = getProperty(tokenData, "texture.scaleX")
      ?? getProperty(tokenData, "texture.scaleY")
      ?? getProperty(tokenData, "scale");
    const scale = getItemPileTokenScale(tokenDocument, pileData, overrideScale);
    const newTokenData = foundry.utils.mergeObject(tokenData, {
      "texture.src": getItemPileTokenImage(tokenDocument, pileData, overrideImage),
      "texture.scaleX": scale,
      "texture.scaleY": scale,
      "name": getItemPileName(tokenDocument, pileData, tokenData?.name),
    });
    const data = {
      "_id": tokenDocument.id, ...newTokenData
    };
    if (!tokenDocument.actorLink && (tokenDocument.actor === documentActor || !documentActor)) {
      data[CONSTANTS.FLAGS.PILE] = flagData;
      data[CONSTANTS.FLAGS.VERSION] = Helpers.getModuleVersion();
      documentActor = false;
    }
    return data;
  });

  if (canvas.scene && !foundry.utils.isEmpty(updates)) {
    await canvas.scene.updateEmbeddedDocuments("Token", updates);
  }

  if (documentActor) {
    await documentActor.update({
      [CONSTANTS.FLAGS.PILE]: flagData,
      [CONSTANTS.FLAGS.VERSION]: Helpers.getModuleVersion()
    });
  }

  return true;
}

export function cleanFlagData(flagData) {
  const defaults = foundry.utils.mergeObject(
    { ...CONSTANTS.PILE_DEFAULTS },
    Helpers.getSetting(SETTINGS.PILE_DEFAULTS) ?? {}
  );
  const defaultKeys = Object.keys(defaults);
  const difference = new Set(Object.keys(foundry.utils.diffObject(flagData, defaults)));
  const toRemove = new Set(defaultKeys.filter(key => !difference.has(key)));
  if (flagData.enabled) {
    toRemove.delete("type")
  }
  if (!CONSTANTS.CUSTOM_PILE_TYPES[flagData.type]) {
    const baseKeys = new Set(defaultKeys);
    for (const key of Object.keys(flagData)) {
      if (!baseKeys.has(key)) {
        delete flagData[key];
        flagData["-=" + key] = null;
      }
    }
  }
  for (const key of toRemove) {
    delete flagData[key];
    flagData["-=" + key] = null;
  }
  return flagData;
}

export function cleanItemFlagData(flagData, { addRemoveFlag = false } = {}) {
  const defaults = Object.keys(CONSTANTS.ITEM_DEFAULTS);
  const difference = new Set(Object.keys(foundry.utils.diffObject(flagData, CONSTANTS.ITEM_DEFAULTS)));
  const toRemove = new Set(defaults.filter(key => !difference.has(key)));
  for (const key of toRemove) {
    delete flagData[key];
    if (!addRemoveFlag) {
      flagData["-=" + key] = null;
    }
  }
  return flagData;
}

export function updateItemData(item, update, { returnUpdate = false, version = false } = {}) {
  const flagData = cleanItemFlagData(foundry.utils.mergeObject(getItemFlagData(item), update.flags ?? {}));
  const updates = foundry.utils.mergeObject(update?.data ?? {}, {});
  setProperty(updates, CONSTANTS.FLAGS.ITEM, flagData)
  setProperty(updates, CONSTANTS.FLAGS.VERSION, version || Helpers.getModuleVersion())
  if (returnUpdate) {
    updates["_id"] = item?.id ?? item?._id;
    return updates;
  }
  return item.update(updates);
}

/* -------------------------- Merchant Methods ------------------------- */

export function getMerchantModifiersForActor(merchant, {
  item = false,
  actor = false,
  pileFlagData = false,
  itemFlagData = false,
  absolute = false
} = {}) {

  let {
    buyPriceModifier, sellPriceModifier, itemTypePriceModifiers, actorPriceModifiers
  } = getActorFlagData(merchant, pileFlagData);

  if (item) {
    if (!itemFlagData) {
      itemFlagData = getItemFlagData(item);
    }
    const itemTypePriceModifier = itemTypePriceModifiers
      .sort((a, b) => a.type === "custom" && b.type !== "custom" ? -1 : 0)
      .find(priceData => {
        return priceData.type === "custom"
          ? priceData.category.toLowerCase() === itemFlagData.customCategory.toLowerCase()
          : priceData.type === item.type;
      });
    if (itemTypePriceModifier) {
      buyPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.buyPriceModifier : buyPriceModifier * itemTypePriceModifier.buyPriceModifier;
      sellPriceModifier = itemTypePriceModifier.override ? itemTypePriceModifier.sellPriceModifier : sellPriceModifier * itemTypePriceModifier.sellPriceModifier;
    }
  }

  if (actor && actorPriceModifiers) {
    const actorSpecificModifiers = actorPriceModifiers?.find(data => data.actorUuid === Utilities.getUuid(actor) || data.actor === actor.id);
    if (actorSpecificModifiers) {
      buyPriceModifier = actorSpecificModifiers.override || absolute ? actorSpecificModifiers.buyPriceModifier ?? buyPriceModifier : buyPriceModifier * actorSpecificModifiers.buyPriceModifier;
      sellPriceModifier = actorSpecificModifiers.override || absolute ? actorSpecificModifiers.sellPriceModifier ?? sellPriceModifier : sellPriceModifier * actorSpecificModifiers.sellPriceModifier;
    }
  }

  if (SYSTEMS.DATA.PRICE_MODIFIER_TRANSFORMER && !absolute) {
    const modifiers = SYSTEMS.DATA.PRICE_MODIFIER_TRANSFORMER({
      buyPriceModifier,
      sellPriceModifier,
      merchant,
      item,
      actor,
      actorPriceModifiers
    });
    buyPriceModifier = modifiers.buyPriceModifier;
    sellPriceModifier = modifiers.sellPriceModifier;
  }

  return {
    buyPriceModifier: Helpers.roundToDecimals(buyPriceModifier, 2),
    sellPriceModifier: Helpers.roundToDecimals(sellPriceModifier, 2)
  }
}

function getSmallestExchangeRate(currencies) {
  return currencies.length > 1
    ? Math.min(...currencies.filter(currency => !currency.secondary).map(currency => currency.exchangeRate))
    : (Helpers.getSetting(SETTINGS.CURRENCY_DECIMAL_DIGITS) ?? 0.00001);
}

function getExchangeRateDecimals(smallestExchangeRate) {
  return smallestExchangeRate.toString().includes(".") ? smallestExchangeRate.toString().split(".")[1].length : 0;
}

export function getPriceArray(totalCost, currencies) {

  if (!currencies) currencies = getCurrencyList()

  const primaryCurrency = currencies.find(currency => currency.primary);

  if (currencies.length === 1) {
    return [{
      ...primaryCurrency,
      cost: totalCost,
      quantity: totalCost,
      baseCost: totalCost,
      maxCurrencyCost: totalCost,
      string: primaryCurrency.abbreviation.replace('{#}', totalCost),
      secondary: false
    }]
  }

  const smallestExchangeRate = getSmallestExchangeRate(currencies);

  const prices = [];

  if (primaryCurrency.exchangeRate === smallestExchangeRate) {

    let cost = totalCost;

    for (const currency of currencies) {

      const numCurrency = Math.floor(cost / currency.exchangeRate);

      cost = cost - (numCurrency * currency.exchangeRate);

      prices.push({
        ...currency,
        cost: Math.round(numCurrency),
        quantity: Math.round(numCurrency),
        baseCost: Math.round(numCurrency),
        maxCurrencyCost: Math.ceil(totalCost / currency.exchangeRate),
        string: currency.abbreviation.replace("{#}", numCurrency),
        secondary: false
      });

    }

    return prices;

  }

  const decimals = getExchangeRateDecimals(smallestExchangeRate);

  let fraction = Helpers.roundToDecimals(totalCost % 1, decimals);
  let cost = Math.round(totalCost - fraction);

  let skipPrimary = false;
  if (cost) {
    skipPrimary = true;
    prices.push({
      ...primaryCurrency,
      cost: cost,
      quantity: cost,
      baseCost: cost,
      maxCurrencyCost: totalCost,
      string: primaryCurrency.abbreviation.replace('{#}', cost),
      secondary: false
    });
  }

  for (const currency of currencies) {

    if (currency === primaryCurrency && skipPrimary) continue;

    const numCurrency = Math.floor(Helpers.roundToDecimals(fraction / currency.exchangeRate, decimals));

    fraction = Helpers.roundToDecimals(fraction - (numCurrency * currency.exchangeRate), decimals);

    prices.push({
      ...currency,
      cost: Math.round(numCurrency),
      quantity: Math.round(numCurrency),
      baseCost: Math.round(numCurrency),
      maxCurrencyCost: Math.ceil(totalCost / currency.exchangeRate),
      string: currency.abbreviation.replace("{#}", numCurrency),
      secondary: false
    });
  }

  prices.sort((a, b) => b.exchangeRate - a.exchangeRate);

  return prices;
}

export function getPriceFromString(str, currencyList = false) {

  if (!currencyList) {
    currencyList = getCurrencyList()
  }

  const currencies = foundry.utils.duplicate(currencyList)
    .map(currency => {
      currency.quantity = 0
      currency.identifier = currency.abbreviation.toLowerCase().replace("{#}", "").trim()
      return currency;
    });

  const sortedCurrencies = currencies.map(currency => `(${currency.identifier})`);
  sortedCurrencies.sort((a, b) => b.length - a.length);
  const splitBy = new RegExp("(.*?) *(" + sortedCurrencies.join("|") + ")", "g");

  const parts = [...str.split(",").join("").split(" ").join("").trim().toLowerCase().matchAll(splitBy)];

  let overallCost = 0;
  for (const part of parts) {
    for (const currency of currencies) {

      if (part[2] !== currency.identifier) continue;

      try {
        const roll = new Roll(part[1]).evaluate({ async: false })
        currency.quantity = roll.total;
        if (roll.total !== Number(part[1])) {
          currency.roll = roll;
        }
        if (currency.exchangeRate) {
          overallCost += roll.total * currency.exchangeRate;
        }
      } catch (err) {

      }
    }
  }

  if (!currencies.some(currency => currency.quantity)) {
    try {
      const roll = new Roll(str).evaluate({ async: false });
      if (roll.total) {
        const primaryCurrency = currencies.find(currency => currency.primary);
        primaryCurrency.quantity = roll.total;
        if (roll.total !== Number(str)) {
          primaryCurrency.roll = roll;
        }
        overallCost = roll.total;
      }
    } catch (err) {

    }
  }

  return { currencies, overallCost };

}

export function getCostOfItem(item, defaultCurrencies = false) {

  if (!defaultCurrencies) {
    defaultCurrencies = getCurrencyList().filter(currency => !currency.secondary);
  }

  let overallCost = 0;
  let itemCost = Utilities.getItemCost(item);
  if (SYSTEMS.DATA.ITEM_COST_TRANSFORMER) {
    overallCost = SYSTEMS.DATA.ITEM_COST_TRANSFORMER(item, defaultCurrencies);
    if (overallCost === false) {
      Helpers.debug("failed to find price for item:", item)
    }
  } else if (typeof itemCost === "string" && isNaN(Number(itemCost))) {
    overallCost = getPriceFromString(itemCost, defaultCurrencies).overallCost;
  } else {
    overallCost = Number(itemCost);
  }

  return Math.max(0, overallCost);

}

export function getPriceData({
  cost = false,
  item = false,
  seller = false,
  buyer = false,
  sellerFlagData = false,
  buyerFlagData = false,
  itemFlagData = false,
  quantity = 1,
  secondaryPrices = false
} = {}) {

  let priceData = [];

  buyerFlagData = getActorFlagData(buyer, buyerFlagData);
  if (!isItemPileMerchant(buyer, buyerFlagData)) {
    buyerFlagData = false;
  }

  sellerFlagData = getActorFlagData(seller, sellerFlagData);
  if (!isItemPileMerchant(seller, sellerFlagData)) {
    sellerFlagData = false;
  }

  if (cost && !item) {
    item = {};
    setProperty(item, game.itempiles.API.ITEM_PRICE_ATTRIBUTE, cost);
    setProperty(item, CONSTANTS.FLAGS.ITEM, CONSTANTS.ITEM_DEFAULTS);
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
    });
    return priceData;
  }

  // Retrieve the item price modifiers
  let modifier = 1;
  if (sellerFlagData) {

    modifier = getMerchantModifiersForActor(seller, {
      item, actor: buyer, pileFlagData: sellerFlagData, itemFlagData
    }).buyPriceModifier;

  } else if (buyerFlagData) {

    modifier = getMerchantModifiersForActor(buyer, {
      item, actor: seller, pileFlagData: buyerFlagData, itemFlagData
    }).sellPriceModifier;

  }

  const disableNormalCost = itemFlagData.disableNormalCost && !sellerFlagData.onlyAcceptBasePrice;
  const hasOtherPrices = secondaryPrices?.length > 0 || itemFlagData.prices.filter(priceGroup => priceGroup.length).length > 0;

  const currencyList = getCurrencyList(merchant);
  const currencies = getActorCurrencies(merchant, { currencyList, getAll: true });
  const defaultCurrencies = currencies.filter(currency => !currency.secondary);

  // In order to easily calculate an item's total worth, we can use the smallest exchange rate and convert all prices
  // to it, in order have a stable form of exchange calculation
  const smallestExchangeRate = getSmallestExchangeRate(defaultCurrencies);
  const decimals = getExchangeRateDecimals(smallestExchangeRate);

  let overallCost = getCostOfItem(item, defaultCurrencies);

  if (itemFlagData?.free || (!disableNormalCost && (overallCost === 0 || overallCost < smallestExchangeRate) && !hasOtherPrices) || modifier <= 0) {
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
      quantity: quantity
    })
    return priceData;
  }

  // If the item does include its normal cost, we calculate that here
  if (overallCost >= smallestExchangeRate && (!itemFlagData.disableNormalCost || (merchant === buyer && buyerFlagData.onlyAcceptBasePrice))) {

    // Base prices is the displayed price, without quantity taken into account
    const baseCost = Helpers.roundToDecimals(overallCost * modifier, decimals);
    const basePrices = getPriceArray(baseCost, defaultCurrencies);

    // Prices is the cost with the amount of quantity taken into account, which may change the number of the different
    // types of currencies it costs (eg, an item wouldn't cost 1 gold and 100 silver, it would cost 11 gold
    let totalCost = Helpers.roundToDecimals(overallCost * modifier * quantity, decimals);
    let prices = getPriceArray(totalCost, defaultCurrencies);

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
        quantity: quantity
      });

    }
  }

  // If the item has custom prices, we include them here
  if (secondaryPrices) {

    if (!priceData.length) {
      priceData.push({
        basePrices: [],
        basePriceString: "",
        prices: [],
        priceString: "",
        totalCost: 0,
        baseCost: 0,
        primary: true,
        maxQuantity: 0,
        quantity: quantity
      });
    }

    for (const secondaryPrice of secondaryPrices) {

      const itemModifier = modifier;
      const cost = Math.round(secondaryPrice.quantity * itemModifier * quantity);
      const baseCost = Math.round(secondaryPrice.quantity * itemModifier);
      secondaryPrice.name = game.i18n.localize(secondaryPrice.name);
      if (!secondaryPrice.data?.item) {
        secondaryPrice.data.item = CompendiumUtilities.getItemFromCache(secondaryPrice.data.uuid);
      }
      priceData[0].basePrices.push({
        ...secondaryPrice,
        cost,
        baseCost,
        modifier: itemModifier,
        string: secondaryPrice.abbreviation.replace("{#}", baseCost),
        priceString: cost ? secondaryPrice.abbreviation.replace("{#}", cost) : "",
        basePriceString: baseCost ? secondaryPrice.abbreviation.replace("{#}", baseCost) : ""
      });
      priceData[0].prices.push({
        ...secondaryPrice,
        cost,
        baseCost,
        modifier: itemModifier,
        string: secondaryPrice.abbreviation.replace("{#}", cost),
        priceString: cost ? secondaryPrice.abbreviation.replace("{#}", cost) : "",
        basePriceString: baseCost ? secondaryPrice.abbreviation.replace("{#}", baseCost) : ""
      });

      priceData[0].basePriceString = priceData[0].basePrices.filter(price => price.cost).map(price => price.string).join(" ");
      priceData[0].priceString = priceData[0].prices.filter(price => price.cost).map(price => price.string).join(" ");

    }

  }

  // If the item has custom prices, we include them here
  if (itemFlagData.prices.length && !(merchant === buyer && buyerFlagData.onlyAcceptBasePrice)) {

    priceData = priceData.concat(itemFlagData.prices.map(priceGroup => {
      if (!Array.isArray(priceGroup)) priceGroup = [priceGroup];
      const prices = priceGroup.map(price => {
        const itemModifier = price.fixed ? 1 : modifier;
        const cost = Math.round(price.quantity * itemModifier * quantity);
        const baseCost = Math.round(price.quantity * itemModifier);
        price.name = game.i18n.localize(price.name);
        if (!price.data?.item) {
          price.data.item = CompendiumUtilities.getItemFromCache(price.data.uuid);
        }
        return {
          ...price,
          cost,
          baseCost,
          modifier: itemModifier,
          priceString: cost ? price.abbreviation.replace("{#}", cost) : "",
          basePriceString: baseCost ? price.abbreviation.replace("{#}", baseCost) : "",
          secondary: true
        };
      });

      return {
        prices,
        priceString: prices.filter(price => price.priceString).map(price => price.priceString).join(" "),
        basePriceString: prices.filter(price => price.basePriceString).map(price => price.basePriceString).join(" "),
        maxQuantity: 0,
        quantity: quantity
      }
    }));
  }

  // If there's a buyer, we also calculate how many of the item the buyer can afford
  if (!buyer) return priceData;

  const buyerInfiniteCurrencies = buyerFlagData?.infiniteCurrencies;
  const buyerInfiniteQuantity = buyerFlagData?.infiniteQuantity;

  const recipientCurrencies = getActorCurrencies(buyer, { currencyList });
  const totalCurrencies = recipientCurrencies
    .filter(currency => currency.exchangeRate !== undefined)
    .map(currency => currency.quantity * currency.exchangeRate).reduce((acc, num) => acc + num, 0);

  // For each price group, check for properties and items and make sure that the actor can afford it
  for (const priceGroup of priceData) {

    const primaryPrices = priceGroup.prices.filter(price => !price.secondary);
    const secondaryPrices = priceGroup.prices.filter(price => price.secondary);
    priceGroup.maxQuantity = Infinity;

    if (primaryPrices.length) {
      priceGroup.prices.forEach(price => {
        price.maxQuantity = Infinity;
      });
      if (!buyerInfiniteCurrencies) {
        priceGroup.maxQuantity = Math.floor(totalCurrencies / priceGroup.baseCost);
        priceGroup.prices.forEach(price => {
          price.maxQuantity = priceGroup.maxQuantity;
        });
      }
    }

    for (const price of secondaryPrices) {

      if (buyerInfiniteQuantity) {
        price.maxQuantity = Infinity;
        continue;
      }

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
        const priceItem = CompendiumUtilities.getItemFromCache(price.data.uuid);
        const foundItem = priceItem ? Utilities.findSimilarItem(buyer.items, priceItem) : false;
        const itemQuantity = foundItem ? Utilities.getItemQuantity(foundItem) : 0;
        price.buyerQuantity = itemQuantity;
        if (!itemQuantity) {
          priceGroup.maxQuantity = 0;
          priceGroup.quantity = 0;
          continue;
        }

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

  return priceData;
}

export function getPaymentData({
  purchaseData = [],
  seller = false,
  buyer = false,
  sellerFlagData = false,
  buyerFlagData = false
} = {}) {

  buyerFlagData = getActorFlagData(buyer, buyerFlagData);
  if (!isItemPileMerchant(buyer, buyerFlagData)) {
    buyerFlagData = false;
  }

  sellerFlagData = getActorFlagData(seller, sellerFlagData);
  if (!isItemPileMerchant(seller, sellerFlagData)) {
    sellerFlagData = false;
  }

  const merchant = sellerFlagData ? seller : buyer;
  const currencyList = getCurrencyList(merchant);
  const currencies = getActorCurrencies(merchant, { currencyList, getAll: true });
  const smallestExchangeRate = getSmallestExchangeRate(currencies)
  const decimals = getExchangeRateDecimals(smallestExchangeRate);

  const recipientCurrencies = getActorCurrencies(buyer, { currencyList, getAll: true });

  const buyerInfiniteCurrencies = buyerFlagData?.infiniteCurrencies;

  const paymentData = purchaseData.map(data => {
      const prices = getPriceData({
        cost: data.cost,
        item: data.item,
        secondaryPrices: data.secondaryPrices,
        seller,
        buyer,
        sellerFlagData,
        buyerFlagData,
        itemFlagData: data.itemFlagData,
        quantity: data.quantity || 1
      })[data.paymentIndex || 0];
      return {
        ...prices, item: data.item
      };
    })
    .reduce((priceData, priceGroup) => {

      if (!priceGroup.maxQuantity && (buyer || seller)) {
        priceData.canBuy = false;
        priceData.reason = ["ITEM-PILES.Applications.TradeMerchantItem." + (buyer === merchant ? "TheyCantAfford" : "YouCantAfford")];
        return priceData;
      }

      const primaryPrices = priceGroup.prices.filter(price => !price.secondary && price.cost);
      const secondaryPrices = priceGroup.prices.filter(price => price.secondary && price.cost);

      if (primaryPrices.length) {

        priceData.totalCurrencyCost = Helpers.roundToDecimals(priceData.totalCurrencyCost + priceGroup.totalCost, decimals);
        priceData.primary = true;

      }

      if (secondaryPrices.length) {

        for (const price of secondaryPrices) {

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
            priceData.reason = ["ITEM-PILES.Applications.TradeMerchantItem." + (buyer === merchant ? "TheyCantAfford" : "YouCantAfford")];
          }
        }
      }

      if (priceGroup.item) {

        const itemQuantity = Utilities.getItemQuantity(priceGroup.item);

        const quantityPerPrice = game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE
          ? getProperty(priceGroup.item, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE) ?? 1
          : 1;

        const requiredQuantity = Math.floor(priceGroup.quantity * quantityPerPrice);

        if (requiredQuantity > itemQuantity && requiredQuantity > (priceGroup.maxQuantity * quantityPerPrice)) {
          priceData.canBuy = false;
          priceData.reason = [`ITEM-PILES.Applications.TradeMerchantItem.${buyer === merchant ? "You" : "They"}LackQuantity`, {
            quantity: itemQuantity,
            requiredQuantity
          }];
        }

        priceData.buyerReceive.push({
          type: "item",
          name: priceGroup.item.name,
          img: priceGroup.item.img,
          quantity: requiredQuantity,
          item: priceGroup.item,
        });
      }

      return priceData;

    }, {
      totalCurrencyCost: 0, canBuy: true, primary: false, finalPrices: [], otherPrices: [], reason: [],

      buyerReceive: [], buyerChange: [], sellerReceive: []
    });

  if (paymentData.totalCurrencyCost && !seller && !buyer) {

    paymentData.finalPrices = getPriceArray(paymentData.totalCurrencyCost, recipientCurrencies);

  } else if (paymentData.totalCurrencyCost) {

    // The price array that we need to fill
    const prices = getPriceArray(paymentData.totalCurrencyCost, recipientCurrencies);

    // This is the target price amount we need to hit
    let priceLeft = paymentData.totalCurrencyCost;

    const inverse = prices[prices.length - 1].primary && prices[prices.length - 1].exchangeRate === 1;

    // Starting from the smallest currency increment in the price
    for (let i = prices.length - 1, j = 0; i >= 0; i--, j++) {

      const price = prices[inverse ? j : i];

      const buyerPrice = {
        ...price,
        buyerQuantity: buyerInfiniteCurrencies ? Infinity : price.quantity,
        quantity: 0,
        isCurrency: true
      }

      if (price.type === "item") {
        buyerPrice.item = price.data.item ?? CompendiumUtilities.getItemFromCache(price.data.uuid);
      }

      // If we have met the price target (or exceeded it, eg, we need change), populate empty entry
      if (priceLeft <= 0 || !price.cost || currencies.length === 1) {
        if (currencies.length === 1) {
          buyerPrice.quantity = price.cost;
          priceLeft = 0;
        }
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
    if (currencies.length > 1) {

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

export function isMerchantClosed(merchant, { pileData = false } = {}) {

  if (!pileData) pileData = getActorFlagData(merchant);

  const timestamp = window.SimpleCalendar.api.timestampToDate(window.SimpleCalendar.api.timestamp());

  const openTimes = pileData.openTimes.open;
  const closeTimes = pileData.openTimes.close;

  const openingTime = Number(openTimes.hour.toString() + "." + openTimes.minute.toString());
  const closingTime = Number(closeTimes.hour.toString() + "." + closeTimes.minute.toString());
  const currentTime = Number(timestamp.hour.toString() + "." + timestamp.minute.toString());

  let isClosed = openingTime > closingTime
    ? !(currentTime >= openingTime || currentTime <= closingTime)  // Is the store open over midnight?
    : !(currentTime >= openingTime && currentTime <= closingTime); // or is the store open during normal daylight hours?

  const currentWeekday = window.SimpleCalendar.api.getCurrentWeekday();

  isClosed = isClosed || (pileData.closedDays ?? []).includes(currentWeekday.name);

  const currentDate = window.SimpleCalendar.api.currentDateTime();
  const notes = window.SimpleCalendar.api.getNotesForDay(currentDate.year, currentDate.month, currentDate.day);
  const categories = new Set(notes.map(note => getProperty(note, "flags.foundryvtt-simple-calendar.noteData.categories") ?? []).deepFlatten());

  return isClosed || categories.intersection(new Set(pileData.closedHolidays ?? [])).size > 0;

}

export async function updateMerchantLog(itemPile, activityData = {}) {

  const vaultLog = getActorLog(itemPile);

  vaultLog.push({
    ...activityData,
    date: Date.now()
  });

  return itemPile.update({
    [CONSTANTS.FLAGS.LOG]: vaultLog
  });
}

/* ---------------------- VAULT FUNCTIONS ---------------------- */

export function getVaultGridData(vaultActor, flagData = false) {

  const vaultFlags = getActorFlagData(vaultActor, flagData);

  const vaultItems = getActorItems(vaultActor);
  const validVaultItems = vaultItems.filter(item => {
    return !getItemFlagData(item).vaultExpander;
  });

  let enabledCols = vaultFlags.cols;
  let enabledRows = vaultFlags.rows;

  if (vaultFlags.vaultExpansion) {

    const vaultExpanders = vaultItems.filter(item => {
      return getItemFlagData(item).vaultExpander;
    }).map(item => ({
      itemFlagData: getItemFlagData(item),
      quantity: Utilities.getItemQuantity(item)
    }))

    const expansions = vaultExpanders.reduce((acc, item) => {
      acc.cols += (item.itemFlagData.addsCols ?? 0) * item.quantity;
      acc.rows += (item.itemFlagData.addsRows ?? 0) * item.quantity;
      return acc;
    }, {
      cols: vaultFlags.baseExpansionCols ?? 0,
      rows: vaultFlags.baseExpansionRows ?? 0
    });

    enabledCols = expansions.cols;
    enabledRows = expansions.rows;

  }

  enabledCols = Math.min(enabledCols, vaultFlags.cols);
  enabledRows = Math.min(enabledRows, vaultFlags.rows);

  return {
    totalSpaces: Math.max(0, (vaultFlags.cols * vaultFlags.rows)),
    enabledSpaces: Math.max(0, (enabledCols * enabledRows)),
    freeSpaces: Math.max(0, (enabledCols * enabledRows) - validVaultItems.length),
    enabledCols: enabledCols,
    enabledRows: enabledRows,
    cols: vaultFlags.cols,
    rows: vaultFlags.rows
  }

}

export function getVaultAccess(vaultActor, { flagData = false, hasRecipient = false } = {}) {

  const vaultFlags = getActorFlagData(vaultActor, flagData);

  const vaultAccess = vaultFlags.vaultAccess.filter(access => {
    return fromUuidSync(access.uuid)?.isOwner;
  });

  return vaultAccess.reduce((acc, access) => {
    acc.canView = acc.canView || (access.view ?? true);
    acc.canOrganize = acc.canOrganize || access.organize;
    acc.canWithdrawItems = (acc.canWithdrawItems || access.items.withdraw) && hasRecipient;
    acc.canDepositItems = (acc.canDepositItems || access.items.deposit) && hasRecipient;
    acc.canWithdrawCurrencies = (acc.canWithdrawCurrencies || access.currencies.withdraw) && hasRecipient;
    acc.canDepositCurrencies = (acc.canDepositCurrencies || access.currencies.deposit) && hasRecipient;
    return acc;
  }, {
    canView: vaultActor.isOwner || !vaultFlags.restrictVaultAccess,
    canOrganize: vaultActor.isOwner,
    canWithdrawItems: vaultActor.isOwner && hasRecipient,
    canDepositItems: vaultActor.isOwner && hasRecipient,
    canWithdrawCurrencies: vaultActor.isOwner && hasRecipient,
    canDepositCurrencies: vaultActor.isOwner && hasRecipient
  });

}

export async function updateVaultLog(itemPile, {
  actor = false,
  userId = false,
  items = [],
  attributes = [],
  withdrawal = true,
  vaultLogData = {},
} = {}) {

  const formattedItems = [];
  const formattedCurrencies = [];

  const currencies = getActorCurrencies(itemPile, { getAll: true });

  const date = Date.now();

  for (const itemData of items) {
    if (currencies.some(currency => currency.name === itemData.item.name)) {
      formattedCurrencies.push({
        actor: actor?.name ?? false,
        user: userId,
        name: itemData.item.name,
        qty: itemData.quantity * (withdrawal ? -1 : 1),
        action: vaultLogData?.action ?? (withdrawal ? "withdrew" : "deposited"),
        date
      });
    } else {
      const item = await Item.implementation.create(itemData.item, { temporary: true });
      formattedItems.push({
        actor: actor?.name ?? false,
        user: userId,
        name: item.name,
        qty: itemData.quantity * (withdrawal ? -1 : 1),
        action: vaultLogData?.action ?? (withdrawal ? "withdrew" : "deposited"),
        date
      });
    }
  }

  for (const [key, quantity] of Object.entries(attributes)) {
    const currency = currencies.find(currency => currency.data.path === key);
    if (currency) {
      formattedCurrencies.push({
        actor: actor?.name ?? false,
        user: userId,
        name: currency.name,
        qty: quantity * (withdrawal ? -1 : 1),
        action: vaultLogData?.action ?? (withdrawal ? "withdrew" : "deposited"),
        date
      });
    }
  }

  const vaultLog = getActorLog(itemPile);

  return itemPile.update({
    [CONSTANTS.FLAGS.LOG]: formattedItems.concat(formattedCurrencies).concat(vaultLog)
  });
}

export function getActorLog(actor) {
  return getProperty(Utilities.getActor(actor), CONSTANTS.FLAGS.LOG) || [];
}

export function clearActorLog(actor) {
  return actor.update({
    [CONSTANTS.FLAGS.LOG]: []
  });
}

/**
 *
 * @param tableUuid
 * @param formula
 * @param resetTable
 * @param normalize
 * @param displayChat
 * @param rollData
 * @param customCategory
 * @returns {Promise<[object]>}
 */
export async function rollTable({
  tableUuid,
  formula = "1",
  resetTable = true,
  normalize = false,
  displayChat = false,
  rollData = {},
  customCategory = false
} = {}) {

  const rolledItems = [];

  const table = await fromUuid(tableUuid);

  if (!tableUuid.startsWith("Compendium")) {
    if (resetTable) {
      await table.reset();
    }

    if (normalize) {
      await table.update({
        results: table.results.map(result => ({
          _id: result.id, weight: result.range[1] - (result.range[0] - 1)
        }))
      });
      await table.normalize();
    }
  }

  const roll = new Roll(formula.toString(), rollData).evaluate({ async: false });
  if (roll.total <= 0) {
    return [];
  }

  let results;
  if (game.modules.get("better-rolltables")?.active) {
    results = (await game.betterTables.roll(table)).itemsData.map(result => {
      return {
        documentCollection: result.compendiumName || result.documentName,
        documentId: result.item.id,
        text: result.item.text || result.item.name,
        img: result.item.img,
        quantity: result.quantity
      }
    })
  } else {
    results = (await table.drawMany(roll.total, { displayChat, recursive: true })).results;
  }

  for (const rollData of results) {

    let rolledQuantity = rollData?.quantity ?? 1;

    let item;
    if (rollData.documentCollection === "Item") {
      item = game.items.get(rollData.documentId);
    } else {
      const compendium = game.packs.get(rollData.documentCollection);
      if (compendium) {
        item = await compendium.getDocument(rollData.documentId);
      }
    }

    if (item instanceof RollTable) {
      rolledItems.push(...(await rollTable({ tableUuid: item.uuid, resetTable, normalize, displayChat })))
    } else if (item instanceof Item) {
      const quantity = Math.max(Utilities.getItemQuantity(item) * rolledQuantity, 1);
      rolledItems.push({
        ...rollData,
        item,
        quantity
      });
    }

  }

  const items = [];

  rolledItems.forEach(newItem => {

    const existingItem = items.find(
      (item) => item.documentId === newItem.documentId
    );
    if (existingItem) {
      existingItem.quantity += Math.max(newItem.quantity, 1);
    } else {
      setProperty(newItem, "flags", newItem.item.flags);
      if (game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE && !getProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE)) {
        setProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE, Utilities.getItemQuantity(newItem.item));
      }
      if (customCategory) {
        setProperty(newItem, CONSTANTS.FLAGS.CUSTOM_CATEGORY, customCategory);
      }
      items.push({
        ...newItem
      });
    }
  })

  return items;

}

export async function rollMerchantTables({ tableData = false, actor = false } = {}) {

  if (tableData && !Array.isArray(tableData)) {
    tableData = [tableData]
  } else if (!tableData && actor) {
    const flagData = getActorFlagData(actor);
    tableData = flagData.tablesForPopulate;
  } else if (!tableData && !actor) {
    return [];
  }

  let items = [];

  for (const table of tableData) {

    const rollableTable = await fromUuid(table.uuid);

    if (!rollableTable) continue;

    if (!table.uuid.startsWith("Compendium")) {
      await rollableTable.reset();
    }

    let tableItems = [];

    if (table.addAll) {

      for (const [itemId, formula] of Object.entries(table.items)) {
        const roll = new Roll(formula).evaluate({ async: false });
        if (roll.total <= 0) continue;
        const rollResult = rollableTable.results.get(itemId).toObject();
        const potentialPack = game.packs.get(rollResult.documentCollection);
        if (rollResult.documentCollection === "RollTable" || potentialPack?.documentName === "RollTable") {
          const subTable = await getTable(rollResult);
          items.push(...(await rollMerchantTables({
            tableData: [{
              uuid: subTable.uuid,
              addAll: false,
              timesToRoll: roll.total,
              customCategory: table.customCategory
            }], actor
          })))
          continue;
        }
        const item = await getItem(rollResult);
        if (!item) continue;
        const quantity = roll.total * Math.max(Utilities.getItemQuantity(item), 1);
        tableItems.push({
          ...rollResult,
          customCategory: table.customCategory,
          item,
          quantity
        })
      }

    } else {

      const roll = new Roll((table.timesToRoll ?? "1").toString()).evaluate({ async: false });

      if (roll.total <= 0) {
        continue;
      }

      tableItems = await rollTable({
        tableUuid: table.uuid,
        formula: roll.total
      })

      tableItems.forEach(item => {
        if (table.customCategory) {
          setProperty(item, CONSTANTS.FLAGS.CUSTOM_CATEGORY, table.customCategory);
        }
      });

    }

    tableItems.forEach(newItem => {
      const existingItem = items.find(
        (item) => item.documentId === newItem.documentId
      );
      if (existingItem) {
        existingItem.quantity += Math.max(newItem.quantity, 1);
      } else {
        setProperty(newItem, "flags", newItem.item.flags);
        if (game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE && !getProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE)) {
          setProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE, Utilities.getItemQuantity(newItem.item));
        }
        if (newItem.customCategory) {
          setProperty(newItem, CONSTANTS.FLAGS.CUSTOM_CATEGORY, newItem.customCategory);
        }
        items.push({
          ...newItem,
          quantity: newItem.quantity
        });
      }
    })
  }

  return items;
}

async function getTable(tableToGet) {
  let table;
  if (tableToGet.documentCollection === "RollTable") {
    table = game.tables.get(tableToGet.documentId);
  } else {
    const compendium = game.packs.get(tableToGet.documentCollection);
    if (compendium) {
      table = await compendium.getDocument(tableToGet.documentId);
    }
  }
  return table;
}

async function getItem(itemToGet) {
  let item;
  if (itemToGet.documentCollection === "Item") {
    item = game.items.get(itemToGet.documentId);
  } else {
    const compendium = game.packs.get(itemToGet.documentCollection);
    if (compendium) {
      item = await compendium.getDocument(itemToGet.documentId);
    }
  }
  return item;
}
