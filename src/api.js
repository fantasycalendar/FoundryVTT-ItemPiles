import * as Helpers from "./helpers/helpers.js";
import * as Utilities from "./helpers/utilities.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import * as SharingUtilities from "./helpers/sharing-utilities.js";
import SETTINGS from "./constants/settings.js";
import ItemPileSocket from "./socket.js";
import HOOKS from "./constants/hooks.js";
import { isItemPileClosed, isItemPileContainer, isItemPileLocked } from "./helpers/pile-utilities.js";

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
  
  /* ================= ITEM PILE METHODS ================= */
  
  /**
   * Creates the default item pile token at a location.
   *
   * @param {Object} position                         The position to create the item pile at
   * @param {String/Boolean} [sceneId=false]          Which scene to create the item pile on
   * @param {Array/Boolean} [items=false]             Any items to create on the item pile
   * @param {String/Boolean} [pileActorName=false]    Whether to use an existing item pile actor as the basis of this new token
   *
   * @returns {Promise<String>}
   */
  static createItemPile(position, {
    sceneId = game.user.viewedScene,
    items = false,
    pileActorName = false
  } = {}) {
    
    if (pileActorName) {
      const pileActor = game.actors.getName(pileActorName);
      if (!pileActor) {
        throw Helpers.custom_error(`There is no actor of the name "${pileActorName}"`, true);
      } else if (!PileUtilities.isValidItemPile(pileActor)) {
        throw Helpers.custom_error(`The actor of name "${pileActorName}" is not a valid item pile actor.`, true);
      }
    }
    
    if (items) {
      items = items.map(item => {
        return item instanceof Item
          ? item.toObject()
          : item;
      })
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.CREATE_PILE, sceneId, position, { pileActorName, items });
  }
  
  /**
   * Turns tokens and its actors into item piles
   *
   * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be turned into item piles
   * @param {Object} pileSettings                                     Overriding settings to be put on the item piles' settings
   * @param {Object} tokenSettings                                    Overriding settings that will update the tokens' settings
   *
   * @return {Promise<Array>}                                         The uuids of the targets after they were turned into item piles
   */
  static turnTokensIntoItemPiles(targets, { pileSettings = {}, tokenSettings = {} } = {}) {
    
    if (!Array.isArray(targets)) targets = [targets];
    
    const targetUuids = targets.map(target => {
      if (!(target instanceof Token || target instanceof TokenDocument)) {
        throw Helpers.custom_error(`turnTokensIntoItemPiles | Target must be of type Token or TokenDocument`, true)
      }
      const targetUuid = Utilities.getUuid(target);
      if (!targetUuid) throw Helpers.custom_error(`turnTokensIntoItemPiles | Could not determine the UUID, please provide a valid target`, true)
      return targetUuid;
    })
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TURN_INTO_PILE, targetUuids, pileSettings, tokenSettings);
  }
  
  /**
   * Reverts tokens from an item pile into a normal token and actor
   *
   * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be reverted from item piles
   * @param {Object} tokenSettings                                    Overriding settings that will update the tokens
   *
   * @return {Promise<Array>}                                         The uuids of the targets after they were reverted from being item piles
   */
  static revertTokensFromItemPiles(targets, { tokenSettings = {} } = {}) {
    
    if (!Array.isArray(targets)) targets = [targets];
    
    const targetUuids = targets.map(target => {
      if (!(target instanceof Token || target instanceof TokenDocument)) {
        throw Helpers.custom_error(`revertTokensFromItemPiles | Target must be of type Token or TokenDocument`, true)
      }
      const targetUuid = Utilities.getUuid(target);
      if (!targetUuid) throw Helpers.custom_error(`revertTokensFromItemPiles | Could not determine the UUID, please provide a valid target`, true)
      return targetUuid;
    })
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REVERT_FROM_PILE, targetUuids, tokenSettings);
  }
  
  /**
   * Opens a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  static openItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const data = PileUtilities.getActorFlagData(targetActor);
    if (!data?.enabled || !data?.isContainer) return false;
    const wasLocked = data.locked;
    const wasClosed = data.closed;
    data.closed = false;
    data.locked = false;
    if (wasLocked) {
      const hookResult = Hooks.call(HOOKS.PILE.PRE_UNLOCK, targetActor, data, interactingTokenDocument);
      if (hookResult === false) return false;
    }
    const hookResult = Hooks.call(HOOKS.PILE.PRE_OPEN, targetActor, data, interactingTokenDocument);
    if (hookResult === false) return false;
    if (wasClosed && data.openSound) {
      AudioHelper.play({ src: data.openSound })
    }
    return this.updateItemPile(targetActor, data, { interactingToken: interactingTokenDocument });
  }
  
  /**
   * Closes a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to close
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  static closeItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    const wasClosed = pileData.closed;
    pileData.closed = true;
    const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, targetActor, pileData, interactingTokenDocument);
    if (hookResult === false) return false;
    if (!wasClosed && pileData.closeSound) {
      AudioHelper.play({ src: pileData.closeSound })
    }
    return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
  }
  
  /**
   * Toggles a pile's closed state if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to open or close
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  static async toggleItemPileClosed(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    if (pileData.closed) {
      await this.openItemPile(targetActor, interactingTokenDocument);
    } else {
      await this.closeItemPile(targetActor, interactingTokenDocument);
    }
    return !pileData.closed;
  }
  
  /**
   * Locks a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to lock
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  static lockItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    const wasClosed = pileData.closed;
    pileData.closed = true;
    pileData.locked = true;
    if (!wasClosed) {
      const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, targetActor, pileData, interactingTokenDocument);
      if (hookResult === false) return false;
    }
    const hookResult = Hooks.call(HOOKS.PILE.PRE_LOCK, targetActor, pileData, interactingTokenDocument);
    if (hookResult === false) return false;
    if (!wasClosed && pileData.closeSound) {
      AudioHelper.play({ src: pileData.closeSound })
    }
    return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
  }
  
  /**
   * Unlocks a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to unlock
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  static unlockItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    pileData.locked = false;
    Hooks.call(HOOKS.PILE.PRE_UNLOCK, targetActor, pileData, interactingTokenDocument);
    return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
  }
  
  /**
   * Toggles a pile's locked state if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to lock or unlock
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  static toggleItemPileLocked(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    if (pileData.locked) {
      return this.unlockItemPile(targetActor, interactingTokenDocument);
    }
    return this.lockItemPile(targetActor, interactingTokenDocument);
  }
  
  /**
   * Causes the item pile to play a sound as it was attempted to be opened, but was locked
   *
   * @param {Token/TokenDocument} target
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise<boolean>}
   */
  static rattleItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    
    const pileData = PileUtilities.getActorFlagData(targetActor);
    
    if (!pileData?.enabled || !pileData?.isContainer || !pileData?.locked) return false;
    
    Hooks.call(HOOKS.PILE.PRE_RATTLE, targetActor, pileData, interactingTokenDocument);
    
    if (pileData.lockedSound) {
      AudioHelper.play({ src: pileData.lockedSound })
    }
    
    return ItemPileSocket.executeForEveryone(
      ItemPileSocket.HANDLERS.CALL_HOOK,
      HOOKS.PILE.RATTLE,
      Utilities.getUuid(targetActor),
      pileData,
      Utilities.getUuid(interactingTokenDocument)
    );
  }
  
  /**
   * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Boolean}
   */
  static isItemPileLocked(target) {
    return PileUtilities.isItemPileLocked(target);
  }
  
  /**
   * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Boolean}
   */
  static isItemPileClosed(target) {
    return PileUtilities.isItemPileClosed(target);
  }
  
  /**
   * Whether an item pile is a container. If it is not enabled, it is always false.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Boolean}
   */
  static isItemPileContainer(target) {
    return PileUtilities.isItemPileContainer(target);
  }
  
  /**
   * Updates a pile with new data.
   *
   * @param {Token/TokenDocument} target
   * @param {Object} newData
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   * @param {Object/Boolean} [tokenSettings=false]
   *
   * @return {Promise/Boolean}
   */
  static updateItemPile(target, newData, { interactingToken = false, tokenSettings = false } = {}) {
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`, true);
    
    const interactingTokenUuid = interactingToken ? Utilities.getUuid(interactingToken) : false;
    if (interactingToken && !interactingTokenUuid) throw Helpers.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`, true);
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.UPDATE_PILE, targetUuid, newData, {
      interactingTokenUuid,
      tokenSettings
    });
  }
  
  /**
   * Deletes a pile, calling the relevant hooks.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Promise/Boolean}
   */
  static deleteItemPile(target) {
    if (!PileUtilities.isValidItemPile(target)) {
      throw Helpers.custom_error(`deleteItemPile | This is not an item pile, please provide a valid target`, true);
    }
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`deleteItemPile | Could not determine the UUID, please provide a valid target`, true);
    if (!targetUuid.includes("Token")) {
      throw Helpers.custom_error(`deleteItemPile | Please provide a Token or TokenDocument`, true);
    }
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DELETE_PILE, targetUuid);
  }
  
  /**
   * Splits an item pile's content between all players (or a specified set of target actors).
   *
   * @param target {Token/TokenDocument/Actor}                                                The item pile to split
   * @param targets {boolean/TokenDocument/Actor/Array<TokenDocument/Actor>} [targets=false]  The targets to receive the split contents
   * @param instigator {boolean/TokenDocument/Actor} [instigator=false]                       Whether this was triggered by a specific actor
   * @returns {Promise<object>/Boolean}
   */
  static splitItemPileContents(target, { targets = false, instigator = false } = {}) {
    
    if (!PileUtilities.isValidItemPile(target)) return false;
    
    const itemPileUuid = Utilities.getUuid(target);
    if (!itemPileUuid) throw Helpers.custom_error(`SplitItemPileContents | Could not determine the UUID, please provide a valid item pile`, true)
    
    const itemPileActor = Utilities.getActor(target);
    
    if (targets) {
      if (!Array.isArray(targets)) {
        targets = [targets]
      }
      targets.forEach(actor => {
        if (!(actor instanceof TokenDocument || actor instanceof Actor)) {
          throw Helpers.custom_error("SplitItemPileContents | Each of the entries in targets must be of type TokenDocument or Actor")
        }
      })
      targets = targets.map(target => target?.character ?? target?.actor ?? target);
    }
    
    if (instigator && !(instigator instanceof TokenDocument || instigator instanceof Actor)) {
      throw Helpers.custom_error("SplitItemPileContents | splitter must be of type TokenDocument or Actor")
    }
    
    const actorUuids = (targets || SharingUtilities.getPlayersForItemPile(itemPileActor).map(u => u.character)).map(actor => Utilities.getUuid(actor));
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.SPLIT_PILE, itemPileUuid, actorUuids, game.user.id, instigator);
    
  }
  
  /* ================= ITEM AND ATTRIBUTE METHODS ================= */
  
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
        setProperty(item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, itemData?.quantity)
      }
      
      const existingItems = mergeSimilarItems ? Utilities.findSimilarItem(itemsToAdd, item) : false;
      if (existingItems) {
        setProperty(existingItems, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, Utilities.getItemQuantity(existingItems) + Utilities.getItemQuantity(item))
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
   * Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.
   *
   * @param {Actor/Token/TokenDocument} target        The target to remove a items from
   * @param {Array} items                             An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity"), or Items (the foundry class) or strings of IDs to remove all quantities of
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<array>}                        An array of objects, each containing the item that was removed or updated, the quantity that was removed, and whether the item was deleted
   */
  static removeItems(target, items, { interactionId = false } = {}) {
    
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
   * Transfers items from the source to the target, subtracting a number of quantity from the source's item and adding it to the target's item, deleting items from the source if their quantity reaches 0
   *
   * @param {Actor/Token/TokenDocument} source        The source to transfer the items from
   * @param {Actor/Token/TokenDocument} target        The target to transfer the items to
   * @param {Array} items                             An array of objects each containing the item id (key "_id") and the quantity to transfer (key "quantity"), or Items (the foundry class) or strings of IDs to transfer all quantities of
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An array of objects, each containing the item that was added or updated, and the quantity that was transferred
   */
  static transferItems(source, target, items, { interactionId = false } = {}) {
    
    const sourceUuid = Utilities.getUuid(source);
    if (!sourceUuid) throw Helpers.custom_error(`TransferItems | Could not determine the UUID, please provide a valid source`, true)
    
    const sourceActorItems = PileUtilities.getActorItems(source);
    
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
   * Transfers all items between the source and the target.
   *
   * @param {Actor/Token/TokenDocument} source        The actor to transfer all items from
   * @param {Actor/Token/TokenDocument} target        The actor to receive all the items
   * @param {Array/Boolean} [itemFilters=false]       Array of item types disallowed - will default to module settings if none provided
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<array>}                        An array containing all of the items that were transferred to the target
   */
  static transferAllItems(source, target, { itemFilters = false, interactionId = false } = {}) {
    
    const sourceUuid = Utilities.getUuid(source);
    if (!sourceUuid) throw Helpers.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid source`, true)
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid target`, true)
    
    if (itemFilters) {
      if (!Array.isArray(itemFilters)) throw Helpers.custom_error(`TransferAllItems | itemFilters must be of type array`);
      itemFilters.forEach(entry => {
        if (typeof entry?.path !== "string") throw Helpers.custom_error(`TransferAllItems | each entry in the itemFilters must have a "path" property that is of type string`);
        if (typeof entry?.filter !== "string") throw Helpers.custom_error(`TransferAllItems | each entry in the itemFilters must have a "filter" property that is of type string`);
      })
    }
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`TransferAllItems | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ALL_ITEMS, sourceUuid, targetUuid, game.user.id, {
      itemFilters,
      interactionId
    });
  }
  
  /**
   * Adds attributes on an actor
   *
   * @param {Actor/Token/TokenDocument} target        The target whose attribute will have a set quantity added to it
   * @param {Object} attributes                       An object with each key being an attribute path, and its value being the quantity to add
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An array containing a key value pair of the attribute path and the quantity of that attribute that was removed
   *
   */
  static addAttributes(target, attributes, { interactionId = false } = {}) {
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`AddAttributes | Could not determine the UUID, please provide a valid target`, true)
    
    const targetActor = Utilities.getActor(target);
    
    Object.entries(attributes).forEach(entry => {
      const [attribute, quantity] = entry;
      if (!hasProperty(targetActor.data, attribute)) {
        throw Helpers.custom_error(`AddAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
      }
      if (!Helpers.isRealNumber(quantity) && quantity > 0) {
        throw Helpers.custom_error(`AddAttributes | Attribute "${attribute}" must be of type number and greater than 0`, true)
      }
    });
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`AddAttributes | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.ADD_ATTRIBUTE, targetUuid, attributes, game.user.id, { interactionId });
    
  }
  
  /**
   * Subtracts attributes on the target
   *
   * @param {Token/TokenDocument} target              The target whose attributes will be subtracted from
   * @param {Array/object} attributes                 This can be either an array of attributes to subtract (to zero out a given attribute), or an object with each key being an attribute path, and its value being the quantity to subtract
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An array containing a key value pair of the attribute path and the quantity of that attribute that was removed
   */
  static removeAttributes(target, attributes, { interactionId = false } = {}) {
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`RemoveAttributes | Could not determine the UUID, please provide a valid target`, true)
    
    const targetActor = Utilities.getActor(target);
    
    if (Array.isArray(attributes)) {
      attributes.forEach(attribute => {
        if (typeof attribute !== "string") {
          throw Helpers.custom_error(`RemoveAttributes | Each attribute in the array must be of type string`, true)
        }
        if (!hasProperty(targetActor.data, attribute)) {
          throw Helpers.custom_error(`RemoveAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
        }
      });
    } else {
      Object.entries(attributes).forEach(entry => {
        const [attribute, quantity] = entry;
        if (!hasProperty(targetActor.data, attribute)) {
          throw Helpers.custom_error(`RemoveAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
        }
        if (!is_real_number(quantity) && quantity > 0) {
          throw Helpers.custom_error(`RemoveAttributes | Attribute "${attribute}" must be of type number and greater than 0`, true)
        }
      });
    }
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`RemoveAttributes | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REMOVE_ATTRIBUTES, targetUuid, attributes, game.user.id, { interactionId });
    
  }
  
  /**
   * Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target
   *
   * @param {Actor/Token/TokenDocument} source        The source to transfer the attribute from
   * @param {Actor/Token/TokenDocument} target        The target to transfer the attribute to
   * @param {Array/object} attributes                 This can be either an array of attributes to transfer (to transfer all of a given attribute), or an object with each key being an attribute path, and its value being the quantity to transfer
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
   */
  static transferAttributes(source, target, attributes, { interactionId = false } = {}) {
    
    const sourceUuid = Utilities.getUuid(source);
    if (!sourceUuid) throw Helpers.custom_error(`TransferAttributes | Could not determine the UUID, please provide a valid source`, true)
    const sourceActor = Utilities.getActor(source);
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`TransferAttributes | Could not determine the UUID, please provide a valid target`, true)
    const targetActor = Utilities.getActor(target);
    
    if (Array.isArray(attributes)) {
      attributes.forEach(attribute => {
        if (typeof attribute !== "string") {
          throw Helpers.custom_error(`TransferAttributes | Each attribute in the array must be of type string`, true)
        }
        if (!hasProperty(sourceActor.data, attribute)) {
          throw Helpers.custom_error(`TransferAttributes | Could not find attribute ${attribute} on source's actor with UUID "${targetUuid}"`, true)
        }
        if (!hasProperty(targetActor.data, attribute)) {
          throw Helpers.custom_error(`TransferAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
        }
      });
    } else {
      Object.entries(attributes).forEach(entry => {
        const [attribute, quantity] = entry;
        if (!hasProperty(sourceActor.data, attribute)) {
          throw Helpers.custom_error(`TransferAttributes | Could not find attribute ${attribute} on source's actor with UUID "${targetUuid}"`, true)
        }
        if (!hasProperty(targetActor.data, attribute)) {
          throw Helpers.custom_error(`TransferAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
        }
        if (!Helpers.isRealNumber(quantity) && quantity > 0) {
          throw Helpers.custom_error(`TransferAttributes | Attribute "${attribute}" must be of type number and greater than 0`, true)
        }
      });
    }
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`TransferAttributes | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ATTRIBUTES, sourceUuid, targetUuid, attributes, game.user.id, { interactionId });
    
  }
  
  /**
   * Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target
   *
   * @param {Actor/Token/TokenDocument} source        The source to transfer the attributes from
   * @param {Actor/Token/TokenDocument} target        The target to transfer the attributes to
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
   */
  static transferAllAttributes(source, target, { interactionId = false } = {}) {
    
    const sourceUuid = Utilities.getUuid(source);
    if (!sourceUuid) throw Helpers.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid source`, true);
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid target`, true);
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`TransferAllAttributes | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ALL_ATTRIBUTES, sourceUuid, targetUuid, game.user.id, { interactionId });
    
  }
  
  /**
   * Transfers all items and attributes between the source and the target.
   *
   * @param {Actor/Token/TokenDocument} source        The actor to transfer all items and attributes from
   * @param {Actor/Token/TokenDocument} target        The actor to receive all the items and attributes
   * @param {Array/Boolean} [itemFilters=false]       Array of item types disallowed - will default to module settings if none provided
   * @param {String/Boolean} [interactionId=false]    The ID of this interaction
   *
   * @returns {Promise<object>}                       An object containing all items and attributes transferred to the target
   */
  static transferEverything(source, target, { itemFilters = false, interactionId = false } = {}) {
    
    const sourceUuid = Utilities.getUuid(source);
    if (!sourceUuid) throw Helpers.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid source`, true)
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid target`, true)
    
    if (itemFilters) {
      if (!Array.isArray(itemFilters)) throw Helpers.custom_error(`TransferEverything | itemFilters must be of type array`);
      itemFilters.forEach(entry => {
        if (typeof entry?.path !== "string") throw Helpers.custom_error(`TransferEverything | each entry in the itemFilters must have a "path" property that is of type string`);
        if (typeof entry?.filter !== "string") throw Helpers.custom_error(`TransferEverything | each entry in the itemFilters must have a "filter" property that is of type string`);
      })
    }
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`TransferEverything | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, game.user.id, {
      itemFilters,
      interactionId
    });
    
  }
  
  static getActorStuff(target) {
    const targetActor = Utilities.getActor(target);
    return PileUtilities.getActorItems(targetActor);
  }
  
  
}