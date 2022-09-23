import * as Utilities from "./utilities.js";
import ItemPileSocket from "../socket.js";
import PrivateAPI from "../API/private-api.js";
import { SYSTEMS } from "../systems.js";

export default class Transaction {
  
  constructor(actor) {
    this.actor = actor;
    this.itemsToCreate = [];
    this.itemsToUpdate = [];
    this.itemsToDelete = [];
    this.itemsDeleted = new Map();
    this.actorUpdates = {};
    this.attributeDeltas = new Map();
    this.attributeTypeMap = new Map();
    this.itemDeltas = new Map();
    this.itemTypeMap = new Map();
    this.preCommitted = false;
  }
  
  async appendItemChanges(items, { remove = false, type = "item" } = {}) {
    for (let data of items) {
      let item = data.item ?? data;
      let itemData = item instanceof Item ? item.toObject() : foundry.utils.duplicate(item);
      if (SYSTEMS.DATA.ITEM_TRANSFORMER && !remove) {
        itemData = await SYSTEMS.DATA.ITEM_TRANSFORMER(itemData);
      }
      const incomingQuantity = Math.abs(data.quantity ?? Utilities.getItemQuantity(itemData)) * (remove ? -1 : 1);
      const actorExistingItem = Utilities.findSimilarItem(this.actor.items, itemData);
      if (actorExistingItem) {
        const existingItemUpdate = Utilities.findSimilarItem(this.itemsToUpdate, itemData);
        if (existingItemUpdate) {
          const newQuantity = Utilities.getItemQuantity(existingItemUpdate) + incomingQuantity;
          Utilities.setItemQuantity(existingItemUpdate, newQuantity);
        } else {
          const newQuantity = Utilities.getItemQuantity(actorExistingItem) + incomingQuantity;
          const update = Utilities.setItemQuantity({ _id: actorExistingItem.id }, newQuantity);
          this.itemTypeMap.set(actorExistingItem.id, type)
          this.itemsToUpdate.push(update)
          this.itemDeltas.set(actorExistingItem.id,
            (this.itemDeltas.has(actorExistingItem.id) ? this.itemDeltas.get(actorExistingItem.id) : 0) + incomingQuantity
          );
        }
      } else {
        const existingItemCreation = Utilities.findSimilarItem(this.itemsToCreate, itemData);
        if (existingItemCreation) {
          const newQuantity = Utilities.getItemQuantity(existingItemCreation) + incomingQuantity;
          Utilities.setItemQuantity(existingItemCreation, newQuantity);
        } else {
          setProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE, incomingQuantity);
          this.itemsToCreate.push(itemData);
          this.itemTypeMap.set(itemData._id, type)
        }
      }
    }
  }
  
  async appendActorChanges(attributes, { remove = false, type = "attribute" } = {}) {
    if (!Array.isArray(attributes)) {
      attributes = Object.entries(attributes).map(entry => ({ path: entry[0], quantity: entry[1] }));
    }
    this.actorUpdates = attributes.reduce((acc, attribute) => {
      const incomingQuantity = Math.abs(attribute.quantity) * (remove ? -1 : 1);
      acc[attribute.path] = acc[attribute.path] ?? Number(getProperty(this.actor.data, attribute.path));
      acc[attribute.path] += incomingQuantity
      this.attributeDeltas.set(attribute.path,
        (this.attributeDeltas.has(attribute.path) ? this.attributeDeltas.get(attribute.path) : 0) + incomingQuantity
      );
      this.attributeTypeMap.set(attribute.path, type)
      return acc;
    }, this.actorUpdates);
  }
  
  prepare() {
    this.actorUpdates = Object.fromEntries(Object.entries(this.actorUpdates).filter(entry => {
      if (this.attributeDeltas.get(entry[0]) === 0) {
        this.attributeDeltas.delete(entry[0]);
      }
      return Number(getProperty(this.actor.data, entry[0])) !== entry[1];
    }))
    this.itemsToCreate = this.itemsToCreate.filter(item => {
      return Utilities.getItemQuantity(item) > 0 || this.itemTypeMap.get(item._id) === "currency"
    });
    this.itemsToDelete = this.itemsToUpdate.filter(item => {
      return Utilities.getItemQuantity(item) <= 0 && this.itemTypeMap.get(item._id) !== "currency";
    }).map(item => item._id);
    this.itemDeltas = Array.from(this.itemDeltas).map(([id, quantity]) => {
      const item = this.actor.items.get(id).toObject();
      const type = this.itemTypeMap.get(id);
      setProperty(item, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE, quantity);
      return { item, quantity, type };
    });
    this.itemsDeleted = Array.from(this.itemsDeleted).map(([id, quantity]) => {
      const item = this.actor.items.get(id).toObject();
      const type = this.itemTypeMap.get(id);
      return { item, quantity, type };
    });
    this.itemsToUpdate = this.itemsToUpdate.filter(item => Utilities.getItemQuantity(item) > 0).filter(itemData => {
      const item = this.actor.items.get(itemData._id)
      return Utilities.getItemQuantity(item) !== Utilities.getItemQuantity(itemData);
    });
    this.attributeDeltas = Object.fromEntries(this.attributeDeltas);
    this.preCommitted = true;
    return {
      actorUpdates: this.actorUpdates,
      itemsToCreate: this.itemsToCreate,
      itemsToDelete: this.itemsToDelete,
      itemsToUpdate: this.itemsToUpdate,
      itemsDeleted: this.itemsDeleted,
      attributeDeltas: this.attributeDeltas,
      itemDeltas: this.itemDeltas,
    }
  }
  
  async commit() {
    
    if (!this.preCommitted) {
      this.prepare();
    }
    
    let itemsCreated;
    const actorUuid = Utilities.getUuid(this.actor);
    if (this.actor.isOwner) {
      itemsCreated = await PrivateAPI._commitActorChanges(actorUuid, this.actorUpdates, this.itemsToUpdate, this.itemsToDelete, this.itemsToCreate)
    } else {
      itemsCreated = await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMMIT_ACTOR_CHANGES, actorUuid, this.actorUpdates, this.itemsToUpdate, this.itemsToDelete, this.itemsToCreate);
    }
    
    return {
      attributeDeltas: this.attributeDeltas,
      itemDeltas: this.itemDeltas.concat(itemsCreated.map(item => {
        return {
          item,
          quantity: Utilities.getItemQuantity(item)
        }
      }))
    }
  }
}