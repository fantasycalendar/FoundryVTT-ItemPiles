import { get, writable } from "svelte/store";
import { TJSDocument } from '@typhonjs-fvtt/runtime/svelte/store';
import CONSTANTS from "../constants/constants.js";
import * as Utilities from "../helpers/utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import * as Helpers from "../helpers/helpers.js";
import { InterfaceTracker } from "../socket.js";
import { PileAttribute, PileItem } from "./pile-item.js";

const __STORES__ = new Map();

const __PILEDATA_STORES__ = new Map();

export default class ItemPileStore {
  
  constructor(application, source, recipient = false, { recipientPileData = false } = {}) {
    
    this.subscriptions = [];
    
    this.interactionId = randomID();
    this.application = application;
    
    this.uuid = Utilities.getUuid(source);
    this.actor = Utilities.getActor(source);
    
    this.recipient = recipient ? Utilities.getActor(recipient) : false;
    
    this.document = new TJSDocument(this.actor);
    this.recipientDocument = recipient ? new TJSDocument(this.recipient) : false;
    this.recipientPileData = recipientPileData;
    
    __STORES__.set(this.uuid, this);
    
    this.setupStores();
    this.setupSubscriptions();
  }
  
  get ItemClass() {
    return PileItem;
  };
  
  get AttributeClass() {
    return PileAttribute;
  };
  
  setupStores() {
    
    this.pileData = writable(PileUtilities.getActorFlagData(this.actor));
    this.shareData = writable(SharingUtilities.getItemPileSharingData(this.actor));
    
    this.recipientPileData = this.recipientPileData || writable(this.recipient ? PileUtilities.getActorFlagData(this.recipient) : {});
    this.recipientShareData = writable(this.recipient ? SharingUtilities.getItemPileSharingData(this.recipient) : {});
    
    this.deleted = writable(false);
    
    this.search = writable("");
    this.editQuantities = !this.recipient;
    
    this.allItems = writable([]);
    this.attributes = writable([]);
    
    this.items = writable([]);
    this.currencies = writable([]);
    this.allCurrencies = writable([]);
    
    this.numItems = writable(0);
    this.numCurrencies = writable(0);
    
    this.name = writable("");
    this.img = writable("");
    
  }
  
  setupSubscriptions() {
    
    this.subscribeTo(this.document, () => {
      const { data } = this.document.updateOptions;
      this.name.set(this.actor.name);
      this.img.set(this.actor.img);
      if (hasProperty(data, CONSTANTS.FLAGS.SHARING)) {
        this.shareData.set(SharingUtilities.getItemPileSharingData(this.actor));
        this.refreshItems();
      }
      if (hasProperty(data, CONSTANTS.FLAGS.PILE)) {
        this.pileData.set(PileUtilities.getActorFlagData(this.actor));
        this.refreshItems();
      }
    });
    
    if (this.recipientDocument) {
      this.subscribeTo(this.recipientDocument, () => {
        const { data } = this.document.updateOptions;
        if (hasProperty(data, CONSTANTS.FLAGS.SHARING)) {
          this.recipientShareData.set(SharingUtilities.getItemPileSharingData(this.recipient));
          this.refreshItems();
        }
        if (hasProperty(data, CONSTANTS.FLAGS.PILE)) {
          this.recipientPileData.set(PileUtilities.getActorFlagData(this.recipient));
          this.refreshItems();
        }
      });
    }
    
    const items = [];
    const attributes = [];
    
    PileUtilities.getActorItems(this.actor).map(item => {
      items.push(new this.ItemClass(this, item));
    });
    
    PileUtilities.getActorCurrencies(this.actor, { forActor: this.recipient, getAll: true }).forEach(currency => {
      if (currency.type === "item") {
        if (!currency.item) return;
        items.push(new this.ItemClass(this, currency.item ?? currency.data));
      } else {
        attributes.push(new this.AttributeClass(this, currency));
      }
    });
    
    this.allItems.set(items);
    this.attributes.set(attributes);
    
    this.subscribeTo(this.allItems, (val) => {
      if (!val) return;
      this.refreshItems();
    });
    this.subscribeTo(this.attributes, (val) => {
      if (!val) return;
      this.refreshItems();
    });
    
    const filterDebounce = foundry.utils.debounce(() => {
      this.refreshItems();
    }, 300);
    this.subscribeTo(this.search, (val) => {
      if (!val) return;
      filterDebounce()
    });
    
  }
  
  static getStore(actor) {
    const uuid = Utilities.getUuid(actor);
    return __STORES__.get(uuid);
  }
  
  static notifyChanges(event, actor, ...args) {
    const store = this.getStore(actor);
    if (store) {
      store[event](...args);
    }
  }
  
  refreshItems() {
    const allItems = get(this.allItems);
    
    const items = allItems.filter(entry => !entry.isCurrency);
    const itemCurrencies = allItems.filter(entry => entry.isCurrency);
    
    this.numItems.set(items.filter(entry => get(entry.quantity) > 0).length);
    this.items.set(items.filter(entry => !get(entry.filtered)));
    
    const currencies = get(this.attributes).concat(itemCurrencies);
    this.numCurrencies.set(currencies.filter(entry => get(entry.quantity) > 0).length);
    this.currencies.set(currencies.filter(entry => !get(entry.filtered)));
    this.allCurrencies.set(currencies);
  }
  
  createItem(item) {
    if (PileUtilities.isItemInvalid(this.actor, item)) return;
    const items = get(this.allItems);
    const deletedItems = items
      .filter(item => item.id === null)
      .map(item => ({
        pileItem: item,
        ...item.similarities
      }));
    const previouslyDeletedItem = Utilities.findSimilarItem(deletedItems, item);
    if (previouslyDeletedItem) {
      previouslyDeletedItem.pileItem.setup(item);
    } else {
      items.push(new PileItem(this, item));
    }
    this.allItems.set(items);
    this.refreshItems();
  }
  
  deleteItem(item) {
    if (PileUtilities.isItemInvalid(this.actor, item)) return;
    const items = get(this.allItems);
    const pileItem = items.find(pileItem => pileItem.id === item.id);
    if (!pileItem) return;
    if (this.editQuantities) {
      items.splice(items.indexOf(pileItem), 1);
      this.allItems.set(items);
    } else {
      pileItem.id = null;
      pileItem.quantity.set(0);
      pileItem.quantityLeft.set(0);
    }
    pileItem.unsubscribe();
    this.refreshItems();
  }
  
  delete() {
    this.deleted.set(true);
  }
  
  async update() {
    
    const itemsToUpdate = [];
    const itemsToDelete = [];
    const attributesToUpdate = {};
    
    const items = get(this.allItems).filter(item => item.id);
    for (let item of items) {
      const itemQuantity = get(item.quantity);
      if (itemQuantity === 0) {
        itemsToDelete.push(item.id);
      } else {
        itemsToUpdate.push({
          _id: item.id,
          [game.itempiles.ITEM_QUANTITY_ATTRIBUTE]: itemQuantity
        })
      }
    }
    
    const attributes = get(this.attributes);
    for (let attribute of attributes) {
      attributesToUpdate[attribute.path] = get(attribute.quantity);
    }
    
    const pileSharingData = SharingUtilities.getItemPileSharingData(this.actor);
    
    await this.actor.update(attributesToUpdate);
    if (pileSharingData?.currencies) {
      pileSharingData.currencies = pileSharingData.currencies.map(currency => {
        if (attributesToUpdate[currency.path] !== undefined) {
          currency.actors = currency.actors.map(actor => {
            actor.quantity = Math.max(0, Math.min(actor.quantity, attributesToUpdate[currency.path]));
            return actor;
          })
        }
        return currency;
      })
    }
    
    await this.actor.updateEmbeddedDocuments("Item", itemsToUpdate);
    await this.actor.deleteEmbeddedDocuments("Item", itemsToDelete);
    if (pileSharingData?.items) {
      pileSharingData.items = pileSharingData.items.map(item => {
        const sharingItem = itemsToUpdate.find(item => item._id === item.id);
        if (sharingItem) {
          item.actors = item.actors.map(actor => {
            actor.quantity = Math.max(0, Math.min(actor.quantity, sharingItem.quantity));
            return actor;
          })
        }
        return item;
      })
    }
    
    await SharingUtilities.updateItemPileSharingData(this.actor, pileSharingData);
    
    Helpers.custom_notify("Item Pile successfully updated.");
    
    this.refreshItems();
    
  }
  
  takeAll() {
    game.itempiles.transferEverything(
      this.actor,
      this.recipient,
      { interactionId: this.interactionId }
    );
  }
  
  splitAll() {
    return game.itempiles.splitItemPileContents(this.actor, { instigator: this.recipient });
  }
  
  closeContainer() {
    if (!InterfaceTracker.isOpened(this.application.id)) {
      return game.itempiles.closeItemPile(this.actor);
    }
  }
  
  subscribeTo(target, callback) {
    this.subscriptions.push(target.subscribe(callback));
  }
  
  unsubscribe() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
  
  onDestroy() {
    this.unsubscribe();
    __STORES__.delete(this.uuid);
  }
}