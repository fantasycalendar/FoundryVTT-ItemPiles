import { writable, get } from 'svelte/store';
import * as Utilities from "../../helpers/utilities.js";

export default class TradingStore {
  
  constructor(leftTrader, rightTrader, publicTradeId, privateTradeId = false, isPrivate = false) {
    
    this.publicTradeId = publicTradeId;
    this.privateTradeId = privateTradeId;
    this.isPrivate = isPrivate;
    
    this.leftTraderUser = leftTrader.user;
    this.leftTraderActor = leftTrader.actor;
    this.leftTraderItems = writable(leftTrader.items ?? []);
    this.leftTraderCurrencies = writable(leftTrader.currencies ?? []);
    this.leftTraderItemCurrencies = writable(leftTrader.itemCurrencies ?? []);
    this.leftTraderAccepted = writable(leftTrader.accepted ?? false);
    
    this.rightTraderUser = rightTrader.user;
    this.rightTraderActor = rightTrader.actor;
    this.rightTraderItems = writable(rightTrader.items ?? []);
    this.rightTraderCurrencies = writable(rightTrader.currencies ?? []);
    this.rightTraderItemCurrencies = writable(rightTrader.itemCurrencies ?? []);
    this.rightTraderAccepted = writable(rightTrader?.accepted ?? false);
    
  }
  
  static import(leftTraderData, rightTraderData, publicTradeId) {
    
    const leftTrader = {
      user: game.users.get(leftTraderData.user),
      actor: Utilities.fromUuidFast(leftTraderData.actorUiid),
      items: leftTraderData.items,
      currencies: leftTraderData.currencies,
      itemCurrencies: leftTraderData.itemCurrencies,
      accepted: leftTraderData.accepted
    };
    
    const rightTrader = {
      user: game.users.get(rightTraderData.user),
      actor: Utilities.fromUuidFast(rightTraderData.actorUiid),
      items: rightTraderData.items,
      currencies: rightTraderData.currencies,
      itemCurrencies: rightTraderData.itemCurrencies,
      accepted: rightTraderData.accepted
    };
    
    return new this(leftTrader, rightTrader, publicTradeId);
  }
  
  export() {
    return [{
      userId: get(this.leftTraderUser.id),
      actorUiid: get(Utilities.getUuid(this.leftTraderActor)),
      items: get(this.leftTraderItems),
      currencies: get(this.leftTraderCurrencies),
      itemCurrencies: get(this.leftTraderItemCurrencies),
      accepted: get(this.leftTraderAccepted)
    }, {
      userId: get(this.rightTraderUser.id),
      actorUiid: get(Utilities.getUuid(this.rightTraderActor)),
      items: get(this.rightTraderItems),
      currencies: get(this.rightTraderCurrencies),
      itemCurrencies: get(this.rightTraderItemCurrencies),
      accepted: get(this.rightTraderAccepted)
    }, this.publicTradeId]
  }
  
  getTradeData() {
    return {
      remove: {
        actor: this.leftTraderActor,
        items: get(this.leftTraderItems).concat(get(this.leftTraderItemCurrencies)),
        attributes: get(this.leftTraderCurrencies)
      }, add: {
        actor: this.rightTraderActor,
        items: get(this.rightTraderItems).concat(get(this.rightTraderItemCurrencies)),
        attributes: get(this.rightTraderCurrencies)
      }
    };
  }
  
  get tradeIsAccepted() {
    return get(this.leftTraderAccepted) && get(this.rightTraderAccepted);
  }
  
  async toggleAccepted() {
    this.leftTraderAccepted.set(!get(this.leftTraderAccepted));
  }
  
  updateItems(userId, inItems) {
    this.leftTraderAccepted.set(false);
    this.rightTraderAccepted.set(false);
    const items = inItems.filter(item => !item.currency);
    const itemCurrencies = inItems.filter(item => item.currency);
    if (userId === this.rightTraderUser.id) {
      this.rightTraderItems.set(items)
      this.rightTraderItemCurrencies.set(itemCurrencies)
    }
  }
  
  updateCurrencies(userId, inCurrencies) {
    this.leftTraderAccepted.set(false);
    this.rightTraderAccepted.set(false);
    if (userId === this.rightTraderUser.id) {
      this.rightTraderCurrencies.set(inCurrencies)
    }
  }
  
  updateAcceptedState(userId, state) {
    if (userId === this.rightTraderUser.id) {
      this.rightTraderAccepted.set(state);
    }
  }
  
  async addItem(newItem, limitQuantity = true) {
    
    const items = get(this.leftTraderItems);
    
    const item = Utilities.findSimilarItem(items, newItem)
    
    if (!item) {
      items.push({
        id: newItem._id,
        name: newItem.name,
        img: newItem?.img ?? "",
        quantity: 1,
        maxQuantity: limitQuantity ? Utilities.getItemQuantity(newItem) : Infinity,
        data: newItem
      })
    } else {
      if (item.quantity >= Utilities.getItemQuantity(newItem)) return;
      item.quantity = Math.min(item.quantity + 1, Utilities.getItemQuantity(newItem));
    }
    
    this.leftTraderItems.set(items);
    
  }
  
  removeItem(removedItem) {
    
    const items = get(this.leftTraderItems)
      .filter(item => item.id !== removedItem.id);
    
    this.leftTraderItems.set(items);
    
  }
  
}