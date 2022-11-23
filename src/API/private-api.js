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
import { SYSTEMS } from "../systems.js";
import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import CustomDialog from "../applications/components/CustomDialog.svelte";

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
    ItemPileStore.notifyChanges("createItem", doc.parent, doc);
    if (!PileUtilities.isValidItemPile(doc.parent)) return;
    this._evaluateItemPileChange(doc.parent, {}, true);
  }

  /**
   * @private
   */
  static _onUpdateItem(doc) {
    if (!doc.parent) return;
    if (!PileUtilities.isValidItemPile(doc.parent)) return;
    this._evaluateItemPileChange(doc.parent, {}, true);
  }

  /**
   * @private
   */
  static _onDeleteItem(doc) {
    if (!doc.parent) return;
    ItemPileStore.notifyChanges("deleteItem", doc.parent, doc);
    if (!PileUtilities.isValidItemPile(doc.parent)) return;
    this._evaluateItemPileChange(doc.parent, {}, true);
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
    ItemPileStore.notifyChanges("delete", doc.actor)
    if (!PileUtilities.isValidItemPile(doc)) return;
    Helpers.hooks.callAll(HOOKS.PILE.DELETE, doc);
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
  static _onPreCreateToken(doc, data) {
    const itemPileConfig = getProperty(data, CONSTANTS.FLAGS.PILE);
    if (!itemPileConfig?.enabled) return;
    if (!doc.isLinked) {
      doc.updateSource({
        [`actorData.flags.${CONSTANTS.MODULE_NAME}.-=sharing`]: null,
      });
    }
    if (itemPileConfig.closedImage.includes("*")) {
      itemPileConfig.closedImage = Helpers.random_array_element(itemPileConfig.closedImages);
      itemPileConfig.closedImages = [];
    }
    if (itemPileConfig.emptyImage.includes("*")) {
      itemPileConfig.emptyImage = Helpers.random_array_element(itemPileConfig.emptyImages);
      itemPileConfig.emptyImages = [];
    }
    if (itemPileConfig.openedImage.includes("*")) {
      itemPileConfig.openedImage = Helpers.random_array_element(itemPileConfig.openedImages);
      itemPileConfig.openedImages = [];
    }
    if (itemPileConfig.lockedImage.includes("*")) {
      itemPileConfig.lockedImage = Helpers.random_array_element(itemPileConfig.lockedImages);
      itemPileConfig.lockedImages = [];
    }
    doc.updateSource({
      [CONSTANTS.FLAGS.PILE]: itemPileConfig, ["actorData." + CONSTANTS.FLAGS.PILE]: itemPileConfig
    });
    const targetItems = PileUtilities.getActorItems(doc.actor);
    const targetCurrencies = PileUtilities.getActorCurrencies(doc.actor);
    const pileData = { data: itemPileConfig, items: targetItems, currencies: targetCurrencies };
    doc.updateSource({
      "img": PileUtilities.getItemPileTokenImage(doc, pileData),
      "scale": PileUtilities.getItemPileTokenScale(doc, pileData),
      "name": PileUtilities.getItemPileName(doc, pileData)
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

  static async _addItems(targetUuid, items, userId, {
    removeExistingActorItems = false, interactionId = false
  } = {}) {

    const targetActor = Utilities.getActor(targetUuid);

    const transaction = new Transaction(targetActor);

    if (removeExistingActorItems) {
      const existingItems = PileUtilities.getActorItems(targetActor);
      await transaction.appendItemChanges(existingItems, { remove: true });
    }

    await transaction.appendItemChanges(items);

    const { itemsToUpdate, itemsToCreate, itemsToDelete } = transaction.prepare(); // Prepare data

    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_ADD, targetActor, itemsToCreate, itemsToUpdate, itemsToDelete, userId);
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

    await transaction.appendItemChanges(items, { remove: true });

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
    await sourceTransaction.appendItemChanges(items, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();

    const targetTransaction = new Transaction(targetActor);
    await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
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

  static async _transferAllItems(sourceUuid, targetUuid, userId, {
    itemFilters = false, interactionId = false
  } = {}) {

    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);

    const itemsToTransfer = PileUtilities.getActorItems(sourceActor, { itemFilters }).map(item => item.toObject());

    const sourceTransaction = new Transaction(sourceActor);
    await sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();

    const targetTransaction = new Transaction(targetActor);
    await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
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

  static async _setAttributes(targetUuid, attributes, userId, { interactionId = false } = {}) {

    const targetActor = Utilities.getActor(targetUuid);

    const transaction = new Transaction(targetActor);
    await transaction.appendActorChanges(attributes);
    const { actorUpdates } = transaction.prepare();

    const hookResult = Helpers.hooks.call(HOOKS.ATTRIBUTE.PRE_SET, targetActor, actorUpdates, interactionId);
    if (hookResult === false) return false;

    const { attributeDeltas } = await transaction.commit();

    await ItemPileSocket.callHook(HOOKS.ATTRIBUTE.SET, targetUuid, attributeDeltas, userId, interactionId);

    await this._executeItemPileMacro(targetUuid, {
      action: "setAttributes",
      target: targetUuid,
      attributes: attributeDeltas,
      userId: userId,
      interactionId: interactionId
    });

    return attributeDeltas;

  }

  static async _addAttributes(targetUuid, attributes, userId, { interactionId = false } = {}) {

    const targetActor = Utilities.getActor(targetUuid);

    const transaction = new Transaction(targetActor);
    await transaction.appendActorChanges(attributes);
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
    await transaction.appendActorChanges(attributes, { remove: true });
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
    await sourceTransaction.appendActorChanges(attributes, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();

    const targetTransaction = new Transaction(targetActor);
    await targetTransaction.appendActorChanges(sourceUpdates.attributeDeltas);
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
      return hasProperty(targetActor, attribute.data.path);
    }).map(attribute => attribute.data.path);

    const sourceTransaction = new Transaction(sourceActor);
    await sourceTransaction.appendActorChanges(attributesToTransfer, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();

    const targetTransaction = new Transaction(targetActor);
    await targetTransaction.appendActorChanges(sourceUpdates.attributeDeltas);
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
      return hasProperty(targetActor, attribute.data.path);
    }).map(attribute => attribute.data.path);

    const sourceTransaction = new Transaction(sourceActor);
    await sourceTransaction.appendItemChanges(itemsToTransfer, { remove: true });
    await sourceTransaction.appendActorChanges(attributesToTransfer, { remove: true });
    const sourceUpdates = sourceTransaction.prepare();

    const targetTransaction = new Transaction(targetActor);
    await targetTransaction.appendItemChanges(sourceUpdates.itemDeltas);
    await targetTransaction.appendActorChanges(sourceUpdates.attributeDeltas);
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
        itemsDropped = (await this._removeItems(sourceUuid, itemsToTransfer, userId)).map(item => {
          item.quantity = Math.abs(item.quantity)
          Utilities.setItemQuantity(item.item, Math.abs(item.quantity), true);
          return item;
        });
        targetUuid = await this._createItemPile({ sceneId, position, items: itemsDropped });
      }

      // If there's no source (it was dropped from the item bar)
    } else {

      // If there's a target token, add the item to it, otherwise create a new pile at the drop location
      if (targetUuid) {
        itemsDropped = await this._addItems(targetUuid, [itemData], userId);
      } else {
        targetUuid = await this._createItemPile({ sceneId, position, items: [itemData] });
      }

    }

    await ItemPileSocket.callHook(HOOKS.ITEM.DROP, sourceUuid, targetUuid, itemsDropped, position);

    return { sourceUuid, targetUuid, position, itemsDropped };

  }


  static async _createItemPile({
    sceneId = null,
    position = false,
    actor = false,
    createActor = false,
    items = false,
    tokenOverrides = {},
    actorOverrides = {},
    itemPileFlags = {}
  } = {}) {

    let returns = {};

    let pileActor;

    if (createActor) {

      let pileDataDefaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

      pileDataDefaults.enabled = true;
      pileDataDefaults.deleteWhenEmpty = "true";
      pileDataDefaults.displayOne = true;
      pileDataDefaults.showItemName = true;
      pileDataDefaults.overrideSingleItemScale = true;
      pileDataDefaults.singleItemScale = 0.75;

      pileDataDefaults = foundry.utils.mergeObject(pileDataDefaults, itemPileFlags);

      pileActor = await Actor.create({
        name: actor || "New Item Pile", type: Helpers.getSetting("actorClassType"), img: "icons/svg/item-bag.svg"
      });

      await pileActor.update({
        [CONSTANTS.FLAGS.PILE]: pileDataDefaults, prototypeToken: {
          name: "Item Pile",
          actorLink: false,
          bar1: { attribute: "" },
          vision: false,
          displayName: 50,
          [CONSTANTS.FLAGS.PILE]: pileDataDefaults, ...tokenOverrides
        }, ...actorOverrides
      })

    } else if (!actor) {

      pileActor = game.actors.get(Helpers.getSetting(SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID));

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
          name: "Default Item Pile", type: Helpers.getSetting("actorClassType"), img: "icons/svg/item-bag.svg"
        });

        await pileActor.update({
          [CONSTANTS.FLAGS.PILE]: pileDataDefaults, prototypeToken: {
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

      pileActor = await fromUuid(actor);

      if (!pileActor) {
        throw Helpers.custom_error("Could not find actor with UUID " + actor);
      }

    }

    if (position && sceneId) {

      let overrideData = { ...position, ...tokenOverrides };

      let pileData = PileUtilities.getActorFlagData(pileActor);
      pileData.enabled = true;
      pileData = foundry.utils.mergeObject(pileData, itemPileFlags);

      if (!pileActor.prototypeToken.actorLink) {

        if (items) {
          for (let i = 0; i < items.length; i++) {
            const itemData = items[i]?.item ?? items[i];
            if (SYSTEMS.DATA.ITEM_TRANSFORMER) {
              items[i] = await SYSTEMS.DATA.ITEM_TRANSFORMER(itemData);
            }
          }
        } else {
          items = []
        }

        items = items ? items.map(item => {
          return item.item ?? item;
        }) : [];

        overrideData['actorData'] = {
          items: items, ...actorOverrides
        }

        const data = { data: pileData, items: items };

        overrideData = foundry.utils.mergeObject(overrideData, {
          "img": PileUtilities.getItemPileTokenImage(pileActor, data, overrideData?.img),
          "scale": PileUtilities.getItemPileTokenScale(pileActor, data, overrideData?.scale),
          "name": PileUtilities.getItemPileName(pileActor, data, overrideData?.name),
        });

      }

      const tokenData = await pileActor.getTokenDocument(overrideData);

      const scene = game.scenes.get(sceneId);

      const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_CREATE, tokenData);
      if (hookResult === false) return false;

      const [tokenDocument] = await scene.createEmbeddedDocuments("Token", [tokenData]);

      returns["tokenUuid"] = Utilities.getUuid(tokenDocument);

    }

    returns["actorUuid"] = pileActor.uuid;

    return returns;

  }

  static async _turnTokensIntoItemPiles(targetUuids, pileSettings = {}, tokenSettings = {}) {

    const tokenUpdateGroups = {};
    const actorUpdateGroups = {};

    for (const targetUuid of targetUuids) {

      const target = fromUuidSync(targetUuid);

      const specificPileSettings = foundry.utils.mergeObject(
        PileUtilities.getActorFlagData(target),
        pileSettings
      );
      specificPileSettings.enabled = true;

      const targetItems = PileUtilities.getActorItems(target, { itemFilters: specificPileSettings.overrideItemFilters });
      const targetCurrencies = PileUtilities.getActorCurrencies(target, { currencyList: specificPileSettings.overrideCurrencies });

      const data = { data: specificPileSettings, items: targetItems, currencies: targetCurrencies };

      let specificTokenSettings = Helpers.isFunction(tokenSettings)
        ? await tokenSettings(target)
        : foundry.utils.deepClone(tokenSettings);

      specificTokenSettings = foundry.utils.mergeObject(specificTokenSettings, {
        "img": PileUtilities.getItemPileTokenImage(target, data, specificTokenSettings?.img),
        "scale": PileUtilities.getItemPileTokenScale(target, data, specificTokenSettings?.scale),
        "name": PileUtilities.getItemPileName(target, data, specificTokenSettings?.name)
      });

      const sceneId = targetUuid.split('.')[1];
      const tokenId = targetUuid.split('.')[3];

      if (!tokenUpdateGroups[sceneId]) {
        tokenUpdateGroups[sceneId] = []
      }

      tokenUpdateGroups[sceneId].push({
        "_id": tokenId, ...specificTokenSettings,
        [CONSTANTS.FLAGS.PILE]: specificPileSettings,
        [`actorData.${CONSTANTS.FLAGS.PILE}`]: specificPileSettings
      });

      if (target.isLinked) {
        if (actorUpdateGroups[target.actor.id]) continue;
        actorUpdateGroups[target.actor.id] = {
          "_id": target.actor.id,
          [CONSTANTS.FLAGS.PILE]: specificPileSettings
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

      let target = fromUuidSync(targetUuid);

      const specificPileSettings = PileUtilities.getActorFlagData(target);
      specificPileSettings.enabled = false;

      const sceneId = targetUuid.split('.')[1];
      const tokenId = targetUuid.split('.')[3];

      if (!tokenUpdateGroups[sceneId]) {
        tokenUpdateGroups[sceneId] = [];
      }

      const specificTokenSettings = Helpers.isFunction(tokenSettings)
        ? await tokenSettings(target)
        : foundry.utils.deepClone(tokenSettings);

      tokenUpdateGroups[sceneId].push({
        "_id": tokenId,
        ...specificTokenSettings,
        [CONSTANTS.FLAGS.PILE]: specificPileSettings,
        [`actorData.${CONSTANTS.FLAGS.PILE}`]: specificPileSettings
      });

      if (target.isLinked) {
        if (actorUpdateGroups[target.actor.id]) continue;
        actorUpdateGroups[target.actor.id] = {
          "_id": target.actor.id, [CONSTANTS.FLAGS.PILE]: specificPileSettings
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

    const interactingToken = interactingTokenUuid ? fromUuidSync(interactingTokenUuid) : false;

    if (foundry.utils.isEmpty(diffData)) return false;

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
    return target.document.delete();
  }

  /* -------- PRIVATE ITEM PILE METHODS -------- */

  /**
   * Checks whether a given item pile would need to update its images, text, and/or scale
   *
   * @param {foundry.abstract.Document} doc
   * @param {object} changes
   * @param {boolean} force
   * @returns {*}
   * @private
   */
  static _evaluateItemPileChange(doc, changes = {}, force = false) {
    const target = doc?.token ?? doc;
    if (!Helpers.isResponsibleGM()) return;
    if (!force && !PileUtilities.shouldEvaluateChange(target, changes)) return;
    const targetUuid = target.uuid;
    return Helpers.debounceManager.setDebounce(targetUuid, async (uuid) => {
      if (!Utilities.getDocument(uuid)) return;
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
          if (Array.isArray(filePath)) {
            return resolve();
          }
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
  static async _executeItemPileMacro(targetUuid, macroData) {

    const target = Utilities.getToken(targetUuid);

    if (!PileUtilities.isValidItemPile(target)) return false;

    const pileData = PileUtilities.getActorFlagData(target);

    if (!pileData.macro) return false;

    // Reformat macro data to contain useful information
    if (macroData.source) {
      macroData.source = fromUuidSync(macroData.source);
    }

    if (Array.isArray(macroData.target)) {

      macroData.target = macroData.target.map(target => fromUuidSync(target));

    } else {

      if (macroData.target) {
        macroData.target = fromUuidSync(macroData.target);
      }

      const targetActor = macroData.target instanceof TokenDocument ? macroData.target.actor : macroData.target;

      if (macroData.items) {
        macroData.items = macroData.items.map(item => targetActor.items.get(item._id));
      }

    }

    return Utilities.runMacro(pileData.macro, macroData)

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

    dropData.source = item.parent;

    if (!dropData.source && !game.user.isGM) {
      return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
    }

    const pre_drop_determined_hook = Helpers.hooks.call(HOOKS.ITEM.PRE_DROP_DETERMINED, dropData.source, dropData.target, dropData.itemData, dropData.position);
    if (pre_drop_determined_hook === false) return false;

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
        .map(token => Utilities.getDocument(token));

      if (droppableDocuments.length && game.modules.get("midi-qol")?.active && game.settings.get("midi-qol", "DragDropTarget")) {
        Helpers.custom_warning("You have Drag & Drop Targetting enabled in MidiQOL, which disables drag & drop items");
        return false;
      }

      if (!droppableDocuments.length) {
        dropData.position = { x, y };
      }
    }

    const canGiveItems = Helpers.getSetting(SETTINGS.ENABLE_GIVING_ITEMS) || game.user.isGM;
    const canDropItems = Helpers.getSetting(SETTINGS.ENABLE_DROPPING_ITEMS) || game.user.isGM;

    const droppableItemPiles = droppableDocuments.filter(token => PileUtilities.isValidItemPile(token));
    const droppableNormalTokens = droppableDocuments.filter(token => !PileUtilities.isValidItemPile(token));

    const droppingItem = canDropItems && (droppableItemPiles.length || (dropData.position && !droppableNormalTokens.length));
    const givingItem = canGiveItems && droppableNormalTokens.length && !droppableItemPiles.length;

    if (droppingItem) {
      dropData.target = droppableItemPiles[0];
      return this._dropItem(dropData);
    } else if (givingItem) {
      dropData.target = droppableNormalTokens[0];
      return this._giveItem(dropData);
    }

    return false;

  }

  static async _giveItem(dropData) {

    if (dropData.source === dropData.target) return;

    const validItem = await PileUtilities.checkItemType(dropData.target, dropData.itemData.item);
    if (!validItem) return;
    dropData.itemData.item = validItem;

    const user = Array.from(game.users).find(user => user?.character === dropData.target.actor);

    if (user && !user?.active && !game.user.isGM) {
      return TJSDialog.prompt({
        title: game.i18n.localize("ITEM-PILES.Dialogs.GiveItemUserNotActive.Title"), content: {
          class: CustomDialog, props: {
            content: game.i18n.format("ITEM-PILES.Dialogs.GiveItemUserNotActive.Content", {
              actor_name: dropData.target.actor.name, user_name: user.name
            })
          }
        }
      });
    }

    const gms = Helpers.getActiveGMs().map(user => user.id);

    if (user?.active || gms.length || game.user.isGM) {

      const item = await Item.implementation.create(dropData.itemData.item, { temporary: true });

      if (Utilities.hasItemQuantity(dropData.itemData.item)) {
        const quantity = await DropItemDialog.show(item, dropData.target.actor, { giving: true });
        Utilities.setItemQuantity(dropData.itemData.item, quantity);
        dropData.itemData.quantity = quantity;
      } else {
        dropData.itemData.quantity = 1;
      }

      const sourceUuid = Utilities.getUuid(dropData.source);
      const targetUuid = Utilities.getUuid(dropData.target);

      if ((!user || !user?.active) && game.user.isGM) {
        Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ItemTransferred", {
          source_actor_name: dropData.source.name, target_actor_name: dropData.target.name, item_name: item.name
        }));
        return this._transferItems(sourceUuid, targetUuid, [dropData.itemData.item], game.user.id)
      }

      return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.GIVE_ITEMS, [user ? user.id : gms[0]], {
        userId: game.user.id, sourceUuid, targetUuid, itemData: dropData.itemData
      });
    }
  }

  static async _dropItem(dropData) {

    if (dropData.source === dropData.target) return;

    if (dropData.target && PileUtilities.isItemPileMerchant(dropData.target)) return;

    const validItem = await PileUtilities.checkItemType(dropData.target, dropData.itemData.item);
    if (!validItem) return;
    dropData.itemData.item = validItem;

    if (dropData.target && !dropData.position && !game.user.isGM) {

      if (!(dropData.target instanceof Actor && dropData.source instanceof Actor)) {

        const sourceToken = canvas.tokens.placeables.find(token => token.actor === dropData.source);

        if (sourceToken) {

          const distance = Math.floor(Utilities.distance_between_rect(sourceToken, dropData.target.object) / canvas.grid.size) + 1

          const pileData = PileUtilities.getActorFlagData(dropData.target);

          const maxDistance = pileData?.distance ? pileData?.distance : Infinity;

          if (distance > maxDistance) {
            Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
            return false;
          }
        }
      }

      if (game.itempiles.API.isItemPileLocked(dropData.target)) {
        Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileLocked"), true);
        return false;
      }
    }

    if (Utilities.hasItemQuantity(dropData.itemData.item)) {
      if (hotkeyState.altDown) {

        Utilities.setItemQuantity(dropData.itemData.item, 1);
        dropData.itemData.quantity = 1;

      } else {

        let quantity = Utilities.getItemQuantity(dropData.itemData.item);

        if (quantity > 1) {
          const item = await Item.implementation.create(dropData.itemData.item, { temporary: true });
          quantity = await DropItemDialog.show(item, dropData.target);
          if (!quantity) return;
        }

        Utilities.setItemQuantity(dropData.itemData.item, Number(quantity));
        dropData.itemData.quantity = Number(quantity);

      }
    }

    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_DROP, dropData.source, dropData.target, dropData.position, dropData.itemData);
    if (hookResult === false) return false;

    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DROP_ITEMS, {
      userId: game.user.id,
      sceneId: canvas?.scene?.id ?? "",
      sourceUuid: Utilities.getUuid(dropData.source),
      targetUuid: Utilities.getUuid(dropData.target),
      position: dropData.position,
      itemData: dropData.itemData
    });

  }

  static async _giveItems({ userId, sourceUuid, targetUuid, itemData } = {}) {

    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);

    const contentString = "ITEM-PILES.Dialogs.ReceiveItem." + (itemData.quantity > 1 ? "ContentMany" : "ContentOne");

    const item = await Item.implementation.create(itemData.item, { temporary: true });

    const accepted = await TJSDialog.confirm({
      title: game.i18n.localize("ITEM-PILES.Dialogs.ReceiveItem.Title"), content: {
        class: CustomDialog, props: {
          content: game.i18n.format(contentString, {
            source_actor_name: sourceActor.name,
            target_actor_name: targetActor.name,
            quantity: itemData.quantity,
            item_name: item.name
          }), icon: "fas fa-handshake", header: game.i18n.localize("ITEM-PILES.Dialogs.ReceiveItem.Header")
        }
      }
    });

    if (accepted) {
      await PrivateAPI._addItems(targetUuid, [itemData], game.user.id);
    }

    return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.GIVE_ITEMS_RESPONSE, [userId], {
      userId: game.user.id, accepted, sourceUuid, itemData
    });

  }

  static async _giveItemsResponse({ userId, accepted, sourceUuid, itemData } = {}) {
    const user = game.users.get(userId);
    if (accepted) {
      await PrivateAPI._removeItems(sourceUuid, [itemData], game.user.id);
      return Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.GiveItemAccepted", { user_name: user.name }));
    }
    return Helpers.custom_warning(game.i18n.format("ITEM-PILES.Warnings.GiveItemDeclined", { user_name: user.name }), true);
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
        return game.itempiles.API.rattleItemPile(pileDocument, interactingActor);
      }

      if (pileData.closed) {
        Helpers.debug(`Opened item pile with UUID ${pileDocument.uuid}`);
        await game.itempiles.API.openItemPile(pileDocument, interactingActor);
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

    const tempPileTransaction = new Transaction(itemPileActor);

    const numPlayers = actorUuids.length;

    if (pileData.shareItemsEnabled) {
      const itemsToRemove = items.map(item => {
        const itemData = item.toObject();
        const quantity = Math.floor(Utilities.getItemQuantity(itemData) / numPlayers) * numPlayers;
        return {
          item: itemData, quantity
        }
      }).filter(entry => entry.quantity);
      await tempPileTransaction.appendItemChanges(itemsToRemove, { remove: true });
    }

    if (pileData.shareCurrenciesEnabled) {
      const currencyItems = currencies.filter(entry => entry.type === "item").map(entry => {
        const itemData = entry.item.toObject();
        const quantity = Math.floor(Utilities.getItemQuantity(itemData) / numPlayers) * numPlayers;
        return {
          item: itemData, quantity
        }
      }).filter(entry => entry.quantity);
      await tempPileTransaction.appendItemChanges(currencyItems, { remove: true, type: "currency" });

      const attributes = currencies.filter(entry => entry.type === "attribute").map(attribute => {
        return {
          ...attribute, quantity: Math.floor(attribute.quantity / numPlayers) * numPlayers
        }
      });
      await tempPileTransaction.appendActorChanges(attributes, { remove: true });
    }

    const preparedData = tempPileTransaction.prepare();

    const transactionMap = actorUuids.map(uuid => {
      return [uuid, new Transaction(Utilities.getActor(uuid))];
    });

    for (const [uuid, transaction] of transactionMap) {

      if (pileData.shareItemsEnabled) {
        await transaction.appendItemChanges(deepClone(preparedData).itemDeltas.filter(delta => delta.type === "item").map(delta => {
          delta.quantity = SharingUtilities.getItemSharesLeftForActor(itemPileActor, delta.item, transaction.actor, {
            players: numPlayers, shareData: shareData, floor: true
          });
          return delta;
        }));
      }

      if (pileData.shareCurrenciesEnabled) {
        await transaction.appendItemChanges(deepClone(preparedData).itemDeltas.filter(delta => delta.type === "currency").map(delta => {
          delta.quantity = SharingUtilities.getItemSharesLeftForActor(itemPileActor, delta.item, transaction.actor, {
            players: numPlayers, shareData: shareData, floor: true
          });
          return delta;
        }), { type: "currency" });

        await transaction.appendActorChanges(Object.entries(deepClone(preparedData).attributeDeltas).map(entry => {
          let [path] = entry;
          const quantity = SharingUtilities.getAttributeSharesLeftForActor(itemPileActor, path, transaction.actor, {
            players: numPlayers, shareData: shareData, floor: true
          });
          return { path, quantity };
        }));
      }
    }

    const actorPreparedData = Object.fromEntries(transactionMap.map(entry => [entry[0], entry[1].prepare()]));

    const hookResult = Helpers.hooks.call(HOOKS.PILE.PRE_SPLIT_INVENTORY, itemPileActor, preparedData, actorPreparedData, userId, instigator);
    if (hookResult === false) return false;

    const pileDeltas = await tempPileTransaction.commit();
    const actorDeltas = {};
    for (const [uuid, transaction] of transactionMap) {
      actorDeltas[uuid] = await transaction.commit();
    }

    await SharingUtilities.clearItemPileSharingData(itemPileActor);

    await ItemPileSocket.callHook(HOOKS.PILE.SPLIT_INVENTORY, itemPileUuid, pileDeltas, actorDeltas, userId, instigator);

    await this._executeItemPileMacro(itemPileUuid, {
      action: "splitInventory", source: itemPileUuid, target: actorUuids, transfers: {
        pileDeltas, actorDeltas
      }, userId: userId, instigator: instigator
    });

    const shouldBeDeleted = PileUtilities.shouldItemPileBeDeleted(itemPileUuid);
    if (shouldBeDeleted) {
      await this._deleteItemPile(itemPileUuid);
    }

    return {
      pileDeltas, actorDeltas
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
      inspectingTarget = inspectingTargetUuid ? fromUuidSync(inspectingTargetUuid) : false;
    }

    const merchant = PileUtilities.isItemPileMerchant(target);
    if (merchant) {
      return MerchantApp.show(target, inspectingTarget)
    }

    return ItemPileInventoryApp.show(target, inspectingTarget, { remote });

  }

  static async _tradeItems(sellerUuid, buyerUuid, items, userId, {
    interactionId = false
  } = {}) {

    const sellingActor = Utilities.getActor(sellerUuid);
    const buyingActor = Utilities.getActor(buyerUuid);

    const itemPrices = PileUtilities.getPricesForItems(items.map(data => {
      const item = sellingActor.items.get(data.id);
      return {
        ...data, item
      }
    }), { seller: sellingActor, buyer: buyingActor });

    const preCalcHookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_CALC_TRADE, sellingActor, buyingActor, itemPrices, userId, interactionId);
    if (preCalcHookResult === false) return false;

    const sellerTransaction = new Transaction(sellingActor);
    const sellerFlagData = PileUtilities.getActorFlagData(sellerTransaction);
    const sellerIsMerchant = sellerFlagData.enabled && sellerFlagData.isMerchant;
    const sellerInfiniteQuantity = sellerIsMerchant && sellerFlagData.infiniteQuantity;
    const sellerInfiniteCurrencies = sellerIsMerchant && sellerFlagData.infiniteCurrencies;

    for (const payment of itemPrices.sellerReceive) {
      if (!payment.quantity) continue;
      if (payment.type === "attribute") {
        await sellerTransaction.appendActorChanges([{
          path: payment.data.path, quantity: payment.quantity
        }], { type: payment.isCurrency ? "currency" : payment.type });
      } else {
        await sellerTransaction.appendItemChanges([{
          item: payment.data.item, quantity: payment.quantity
        }], { type: payment.isCurrency ? "currency" : payment.type });
      }
    }

    for (const entry of itemPrices.buyerReceive) {
      if (!entry.quantity || (sellerInfiniteCurrencies && entry.isCurrency) || (sellerInfiniteQuantity && !entry.isCurrency)) {
        continue;
      }
      if (entry.type === "attribute") {
        await sellerTransaction.appendActorChanges([{
          path: entry.data.path, quantity: entry.quantity
        }], {
          remove: true, type: entry.isCurrency ? "currency" : entry.type
        });
      } else {
        const itemFlagData = PileUtilities.getItemFlagData(entry.item);
        if (sellerIsMerchant && itemFlagData.infiniteQuantity) continue;
        await sellerTransaction.appendItemChanges([{
          item: entry.item, quantity: entry.quantity
        }], {
          remove: true, type: entry.isCurrency ? "currency" : entry.type, removeIfZero: !itemFlagData.isService
        });
      }
    }

    const buyerTransaction = new Transaction(buyingActor);
    const buyerFlagData = PileUtilities.getActorFlagData(buyingActor);
    const buyerIsMerchant = buyerFlagData.enabled && buyerFlagData.isMerchant;
    const buyerInfiniteCurrencies = buyerIsMerchant && buyerFlagData.infiniteCurrencies;
    const buyerInfiniteQuantity = buyerIsMerchant && buyerFlagData.infiniteQuantity;
    const buyerHidesNewItems = buyerIsMerchant && buyerFlagData.hideNewItems;

    for (const price of itemPrices.finalPrices) {
      if (!price.quantity || (buyerInfiniteCurrencies && price.isCurrency) || (buyerInfiniteQuantity && !price.isCurrency)) {
        continue;
      }
      if (price.type === "attribute") {
        await buyerTransaction.appendActorChanges([{
          path: price.data.path, quantity: price.quantity
        }], { remove: true, type: price.isCurrency ? "currency" : price.type });
      } else {
        await buyerTransaction.appendItemChanges([{
          item: price.data.item, quantity: price.quantity
        }], { remove: true, type: price.isCurrency ? "currency" : price.type });
      }
    }

    for (const entry of itemPrices.buyerReceive) {
      if (!entry.quantity) continue;
      if (entry.type === "attribute") {
        await buyerTransaction.appendActorChanges([{
          path: entry.data.path, quantity: entry.quantity
        }], { type: entry.type });
      } else {
        const itemFlagData = PileUtilities.getItemFlagData(entry.item);
        if (itemFlagData.isService) continue;
        const item = entry.item.toObject();
        if (buyerHidesNewItems) {
          setProperty(item, CONSTANTS.FLAGS.ITEM + '.hidden', true);
        }
        await buyerTransaction.appendItemChanges([{
          item: item, quantity: entry.quantity
        }], { type: entry.type });
      }
    }

    for (const change of itemPrices.buyerChange) {
      if (!change.quantity) continue;
      if (change.type === "attribute") {
        await buyerTransaction.appendActorChanges([{
          path: change.data.path, quantity: change.quantity
        }], { type: "currency" });
      } else {
        await buyerTransaction.appendItemChanges([{
          item: change.item, quantity: change.quantity
        }], { type: "currency" });
      }
    }

    const sellerUpdates = sellerTransaction.prepare();
    const buyerUpdates = buyerTransaction.prepare();

    const hookResult = Helpers.hooks.call(HOOKS.ITEM.PRE_TRADE, sellingActor, sellerUpdates, buyingActor, buyerUpdates, userId, interactionId);
    if (hookResult === false) return false;

    const sellerTransactionData = await sellerTransaction.commit();
    const buyerTransactionData = await buyerTransaction.commit();

    await this._executeItemPileMacro(sellerUuid, {
      action: "tradeItems",
      source: sellerUuid,
      target: buyerUuid,
      items: sellerTransactionData.itemDeltas,
      attributes: sellerTransactionData.attributeDeltas,
      userId: userId,
      interactionId: interactionId
    });

    await this._executeItemPileMacro(buyerUuid, {
      action: "tradeItems",
      source: sellerUuid,
      target: buyerUuid,
      items: buyerTransactionData.itemDeltas,
      attributes: buyerTransactionData.attributeDeltas,
      userId: userId,
      interactionId: interactionId
    });

    if (sellerIsMerchant) {
      for (let entry of itemPrices.buyerReceive) {
        const itemFlagData = PileUtilities.getItemFlagData(entry.item);
        if (!itemFlagData.macro) continue;
        await Utilities.runMacro(itemFlagData.macro, {
          seller: sellingActor, buyer: buyingActor, item: entry.item, quantity: entry.quantity
        });
      }
    }

    await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.ITEM.TRADE, sellerUuid, buyerUuid, itemPrices, userId, interactionId);

    return {
      itemDeltas: buyerTransactionData.itemDeltas, attributeDeltas: buyerTransactionData.attributeDeltas, itemPrices
    };

  }

  static async _rollItemTable({
    table = "",
    timesToRoll = "1",
    resetTable = true,
    displayChat = false,
    rollData = {},
    targetActor = false,
    removeExistingActorItems = false,
    userId = false,
  } = {}) {

    const rollTable = await fromUuid(table);

    if (!table.startsWith("Compendium")) {
      if (resetTable) {
        await rollTable.reset();
      }
      await rollTable.normalize();
    }

    const roll = new Roll(timesToRoll.toString(), rollData).evaluate({ async: false });
    if (roll.total <= 0) {
      return [];
    }

    const tableDraw = await rollTable.drawMany(roll.total, { displayChat, recursive: true });
    const items = [];
    for (const rollData of tableDraw.results) {
      const existingItem = items.find((item) => item.documentId === rollData.documentId);
      if (existingItem) {
        existingItem.quantity++;
      } else {

        let item;
        if (rollData.documentCollection === "Item") {
          item = game.items.get(rollData.documentId);
        } else {
          const compendium = game.packs.get(rollData.documentCollection);
          if (compendium) {
            item = await compendium.getDocument(rollData.documentId);
          }
        }

        if (item instanceof Item) {
          items.push({
            ...rollData, item: item.toObject(), quantity: 1,
          });
        }
      }
    }

    if (targetActor) {
      await this._addItems(targetActor, items, userId, { removeExistingActorItems });
    }

    return items;

  }

}
