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
    this.quantity = writable(0);
    this.currentQuantity = writable(1);
    this.quantityLeft = writable(0);
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
  }
  
  setupSubscriptions() {
    super.setupSubscriptions();
    
    this.subscribeTo(this.store.shareData, () => {
      if (!this.toShare) {
        this.quantityLeft.set(get(this.quantity));
        return;
      }
      const quantityLeft = SharingUtilities.getItemSharesLeftForActor(this.store.source, this.item, this.store.recipient);
      this.quantityLeft.set(quantityLeft);
    });
    
    this.subscribeTo(this.itemDocument, () => {
      const { data } = this.itemDocument.updateOptions;
      this.id = this.item.id;
      this.name = this.item.name;
      this.img = this.item.img;
      this.type = this.item.type;
      this.identifier = this.item.name + "-" + this.item.type;
      this.similarities = Utilities.setSimilarityProperties({}, this.item);
      if (hasProperty(data, game.itempiles.ITEM_QUANTITY_ATTRIBUTE)) {
        this.quantity.set(Utilities.getItemQuantity(data));
        const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity));
        this.currentQuantity.set(quantity);
      }
    });
    
    this.subscribeTo(this.quantity, this.filter.bind(this));
    this.subscribeTo(this.store.search, this.filter.bind(this));
    this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));
  }
  
  setupProperties() {
    this.isCurrency = PileUtilities.isItemCurrency(this.item, { target: this.store.source });
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
    return game.itempiles.transferItems(
      this.store.source,
      this.store.recipient,
      [{ _id: this.id, quantity }],
      { interactionId: this.store.interactionId }
    );
  }
}

export class PileAttribute extends PileBaseItem {
  
  setupStores(attribute) {
    super.setupStores();
    this.attribute = attribute;
    this.path = this.attribute.path;
    this.name = this.attribute.name;
    this.img = this.attribute.img;
    this.identifier = this.attribute.path;
    this.presentFromTheStart.set(Number(getProperty(this.store.source.data, this.attribute.path) ?? 0) > 0);
    this.quantity.set(Number(getProperty(this.store.source.data, this.path) ?? 0));
    this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
  }
  
  setupSubscriptions() {
    super.setupSubscriptions();
    
    this.subscribeTo(this.store.shareData, (val) => {
      if (!this.toShare) {
        this.quantityLeft.set(get(this.quantity));
        return;
      }
      const quantityLeft = SharingUtilities.getAttributeSharesLeftForActor(this.store.source, this.path, this.store.recipient);
      this.quantityLeft.set(quantityLeft);
    });
    
    this.subscribeTo(this.store.document, () => {
      const { data } = this.store.document.updateOptions;
      this.path = this.attribute.path;
      this.name = this.attribute.name;
      this.img = this.attribute.img;
      this.identifier = this.attribute.path;
      if (hasProperty(data, this.path)) {
        this.quantity.set(Number(getProperty(data, this.path) ?? 0));
        this.currentQuantity.set(Math.min(get(this.currentQuantity), get(this.quantityLeft), get(this.quantity)));
      }
    });
    
    this.subscribeTo(this.quantity, this.filter.bind(this));
    this.subscribeTo(this.store.search, this.filter.bind(this));
    this.subscribeTo(this.store.pileData, this.setupProperties.bind(this));
  }
  
  setupProperties() {
    this.toShare = get(this.store.pileData).shareCurrenciesEnabled && !!this.store.recipient;
  }
  
  filter() {
    const search = get(this.store.search);
    const presentFromTheSTart = get(this.presentFromTheStart);
    const quantity = get(this.quantity);
    if (quantity === 0 && !presentFromTheSTart && !this.store.editQuantities) {
      this.filtered.set(true);
    } else if (search) {
      this.filtered.set(!this.name.toLowerCase().includes(search.toLowerCase()));
    } else {
      this.filtered.set(!presentFromTheSTart && quantity === 0 && !this.store.editQuantities);
    }
  }
  
  take() {
    const quantity = Math.min(get(this.currentQuantity), get(this.quantityLeft));
    return game.itempiles.transferAttributes(
      this.store.source,
      this.store.recipient,
      { [this.path]: quantity },
      { interactionId: this.interactionId }
    );
  }
  
}