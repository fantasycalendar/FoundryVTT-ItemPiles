import { writable, get } from 'svelte/store';

export default class CurrencyStore {
  
  constructor(data) {
    this.currencies = writable(data.map((entry, index) => {
      return {
        ...entry,
        index
      }
    }));
  }
  
  setPrimary(index) {
    const currencies = get(this.currencies);
    currencies.forEach((entry, entryIndex) => {
      entry.primary = entryIndex === index;
    });
    this.currencies.set(currencies);
  }
  
  export() {
    return get(this.currencies);
  }
  
}