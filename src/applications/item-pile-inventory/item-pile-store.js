import { writable, get } from 'svelte/store';
import * as Utilities from "../../helpers/utilities.js";
import * as SharingUtilities from "../../helpers/sharing-utilities.js";
import * as PileUtilities from "../../helpers/pile-utilities.js";

export default class ItemPileStore {
  
  constructor(pileActor, recipientActor) {
    this.interactionId = randomID();
    this.pileActor = pileActor;
    this.recipientActor = recipientActor;
    this.pileData = PileUtilities.getActorFlagData(pileActor)
    
    this.attributes = writable([]);
    this.items = writable([]);
    this.search = writable("");
    this.editQuantities = writable(!recipientActor && pileActor.isOwner && game.user.isGM);
    
    const searchDebounce = debounce((str) => {
      this.filter(str);
    }, 300);
    
    this.search.subscribe((str) => {
      searchDebounce(str);
    });
    
    this.update();
    
  }
  
  update() {
    this.updateItems();
    this.updateAttributes();
  }
  
  updateItems() {
    
    const items = get(this.items);
    
    // Get all the items on the actor right now
    const newItems = SharingUtilities.getItemPileItemsForActor(this.pileActor, this.recipientActor);
    
    if (!items.length) {
      this.items.set(newItems);
      return;
    }
    
    // If there are none, stop displaying them in the UI
    if (!newItems.length) {
      this.items.set([]);
      return;
    }
    
    // Otherwise, loop through the old items
    for (let oldItem of items) {
      
      // If we find an item that was previously listed
      const foundItem = Utilities.findSimilarItem(newItems, oldItem);
      
      // We update the previously listed attribute to reflect this
      oldItem.quantity = foundItem ? foundItem.quantity : 0;
      oldItem.shareLeft = foundItem ? foundItem.shareLeft : 0;
      oldItem.currentQuantity = foundItem ? Math.min(oldItem.currentQuantity, foundItem.shareLeft) : 0;
      
      // We then remove it from the incoming list, as we already have it
      if (foundItem) {
        newItems.splice(newItems.indexOf(foundItem), 1)
      }
      
    }
    
    // Add the new items to the list
    this.items.set(items.concat(newItems));
    
  }
  
  updateAttributes() {
    
    const attributes = get(this.attributes);
    
    // Get all the attributes on the actor right now
    const newAttributes = SharingUtilities.getItemPileAttributesForActor(this.pileActor, this.recipientActor);
    
    console.log(newAttributes);
    
    if (!attributes) {
      this.attributes.set(newAttributes);
      return;
    }
    
    // If there are none, stop displaying them in the UI
    if (!newAttributes.length) {
      this.attributes.set([]);
      return;
    }
    
    // Otherwise, loop through the old attributes
    for (let oldCurrency of attributes) {
      
      // If we find attribute that was previously listed
      const foundAttribute = newAttributes.find(newCurrency => newCurrency.path === oldCurrency.path);
      
      // We update the previously listed attribute to reflect this
      oldCurrency.quantity = foundAttribute ? foundAttribute.quantity : 0;
      oldCurrency.shareLeft = foundAttribute ? foundAttribute.shareLeft : 0;
      oldCurrency.currentQuantity = foundAttribute ? Math.min(oldCurrency.currentQuantity, foundAttribute.shareLeft) : 0;
      
      if (foundAttribute) {
        // We then remove it from the incoming list, as we already have it
        newAttributes.splice(newAttributes.indexOf(foundAttribute), 1)
      }
      
    }
    
    // Add the new attributes to the list
    this.attributes.set(attributes.concat(newAttributes));
    
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