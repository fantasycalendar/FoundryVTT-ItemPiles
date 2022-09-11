import { get, writable } from "svelte/store";
import * as Utilities from "../helpers/utilities.js";
import { TJSDocument } from '@typhonjs-fvtt/runtime/svelte/store';
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";

class PileBaseItem {
  
  constructor(store, data) {
    this.store = store;
    this.subscriptions = [];
    this.setup(data);
  }
  
  setupStores() {
    this.quantity = writable(1);
    this.currentQuantity = writable(1);
    this.quantityLeft = writable(1);
    this.filtered = writable(true);
    this.presentFromTheStart = writable(false);
  }
  
  setupSubscriptions() {
    // Higher order implementation
  }
  
  setup(data) {
    this.unsubscribe();
    this.setupStores(data);
    this.setupSubscriptions(data);
  }
  
  subscribeTo(target, callback) {
    this.subscriptions.push(target.subscribe(callback));
  }
  
  unsubscribe() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}

export class PileItem extends PileBaseItem {
  
  setupStores(item) {
    super.setupStores();
    this.item = item;
    this.itemDocument = new TJSDocument(this.item);
    this.presentFromTheStart.set(Utilities.getItemQuantity(this.item) > 0);
    this.quantity.set(Utilities.getItemQuantity(this.item));
    this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
    this.id = this.item.id;
    this.type = this.item.type;
    this.name = writable(this.item.name);
    this.img = writable(this.item.img);
    this.abbreviation = this.item.abbreviation;
    this.identifier = this.id;
  }
  
  setupSubscriptions() {
    super.setupSubscriptions()
    
    this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));
    
    this.subscribeTo(this.store.shareData, () => {
      if (!this.toShare) {
        this.quantityLeft.set(get(this.quantity));
        return;
      }
      const quantityLeft = SharingUtilities.getItemSharesLeftForActor(this.store.actor, this.item, this.store.recipient);
      this.quantityLeft.set(quantityLeft);
    });
    
    this.subscribeTo(this.itemDocument, () => {
      const { data } = this.itemDocument.updateOptions;
      this.name.set(this.item.name);
      this.img.set(this.item.img);
      this.similarities = Utilities.setSimilarityProperties({}, this.item);
      if (hasProperty(data, game.itempiles.ITEM_QUANTITY_ATTRIBUTE)) {
        this.quantity.set(Utilities.getItemQuantity(data));
        const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity));
        this.currentQuantity.set(quantity);
      }
    });
    
    this.subscribeTo(this.quantity, this.filter.bind(this));
    this.subscribeTo(this.store.search, this.filter.bind(this));
  }
  
  setupProperties() {
    this.isCurrency = PileUtilities.isItemCurrency(this.item, { target: this.store.actor });
    this.similarities = Utilities.setSimilarityProperties({}, this.item);
    this.toShare = this.isCurrency
      ? get(this.store.pileData).shareCurrenciesEnabled && !!this.store.recipient
      : get(this.store.pileData).shareItemsEnabled && !!this.store.recipient;
  }
  
  filter() {
    const search = get(this.store.search);
    const presentFromTheSTart = get(this.presentFromTheStart);
    const quantity = get(this.quantity);
    if (quantity === 0 && !presentFromTheSTart) {
      this.filtered.set(true);
    } else if (search) {
      this.filtered.set(!this.name.toLowerCase().includes(search.toLowerCase()));
    } else {
      this.filtered.set(!presentFromTheSTart && quantity === 0);
    }
  }
  
  
  take() {
    const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft));
    if (!quantity) return;
    return game.itempiles.transferItems(
      this.store.actor,
      this.store.recipient,
      [{ _id: this.id, quantity }],
      { interactionId: this.store.interactionId }
    );
  }
  
  updateQuantity(quantity) {
    const roll = new Roll(quantity).evaluate({ async: false });
    this.quantity.set(roll.total);
    return this.item.update({
      [game.itempiles.ITEM_QUANTITY_ATTRIBUTE]: roll.total
    });
  }
}

export class PileAttribute extends PileBaseItem {
  
  setupStores(attribute) {
    super.setupStores();
    this.attribute = attribute;
    this.path = this.attribute.path;
    this.name = writable(this.attribute.name);
    this.img = writable(this.attribute.img);
    this.abbreviation = this.attribute.abbreviation;
    this.identifier = this.attribute.path;
    this.presentFromTheStart.set(Number(getProperty(this.store.actor.data, this.attribute.path) ?? 0) > 0);
    this.quantity.set(Number(getProperty(this.store.actor.data, this.path) ?? 0));
    this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
  }
  
  setupSubscriptions() {
    super.setupSubscriptions();
    
    this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));
    
    this.subscribeTo(this.store.shareData, (val) => {
      if (!this.toShare) {
        this.quantityLeft.set(get(this.quantity));
        return;
      }
      const quantityLeft = SharingUtilities.getAttributeSharesLeftForActor(this.store.actor, this.path, this.store.recipient);
      this.quantityLeft.set(quantityLeft);
    });
    
    this.subscribeTo(this.store.document, () => {
      const { data } = this.store.document.updateOptions;
      this.path = this.attribute.path;
      this.name.set(this.attribute.name);
      this.img.set(this.attribute.img);
      if (hasProperty(data, this.path)) {
        this.quantity.set(Number(getProperty(data, this.path) ?? 0));
        this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
      }
    });
    
    this.subscribeTo(this.quantity, this.filter.bind(this));
    this.subscribeTo(this.store.search, this.filter.bind(this));
  }
  
  setupProperties() {
    this.toShare = get(this.store.pileData).shareCurrenciesEnabled && !!this.store.recipient;
  }
  
  filter() {
    const name = get(this.name);
    const search = get(this.store.search);
    const presentFromTheSTart = get(this.presentFromTheStart);
    const quantity = get(this.quantity);
    if (quantity === 0 && !presentFromTheSTart && !this.store.editQuantities) {
      this.filtered.set(true);
    } else if (search) {
      this.filtered.set(!name.toLowerCase().includes(search.toLowerCase()));
    } else {
      this.filtered.set(!presentFromTheSTart && quantity === 0 && !this.store.editQuantities);
    }
  }
  
  take() {
    const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft));
    return game.itempiles.transferAttributes(
      this.store.actor,
      this.store.recipient,
      { [this.path]: quantity },
      { interactionId: this.interactionId }
    );
  }
  
  updateQuantity() {
    return this.store.actor.update({
      [this.path]: get(this.quantity)
    });
  }
  
}