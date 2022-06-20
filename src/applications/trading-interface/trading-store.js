import { writable, get } from 'svelte/store';
import * as Utilities from "../../helpers/utilities.js";
import * as SharingUtilities from "../../helpers/sharing-utilities.js";
import * as PileUtilities from "../../helpers/pile-utilities.js";
import ItemPileSocket from "../../socket.js";

export default class TradingStore {
  
  constructor(leftTrader, rightTrader, publicTradeId, privateTradeId, isPrivate) {
    
    this.publicTradeId = publicTradeId;
    this.privateTradeId = privateTradeId;
    this.isPrivate = isPrivate;
    
    this.leftTraderUser = leftTrader.user;
    this.leftTraderActor = leftTrader.actor;
    this.leftTraderItems = writable([]);
    this.leftTraderCurrencies = writable([]);
    this.leftTraderItemCurrencies = writable([]);
    this.leftTraderAccepted = writable(false);
    
    this.rightTraderUser = rightTrader.user;
    this.rightTraderActor = rightTrader.actor;
    this.rightTraderItems = writable([]);
    this.rightTraderCurrencies = writable([]);
    this.rightTraderItemCurrencies = writable([]);
    this.rightTraderAccepted = writable(false);
    
  }
  
  getTradeData() {
    return {
      remove: {
        actor: this.leftTraderActor,
        items: get(this.leftTraderItems).concat(get(this.leftTraderItemCurrencies)),
        attributes: get(this.leftTraderCurrencies)
      },
      add: {
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
    const acceptedState = get(this.leftTraderAccepted);
    await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_STATE, [this.leftTraderUser.id, this.rightTraderUser.id], this.privateTradeId, game.user.id, !acceptedState);
    return this.executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_STATE, this.publicTradeId, game.user.id, !acceptedState);
  }
  
  updateItems(userId, inItems) {
    this.leftTraderAccepted.set(false);
    this.rightTraderAccepted.set(false);
    const items = inItems.filter(item => !item.currency);
    const itemCurrencies = inItems.filter(item => item.currency);
    if (userId === this.leftTraderUser.id) {
      this.leftTraderItems.set(items)
      this.leftTraderItemCurrencies.set(itemCurrencies)
    } else if (userId === this.rightTraderUser.id) {
      this.rightTraderItems.set(items)
      this.rightTraderItemCurrencies.set(itemCurrencies)
    }
  }
  
  updateCurrencies(userId, inCurrencies) {
    this.leftTraderAccepted.set(false);
    this.rightTraderAccepted.set(false);
    if (userId === this.leftTraderUser.id) {
      this.leftTraderCurrencies.set(inCurrencies)
    } else if (userId === this.rightTraderUser.id) {
      this.rightTraderCurrencies.set(inCurrencies)
    }
  }
  
  updateAcceptedState(userId, state) {
    if (userId === this.leftTraderUser.id) {
      this.leftTraderAccepted.set(state);
    } else if (userId === this.rightTraderUser.id) {
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
    
    await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_UPDATE_ITEMS, [this.leftTraderUser.id, this.rightTraderUser.id], this.privateTradeId, game.user.id, items);
    return this.executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_UPDATE_ITEMS, this.publicTradeId, game.user.id, items);
    
  }
  
  async executeSocketAction(socketHandler, ...args) {
    if (this.isPrivate) {
      return ItemPileSocket.executeForUsers(socketHandler, [this.leftTraderUser.id, this.rightTraderUser.id], ...args);
    }
    return ItemPileSocket.executeForEveryone(socketHandler, ...args);
  }
  
}