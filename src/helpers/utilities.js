import * as Helpers from "./helpers.js";

export function getActor(target) {
  if (target instanceof Actor) return target;
  if (stringIsUuid(target)) {
    target = fromUuidFast(target);
  }
  target = getDocument(target);
  return target?.actor ?? target;
}

export function getToken(documentUuid) {
  const document = fromUuidFast(documentUuid);
  return document instanceof TokenDocument ? document.object : document;
}

export function getDocument(target) {
  if (stringIsUuid(target)) {
    target = fromUuidFast(target);
  }
  return target?.document ?? target;
}

export function stringIsUuid(inId) {
  return typeof inId === "string"
    && (inId.match(/\./g) || []).length
    && !inId.endsWith(".");
}

/**
 *  Retrieves an object from the scene using its UUID, avoiding compendiums as they would have to be async'd
 *
 * @param uuid
 * @returns {null}
 */
export function fromUuidFast(uuid) {
  let parts = uuid.split(".");
  let doc;

  const [docName, docId] = parts.slice(0, 2);
  parts = parts.slice(2);
  const collection = CONFIG[docName].collection.instance;
  doc = collection.get(docId);

  // Embedded Documents
  while (doc && (parts.length > 1)) {
    const [embeddedName, embeddedId] = parts.slice(0, 2);
    doc = doc.getEmbeddedDocument(embeddedName, embeddedId);
    parts = parts.slice(2);
  }
  return doc || null;
}

export function getUuid(target) {
  if (stringIsUuid(target)) return target;
  const document = getDocument(target);
  return document?.uuid ?? false;
}

/**
 * Find and retrieves an item in a list of items
 *
 * @param {Array<Item|Object>} items
 * @param {Item|Object} findItem
 * @returns {*}
 */
export function findSimilarItem(items, findItem) {

  const itemSimilarities = game.itempiles.API.ITEM_SIMILARITIES;

  const findItemId = findItem instanceof Item ? findItem.id : findItem._id;

  return items.find(item => {
    const itemId = item instanceof Item ? item.id : item._id;
    if (itemId && findItemId && itemId === findItemId) {
      return true;
    }

    const itemData = item instanceof Item ? item.toObject() : item;
    for (const path of itemSimilarities) {
      if (getProperty(itemData, path) !== getProperty(findItem, path) || (!hasProperty(itemData, path) ^ !hasProperty(findItem, path))) {
        return false;
      }
    }

    return true;
  });
}

export function setSimilarityProperties(obj, item) {
  const itemData = item instanceof Item ? item.toObject() : item;
  setProperty(obj, "_id", itemData._id);
  game.itempiles.API.ITEM_SIMILARITIES.forEach(prop => {
    setProperty(obj, prop, getProperty(itemData, prop));
  })
  return obj;
}

/**
 * Returns a given item's quantity
 *
 * @param {Item/Object} item
 * @returns {number}
 */
export function getItemQuantity(item) {
  const itemData = item instanceof Item ? item.toObject() : item;
  return Number(getProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE) ?? 0);
}


/**
 * Returns whether an item has the quantity property
 *
 * @param {Item/Object} item
 * @returns {number}
 */
export function hasItemQuantity(item) {
  const itemData = item instanceof Item ? item.toObject() : item;
  return hasProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE);
}

/**
 * Returns a given item's quantity
 *
 * @param {Object} itemData
 * @param {Number} quantity
 * @returns {Object}
 */
export function setItemQuantity(itemData, quantity) {
  setProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE, quantity)
  return itemData;
}


export function getItemCost(item) {
  const itemData = item instanceof Item ? item.toObject() : item;
  return getProperty(itemData, game.itempiles.API.ITEM_PRICE_ATTRIBUTE) ?? 0;
}

/**
 * Retrieves all visible tokens on a given location
 *
 * @param position
 * @returns {Array<Token>}
 */
export function getTokensAtLocation(position) {
  const tokens = [...canvas.tokens.placeables].filter(token => token.mesh.visible);
  return tokens.filter(token => {
    return position.x >= token.x && position.x < (token.x + (token.document.width * canvas.grid.size))
      && position.y >= token.y && position.y < (token.y + (token.document.height * canvas.grid.size));
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

export function refreshAppsWithDocument(doc, callback) {
  const apps = Object.values(ui.windows).filter(app => app.id.endsWith(doc.id));
  for (const app of apps) {
    if (app[callback]) {
      app[callback]();
    }
  }
}

export async function runMacro(macroId, macroData) {

  // Credit to Otigon, Zhell, Gazkhan and MrVauxs for the code in this section
  let macro;
  if (macroId.startsWith("Compendium")) {
    let packArray = macroId.split(".");
    let compendium = game.packs.get(`${packArray[1]}.${packArray[2]}`);
    if (!compendium) {
      throw Helpers.custom_error(`Compendium ${packArray[1]}.${packArray[2]} was not found`);
    }
    let findMacro = (await compendium.getDocuments()).find(m => m.name === packArray[3] || m.id === packArray[3])
    if (!findMacro) {
      throw Helpers.custom_error(`The "${packArray[3]}" macro was not found in Compendium ${packArray[1]}.${packArray[2]}`);
    }
    macro = new Macro(findMacro?.toObject());
    macro.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
  } else {
    macro = game.macros.getName(macroId);
    if (!macro) {
      throw Helpers.custom_error(`Could not find macro with name "${macroId}"`);
    }
  }

  let result = false;
  try {
    result = await macro.execute(macroData);
  } catch (err) {
    Helpers.custom_warning(`Error when executing macro ${macroId}!\n${err}`, true);
  }

  return result;

}