const PACK_ID = `world.item-piles-item-backup-do-not-delete`;

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
      && compendiumItem.type === itemToFind.type
      && compendiumItem.img === itemToFind.img;
  });
  return (item?._id ? pack.getDocument(item._id) : false);
}

export async function findOrCreateItemInCompendium(itemData) {
  let compendiumItem = await findSimilarItemInCompendium(itemData);
  if (!compendiumItem) {
    compendiumItem = (await addItemsToCompendium([itemData]))[0];
  }
  return compendiumItem;
}
