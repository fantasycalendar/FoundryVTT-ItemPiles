import { get, writable } from "svelte/store";
import * as PileUtilities from "../../helpers/pile-utilities.js";
import * as Utilities from "../../helpers/utilities.js";

export default class MerchantStore {
  
  constructor(merchant, buyer) {
    
    this.merchant = merchant;
    this.buyer = buyer;
    this.merchantData = PileUtilities.getActorFlagData(merchant);
    
    this.items = writable([]);
    this.categories = writable([]);
    
    this.description = writable("");
    this.description.set(this.merchant.data.data.details.biography.value);
    
    this.search = writable("");
    this.editQuantities = writable(!buyer && merchant.isOwner && game.user.isGM);
    
    const searchDebounce = debounce((str) => {
      this.filter(str);
    }, 300);
    
    this.search.subscribe((str) => {
      searchDebounce(str);
    });
    
    this.refresh();
    
  }
  
  refresh() {
    this.refreshItems();
  }
  
  refreshItems() {
    
    const items = PileUtilities.getMerchantItemsForActor(this.merchant, this.buyer);
    
    items.sort((a, b) => {
      return CONFIG.Item.typeLabels[a.type] < CONFIG.Item.typeLabels[b.type] || a.name < b.name ? -1 : 1;
    });
    
    const categories = [...new Set(items.map(item => item.type))].map(type => ({
      type, label: CONFIG.Item.typeLabels[type]
    }));
    
    this.categories.set(categories);
    
    this.items.set(items);
    
    console.log(get(this.categories))
    console.log(get(this.items))
    
  }
  
  filter(search) {
    
    const items = get(this.items);
    
    items.forEach(item => {
      item.visible = !search || item.name.toLowerCase().includes(search.toLowerCase());
    });
    
    this.items.set(items);
  }
  
}