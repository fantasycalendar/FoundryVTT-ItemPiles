import * as Helpers from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import HOOKS from "../constants/hooks.js";
import ItemPileSocket from "../socket.js";
import SETTINGS from "../constants/settings.js";
import CONSTANTS from "../constants/constants.js";
import { hotkeyState } from "../hotkeys.js";
import DropItemDialog from "../applications/dialogs/drop-item-dialog/drop-item-dialog.js";
import { ItemPileInventoryApp } from "../applications/item-pile-inventory-app/item-pile-inventory-app.js";
import Transaction from "../helpers/transaction.js";
import ItemPileStore from "../stores/item-pile-store.js";
import MerchantApp from "../applications/merchant-app/merchant-app.js";

const preloadedFiles = new Set();

export default class PrivateAPI {
  
  /**
   * Initializes the API for Foundry's core hooks
   */
  static initialize() {
    Helpers.hooks.on("canvasReady", this._onCanvasReady.bind(this));
    Helpers.hooks.on("createItem", this._onCreateItem.bind(this));
    Helpers.hooks.on("updateItem", this._onUpdateItem.bind(this));
    Helpers.hooks.on("deleteItem", this._onDeleteItem.bind(this));
    Helpers.hooks.on("updateActor", this._onUpdateActor.bind(this));
    Helpers.hooks.on("deleteToken", this._onDeleteToken.bind(this));
    Helpers.hooks.on("deleteActor", this._onDeleteActor.bind(this));
    Helpers.hooks.on("preCreateToken", this._onPreCreateToken.bind(this))
    Helpers.hooks.on("createToken", this._onCreateToken.bind(this))
    Helpers.hooks.on("dropCanvasData", this._dropData.bind(this));
  }
  
  /**
   * @private
   */
  static async _onCanvasReady(canvas) {
    const tokens = [...canvas.tokens.placeables].map(token => token.document);
    for (const doc of tokens) {
      await this._preloadItemPileFiles(doc);
    }
  }
  
  /**
   * @private
   */
  static _onCreateItem(doc) {
    if (!doc.parent) return;
    if (!PileUtilities.isValidItemPile(doc.parent)) return;
    ItemPileStore.notifyChanges("createItem", doc.parent, doc);
    this._evaluateItemPileChange(doc.parent);
  }
  
  /**
   * @private
   */
  static _onUpdateItem(doc) {
    if (!doc.parent) return;
    if (!PileUtilities.isValidItemPile(doc.parent)) return;
    this._evaluateItemPileChange(doc.parent);
  }
  
  /**
   * @private
   */
  static _onDeleteItem(doc) {
    if (!doc.parent) return;
    if (!PileUtilities.isValidItemPile(doc.parent)) return;
    ItemPileStore.notifyChanges("deleteItem", doc.parent, doc);
    this._evaluateItemPileChange(doc.parent);
  }
  
  /**
   * @private
   */
  static _onUpdateActor(doc, changes) {
    if (!PileUtilities.isValidItemPile(doc)) return;
    this._evaluateItemPileChange(doc, changes);
  }
  
  /**
   * @private
   */
  static _onDeleteToken(doc) {
    if (!PileUtilities.isValidItemPile(doc)) return;
    Helpers.hooks.callAll(HOOKS.PILE.DELETE, doc);
    ItemPileStore.notifyChanges("delete", doc.actor)
  }
  
  /**
   * @private
   */
  static _onDeleteActor(doc) {
    ItemPileStore.notifyChanges("delete", doc)
  }
  
  /**
   * @private
   */
  static _onPreCreateToken(doc) {
    if (!doc.isLinked) {
      doc.data.update({
        [`actorData.flags.${CONSTANTS.MODULE_NAME}.-=sharing`]: null
      });
    }
    const itemPileConfig = PileUtilities.getActorFlagData(doc.actor)
    const targetItems = PileUtilities.getActorItems(doc.actor);
    const targetCurrencies = PileUtilities.getActorCurrencies(doc.actor);
    const data = { data: itemPileConfig, items: targetItems, currencies: targetCurrencies };
    doc.data.update({
      "img": PileUtilities.getItemPileTokenImage(doc, data),
      "scale": PileUtilities.getItemPileTokenScale(doc, data),
      "name": PileUtilities.getItemPileName(doc, data),
      [CONSTANTS.FLAGS.PILE]: itemPileConfig
    });
  }
  
  /**
   * @private
   */
  static _onCreateToken(doc) {
    if (!PileUtilities.isValidItemPile(doc)) return;
    const itemPileConfig = PileUtilities.getActorFlagData(doc.actor)
    Helpers.hooks.callAll(HOOKS.PILE.CREATE, doc, itemPileConfig);
    return this._preloadItemPileFiles(doc);
  }
  
  static async _addItems(targetUuid, items, userId, { interactionId = false } = {}) {
    
    const targetActor = Utilities.getActor(targetUuid);
    
    const transaction = new Transaction(targetActor);
    
    transaction.appendItemChanges(items);
    
    const { itemsToUpdate, itemsToCreate } = transaction.prepare(); // Prepare data
    
    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_ADD, targetActor, itemsToCreate, itemsToUpdate, userId);
    if (hookResult === false) return false; // Call pre-hook to allow user to interrupt it
    
    const { itemDeltas } = await transaction.commit(); // Actually add the items to the actor
    
    await ItemPileSocket.callHook(HOOKS.ITEM.ADD, targetUuid, itemDeltas, userId, interactionId);
    
    await this._executeItemPileMacro(targetUuid, {
      action: "addItems", target: targetUuid, items: itemDeltas, userId: userId, interactionId: interactionId
    });
    
    return itemDeltas;
    
  }
  
  static async _removeItems(targetUuid, items, userId, { interactionId = false } = {}) {
    
    const targetActor = Utilities.getActor(targetUuid);
    
    const transaction = new Transaction(targetActor);
    
    transaction.appendItemChanges(items, { remove: true });
    
    const { itemsToUpdate, itemsToDelete } = transaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_REMOVE, targetActor, itemsToUpdate, itemsToDelete, userId);
    if (hookResult === false) return false;
    
    const { itemDeltas } = await transaction.commit();
    
    await ItemPileSocket.callHook(HOOKS.ITEM.REMOVE, targetUuid, itemDeltas, userId, interactionId);
    
    await this._executeItemPileMacro(targetUuid, {
      action: "removeItems", target: targetUuid, items: itemDeltas, userId: userId, interactionId: interactionId
    });
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(targetUuid);
    if (shouldBeDeleted) {
      await this._deleteItemPile(targetUuid);
    }
    
    return itemDeltas;
    
  }
  
  static async _transferItems(sourceUuid, targetUuid, items, userId, { interactionId = false } = {}) {
    
    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);
    
    const sourceTransaction = new Transaction(sourceActor);
    sourceTransaction.appendItemChanges(items, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();
    
    const targetTransaction = new Transaction(targetActor);
    targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
    const targetUpdates = targetTransaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_TRANSFER, sourceActor, sourceUpdates, targetActor, targetUpdates, userId);
    if (hookResult === false) return false;
    
    await sourceTransaction.commit();
    const { itemDeltas } = await targetTransaction.commit();
    
    await ItemPileSocket.callHook(HOOKS.ITEM.TRANSFER, sourceUuid, targetUuid, itemDeltas, userId, interactionId);
    
    const macroData = {
      action: "transferItems",
      source: sourceUuid,
      target: targetUuid,
      items: itemDeltas,
      userId: userId,
      interactionId: interactionId
    };
    
    await this._executeItemPileMacro(sourceUuid, macroData);
    await this._executeItemPileMacro(targetUuid, macroData);
    
    const itemPile = Utilities.getToken(sourceUuid);
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(sourceUuid);
    if (shouldBeDeleted) {
      await this._deleteItemPile(sourceUuid);
    } else if (PileUtilities.isItemPileEmpty(itemPile)) {
      await SharingUtilities.clearItemPileSharingData(itemPile);
    } else {
      await SharingUtilities.setItemPileSharingData(sourceUuid, targetUuid, {
        items: itemDeltas
      });
    }
    
    return itemDeltas;
    
  }
  
  static async _transferAllItems(sourceUuid, targetUuid, userId, { itemFilters = false, interactionId = false } = {}) {
    
    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);
    
    const itemsToTransfer = PileUtilities.getActorItems(sourceActor, { itemFilters }).map(item => item.toObject());
    
    const sourceTransaction = new Transaction(sourceActor);
    sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();
    
    const targetTransaction = new Transaction(targetActor);
    targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
    const targetUpdates = targetTransaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_TRANSFER_ALL, sourceActor, sourceUpdates, targetActor, targetUpdates, userId);
    if (hookResult === false) return false;
    
    await sourceTransaction.commit();
    const { itemDeltas } = await targetTransaction.commit();
    
    await ItemPileSocket.callHook(HOOKS.ITEM.TRANSFER_ALL, sourceUuid, targetUuid, itemDeltas, userId, interactionId);
    
    const macroData = {
      action: "transferAllItems",
      source: sourceUuid,
      target: targetUuid,
      items: itemDeltas,
      userId: userId,
      interactionId: interactionId
    };
    await this._executeItemPileMacro(sourceUuid, macroData);
    await this._executeItemPileMacro(targetUuid, macroData);
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(sourceUuid);
    if (shouldBeDeleted) {
      await this._deleteItemPile(sourceUuid);
    }
    
    return itemDeltas;
  }
  
  static async _addAttributes(targetUuid, attributes, userId, { interactionId = false } = {}) {
    
    const targetActor = Utilities.getActor(targetUuid);
    
    const transaction = new Transaction(targetActor);
    transaction.appendActorChanges(attributes);
    const { actorUpdates } = transaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.ATTRIBUTE.PRE_ADD, targetActor, actorUpdates, interactionId);
    if (hookResult === false) return false;
    
    const { attributeDeltas } = await transaction.commit();
    
    await ItemPileSocket.callHook(HOOKS.ATTRIBUTE.ADD, targetUuid, attributeDeltas, userId, interactionId);
    
    await this._executeItemPileMacro(targetUuid, {
      action: "addAttributes",
      target: targetUuid,
      attributes: attributeDeltas,
      userId: userId,
      interactionId: interactionId
    });
    
    return attributeDeltas;
    
  }
  
  static async _removeAttributes(targetUuid, attributes, userId, { interactionId = false } = {}) {
    
    const targetActor = Utilities.getActor(targetUuid);
    
    const transaction = new Transaction(targetActor);
    transaction.appendActorChanges(attributes, { remove: true });
    const { actorUpdates } = transaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.ATTRIBUTE.PRE_REMOVE, targetActor, actorUpdates, interactionId);
    if (hookResult === false) return false;
    
    const { attributeDeltas } = await transaction.commit();
    
    await ItemPileSocket.callHook(HOOKS.ATTRIBUTE.REMOVE, targetUuid, attributeDeltas, userId, interactionId);
    
    await this._executeItemPileMacro(targetUuid, {
      action: "removeAttributes",
      target: targetUuid,
      attributes: attributeDeltas,
      userId: userId,
      interactionId: interactionId
    });
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(targetUuid);
    if (shouldBeDeleted) {
      await this._deleteItemPile(targetUuid);
    }
    
    return attributeDeltas;
    
  }
  
  static async _transferAttributes(sourceUuid, targetUuid, attributes, userId, { interactionId = false } = {}) {
    
    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);
    
    const sourceTransaction = new Transaction(sourceActor);
    sourceTransaction.appendActorChanges(attributes, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();
    
    const targetTransaction = new Transaction(targetActor);
    targetTransaction.appendActorChanges(sourceUpdates.attributeDeltas);
    const targetUpdates = targetTransaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER, sourceActor, sourceUpdates.actorUpdates, targetActor, targetUpdates.actorUpdates, interactionId);
    if (hookResult === false) return false;
    
    await sourceTransaction.commit();
    const { attributeDeltas } = await targetTransaction.commit();
    
    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.TRANSFER, sourceUuid, targetUuid, attributeDeltas, userId, interactionId);
    
    const macroData = {
      action: "transferAttributes",
      source: sourceUuid,
      target: targetUuid,
      attributes: attributeDeltas,
      userId: userId,
      interactionId: interactionId
    };
    await this._executeItemPileMacro(sourceUuid, macroData);
    await this._executeItemPileMacro(targetUuid, macroData);
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(sourceUuid);
    
    const itemPile = await fromUuid(sourceUuid)
    
    if (shouldBeDeleted) {
      await this._deleteItemPile(sourceUuid);
    } else if (PileUtilities.isItemPileEmpty(itemPile)) {
      await SharingUtilities.clearItemPileSharingData(itemPile);
    } else {
      await SharingUtilities.setItemPileSharingData(sourceUuid, targetUuid, {
        attributes: attributeDeltas
      });
    }
    
    return attributeDeltas;
    
  }
  
  static async _transferAllAttributes(sourceUuid, targetUuid, userId, { interactionId = false } = {}) {
    
    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);
    
    const sourceAttributes = PileUtilities.getActorCurrencies(sourceActor).filter(entry => entry.type === "attribute");
    const attributesToTransfer = sourceAttributes.filter(attribute => {
      return hasProperty(targetActor.data, attribute.data.path);
    }).map(attribute => attribute.data.path);
    
    const sourceTransaction = new Transaction(sourceActor);
    sourceTransaction.appendActorChanges(attributesToTransfer, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();
    
    const targetTransaction = new Transaction(targetActor);
    targetTransaction.appendActorChanges(sourceUpdates.attributeDeltas);
    const targetUpdates = targetTransaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER_ALL, sourceActor, sourceUpdates.actorUpdates, targetActor, targetUpdates.actorUpdates, interactionId);
    if (hookResult === false) return false;
    
    await sourceTransaction.commit();
    const { attributeDeltas } = await targetTransaction.commit();
    
    await ItemPileSocket.callHook(HOOKS.ATTRIBUTE.TRANSFER_ALL, sourceUuid, targetUuid, attributeDeltas, userId, interactionId);
    
    const macroData = {
      action: "transferAllAttributes",
      source: sourceUuid,
      target: targetUuid,
      attributes: attributeDeltas,
      userId: userId,
      interactionId: interactionId
    };
    await this._executeItemPileMacro(sourceUuid, macroData);
    await this._executeItemPileMacro(targetUuid, macroData);
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(sourceUuid);
    
    if (shouldBeDeleted) {
      await this._deleteItemPile(sourceUuid);
    }
    
    return attributeDeltas;
    
  }
  
  static async _transferEverything(sourceUuid, targetUuid, userId, { itemFilters = false, interactionId } = {}) {
    
    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);
    
    const itemsToTransfer = PileUtilities.getActorItems(sourceActor, { itemFilters }).map(item => item.toObject());
    
    const sourceAttributes = PileUtilities.getActorCurrencies(sourceActor).filter(entry => entry.type === "attribute");
    const attributesToTransfer = sourceAttributes.filter(attribute => {
      return hasProperty(targetActor.data, attribute.data.path);
    }).map(attribute => attribute.data.path);
    
    const sourceTransaction = new Transaction(sourceActor);
    sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true });
    sourceTransaction.appendActorChanges(attributesToTransfer, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();
    
    const targetTransaction = new Transaction(targetActor);
    targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
    targetTransaction.appendActorChanges(sourceUpdates.attributeDeltas);
    const targetUpdates = targetTransaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.PRE_TRANSFER_EVERYTHING, sourceActor, sourceUpdates, targetActor, targetUpdates, userId);
    if (hookResult === false) return false;
    
    await sourceTransaction.commit();
    const { itemDeltas, attributeDeltas } = await targetTransaction.commit();
    
    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, itemDeltas, attributeDeltas, userId, interactionId);
    
    const macroData = {
      action: "transferEverything",
      source: sourceUuid,
      target: targetUuid,
      items: itemDeltas,
      attributes: attributeDeltas,
      userId: userId,
      interactionId: interactionId
    };
    await this._executeItemPileMacro(sourceUuid, macroData);
    await this._executeItemPileMacro(targetUuid, macroData);
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(sourceUuid);
    if (shouldBeDeleted) {
      await this._deleteItemPile(sourceUuid);
    }
    
    return {
      itemsTransferred: itemDeltas, attributesTransferred: attributeDeltas
    };
    
  }
  
  static async _commitActorChanges(actorUuid, actorUpdates, itemsToUpdate, itemsToDelete, itemsToCreate) {
    const actor = Utilities.getActor(actorUuid);
    await actor.update(actorUpdates);
    await actor.updateEmbeddedDocuments("Item", itemsToUpdate);
    await actor.deleteEmbeddedDocuments("Item", itemsToDelete);
    const createdItems = await actor.createEmbeddedDocuments("Item", itemsToCreate);
    return createdItems.map(item => item.toObject());
  }
  
  /**
   * If not given an actor, this method creates an item pile at a location, then adds an item to it.
   *
   * If a target was provided, it will just add the item to that target actor.
   *
   * If an actor was provided, it will transfer the item from the actor to the target actor.
   *
   * @param {String} userId
   * @param {String} sceneId
   * @param {String/Boolean} [sourceUuid=false]
   * @param {String/Boolean} [targetUuid=false]
   * @param {Object/Boolean} [position=false]
   * @param {Object} [itemData=false]
   *
   * @returns {sourceUuid: string/boolean, targetUuid: string/boolean, position: object/boolean, itemsDropped: array }
   */
  static async _dropItems({
                            userId, sceneId, sourceUuid = false, targetUuid = false, itemData = false, position = false
                          } = {}) {
    
    let itemsDropped;
    
    // If there's a source of the item (it wasn't dropped from the item bar)
    if (sourceUuid) {
      
      const itemsToTransfer = [{ _id: itemData.item._id, quantity: itemData.quantity }];
      
      // If there's a target token, add the item to it, otherwise create a new pile at the drop location
      if (targetUuid) {
        itemsDropped = await this._transferItems(sourceUuid, targetUuid, itemsToTransfer, userId);
      } else {
        itemsDropped = await this._removeItems(sourceUuid, itemsToTransfer, userId);
        targetUuid = await this._createItemPile(sceneId, position, { items: itemsDropped });
      }
      
      // If there's no source (it was dropped from the item bar)
    } else {
      
      // If there's a target token, add the item to it, otherwise create a new pile at the drop location
      if (targetUuid) {
        itemsDropped = await this._addItems(targetUuid, [itemData], userId);
      } else {
        targetUuid = await this._createItemPile(sceneId, position, { items: [itemData] });
      }
      
    }
    
    await ItemPileSocket.callHook(HOOKS.ITEM.DROP, sourceUuid, targetUuid, itemsDropped, position);
    
    return { sourceUuid, targetUuid, position, itemsDropped };
    
  }
  
  
  static async _createItemPile(sceneId, position, { pileActorName = false, items = false } = {}) {
    
    let pileActor;
    
    if (!pileActorName) {
      
      pileActor = Helpers.getSetting(SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID);
      
      if (!pileActor) {
        
        Helpers.custom_notify("A Default Item Pile has been added to your Actors list. You can configure the default look and behavior on it, or duplicate it to create different styles.")
        
        const pileDataDefaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);
        
        pileDataDefaults.enabled = true;
        pileDataDefaults.deleteWhenEmpty = "true";
        pileDataDefaults.displayOne = true;
        pileDataDefaults.showItemName = true;
        pileDataDefaults.overrideSingleItemScale = true;
        pileDataDefaults.singleItemScale = 0.75;
        
        pileActor = await Actor.create({
          name: "Default Item Pile",
          type: Helpers.getSetting("actorClassType"),
          img: "icons/svg/item-bag.svg",
          [CONSTANTS.FLAGS.PILE]: pileDataDefaults
        });
        
        await pileActor.update({
          "token": {
            name: "Item Pile",
            actorLink: false,
            bar1: { attribute: "" },
            vision: false,
            displayName: 50,
            [CONSTANTS.FLAGS.PILE]: pileDataDefaults
          }
        })
        
        await game.settings.set(CONSTANTS.MODULE_NAME, "defaultItemPileActorID", pileActor.id);
        
      }
      
    } else {
      
      pileActor = game.actors.getName(pileActorName);
      
    }
    
    let overrideData = { ...position };
    
    const pileData = PileUtilities.getActorFlagData(pileActor);
    
    if (!pileActor.data.token.actorLink) {
      
      items = items ? items.map(itemData => itemData.item ?? itemData) : [];
      
      overrideData['actorData'] = {
        items: items
      }
      
      const data = { data: pileData, items: items };
      
      overrideData = foundry.utils.mergeObject(overrideData, {
        "img": PileUtilities.getItemPileTokenImage(pileActor, data),
        "scale": PileUtilities.getItemPileTokenScale(pileActor, data),
        "name": PileUtilities.getItemPileName(pileActor, data),
      });
      
    }
    
    const tokenData = await pileActor.getTokenData(overrideData);
    
    const scene = game.scenes.get(sceneId);
    
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_CREATE, tokenData);
    if (hookResult === false) return false;
    
    const [tokenDocument] = await scene.createEmbeddedDocuments("Token", [tokenData]);
    
    return Utilities.getUuid(tokenDocument);
    
  }
  
  static async _turnTokensIntoItemPiles(targetUuids, pileSettings = {}, tokenSettings = {}) {
    
    const tokenUpdateGroups = {};
    const actorUpdateGroups = {};
    
    for (const targetUuid of targetUuids) {
      
      let target = Utilities.fromUuidFast(targetUuid);
      
      pileSettings = foundry.utils.mergeObject(PileUtilities.getActorFlagData(target), pileSettings);
      pileSettings.enabled = true;
      
      const targetItems = PileUtilities.getActorItems(target, { itemFilters: pileSettings.overrideItemFilters });
      const targetCurrencies = PileUtilities.getActorCurrencies(target, { currencyList: pileSettings.overrideCurrencies });
      
      const data = { data: pileSettings, items: targetItems, currencies: targetCurrencies };
      
      tokenSettings = foundry.utils.mergeObject(tokenSettings, {
        "img": PileUtilities.getItemPileTokenImage(target, data),
        "scale": PileUtilities.getItemPileTokenScale(target, data),
        "name": PileUtilities.getItemPileName(target, data)
      });
      
      const sceneId = targetUuid.split('.')[1];
      const tokenId = targetUuid.split('.')[3];
      
      if (!tokenUpdateGroups[sceneId]) {
        tokenUpdateGroups[sceneId] = []
      }
      
      tokenUpdateGroups[sceneId].push({
        "_id": tokenId, ...tokenSettings,
        [CONSTANTS.FLAGS.PILE]: pileSettings,
        [`actorData.${CONSTANTS.FLAGS.PILE}`]: pileSettings
      });
      
      if (target.isLinked) {
        if (actorUpdateGroups[target.actor.id]) continue;
        actorUpdateGroups[target.actor.id] = {
          "_id": target.actor.id, [CONSTANTS.FLAGS.PILE]: pileSettings
        }
      }
    }
    
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_TURN_INTO, tokenUpdateGroups, actorUpdateGroups);
    if (hookResult === false) return false;
    
    await Actor.updateDocuments(Object.values(actorUpdateGroups));
    
    for (const [sceneId, updateData] of Object.entries(tokenUpdateGroups)) {
      const scene = game.scenes.get(sceneId);
      await scene.updateEmbeddedDocuments("Token", updateData);
    }
    
    await ItemPileSocket.callHook(HOOKS.PILE.TURN_INTO, tokenUpdateGroups, actorUpdateGroups);
    
    return targetUuids;
    
  }
  
  static async _revertTokensFromItemPiles(targetUuids, tokenSettings) {
    
    const actorUpdateGroups = {};
    const tokenUpdateGroups = {};
    
    for (const targetUuid of targetUuids) {
      
      let target = Utilities.fromUuidFast(targetUuid);
      
      const pileSettings = PileUtilities.getActorFlagData(target);
      pileSettings.enabled = false;
      
      const sceneId = targetUuid.split('.')[1];
      const tokenId = targetUuid.split('.')[3];
      
      if (!tokenUpdateGroups[sceneId]) {
        tokenUpdateGroups[sceneId] = [];
      }
      
      tokenUpdateGroups[sceneId].push({
        "_id": tokenId, ...tokenSettings,
        [CONSTANTS.FLAGS.PILE]: pileSettings,
        [`actorData.${CONSTANTS.FLAGS.PILE}`]: pileSettings
      });
      
      if (target.isLinked) {
        if (actorUpdateGroups[target.actor.id]) continue;
        actorUpdateGroups[target.actor.id] = {
          "_id": target.actor.id, [CONSTANTS.FLAGS.PILE]: pileSettings
        }
      }
    }
    
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_REVERT_FROM, tokenUpdateGroups, actorUpdateGroups);
    if (hookResult === false) return false;
    
    await Actor.updateDocuments(Object.values(actorUpdateGroups));
    
    for (const [sceneId, updateData] of Object.entries(tokenUpdateGroups)) {
      const scene = game.scenes.get(sceneId);
      await scene.updateEmbeddedDocuments("Token", updateData);
    }
    
    await ItemPileSocket.callHook(HOOKS.PILE.REVERT_FROM, tokenUpdateGroups, actorUpdateGroups);
    
    return targetUuids;
    
  }
  
  static async _updateItemPile(targetUuid, newData, { interactingTokenUuid = false, tokenSettings = false } = {}) {
    
    const targetActor = Utilities.getActor(targetUuid);
    const interactingToken = interactingTokenUuid ? Utilities.getToken(interactingTokenUuid) : false;
    
    const oldData = PileUtilities.getActorFlagData(targetActor);
    
    const data = foundry.utils.mergeObject(foundry.utils.duplicate(oldData), foundry.utils.duplicate(newData));
    
    const diff = foundry.utils.diffObject(oldData, data);
    
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_UPDATE, targetActor, data, interactingToken, tokenSettings);
    if (hookResult === false) return false;
    
    await Helpers.wait(15);
    
    await PileUtilities.updateItemPileData(targetActor, data, tokenSettings);
    
    if (data.enabled && data.isContainer) {
      if (diff?.closed === true) {
        await this._executeItemPileMacro(targetUuid, {
          action: "closeItemPile", source: interactingTokenUuid, target: targetUuid
        });
      }
      if (diff?.locked === true) {
        await this._executeItemPileMacro(targetUuid, {
          action: "lockItemPile", source: interactingTokenUuid, target: targetUuid
        });
      }
      if (diff?.locked === false) {
        await this._executeItemPileMacro(targetUuid, {
          action: "unlockItemPile", source: interactingTokenUuid, target: targetUuid
        });
      }
      if (diff?.closed === false) {
        await this._executeItemPileMacro(targetUuid, {
          action: "openItemPile", source: interactingTokenUuid, target: targetUuid
        });
      }
    }
    
    return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.UPDATED_PILE, targetUuid, diff, interactingTokenUuid);
  }
  
  static _updatedItemPile(targetUuid, diffData, interactingTokenUuid) {
    
    const target = Utilities.getToken(targetUuid);
    
    const interactingToken = interactingTokenUuid ? Utilities.fromUuidFast(interactingTokenUuid) : false;
    
    if (foundry.utils.isObjectEmpty(diffData)) return false;
    
    const data = PileUtilities.getActorFlagData(target);
    
    Helpers.hooks.callAll(HOOKS.PILE.UPDATE, target, diffData, interactingToken)
    
    if (data.enabled && data.isContainer) {
      if (diffData?.closed === true) {
        Helpers.hooks.callAll(HOOKS.PILE.CLOSE, target, interactingToken)
      }
      if (diffData?.locked === true) {
        Helpers.hooks.callAll(HOOKS.PILE.LOCK, target, interactingToken)
      }
      if (diffData?.locked === false) {
        Helpers.hooks.callAll(HOOKS.PILE.UNLOCK, target, interactingToken)
      }
      if (diffData?.closed === false) {
        Helpers.hooks.callAll(HOOKS.PILE.OPEN, target, interactingToken)
      }
    }
  }
  
  static async _deleteItemPile(targetUuid) {
    const target = Utilities.getToken(targetUuid);
    if (!target) return false;
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_DELETE, target);
    if (hookResult === false) return false;
    return target.delete();
  }
  
  /* -------- PRIVATE ITEM PILE METHODS -------- */
  
  /**
   * Checks whether a given item pile would need to update its images, text, and/or scale
   *
   * @param {foundry.abstract.Document} doc
   * @param [changes]
   * @returns {*}
   * @private
   */
  static _evaluateItemPileChange(doc, changes) {
    const target = doc?.token ?? doc;
    if (!Helpers.isResponsibleGM()) return;
    if (!PileUtilities.isValidItemPile(target)) return;
    const targetUuid = target.uuid;
    return Helpers.debounceManager.setDebounce(targetUuid, async (uuid) => {
      const deleted = PileUtilities.shouldItemPileBeDeleted(uuid);
      if (deleted) return;
      await Helpers.hooks.runWithout(async () => {
        await PileUtilities.updateItemPileData(uuid);
      });
    })(targetUuid);
    
  }
  
  /**
   * Pre-loads all images and sounds related to a given token document on the client-side.
   *
   * @param {TokenDocument} tokenDocument
   * @return {Promise<boolean>}
   */
  static async _preloadItemPileFiles(tokenDocument) {
    
    if (!PileUtilities.isValidItemPile(tokenDocument)) return false;
    
    const pileData = PileUtilities.getActorFlagData(tokenDocument);
    
    if (Helpers.getSetting("preloadFiles")) {
      await Promise.allSettled(Object.entries(pileData).map(entry => {
        return new Promise(async (resolve) => {
          const [property, filePath] = entry;
          const isImage = property.toLowerCase().includes("image");
          const isSound = property.toLowerCase().includes("sound");
          if ((!isImage && !isSound) || (!filePath || preloadedFiles.has(filePath))) return resolve();
          preloadedFiles.add(filePath);
          
          if (isImage) {
            await loadTexture(filePath);
            Helpers.debug(`Preloaded image: ${filePath}`);
          } else if (isSound) {
            Helpers.debug(`Preloaded sound: ${filePath}`);
            await AudioHelper.preloadSound(filePath);
          }
          resolve();
        });
      }));
    }
    
    Helpers.debug(`Initialized item pile with uuid ${tokenDocument.uuid}`);
  }
  
  /**
   * This executes any macro that is configured on the item pile, providing the macro with extra data relating to the
   * action that prompted the execution (if the advanced-macros module is installed)
   *
   * @param {String} targetUuid
   * @param {Object} macroData
   * @return {Promise/Boolean}
   */
  static _executeItemPileMacro(targetUuid, macroData) {
    
    const target = Utilities.getToken(targetUuid);
    
    if (!PileUtilities.isValidItemPile(target)) return false;
    
    const pileData = PileUtilities.getActorFlagData(target);
    
    if (!pileData.macro) return false;
    
    const macro = game.macros.getName(pileData.macro);
    
    if (!macro) {
      throw Helpers.custom_error(`Could not find macro with name "${pileData.macro}" on target with UUID ${target.uuid}`);
    }
    
    // Reformat macro data to contain useful information
    if (macroData.source) {
      macroData.source = Utilities.fromUuidFast(macroData.source);
    }
    
    if (macroData.target) {
      macroData.target = Utilities.fromUuidFast(macroData.target);
    }
    
    const targetActor = macroData.target instanceof TokenDocument ? macroData.target.actor : macroData.target;
    
    if (macroData.item) {
      macroData.items = macroData.items.map(item => targetActor.items.get(item._id));
    }
    
    return macro.execute([macroData]);
    
  }
  
  /**
   * This handles any dropped data onto the canvas or a set item pile
   *
   * @param {canvas} canvas
   * @param {Object} data
   * @param {Actor/Token/TokenDocument/Boolean}[target=false]
   * @return {Promise/Boolean}
   */
  static async _dropData(canvas, data, { target = false } = {}) {
    
    if (data.type !== "Item") return false;
    
    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();
    
    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }
    
    const dropData = {
      source: false, target: target, itemData: {
        item: itemData, quantity: 1
      }, position: false
    }
    
    if (data.tokenId) {
      dropData.source = canvas.tokens.get(data.tokenId).actor;
    } else if (data.actorId) {
      dropData.source = game.actors.get(data.actorId);
    }
    
    if (!dropData.source && !game.user.isGM) {
      return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
    }
    
    const pre_drop_determined_hook = Helpers.hooks.call(HOOKS.ITEM.PRE_DROP_DETERMINED, dropData.source, dropData.target, dropData.position, dropData.itemData);
    if (pre_drop_determined_hook === false) return false;
    
    let action;
    let droppableDocuments = [];
    let x;
    let y;
    
    if (dropData.target) {
      
      droppableDocuments.push(dropData.target);
      
    } else {
      
      const position = canvas.grid.getTopLeft(data.x, data.y);
      x = position[0];
      y = position[1];
      
      droppableDocuments = Utilities.getTokensAtLocation({ x, y })
        .map(token => Utilities.getDocument(token))
        .filter(token => PileUtilities.isValidItemPile(token));
      
    }
    
    if (droppableDocuments.length && game.modules.get("midi-qol")?.active && game.settings.get("midi-qol", "DragDropTarget")) {
      Helpers.custom_warning("You have Drag & Drop Targetting enabled in MidiQOL, which disables drag & drop items")
      return false;
    }
    
    if (droppableDocuments.length > 0 && !game.user.isGM) {
      
      if (!(droppableDocuments[0] instanceof Actor && dropData.source instanceof Actor)) {
        
        const sourceToken = canvas.tokens.placeables.find(token => token.actor === dropData.source);
        
        if (sourceToken) {
          
          const targetToken = droppableDocuments[0];
          
          const distance = Math.floor(Utilities.distance_between_rect(sourceToken, targetToken.object) / canvas.grid.size) + 1
          
          const pileData = PileUtilities.getActorFlagData(targetToken);
          
          const maxDistance = pileData.distance ? pileData.distance : Infinity;
          
          if (distance > maxDistance) {
            Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
            return false;
          }
        }
      }
      
      droppableDocuments = droppableDocuments.filter(token => !game.itempiles.isItemPileLocked(token));
      
      if (!droppableDocuments.length) {
        Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileLocked"), true);
        return false;
      }
    }
    
    const disallowedType = PileUtilities.isItemInvalid(droppableDocuments?.[0], item);
    if (disallowedType) {
      if (!game.user.isGM) {
        return Helpers.custom_warning(game.i18n.format("ITEM-PILES.Errors.DisallowedItemDrop", { type: disallowedType }), true)
      }
      if (!hotkeyState.shiftDown) {
        const force = await Dialog.confirm({
          title: game.i18n.localize("ITEM-PILES.Dialogs.DropTypeWarning.Title"),
          content: `<p class="item-piles-dialog">${game.i18n.format("ITEM-PILES.Dialogs.DropTypeWarning.Content", { type: disallowedType })}</p>`,
          defaultYes: false
        });
        if (!force) {
          return false;
        }
      }
    }
    
    if (hotkeyState.altDown) {
      
      if (droppableDocuments.length) {
        action = "addToPile";
      }
      
      setProperty(dropData.itemData.item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, 1);
      dropData.itemData.quantity = 1;
      
    } else {
      
      const quantity = getProperty(dropData.itemData.item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE);
      
      let result = { action: "addToPile", quantity: 1 }
      if (quantity > 1) {
        result = await DropItemDialog.show(item, droppableDocuments[0]);
        if (!result) return false;
      }
      
      action = result.action;
      setProperty(dropData.itemData.item, game.itempiles.ITEM_QUANTITY_ATTRIBUTE, Number(result.quantity))
      dropData.itemData.quantity = Number(result.quantity);
      
    }
    
    if (action === "addToPile") {
      dropData.target = droppableDocuments[0];
    } else {
      dropData.position = { x, y };
    }
    
    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_DROP, dropData.source, dropData.target, dropData.position, dropData.itemData);
    if (hookResult === false) return false;
    
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DROP_ITEMS, {
      userId: game.user.id,
      sceneId: canvas.scene.id,
      sourceUuid: Utilities.getUuid(dropData.source),
      targetUuid: Utilities.getUuid(dropData.target),
      position: dropData.position,
      itemData: dropData.itemData
    });
    
  }
  
  static async _itemPileClicked(pileDocument) {
    
    if (!PileUtilities.isValidItemPile(pileDocument)) return false;
    
    const pileToken = pileDocument.object;
    
    if (!Helpers.isGMConnected()) {
      Helpers.custom_warning(`Item Piles requires a GM to be connected for players to be able to loot item piles.`, true)
      return false;
    }
    
    Helpers.debug(`Clicked: ${pileDocument.uuid}`);
    
    const pileData = PileUtilities.getActorFlagData(pileDocument);
    
    const maxDistance = pileData.distance ? pileData.distance : Infinity;
    
    let validTokens = [];
    
    if (canvas.tokens.controlled.length > 0) {
      validTokens = [...canvas.tokens.controlled];
      validTokens = validTokens.filter(token => token.document !== pileDocument);
    }
    
    if (!validTokens.length && !game.user.isGM) {
      validTokens.push(...canvas.tokens.placeables);
      if (_token) {
        validTokens.unshift(_token);
      }
    }
    
    validTokens = validTokens.filter(token => token.owner && token.document !== pileDocument).filter(token => {
      return Utilities.tokens_close_enough(pileToken, token, maxDistance) || game.user.isGM;
    });
    
    if (!validTokens.length && !game.user.isGM && maxDistance !== Infinity) {
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
      return false;
    }
    
    let interactingActor;
    if (validTokens.length) {
      if (validTokens.includes(_token)) {
        interactingActor = _token.actor;
      } else {
        validTokens.sort((potentialTargetA, potentialTargetB) => {
          return Utilities.grids_between_tokens(pileToken, potentialTargetA) - Utilities.grids_between_tokens(pileToken, potentialTargetB);
        })
        interactingActor = validTokens[0].actor;
      }
    } else if (game.user.character && !game.user.isGM) {
      interactingActor = game.user.character;
    }
    
    if (pileData.isContainer && interactingActor) {
      
      if (pileData.locked && !game.user.isGM) {
        Helpers.debug(`Attempted to locked item pile with UUID ${pileDocument.uuid}`);
        return game.itempiles.rattleItemPile(pileDocument, interactingActor);
      }
      
      if (pileData.closed) {
        Helpers.debug(`Opened item pile with UUID ${pileDocument.uuid}`);
        await game.itempiles.openItemPile(pileDocument, interactingActor);
      }
      
    }
    
    return this._renderItemPileInterface(pileDocument.uuid, { inspectingTargetUuid: interactingActor?.uuid });
    
  }
  
  static async _splitItemPileContents(itemPileUuid, actorUuids, userId, instigator) {
    
    const itemPileActor = Utilities.getActor(itemPileUuid);
    
    const items = PileUtilities.getActorItems(itemPileActor);
    const currencies = PileUtilities.getActorCurrencies(itemPileActor);
    
    const pileData = PileUtilities.getActorFlagData(itemPileActor);
    const shareData = SharingUtilities.getItemPileSharingData(itemPileActor);
    
    const pileTransaction = new Transaction(itemPileActor);
    
    const transactionMap = actorUuids.map(uuid => {
      return [uuid, new Transaction(Utilities.getActor(uuid))];
    });
    
    if (pileData.shareItemsEnabled) {
      pileTransaction.appendItemChanges(items, { remove: true });
    }
    
    if (pileData.shareCurrenciesEnabled) {
      const currencyItems = currencies.filter(entry => entry.type === "item");
      pileTransaction.appendItemChanges(currencyItems, { remove: true, type: "currency" });
      
      const attributes = currencies.filter(entry => entry.type === "attribute");
      pileTransaction.appendActorChanges(attributes, { remove: true });
    }
    
    const preparedData = pileTransaction.prepare();
    
    for (const [uuid, transaction] of transactionMap) {
      if (pileData.shareItemsEnabled) {
        transaction.appendItemChanges(preparedData.itemDeltas.filter(delta => delta.type === "item").map(delta => {
          delta.quantity = SharingUtilities.getItemSharesLeftForActor(itemPileActor, delta.item, uuid, {
            players: actorUuids.length,
            shareData: shareData,
            floor: true
          });
          return delta;
        }));
      }
      
      if (pileData.shareCurrenciesEnabled) {
        transaction.appendItemChanges(preparedData.itemDeltas.filter(delta => delta.type === "currency").map(delta => {
          delta.quantity = SharingUtilities.getItemSharesLeftForActor(itemPileActor, delta.item, uuid, {
            players: actorUuids.length,
            shareData: shareData,
            floor: true
          });
          return delta;
        }), { type: "currency" });
        
        transaction.appendActorChanges(Object.entries(preparedData.attributeDeltas).map(entry => {
          let [path] = entry;
          const quantity = SharingUtilities.getAttributeSharesLeftForActor(itemPileActor, path, uuid, {
            players: actorUuids.length,
            shareData: shareData,
            floor: true
          });
          return { path, quantity };
        }));
      }
    }
    
    const actorPreparedData = Object.fromEntries(transactionMap.map(entry => [entry[0], entry[1].prepare()]));
    
    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_SPLIT_INVENTORY, itemPileActor, preparedData, actorPreparedData, userId, instigator);
    if (hookResult === false) return false;
    
    const pileDeltas = await pileTransaction.commit();
    const actorDeltas = {};
    for (const [uuid, transaction] of transactionMap) {
      actorDeltas[uuid] = await transaction.commit();
    }
    
    await SharingUtilities.clearItemPileSharingData(itemPileActor);
    
    await ItemPileSocket.callHook(HOOKS.PILE.SPLIT_INVENTORY, itemPileUuid, pileDeltas, actorDeltas, userId, instigator);
    
    await this._executeItemPileMacro(itemPileUuid, {
      action: "splitInventory",
      source: itemPileUuid,
      target: actorUuids,
      transfers: {
        pileDeltas,
        actorDeltas
      },
      userId: userId,
      instigator: instigator
    });
    
    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
    if (shouldBeDeleted) {
      await this._deleteItemPile(itemPileUuid);
    }
    
    return {
      pileDeltas,
      actorDeltas
    };
    
  }
  
  static async _updateTokenHud() {
    if (!canvas.tokens.hud.rendered) return;
    return canvas.tokens.hud.render(true);
  }
  
  static async _renderItemPileInterface(targetUuid, {
    inspectingTargetUuid = false, useDefaultCharacter = false, remote = false
  } = {}) {
    
    const target = Utilities.getActor(targetUuid);
    
    let inspectingTarget;
    if (useDefaultCharacter && !game.user.isGM) {
      inspectingTarget = game.user.character;
    } else {
      inspectingTarget = inspectingTargetUuid ? Utilities.fromUuidFast(inspectingTargetUuid) : false;
    }
    
    const merchant = PileUtilities.isItemPileMerchant(target);
    if (merchant) {
      return MerchantApp.show(target, inspectingTarget)
    }
    
    return ItemPileInventoryApp.show(target, inspectingTarget, { remote });
    
  }
  
  static async _buyItem(itemId, merchantUuid, buyerUuid, paymentIndex = 0, quantity = 1, userId, {
    interactionId = false
  } = {}) {
    
    const merchantActor = Utilities.getActor(merchantUuid);
    const buyingActor = Utilities.getActor(buyerUuid);
    const item = merchantActor.items.get(itemId);
    
    const itemPrices = PileUtilities.getItemPrices(item, { merchant: merchantActor, actor: buyingActor, quantity });
    const selectedPrice = itemPrices[paymentIndex];
    
    const merchantTransaction = new Transaction(merchantActor);
    const buyerTransaction = new Transaction(buyingActor);
    
    buyerTransaction.appendItemChanges([{ item, quantity }]);
    
    const merchantFlagData = PileUtilities.getActorFlagData(merchantActor);
    if (!merchantFlagData.infiniteQuantity) {
      merchantTransaction.appendItemChanges([{ item, quantity }], { remove: true });
    }
    
    for (const price of selectedPrice.finalPrices) {
      if (!price.quantity) continue;
      if (price.type === "attribute") {
        buyerTransaction.appendActorChanges([{
          path: price.data.path,
          quantity: price.quantity
        }], { remove: true, type: selectedPrice.primary ? "currency" : price.type });
      } else {
        buyerTransaction.appendItemChanges([{
          item: price.item,
          quantity: price.quantity
        }], { remove: true, type: selectedPrice.primary ? "currency" : price.type });
      }
    }
    
    for (const change of selectedPrice.changeBack) {
      if (!change.quantity) continue;
      if (change.type === "attribute") {
        buyerTransaction.appendActorChanges([{
          path: change.data.path,
          quantity: change.quantity
        }], { type: selectedPrice.primary ? "currency" : change.type });
      } else {
        buyerTransaction.appendItemChanges([{
          item: change.item,
          quantity: change.quantity
        }], { type: selectedPrice.primary ? "currency" : change.type });
      }
    }
    
    for (const payment of selectedPrice.sellerPay) {
      if (!payment.quantity) continue;
      if (payment.type === "attribute") {
        merchantTransaction.appendActorChanges([{
          path: payment.data.path,
          quantity: payment.quantity
        }], { type: selectedPrice.primary ? "currency" : payment.type });
      } else {
        merchantTransaction.appendItemChanges([{
          item: payment.item,
          quantity: payment.quantity
        }], { type: selectedPrice.primary ? "currency" : payment.type });
      }
    }
    
    const buyerUpdates = buyerTransaction.prepare();
    const merchantUpdates = merchantTransaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.MERCHANT.PRE_BUY, buyingActor, buyerUpdates, merchantActor, merchantUpdates, userId);
    if (hookResult === false) return false;
    
    await merchantTransaction.commit();
    const { itemDeltas, attributeDeltas } = await buyerTransaction.commit();
    
    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.MERCHANT.BUY, buyerUuid, merchantUuid, itemDeltas, attributeDeltas, userId, interactionId);
    
    return { itemDeltas, attributeDeltas, price: selectedPrice };
    
  }
  
  static async _sellItem(itemId, merchantUuid, sellerUuid, paymentIndex = 0, quantity = 1, userId, {
    interactionId = false
  } = {}) {
    
    const merchantActor = Utilities.getActor(merchantUuid);
    const sellingActor = Utilities.getActor(sellerUuid);
    const item = sellingActor.items.get(itemId);
    
    const itemPrices = PileUtilities.getItemPrices(item, {
      merchant: merchantActor,
      actor: sellingActor,
      quantity,
      selling: true
    });
    const selectedPrice = itemPrices[paymentIndex];
    
    const merchantTransaction = new Transaction(merchantActor);
    const sellerTransaction = new Transaction(sellingActor);
    
    merchantTransaction.appendItemChanges([{ item, quantity }]);
    sellerTransaction.appendItemChanges([{ item, quantity }], { remove: true });
    
    const merchantFlagData = PileUtilities.getActorFlagData(merchantActor);
    
    if ((selectedPrice.primary && !merchantFlagData.infiniteCurrencies) || (!selectedPrice.primary && !merchantFlagData.infiniteQuantity)) {
      for (const price of selectedPrice.finalPrices) {
        if (!price.quantity) continue;
        if (price.type === "attribute") {
          merchantTransaction.appendActorChanges([{
            path: price.data.path,
            quantity: price.quantity
          }], { remove: true, type: selectedPrice.primary ? "currency" : price.type });
        } else {
          merchantTransaction.appendItemChanges([{
            item: price.item,
            quantity: price.quantity
          }], { remove: true, type: selectedPrice.primary ? "currency" : price.type });
        }
      }
      
      for (const change of selectedPrice.changeBack) {
        if (!change.quantity) continue;
        if (change.type === "attribute") {
          merchantTransaction.appendActorChanges([{
            path: change.data.path,
            quantity: change.quantity
          }], { type: selectedPrice.primary ? "currency" : change.type });
        } else {
          merchantTransaction.appendItemChanges([{
            item: change.item,
            quantity: change.quantity
          }], { type: selectedPrice.primary ? "currency" : change.type });
        }
      }
    }
    
    for (const payment of selectedPrice.sellerPay) {
      if (!payment.quantity) continue;
      if (payment.type === "attribute") {
        sellerTransaction.appendActorChanges([{
          path: payment.data.path,
          quantity: payment.quantity
        }], { type: selectedPrice.primary ? "currency" : payment.type });
      } else {
        sellerTransaction.appendItemChanges([{
          item: payment.item,
          quantity: payment.quantity
        }], { type: selectedPrice.primary ? "currency" : payment.type });
      }
    }
    
    const sellerUpdates = sellerTransaction.prepare();
    const merchantUpdates = merchantTransaction.prepare();
    
    const hookResult = Helpers.hooks.call(HOOKS.MERCHANT.PRE_SELL, sellingActor, sellerUpdates, merchantActor, merchantUpdates, userId);
    if (hookResult === false) return false;
    
    await merchantTransaction.commit();
    const { itemDeltas, attributeDeltas } = await sellerTransaction.commit();
    
    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.MERCHANT.SELL, sellerUuid, merchantUuid, itemDeltas, attributeDeltas, userId, interactionId);
    
    return { itemDeltas, attributeDeltas, price: selectedPrice };
    
  }
  
}