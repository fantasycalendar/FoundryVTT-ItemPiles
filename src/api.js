import * as Helpers from "./helpers/helpers.js";
import * as Utilities from "./helpers/utilities.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import * as SharingUtilities from "./helpers/sharing-utilities.js";
import SETTINGS from "./constants/settings.js";
import HOOKS from "./constants/hooks.js";
import ItemPileSocket from "./socket.js";
import { getItemsToAdd } from "./helpers/pile-utilities.js";

export default class API {

  /**
   * The actor class type used for the original item pile actor in this system
   *
   * @returns {String}
   */
  static get ACTOR_CLASS_TYPE() {
    return Helpers.getSetting(SETTINGS.ACTOR_CLASS_TYPE);
  }

  /**
   * The currencies used in this system
   *
   * @returns {Array<{name: String, currency: String, img: String}>}
   */
  static get CURRENCIES() {
    return Helpers.getSetting(SETTINGS.CURRENCIES);
  }

  /**
   * The attribute used to track the price of items in this system
   *
   * @returns {string}
   */
  static get ITEM_PRICE_ATTRIBUTE() {
    return Helpers.getSetting(SETTINGS.ITEM_PRICE_ATTRIBUTE);
  }

  /**
   * The attribute used to track the quantity of items in this system
   *
   * @returns {String}
   */
  static get ITEM_QUANTITY_ATTRIBUTE() {
    return Helpers.getSetting(SETTINGS.ITEM_QUANTITY_ATTRIBUTE);
  }

  /**
   * The filters for item types eligible for interaction within this system
   *
   * @returns {Array<{name: String, filters: String}>}
   */
  static get ITEM_FILTERS() {
    return Helpers.getSetting(SETTINGS.ITEM_FILTERS);
  }

  /**
   * The attributes for detecting item similarities
   *
   * @returns {Array<String>}
   */
  static get ITEM_SIMILARITIES() {
    return Helpers.getSetting(SETTINGS.ITEM_SIMILARITIES);
  }

  /**
   * Sets the actor class type used for the original item pile actor in this system
   *
   * @param {String} inClassType
   * @returns {Promise|Boolean}
   */
  static setActorClassType(inClassType) {
    if (typeof inClassType !== "string") {
      throw Helpers.custom_error("setActorTypeClass | inClassType must be of type string");
    }
    return Helpers.setSetting(SETTINGS.ACTOR_CLASS_TYPE, inClassType);
  }

  /**
   * Sets the currencies used in this system
   *
   * @param {Object<{attributes: Array, items: Array}>} inCurrencies
   * @returns {Promise}
   */
  static setCurrencies(inCurrencies) {
    if (!Array.isArray(inCurrencies.attributes) || Array.isArray(inCurrencies.items)) {
      throw Helpers.custom_error("setCurrencies | inCurrencies must be an object with the 'attributes' and 'items' keys, and both must be arrays");
    }

    inCurrencies.attributes.forEach(attribute => {
      if (typeof attribute !== "object") {
        throw Helpers.custom_error("setCurrencies | each entry in the inCurrencies array must be of type object");
      }
      if (typeof attribute.primary !== "boolean") {
        throw Helpers.custom_error("setCurrencies | attribute.primary must be of type boolean");
      }
      if (typeof attribute.name !== "string") {
        throw Helpers.custom_error("setCurrencies | attribute.name must be of type string");
      }
      if (typeof attribute.exchange !== "number") {
        throw Helpers.custom_error("setCurrencies | attribute.exchange must be of type number");
      }
      if (typeof attribute.path !== "string") {
        throw Helpers.custom_error("setCurrencies | attribute.path must be of type string");
      }
      if (attribute.img && typeof attribute.img !== "string") {
        throw Helpers.custom_error("setCurrencies | attribute.img must be of type string");
      }
    });

    inCurrencies.items.forEach(item => {
      if (typeof item !== "object") {
        throw Helpers.custom_error("setCurrencies | each entry in the inCurrencies array must be of type object");
      }
      if (typeof item.primary !== "boolean") {
        throw Helpers.custom_error("setCurrencies | item.primary must be of type boolean");
      }
      if (typeof item.name !== "string") {
        throw Helpers.custom_error("setCurrencies | item.name must be of type string");
      }
      if (typeof item.type !== "string") {
        throw Helpers.custom_error("setCurrencies | item.type must be of type string");
      }
      if (typeof item.exchange !== "number") {
        throw Helpers.custom_error("setCurrencies | item.exchange must be of type number");
      }
      if (item.img && typeof item.img !== "string") {
        throw Helpers.custom_error("setCurrencies | item.img must be of type string");
      }
    });

    return Helpers.setSetting(SETTINGS.CURRENCIES, inCurrencies);
  }

  /**
   * Sets the attribute used to track the price of items in this system
   *
   * @param {string} inAttribute
   * @returns {Promise}
   */
  static setItemPriceAttribute(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw Helpers.custom_error("setItemPriceAttribute | inAttribute must be of type string");
    }
    return Helpers.setSetting(SETTINGS.ITEM_PRICE_ATTRIBUTE, inAttribute);
  }

  /**
   * Sets the attribute used to track the quantity of items in this system
   *
   * @param {String} inAttribute
   * @returns {Promise}
   */
  static setItemQuantityAttribute(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw Helpers.custom_error("setItemQuantityAttribute | inAttribute must be of type string");
    }
    return Helpers.setSetting(SETTINGS.ITEM_QUANTITY_ATTRIBUTE, inAttribute);
  }

  /**
   * Sets the items filters for interaction within this system
   *
   * @param {Array<{path: String, filters: String}>} inFilters
   * @returns {Promise}
   */
  static setItemFilters(inFilters) {
    if (!Array.isArray(inFilters)) {
      throw Helpers.custom_error("setItemFilters | inFilters must be of type array");
    }
    inFilters.forEach(filter => {
      if (typeof filter?.path !== "string") {
        throw Helpers.custom_error("setItemFilters | each entry in inFilters must have a \"path\" property with a value that is of type string");
      }
      if (typeof filter?.filters !== "string") {
        throw Helpers.custom_error("setItemFilters | each entry in inFilters must have a \"filters\" property with a value that is of type string");
      }
    });
    return Helpers.setSetting(SETTINGS.ITEM_FILTERS, inFilters);
  }

  /**
   * Sets the attributes for detecting item similarities
   *
   * @param {Array<String>} inPaths
   * @returns {Promise}
   */
  static setItemSimilarities(inPaths) {
    if (!Array.isArray(inPaths)) {
      throw Helpers.custom_error("setItemSimilarities | inPaths must be of type array");
    }
    inPaths.forEach(path => {
      if (typeof path !== "string") {
        throw Helpers.custom_error("setItemSimilarities | each entry in inPaths must be of type string");
      }
    });
    return Helpers.setSetting(SETTINGS.ITEM_SIMILARITIES, inPaths);
  }

  /* --- ITEM AND ATTRIBUTE METHODS --- */

  /**
   * Adds item to an actor, increasing item quantities if matches were found
   *
   * @param {Actor/TokenDocument/Token} target        The target to add an item to
   * @param {Array} items                             An array of objects, with the key "item" being an item object or an Item class (the foundry class), with an optional key of "quantity" being the amount of the item to add
   * @param {Boolean} [mergeSimilarItems=true]        Whether to merge similar items based on their name and type
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<array>}                        An array of objects, each containing the item that was added or updated, and the quantity that was added
   */
  static addItems(target, items, { mergeSimilarItems = true, interactionId = false } = {}) {

    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`AddItems | Could not determine the UUID, please provide a valid target`, true)

    const itemsToAdd = []
    items.forEach(itemData => {

      let item = itemData;
      if (itemData instanceof Item) {
        item = itemData.toObject();
      } else if (itemData.item instanceof Item) {
        item = itemData.item.toObject();
      } else if (itemData.item) {
        item = itemData.item;
      }

      if (itemData?.quantity !== undefined) {
        setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, itemData?.quantity)
      }

      const existingItems = mergeSimilarItems ? Utilities.findSimilarItem(itemsToAdd, item) : false;
      if (existingItems) {
        setProperty(existingItems, API.ITEM_QUANTITY_ATTRIBUTE, Utilities.getItemQuantity(existingItems) + Utilities.getItemQuantity(item))
      } else {
        itemsToAdd.push(item);
      }

    });

    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`AddItems | interactionId must be of type string`);
    }

    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.ADD_ITEMS, targetUuid, itemsToAdd, game.user.id, { interactionId });
  }

  /**
   * @private
   */
  static async _addItems(targetUuid, items, userId, { interactionId = false } = {}) {

    const targetActor = Utilities.getActor(targetUuid);

    const { itemsAdded, itemsToUpdate, itemsToCreate } = PileUtilities.getItemsToAdd(targetActor, items);

    const hookResult = Hooks.call(HOOKS.ITEM.PRE_ADD, targetActor, itemsToCreate, itemsToUpdate, userId, interactionId);
    if (hookResult === false) return;

    const itemsCreated = await targetActor.createEmbeddedDocuments("Item", itemsToCreate);
    await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);

    itemsCreated.forEach(item => {
      const itemObject = item.toObject()
      itemsAdded.push({
        item: itemObject,
        quantity: Utilities.getItemQuantity(itemObject)
      })
    });

    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.ITEM.ADD, targetUuid, itemsAdded, userId, interactionId);

    const macroData = {
      action: "addItems",
      target: targetUuid,
      items: itemsAdded,
      userId: userId,
      interactionId: interactionId
    };

    // await this._executeItemPileMacro(targetUuid, macroData);

    // await this.updateItemPileApplication(targetUuid);

    return itemsAdded;

  }


  static getActorItems() {

  }

  /**
   * Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.
   *
   * @param {Actor/Token/TokenDocument} target        The target to remove a items from
   * @param {Array} items                             An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity"), or Items (the foundry class) or strings of IDs to remove all quantities of
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<array>}                        An array of objects, each containing the item that was removed or updated, the quantity that was removed, and whether the item was deleted
   */
  static async removeItems(target, items, { interactionId = false } = {}) {

    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`RemoveItems | Could not determine the UUID, please provide a valid target`, true);

    const targetActorItems = game.itempiles.getActorItems(target);

    items = items.map(itemData => {

      let item;
      if (typeof itemData === "string" || itemData._id) {
        const itemId = typeof itemData === "string" ? itemData : itemData._id;
        item = targetActorItems.find(actorItem => actorItem.id === itemId);
        if (!item) {
          throw Helpers.custom_error(`RemoveItems | Could not find item with id "${itemId}" on target "${targetUuid}"`, true)
        }
        item = item.toObject();
      } else {
        if (itemData.item instanceof Item) {
          item = itemData.item.toObject();
        } else if (itemData instanceof Item) {
          item = itemData.toObject();
        } else {
          item = itemData.item;
        }
        let foundActorItem = targetActorItems.find(actorItem => actorItem.id === item._id);
        if (!foundActorItem) {
          throw Helpers.custom_error(`RemoveItems | Could not find item with id "${item._id}" on target "${targetUuid}"`, true)
        }
      }

      return {
        _id: item._id,
        quantity: itemData?.quantity ?? Utilities.getItemQuantity(item)
      }
    });

    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`RemoveItems | interactionId must be of type string`);
    }

    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REMOVE_ITEMS, targetUuid, items, game.user.id, { interactionId });
  }

  /**
   * @private
   */
  static async _removeItems(targetUuid, items, userId, { interactionId = false } = {}) {

    const targetActor = Utilities.getActor(targetUuid);

    const { itemsRemoved, itemsToUpdate, itemsToDelete } = PileUtilities.getItemsToRemove(targetActor, items);

    const hookResult = Hooks.call(HOOKS.ITEM.PRE_REMOVE, targetActor, itemsToUpdate, itemsToDelete, userId, interactionId);
    if (hookResult === false) return;

    await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);
    await targetActor.deleteEmbeddedDocuments("Item", itemsToDelete);

    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.ITEM.REMOVE, targetUuid, itemsRemoved, userId, interactionId);

    const macroData = {
      action: "removeItems",
      target: targetUuid,
      items: itemsRemoved,
      userId: userId,
      interactionId: interactionId
    };

    // await API._executeItemPileMacro(targetUuid, macroData);
    //
    // const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(targetUuid);
    //
    // await API.updateItemPileApplication(targetUuid, shouldBeDeleted);
    //
    // if (shouldBeDeleted) {
    //   await API._deleteItemPile(targetUuid);
    // }

    return itemsRemoved;

  }


  /**
   * Transfers items from the source to the target, subtracting a number of quantity from the source's item and adding it to the target's item, deleting items from the source if their quantity reaches 0
   *
   * @param {Actor/Token/TokenDocument} source        The source to transfer the items from
   * @param {Actor/Token/TokenDocument} target        The target to transfer the items to
   * @param {Array} items                             An array of objects each containing the item id (key "_id") and the quantity to transfer (key "quantity"), or Items (the foundry class) or strings of IDs to transfer all quantities of
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An array of objects, each containing the item that was added or updated, and the quantity that was transferred
   */
  async transferItems(source, target, items, { interactionId = false } = {}) {

    const sourceUuid = Utilities.getUuid(source);
    if (!sourceUuid) throw Helpers.custom_error(`TransferItems | Could not determine the UUID, please provide a valid source`, true)

    const sourceActorItems = API.getActorItems(source);

    items = items.map(itemData => {

      let item;
      if (typeof itemData === "string" || itemData._id) {
        const itemId = typeof itemData === "string" ? itemData : itemData._id;
        item = sourceActorItems.find(actorItem => actorItem.id === itemId);
        if (!item) {
          throw Helpers.custom_error(`TransferItems | Could not find item with id "${itemId}" on target "${sourceUuid}"`, true)
        }
        item = item.toObject();
      } else if (itemData instanceof Item) {
        item = itemData.toObject();
      } else if (itemData.item instanceof Item) {
        item = itemData.item.toObject();
      } else {
        item = itemData.item;
      }

      let foundActorItem = sourceActorItems.find(actorItem => actorItem.id === item._id);
      if (!foundActorItem) {
        throw Helpers.custom_error(`TransferItems | Could not find item with id "${item._id}" on target "${sourceUuid}"`, true)
      }

      return {
        _id: item._id,
        quantity: Math.max((itemData?.quantity ?? 0) ?? Utilities.getItemQuantity(itemData))
      }
    });

    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`TransferItems | Could not determine the UUID, please provide a valid target`, true)

    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`TransferItems | interactionId must be of type string`);
    }

    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ITEMS, sourceUuid, targetUuid, items, game.user.id, { interactionId });

  }

  /**
   * @private
   */
  async _transferItems(sourceUuid, targetUuid, items, userId, { interactionId = false } = {}) {

    const sourceActor = Utilities.fromUuidFast(sourceUuid);
    const targetActor = Utilities.fromUuidFast(targetUuid);

    const sourceUpdates = PileUtilities.getItemsToRemove(sourceUuid, items);
    const targetUpdates = PileUtilities.getItemsToAdd(targetActor, sourceUpdates.itemsRemoved);

    const hookResult = Hooks.call(HOOKS.ITEM.PRE_TRANSFER, sourceActor, targetActor, sourceUpdates, targetUpdates, interactionId);
    if (hookResult === false) return;

    await targetActor.updateEmbeddedDocuments("Item", sourceUpdates.itemsToUpdate);
    await targetActor.deleteEmbeddedDocuments("Item", sourceUpdates.itemsToDelete);

    const itemsCreated = await targetActor.createEmbeddedDocuments("Item", targetUpdates.itemsToCreate);
    await targetActor.updateEmbeddedDocuments("Item", targetUpdates.itemsToUpdate);

    itemsCreated.forEach(item => {
      const itemObject = item.toObject()
      targetUpdates.itemsAdded.push({
        item: itemObject,
        quantity: Utilities.getItemQuantity(itemObject)
      })
    });

    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.ITEM.TRANSFER, sourceUuid, targetUuid, targetUpdates.itemsAdded, userId, interactionId);

    const macroData = {
      action: "transferItems",
      source: sourceUuid,
      target: targetUuid,
      itemsAdded: targetUpdates.itemsAdded,
      userId: userId,
      interactionId: interactionId
    };
    await API._executeItemPileMacro(sourceUuid, macroData);
    await API._executeItemPileMacro(targetUuid, macroData);

    const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
    await API.updateItemPileApplication(sourceUuid, shouldBeDeleted);
    await API.updateItemPileApplication(targetUuid);

    const itemPile = await fromUuid(sourceUuid);

    if (shouldBeDeleted) {
      await API._deleteItemPile(sourceUuid);
    } else if (PileUtilities.isItemPileEmpty(itemPile)) {
      await SharingUtilities.clearItemPileSharingData(itemPile);
    } else {
      await SharingUtilities.setItemPileSharingData(sourceUuid, targetUuid, { items: targetUpdates.itemsAdded });
    }

    return targetUpdates.itemsAdded;

  }

}