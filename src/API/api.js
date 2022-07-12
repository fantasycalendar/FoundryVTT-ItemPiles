import * as Helpers from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import SETTINGS from "../constants/settings.js";
import ItemPileSocket from "../socket.js";
import HOOKS from "../constants/hooks.js";
import TradeAPI from "./trade-api.js";
import PrivateAPI from "./private-api.js";
import { isItemPileMerchant } from "../helpers/pile-utilities.js";

const API = {
  
  /**
   * The actor class type used for the original item pile actor in this system
   *
   * @returns {String}
   */
  get ACTOR_CLASS_TYPE() {
    return Helpers.getSetting(SETTINGS.ACTOR_CLASS_TYPE);
  },
  
  /**
   * The currencies used in this system
   *
   * @returns {Array<{primary: Boolean, name: String, data: Object, img: String, abbreviation: String, exchange: Number}>}
   */
  get CURRENCIES() {
    return Helpers.getSetting(SETTINGS.CURRENCIES);
  },
  
  /**
   * The attribute used to track the price of items in this system
   *
   * @returns {string}
   */
  get ITEM_PRICE_ATTRIBUTE() {
    return Helpers.getSetting(SETTINGS.ITEM_PRICE_ATTRIBUTE);
  },
  
  /**
   * The attribute used to track the quantity of items in this system
   *
   * @returns {String}
   */
  get ITEM_QUANTITY_ATTRIBUTE() {
    return Helpers.getSetting(SETTINGS.ITEM_QUANTITY_ATTRIBUTE);
  },
  
  /**
   * The filters for item types eligible for interaction within this system
   *
   * @returns {Array<{name: String, filters: String}>}
   */
  get ITEM_FILTERS() {
    return Helpers.getSetting(SETTINGS.ITEM_FILTERS);
  },
  
  /**
   * The attributes for detecting item similarities
   *
   * @returns {Array<String>}
   */
  get ITEM_SIMILARITIES() {
    return Helpers.getSetting(SETTINGS.ITEM_SIMILARITIES);
  },
  
  /**
   * Sets the actor class type used for the original item pile actor in this system
   *
   * @param {String} inClassType
   * @returns {Promise|Boolean}
   */
  setActorClassType(inClassType) {
    if (typeof inClassType !== "string") {
      throw Helpers.custom_error("setActorTypeClass | inClassType must be of type string");
    }
    return Helpers.setSetting(SETTINGS.ACTOR_CLASS_TYPE, inClassType);
  },
  
  /**
   * Sets the currencies used in this system
   *
   * @param {Array<Object>} inCurrencies
   * @returns {Promise}
   */
  setCurrencies(inCurrencies) {
    if (!Array.isArray(inCurrencies)) {
      throw Helpers.custom_error("setCurrencies | inCurrencies must be an array");
    }
    
    inCurrencies.forEach(currency => {
      if (typeof currency !== "object") {
        throw Helpers.custom_error("setCurrencies | each entry in inCurrencies must be of type object");
      }
      if (typeof currency.primary !== "boolean") {
        throw Helpers.custom_error("setCurrencies | currency.primary must be of type boolean");
      }
      if (typeof currency.name !== "string") {
        throw Helpers.custom_error("setCurrencies | currency.name must be of type string");
      }
      if (typeof currency.abbreviation !== "string") {
        throw Helpers.custom_error("setCurrencies | currency.abbreviation must be of type string");
      }
      if (typeof currency.exchange !== "number") {
        throw Helpers.custom_error("setCurrencies | currency.exchange must be of type number");
      }
      if (typeof currency.data !== "object") {
        throw Helpers.custom_error("setCurrencies | currency.data must be of type object");
      }
      if (currency.img && typeof currency.img !== "string") {
        throw Helpers.custom_error("setCurrencies | currency.img must be of type string");
      }
    });
    
    return Helpers.setSetting(SETTINGS.CURRENCIES, inCurrencies);
  },
  
  /**
   * Sets the attribute used to track the price of items in this system
   *
   * @param {string} inAttribute
   * @returns {Promise}
   */
  setItemPriceAttribute(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw Helpers.custom_error("setItemPriceAttribute | inAttribute must be of type string");
    }
    return Helpers.setSetting(SETTINGS.ITEM_PRICE_ATTRIBUTE, inAttribute);
  },
  
  /**
   * Sets the attribute used to track the quantity of items in this system
   *
   * @param {String} inAttribute
   * @returns {Promise}
   */
  setItemQuantityAttribute(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw Helpers.custom_error("setItemQuantityAttribute | inAttribute must be of type string");
    }
    return Helpers.setSetting(SETTINGS.ITEM_QUANTITY_ATTRIBUTE, inAttribute);
  },
  
  /**
   * Sets the items filters for interaction within this system
   *
   * @param {Array<{path: String, filters: String}>} inFilters
   * @returns {Promise}
   */
  setItemFilters(inFilters) {
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
  },
  
  /**
   * Sets the attributes for detecting item similarities
   *
   * @param {Array<String>} inPaths
   * @returns {Promise}
   */
  setItemSimilarities(inPaths) {
    if (!Array.isArray(inPaths)) {
      throw Helpers.custom_error("setItemSimilarities | inPaths must be of type array");
    }
    inPaths.forEach(path => {
      if (typeof path !== "string") {
        throw Helpers.custom_error("setItemSimilarities | each entry in inPaths must be of type string");
      }
    });
    return Helpers.setSetting(SETTINGS.ITEM_SIMILARITIES, inPaths);
  },
  
  getPrimaryCurrency(actor = false) {
    if (actor && actor instanceof Actor) {
      return PileUtilities.getActorPrimaryCurrency(actor);
    }
    return this.CURRENCIES.find(currency => currency.primary);
  },
  
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
  createItemPile(position, {
    sceneId = game.user.viewedScene, items = false, pileActorName = false
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
        return item instanceof Item ? item.toObject() : item;
      })
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.CREATE_PILE, sceneId, position, { pileActorName, items });
  },
  
  /**
   * Turns tokens and its actors into item piles
   *
   * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be turned into item piles
   * @param {Object} pileSettings                                     Overriding settings to be put on the item piles' settings
   * @param {Object} tokenSettings                                    Overriding settings that will update the tokens' settings
   *
   * @return {Promise<Array>}                                         The uuids of the targets after they were turned into item piles
   */
  turnTokensIntoItemPiles(targets, { pileSettings = {}, tokenSettings = {} } = {}) {
    
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
  },
  
  /**
   * Reverts tokens from an item pile into a normal token and actor
   *
   * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be reverted from item piles
   * @param {Object} tokenSettings                                    Overriding settings that will update the tokens
   *
   * @return {Promise<Array>}                                         The uuids of the targets after they were reverted from being item piles
   */
  revertTokensFromItemPiles(targets, { tokenSettings = {} } = {}) {
    
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
  },
  
  /**
   * Opens a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  openItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const data = PileUtilities.getActorFlagData(targetActor);
    if (!data?.enabled || !data?.isContainer) return false;
    const wasLocked = data.locked;
    const wasClosed = data.closed;
    data.closed = false;
    data.locked = false;
    if (wasLocked) {
      const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_UNLOCK, targetActor, data, interactingTokenDocument);
      if (hookResult === false) return false;
    }
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_OPEN, targetActor, data, interactingTokenDocument);
    if (hookResult === false) return false;
    if (wasClosed && data.openSound) {
      AudioHelper.play({ src: data.openSound })
    }
    return this.updateItemPile(targetActor, data, { interactingToken: interactingTokenDocument });
  },
  
  /**
   * Closes a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to close
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  closeItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    
    const wasOpen = !pileData.closed;
    pileData.closed = true;
    
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_CLOSE, targetActor, pileData, interactingTokenDocument);
    if (hookResult === false) return false;
    
    if (wasOpen && pileData.closeSound) {
      AudioHelper.play({ src: pileData.closeSound })
    }
    
    return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
  },
  
  /**
   * Toggles a pile's closed state if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to open or close
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  async toggleItemPileClosed(target, interactingToken = false) {
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
  },
  
  /**
   * Locks a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to lock
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  lockItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    const wasClosed = pileData.closed;
    pileData.closed = true;
    pileData.locked = true;
    if (!wasClosed) {
      const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_CLOSE, targetActor, pileData, interactingTokenDocument);
      if (hookResult === false) return false;
    }
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_LOCK, targetActor, pileData, interactingTokenDocument);
    if (hookResult === false) return false;
    if (!wasClosed && pileData.closeSound) {
      AudioHelper.play({ src: pileData.closeSound })
    }
    return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
  },
  
  /**
   * Unlocks a pile if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to unlock
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  unlockItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    pileData.locked = false;
    Helpers.hooks.call(HOOKS.PILE.PRE_UNLOCK, targetActor, pileData, interactingTokenDocument);
    return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
  },
  
  /**
   * Toggles a pile's locked state if it is enabled and a container
   *
   * @param {Token/TokenDocument} target          Target pile to lock or unlock
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise/Boolean}
   */
  toggleItemPileLocked(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    const pileData = PileUtilities.getActorFlagData(targetActor);
    if (!pileData?.enabled || !pileData?.isContainer) return false;
    if (pileData.locked) {
      return this.unlockItemPile(targetActor, interactingTokenDocument);
    }
    return this.lockItemPile(targetActor, interactingTokenDocument);
  },
  
  /**
   * Causes the item pile to play a sound as it was attempted to be opened, but was locked
   *
   * @param {Token/TokenDocument} target
   * @param {Token/TokenDocument/Boolean} [interactingToken=false]
   *
   * @return {Promise<boolean>}
   */
  rattleItemPile(target, interactingToken = false) {
    const targetActor = Utilities.getActor(target);
    const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
    
    const pileData = PileUtilities.getActorFlagData(targetActor);
    
    if (!pileData?.enabled || !pileData?.isContainer || !pileData?.locked) return false;
    
    Helpers.hooks.call(HOOKS.PILE.PRE_RATTLE, targetActor, pileData, interactingTokenDocument);
    
    if (pileData.lockedSound) {
      AudioHelper.play({ src: pileData.lockedSound })
    }
    
    return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.PILE.RATTLE, Utilities.getUuid(targetActor), pileData, Utilities.getUuid(interactingTokenDocument));
  },
  
  /**
   * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Boolean}
   */
  isItemPileLocked(target) {
    return PileUtilities.isItemPileLocked(target);
  },
  
  /**
   * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Boolean}
   */
  isItemPileClosed(target) {
    return PileUtilities.isItemPileClosed(target);
  },
  
  /**
   * Whether an item pile is a container. If it is not enabled, it is always false.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Boolean}
   */
  isItemPileContainer(target) {
    return PileUtilities.isItemPileContainer(target);
  },
  
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
  updateItemPile(target, newData, { interactingToken = false, tokenSettings = false } = {}) {
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`, true);
    
    const interactingTokenUuid = interactingToken ? Utilities.getUuid(interactingToken) : false;
    if (interactingToken && !interactingTokenUuid) throw Helpers.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`, true);
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.UPDATE_PILE, targetUuid, newData, {
      interactingTokenUuid, tokenSettings
    });
  },
  
  /**
   * Deletes a pile, calling the relevant hooks.
   *
   * @param {Token/TokenDocument} target
   *
   * @return {Promise/Boolean}
   */
  deleteItemPile(target) {
    if (!PileUtilities.isValidItemPile(target)) {
      throw Helpers.custom_error(`deleteItemPile | This is not an item pile, please provide a valid target`, true);
    }
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`deleteItemPile | Could not determine the UUID, please provide a valid target`, true);
    if (!targetUuid.includes("Token")) {
      throw Helpers.custom_error(`deleteItemPile | Please provide a Token or TokenDocument`, true);
    }
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DELETE_PILE, targetUuid);
  },
  
  /**
   * Splits an item pile's content between all players (or a specified set of target actors).
   *
   * @param target {Token/TokenDocument/Actor}                                                The item pile to split
   * @param targets {boolean/TokenDocument/Actor/Array<TokenDocument/Actor>} [targets=false]  The targets to receive the split contents
   * @param instigator {boolean/TokenDocument/Actor} [instigator=false]                       Whether this was triggered by a specific actor
   * @returns {Promise<object>/Boolean}
   */
  splitItemPileContents(target, { targets = false, instigator = false } = {}) {
    
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
      throw Helpers.custom_error("SplitItemPileContents | instigator must be of type TokenDocument or Actor")
    }
    
    const actorUuids = (targets || SharingUtilities.getPlayersForItemPile(itemPileActor).map(u => u.character)).map(actor => Utilities.getUuid(actor));
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.SPLIT_PILE, itemPileUuid, actorUuids, game.user.id, instigator);
    
  },
  
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
  addItems(target, items, { mergeSimilarItems = true, interactionId = false } = {}) {
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
  },
  
  /**
   * Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.
   *
   * @param {Actor/Token/TokenDocument} target        The target to remove a items from
   * @param {Array} items                             An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity"), or Items (the foundry class) or strings of IDs to remove all quantities of
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<array>}                        An array of objects, each containing the item that was removed or updated, the quantity that was removed, and whether the item was deleted
   */
  removeItems(target, items, { interactionId = false } = {}) {
    
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
        _id: item._id, quantity: itemData?.quantity ?? Utilities.getItemQuantity(item)
      }
    });
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`RemoveItems | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REMOVE_ITEMS, targetUuid, items, game.user.id, { interactionId });
  },
  
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
  transferItems(source, target, items, { interactionId = false } = {}) {
    
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
        _id: item._id, quantity: Math.max((itemData?.quantity ?? 0) ?? Utilities.getItemQuantity(itemData))
      }
    });
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`TransferItems | Could not determine the UUID, please provide a valid target`, true)
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`TransferItems | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ITEMS, sourceUuid, targetUuid, items, game.user.id, { interactionId });
    
  },
  
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
  transferAllItems(source, target, { itemFilters = false, interactionId = false } = {}) {
    
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
      itemFilters, interactionId
    });
  },
  
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
  addAttributes(target, attributes, { interactionId = false } = {}) {
    
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
    
  },
  
  /**
   * Subtracts attributes on the target
   *
   * @param {Token/TokenDocument} target              The target whose attributes will be subtracted from
   * @param {Array/object} attributes                 This can be either an array of attributes to subtract (to zero out a given attribute), or an object with each key being an attribute path, and its value being the quantity to subtract
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An array containing a key value pair of the attribute path and the quantity of that attribute that was removed
   */
  removeAttributes(target, attributes, { interactionId = false } = {}) {
    
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
    
  },
  
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
  transferAttributes(source, target, attributes, { interactionId = false } = {}) {
    
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
    
  },
  
  /**
   * Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target
   *
   * @param {Actor/Token/TokenDocument} source        The source to transfer the attributes from
   * @param {Actor/Token/TokenDocument} target        The target to transfer the attributes to
   * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
   *
   * @returns {Promise<object>}                       An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
   */
  transferAllAttributes(source, target, { interactionId = false } = {}) {
    
    const sourceUuid = Utilities.getUuid(source);
    if (!sourceUuid) throw Helpers.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid source`, true);
    
    const targetUuid = Utilities.getUuid(target);
    if (!targetUuid) throw Helpers.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid target`, true);
    
    if (interactionId) {
      if (typeof interactionId !== "string") throw Helpers.custom_error(`TransferAllAttributes | interactionId must be of type string`);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ALL_ATTRIBUTES, sourceUuid, targetUuid, game.user.id, { interactionId });
    
  },
  
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
  transferEverything(source, target, { itemFilters = false, interactionId = false } = {}) {
    
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
      itemFilters, interactionId
    });
    
  },
  
  updateTokenHud() {
    return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.RERENDER_TOKEN_HUD);
  },
  
  requestTrade(user) {
    return TradeAPI._requestTrade(user);
  },
  
  spectateTrade(tradeId) {
    return TradeAPI._spectateTrade(tradeId);
  },
  
  renderItemPileInterface(target, {
    userIds = null, inspectingTarget = null, useDefaultCharacter = null
  } = {}) {
    
    const targetDocument = Utilities.getDocument(target);
    const targetUuid = Utilities.getUuid(targetDocument);
    if (!targetUuid) throw Helpers.custom_error(`renderItemPileInterface | Could not determine the UUID, please provide a valid target item pile`);
    
    if (!PileUtilities.isValidItemPile(targetDocument)) {
      throw Helpers.custom_error("renderItemPileInterface | This target is not a valid item pile")
    }
    
    if (!inspectingTarget && !useDefaultCharacter) {
      useDefaultCharacter = true;
    }
    
    if (inspectingTarget && useDefaultCharacter) {
      throw Helpers.custom_error("renderItemPileInterface | You cannot force users to use both their default character and a specific character to inspect the pile")
    }
    
    const inspectingTargetUuid = inspectingTarget ? Utilities.getUuid(inspectingTarget) : false;
    if (inspectingTarget && !inspectingTargetUuid) throw Helpers.custom_error(`renderItemPileInterface | Could not determine the UUID, please provide a valid inspecting target`);
    
    if (!Array.isArray(userIds)) userIds = [game.user.id];
    
    if (!game.user.isGM) {
      if (userIds.length > 1 || !userIds.includes(game.user.id)) {
        throw Helpers.custom_error(`renderItemPileInterface | You are not a GM, so you cannot force others to render an item pile's interface`);
      }
      userIds = [game.user.id];
    }
    
    if (userIds.length === 1 && userIds[0] === game.user.id) {
      return PrivateAPI._renderItemPileInterface(targetUuid, {
        inspectingTargetUuid,
        useDefaultCharacter,
        remote: true
      })
    }
    
    for (const userId of userIds) {
      const user = game.users.get(userId);
      if (!user) throw Helpers.custom_error(`renderItemPileInterface | No user with ID "${userId}" exists`);
      if (useDefaultCharacter) {
        if (!user.character) {
          Helpers.custom_warning(`renderItemPileInterface | User "${user.name}" has no default character`, true);
          return;
        }
      }
    }
    
    return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.RENDER_INTERFACE, userIds, targetUuid, {
      inspectingTargetUuid,
      useDefaultCharacter,
      remote: true
    });
    
  },
  
  getPricesForItem(item, { merchant = false, buyer = false, quantity = 1 } = {}) {
    
    if (!(item instanceof Item)) {
      throw Helpers.custom_error("getPricesForItem | The given item must be of type Item");
    }
    
    if (merchant) {
      merchant = Utilities.getActor(merchant);
      if (!merchant) {
        throw Helpers.custom_error("getPricesForItem | Could not determine actor for the given merchant");
      }
      if (!PileUtilities.isItemPileMerchant(merchant)) {
        throw Helpers.custom_error("getPricesForItem | This target is not a valid item pile merchant");
      }
    } else {
      if (!item.parent) {
        throw Helpers.custom_error("getPricesForItem | If no merchant was given, the item must belong to an actor");
      }
      merchant = Utilities.getActor(item.parent);
    }
    
    if (buyer) {
      buyer = Utilities.getActor(buyer);
      if (!buyer) {
        throw Helpers.custom_error("getPricesForItem | Could not determine actor for the given buyer");
      }
    }
    
    return PileUtilities.getItemPrices(item, { owner: merchant, buyer, quantity });
    
  },
  
  /**
   * Buys a single item from a merchant
   *
   * @param {Item} item                               The item to be traded
   * @param {Actor/Token/TokenDocument} merchant      The merchant actor to buy them item from
   * @param {Actor/Token/TokenDocument} buyer         The actor that is buying the item from the merchant
   * @param {Number} [paymentIndex=0]                 The index of the payment information
   * @param {Number} [quantity=1]                     The quantity of this item to buy
   * @param {String/Boolean} [interactionId=false]    The ID of this interaction
   *
   * @returns {Promise<Object>}                       The items that were created and the attributes that were changed
   */
  buyItem(item, merchant, buyer, { paymentIndex = 0, quantity = 1, interactionId = false } = {}) {
    
    const merchantActor = Utilities.getActor(merchant);
    const merchantUuid = Utilities.getUuid(merchantActor);
    if (!merchantUuid) {
      throw Helpers.custom_error(`buyItemFromMerchant | Could not determine the UUID of the merchant, please provide a valid actor or token`);
    }
    if (!PileUtilities.isItemPileMerchant(merchantActor)) {
      throw Helpers.custom_error("buyItemFromMerchant | The given merchant is not a valid item pile merchant");
    }
    
    const buyerActor = Utilities.getActor(buyer);
    const buyerUuid = Utilities.getUuid(buyer);
    if (!buyerUuid) {
      throw Helpers.custom_error(`buyItemFromMerchant | Could not determine the UUID of the buyer, please provide a valid actor or token`, true);
    }
    
    let actorItem;
    if (typeof item === "string") {
      actorItem = merchantActor.items.get(item) || merchantActor.items.getName(item);
      if (!actorItem) {
        throw Helpers.custom_error(`buyItemFromMerchant | Could not find item on merchant with identifier "${item}"`);
      }
    } else {
      actorItem = merchantActor.items.get(item instanceof Item ? item.id : item._id);
      if (!actorItem) {
        throw Helpers.custom_error(`buyItemFromMerchant | Could not find provided item on merchant`);
      }
    }
    
    const itemQuantity = Utilities.getItemQuantity(actorItem);
    
    const merchantFlagData = PileUtilities.getActorFlagData(merchantActor);
    if (!merchantFlagData.infiniteQuantity && quantity > itemQuantity) {
      throw Helpers.custom_error(`buyItemFromMerchant | Merchant does not have enough of the given item to sell`);
    }
    
    const itemPrices = PileUtilities.getItemPrices(actorItem, { owner: merchantActor, buyer: buyerActor, quantity });
    if (paymentIndex > itemPrices.length - 1) {
      throw Helpers.custom_error(`buyItemFromMerchant | That payment index does not exist`, true);
    }
    
    const selectedItemPrice = itemPrices[paymentIndex];
    
    if (quantity > selectedItemPrice.maxPurchase) {
      throw Helpers.custom_error(`buyItemFromMerchant | The buyer actor cannot afford ${quantity} of this item (max ${selectedItemPrice.maxPurchase})`, true);
    }
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.BUY_ITEM, item.id, merchantUuid, buyerUuid, paymentIndex, quantity, game.user.id, { interactionId });
    
  }
  
}

export default API;