import { writable, get } from 'svelte/store';

export default class CurrencyStore {
  
  constructor() {
    
    this.attributes = writable([]);
    this.items = writable([]);
    this.primary = writable(false)
    
  }
  
  setPrimary(index, item = false) {
    const attributes = get(this.attributes);
    const items = get(this.items);
    
    items.forEach(item => {
      item.primary = false;
    });
    attributes.forEach(attr => {
      attr.primary = false;
    });
    
    if (item) {
      items[index].primary = true;
    } else {
      attributes[index].primary = true;
    }
    this.primary.set(true);
    
    this.attributes.set(attributes);
    this.items.set(items);
  }
  
  export() {
    return {
      attributes: get(this.attributes),
      items: get(this.items)
    };
  }
  
}