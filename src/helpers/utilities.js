export function getActor(target) {
  if (target instanceof Actor) return target;
  if (stringIsUuid(target)) {
    target = fromUuidFast(target);
  }
  target = getDocument(target);
  return target?.actor ?? target;
}

export function getDocument(target) {
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

  const itemSimilarities = game.itempiles.ITEM_SIMILARITIES;

  const findItemId = findItem?.id ?? findItem?._id;

  return items.find(item => {
    const itemId = item.id ?? item._id;
    if (itemId && findItemId && itemId === findItemId) {
      return true;
    }

    const itemData = item instanceof Item ? item.data : item;
    for (const path of itemSimilarities) {
      if (getProperty(itemData, path) !== getProperty(findItem, path)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Returns a given item's quantity
 *
 * @param {Item} item
 * @returns {number}
 */
export function getItemQuantity(item) {
  const itemData = item instanceof Item ? item.data : item;
  return Number(getProperty(itemData, game.itempiles.ITEM_QUANTITY_ATTRIBUTE) ?? 0);
}