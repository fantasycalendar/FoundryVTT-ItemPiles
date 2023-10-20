import SETTINGS from "../constants/settings.js";
import { getSetting } from "./helpers.js";

const PACK_ID = `world.item-piles-item-backup-do-not-delete`;

const COMPENDIUM_CACHE = {};

export async function initializeCompendiumCache() {

  Hooks.on("updateItem", async (item) => {
    if (!item?.pack || !item?.pack.startsWith(PACK_ID)) return;
    COMPENDIUM_CACHE[item.uuid] = item.toObject();
  });

  const pack = game.packs.get(PACK_ID);
  if (pack) {
    for (const index of pack.index) {
      const item = await pack.getDocument(index._id);
      COMPENDIUM_CACHE[item.uuid] = item.toObject();
    }
  }

  Hooks.on("updateCompendium", updateCache);

  updateCache();

}

async function updateCache() {
  const currencies = getSetting(SETTINGS.CURRENCIES);
  const secondaryCurrencies = getSetting(SETTINGS.SECONDARY_CURRENCIES);
  for (const currency of currencies.concat(secondaryCurrencies)) {
    if (!currency.data?.uuid) continue;
    COMPENDIUM_CACHE[currency.data?.uuid] = (await fromUuid(currency.data.uuid)).toObject();
  }
}

export async function getItemCompendium() {
  return game.packs.get(PACK_ID) || await CompendiumCollection.createCompendium({
    label: `Item Piles: Item Backup (DO NOT DELETE)`,
    id: PACK_ID,
    private: true,
    type: "Item"
  });
}

export async function addItemsToCompendium(items) {
  return Item.createDocuments(items, { pack: PACK_ID });
}

export async function findSimilarItemInCompendium(itemToFind) {
  const pack = await getItemCompendium();
  const item = game.packs.get(PACK_ID).index.find(compendiumItem => {
    return compendiumItem.name === itemToFind.name
      && compendiumItem.type === itemToFind.type;
  });
  return (item?._id ? pack.getDocument(item._id) : false);
}

export function getItemFromCache(uuid) {
  return COMPENDIUM_CACHE[uuid] ?? false;
}

export async function findOrCreateItemInCompendium(itemData) {
  let compendiumItem = await findSimilarItemInCompendium(itemData);
  if (!compendiumItem) {
    compendiumItem = (await addItemsToCompendium([itemData]))[0];
  }
  COMPENDIUM_CACHE[compendiumItem.uuid] = itemData;
  return compendiumItem;
}

export function findSimilarItemInCompendiumSync(itemToFind) {
  return Object.values(COMPENDIUM_CACHE).find(compendiumItem => {
    return compendiumItem.name === itemToFind.name
      && compendiumItem.type === itemToFind.type;
  }) ?? false;
}
