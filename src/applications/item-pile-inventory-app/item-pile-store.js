import { writable, get } from 'svelte/store';
import * as Utilities from "../../helpers/utilities.js";
import * as SharingUtilities from "../../helpers/sharing-utilities.js";
import * as PileUtilities from "../../helpers/pile-utilities.js";
import * as Helpers from "../../helpers/helpers.js";

export default class ItemPileStore {
  
  constructor(pileActor, recipientActor) {
    this.interactionId = randomID();
    this.pileActor = pileActor;
    this.recipientActor = recipientActor;
    this.pileData = PileUtilities.getActorFlagData(pileActor)
    
    this.attributes = writable([]);
    this.items = writable([]);
    this.itemCurrencies = writable([]);
    
    this.numItems = writable(0);
    this.numCurrencies = writable(0);
    
    this.search = writable("");
    this.editQuantities = writable(!recipientActor && pileActor.isOwner && game.user.isGM);
    
    const searchDebounce = debounce((str) => {
      this.filter(str);
    }, 300);
    
    this.search.subscribe((str) => {
      searchDebounce(str);
    });
    
    this.attributes.subscribe(this.refreshNumItems.bind(this));
    this.items.subscribe(this.refreshNumItems.bind(this));
    this.itemCurrencies.subscribe(this.refreshNumItems.bind(this));
    
    this.refresh();
    
  }
  
  refreshNumItems() {
    let numItems = get(this.items).filter(item => item.quantity).length;
    this.numItems.set(numItems);
    
    let numCurrencies = get(this.attributes).filter(attribute => attribute.quantity).length;
    let numItemCurrencies = get(this.itemCurrencies).filter(item => item.quantity).length;
    this.numCurrencies.set(numCurrencies + numItemCurrencies);
  }
  
  refresh() {
    this.refreshAttributes();
    this.refreshItems();
  }
  
  refreshItems() {
    
    const items = get(this.items);
    
    // Get all the items on the actor right now
    const mixedItems = SharingUtilities.getItemPileItemsForActor(this.pileActor, this.recipientActor);
    
    this.refreshItemCurrencies(mixedItems.filter(item => item.currency));
    
    const newItems = mixedItems.filter(item => !item.currency);
    
    if (!items.length && !newItems.length) {
      this.items.set([]);
      return;
    }
    
    // Loop through the old items
    for (let oldItem of items) {
      
      // If we find an item that was previously listed
      const foundItem = Utilities.findSimilarItem(newItems, oldItem);
      
      // We refresh the previously listed attribute to reflect this
      oldItem.quantity = foundItem ? foundItem.quantity : 0;
      oldItem.shareLeft = foundItem ? foundItem.shareLeft : 0;
      oldItem.currentQuantity = foundItem ? Math.max(1, Math.min(oldItem.currentQuantity, foundItem.shareLeft)) : 1;
      oldItem.id = foundItem ? foundItem.id : oldItem.id;
      
      // We then remove it from the incoming list, as we already have it
      if (foundItem) {
        newItems.splice(newItems.indexOf(foundItem), 1)
      }
      
    }
    
    this.items.set(items.concat(newItems))
  }
  
  refreshItemCurrencies(newItems) {
    
    const itemCurrencies = get(this.itemCurrencies);
    
    if (!itemCurrencies.length && !newItems.length) {
      this.itemCurrencies.set([]);
      return;
    }
    
    // Loop through the old items
    for (let oldCurrency of itemCurrencies) {
      
      // If we find an item that was previously listed
      const foundItem = Utilities.findSimilarItem(newItems, oldCurrency);
      
      // We refresh the previously listed attribute to reflect this
      oldCurrency.quantity = foundItem ? foundItem.quantity : 0;
      oldCurrency.shareLeft = foundItem ? foundItem.shareLeft : 0;
      oldCurrency.currentQuantity = foundItem ? Math.max(1, Math.min(oldCurrency.currentQuantity, foundItem.shareLeft)) : 1;
      oldCurrency.id = foundItem ? foundItem.id : oldCurrency.id;
      
      // We then remove it from the incoming list, as we already have it
      if (foundItem) {
        newItems.splice(newItems.indexOf(foundItem), 1)
      }
      
    }
    
    this.itemCurrencies.set(itemCurrencies.concat(newItems))
  }
  
  refreshAttributes() {
    
    const attributes = get(this.attributes);
    
    // Get all the attributes on the actor right now
    const newAttributes = SharingUtilities.getItemPileAttributesForActor(this.pileActor, this.recipientActor);
    
    if (!attributes.length && !newAttributes.length) {
      this.attributes.set([]);
      return;
    }
    
    // Loop through the old attributes
    for (let oldCurrency of attributes) {
      
      // If we find attribute that was previously listed
      const foundAttribute = newAttributes.find(newCurrency => newCurrency.path === oldCurrency.path);
      
      // We refresh the previously listed attribute to reflect this
      oldCurrency.quantity = foundAttribute ? foundAttribute.quantity : 0;
      oldCurrency.shareLeft = foundAttribute ? foundAttribute.shareLeft : 0;
      oldCurrency.currentQuantity = foundAttribute ? Math.max(1, Math.min(oldCurrency.currentQuantity, foundAttribute.shareLeft)) : 1;
      
      if (foundAttribute) {
        // We then remove it from the incoming list, as we already have it
        newAttributes.splice(newAttributes.indexOf(foundAttribute), 1)
      }
      
    }
    
    // Add the new attributes to the list
    this.attributes.set(attributes.concat(newAttributes));
    
  }
  
  async updatePile() {
    
    const itemsToUpdate = [];
    const itemsToDelete = [];
    const attributesToUpdate = {};
    
    const items = get(this.items).concat(get(this.itemCurrencies));
    for (let item of items) {
      if (item.quantity === 0) {
        itemsToDelete.push(item.id);
      } else {
        itemsToUpdate.push({
          _id: item.id,
          [game.itempiles.ITEM_QUANTITY_ATTRIBUTE]: item.quantity
        })
      }
    }
    
    const attributes = get(this.attributes);
    for (let attribute of attributes) {
      attributesToUpdate[attribute.path] = attribute.quantity;
    }
    
    const pileSharingData = SharingUtilities.getItemPileSharingData(this.pileActor);
    
    await this.pileActor.update(attributesToUpdate);
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
    
    await this.pileActor.updateEmbeddedDocuments("Item", itemsToUpdate);
    await this.pileActor.deleteEmbeddedDocuments("Item", itemsToDelete);
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
    
    await SharingUtilities.updateItemPileSharingData(this.pileActor, pileSharingData);
    
    Helpers.custom_notify("Item Pile successfully updated.");
    
    this.items.set([]);
    this.itemCurrencies.set([]);
    this.attributes.set([]);
    
    this.refresh();
    
  }
  
  take(data) {
    
    const quantity = Math.min(data.currentQuantity, data.quantity);
    
    if (data.id) {
      return game.itempiles.transferItems(
        this.pileActor,
        this.recipientActor,
        [{ _id: data.id, quantity }],
        { interactionId: this.interactionId }
      );
    }
    
    return game.itempiles.transferAttributes(
      this.pileActor,
      this.recipientActor,
      { [data.path]: quantity },
      { interactionId: this.interactionId }
    );
    
  }
  
  takeAll() {
    game.itempiles.transferEverything(
      this.pileActor,
      this.recipientActor,
      { interactionId: this.interactionId }
    );
  }
  
  splitAll() {
    game.itempiles.splitItemPileContents(this.pileActor);
  }
  
  closeContainer() {
    // TODO: close friggin container
  }
  
  filter(search) {
    
    const items = get(this.items);
    const attributes = get(this.attributes);
    
    items.forEach(item => {
      item.visible = !search || item.name.toLowerCase().includes(search.toLowerCase());
    });
    attributes.forEach(attributes => {
      attributes.visible = !search || attributes.name.toLowerCase().includes(search.toLowerCase());
    });
    
    this.items.set(items);
    this.attributes.set(attributes);
  }
}