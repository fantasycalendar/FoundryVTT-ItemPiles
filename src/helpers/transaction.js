import * as Utilities from "./utilities.js";
import ItemPileSocket from "../socket.js";
import PrivateAPI from "../API/private-api.js";

export default class Transaction {
  
  constructor(actor) {
    this.actor = actor;
    this.itemsToCreate = [];
    this.itemsToUpdate = [];
    this.itemsToDelete = [];
    this.itemsDeleted = new Map();
    this.actorUpdates = {};
    this.attributeDeltas = new Map();
    this.itemDeltas = new Map();
    this.preCommitted = false;
  }
  
  appendItemChanges(items, remove = false) {
    for (let item of items) {
      item = item.item ?? item;
      const incomingQuantity = Math.abs(item.quantity ?? Utilities.getItemQuantity(item)) * (remove ? -1 : 1);
      const actorExistingItem = Utilities.findSimilarItem(this.actor.items, item);
      if (actorExistingItem) {
        const existingItemUpdate = Utilities.findSimilarItem(this.itemsToUpdate, item);
        if (existingItemUpdate) {
          const newQuantity = Utilities.getItemQuantity(existingItemUpdate) + incomingQuantity;
          Utilities.setItemQuantity(existingItemUpdate, newQuantity);
        } else {
          const newQuantity = Utilities.getItemQuantity(actorExistingItem) + incomingQuantity;
          const update = Utilities.setItemQuantity({ _id: actorExistingItem.id }, newQuantity);
          this.itemsToUpdate.push(update)
          this.itemDeltas.set(actorExistingItem.id,
            (this.itemDeltas.has(actorExistingItem.id) ? this.itemDeltas.get(actorExistingItem.id) : 0) + incomingQuantity
          );
        }
      } else {
        const existingItemCreation = Utilities.findSimilarItem(this.itemsToCreate, item);
        if (existingItemCreation) {
          const newQuantity = Utilities.getItemQuantity(existingItemCreation) + incomingQuantity;
          Utilities.setItemQuantity(existingItemCreation, newQuantity);
        } else {
          this.itemsToCreate.push(item)
        }
      }
    }
  }
  
  appendActorChanges(attributes, remove = false) {
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
    this.itemsToCreate = this.itemsToCreate.filter(item => Utilities.getItemQuantity(item) > 0);
    this.itemsToDelete = this.itemsToUpdate.filter(item => Utilities.getItemQuantity(item) <= 0).map(item => item._id);
    this.itemDeltas = Array.from(this.itemDeltas).map(([id, quantity]) => {
      const item = this.actor.items.get(id).toObject();
      return { item, quantity };
    });
    this.itemsDeleted = Array.from(this.itemsDeleted).map(([id, quantity]) => {
      const item = this.actor.items.get(id).toObject();
      return { item, quantity };
    });
    this.itemsToUpdate = this.itemsToUpdate.filter(item => Utilities.getItemQuantity(item) > 0).filter(itemData => {
      const item = this.actor.items.get(itemData._id)
      return Utilities.getItemQuantity(item) !== Utilities.getItemQuantity(itemData);
    });
    this.preCommitted = true;
    return {
      actorUpdates: this.actorUpdates,
      itemsToCreate: this.itemsToCreate,
      itemsToDelete: this.itemsToDelete,
      itemsToUpdate: this.itemsToUpdate,
      itemsDeleted: this.itemsDeleted,
      attributeDeltas: Object.fromEntries(this.attributeDeltas),
      itemDeltas: this.itemDeltas,
    }
  }
  
  async commit() {
    
    if (!this.preCommitted) {
      this.prepare();
    }
    
    let itemsCreated;
    const actorUuid = Utilities.getUuid(this.actor);
    if (!this.actor.owner) {
      itemsCreated = await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMMIT_ACTOR_CHANGES, actorUuid, this.actorUpdates, this.itemsToUpdate, this.itemsToDelete, this.itemsToCreate);
    } else {
      itemsCreated = await PrivateAPI._commitActorChanges(actorUuid, this.actorUpdates, this.itemsToUpdate, this.itemsToDelete, this.itemsToCreate)
    }
    
    return {
      attributeDeltas: Object.fromEntries(this.attributeDeltas),
      itemDeltas: this.itemDeltas.concat(itemsCreated.map(item => {
        return {
          item,
          quantity: Utilities.getItemQuantity(item)
        }
      }))
    }
  }
}