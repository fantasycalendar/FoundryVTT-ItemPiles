import SETTINGS from "../constants/settings.js";
import * as Helpers from "../helpers/helpers.js";
import CONSTANTS from "../constants/constants.js";
import HOOKS from "../constants/hooks.js";
import ItemPileSocket from "../socket.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as Utilities from "../helpers/utilities.js";

export default class ChatAPI {
  
  static initialize() {
    
    Hooks.on("preCreateChatMessage", this._preCreateChatMessage.bind(this));
    Hooks.on("renderChatMessage", this._renderChatMessage.bind(this));
    Hooks.on(HOOKS.ITEM.TRANSFER, this._outputTransferItem.bind(this));
    Hooks.on(HOOKS.ATTRIBUTE.TRANSFER, this._outputTransferCurrency.bind(this));
    Hooks.on(HOOKS.TRANSFER_EVERYTHING, this._outputTransferEverything.bind(this));
    Hooks.on(HOOKS.PILE.SPLIT_INVENTORY, this._outputSplitItemPileInventory.bind(this));
    Hooks.on(HOOKS.TRADE.STARTED, this._outputTradeStarted.bind(this));
    Hooks.on(HOOKS.TRADE.COMPLETE, this._outputTradeComplete.bind(this));
    
    $(document).on("click", ".item-piles-chat-card .item-piles-collapsible", async function () {
      if ($(this).attr("open")) return;
      await Helpers.wait(25);
      $(this).parent()[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
  }
  
  static _preCreateChatMessage(chatMessage) {
    
    if (!Helpers.getSetting(SETTINGS.ENABLE_TRADING)) return;
    
    const content = chatMessage.data.content.toLowerCase();
    
    if (!(content.startsWith("!itempiles") || content.startsWith("!ip"))) return;
    
    const args = content.split(" ").slice(1);
    
    if (args[0] === "trade") {
      setTimeout(() => {
        game.itempiles.requestTrade();
      });
    }
    
    return false;
    
  }
  
  static _renderChatMessage(app, html) {
    html.find(".item-piles-specate-trade").click(function () {
      game.itempiles.spectateTrade($(this).data());
    });
  }
  
  static _disableTradingButton(publicTradeId) {
    const message = Array.from(game.messages).find(message => {
      return getProperty(message.data, CONSTANTS.FLAGS.PUBLIC_TRADE_ID) === publicTradeId;
    });
    if (!message) return;
    const html = $(message.data.content);
    html.find(".item-piles-specate-trade")
      .prop('disabled', true)
      .text(game.i18n.localize("ITEM-PILES.Chat.SpectateDisabled"));
    return message.update({
      content: html.prop("outerHTML")
    })
  }
  
  
  /**
   * Outputs to chat based on transferring an item from or to an item pile
   *
   * @param source
   * @param target
   * @param items
   * @param userId
   * @param interactionId
   * @returns {Promise}
   */
  static async _outputTransferItem(source, target, items, userId, interactionId) {
    if (!PileUtilities.isValidItemPile(source)) return;
    if (!interactionId || game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    const itemData = await this._formatItemData(items);
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, [], userId, interactionId);
  }
  
  /**
   * Outputs to chat based on transferring a currency from or to an item pile
   *
   * @param source
   * @param target
   * @param currencies
   * @param userId
   * @param interactionId
   * @returns {Promise}
   */
  static async _outputTransferCurrency(source, target, currencies, userId, interactionId) {
    if (!PileUtilities.isValidItemPile(source)) return;
    if (!interactionId || game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    const currencyData = this._formatCurrencyData(source, currencies);
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, [], currencyData, userId, interactionId);
  }
  
  /**
   * Outputs to chat based on transferring everything from or to an item pile
   *
   * @param source
   * @param target
   * @param items
   * @param currencies
   * @param userId
   * @param interactionId
   * @returns {Promise}
   */
  static async _outputTransferEverything(source, target, items, currencies, userId, interactionId) {
    if (!PileUtilities.isValidItemPile(source)) return;
    if (!interactionId || game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    const itemData = await this._formatItemData(items);
    const currencyData = this._formatCurrencyData(source, currencies);
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, currencyData, userId, interactionId);
  }
  
  static _outputSplitItemPileInventory(source, transferData, userId) {
    if (!PileUtilities.isValidItemPile(source)) return;
    if (game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.SPLIT_CHAT_MESSAGE, source.uuid, transferData, userId);
  }
  
  static async _outputTradeStarted(party_1, party_2, publicTradeId, isPrivate) {
    if (party_1.user !== game.user.id || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT) || isPrivate) return;
    return this._outputTradeStartedToChat(party_1, party_2, publicTradeId);
  }
  
  static async _outputTradeComplete(party_1, party_2, publicTradeId, isPrivate) {
    if (!Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    return this._outputTradeCompleteToChat(party_1, party_2, publicTradeId, isPrivate);
  }
  
  /**
   * Formats item data to a chat friendly structure
   *
   * @param items
   * @returns {Promise<Array>}
   */
  static async _formatItemData(items) {
    const formattedItems = [];
    for (const itemData of items) {
      const tempItem = await Item.implementation.create(itemData.item, { temporary: true });
      formattedItems.push({
        name: game.i18n.localize(tempItem.name),
        img: itemData.item.img ?? "",
        quantity: itemData.quantity
      });
    }
    return formattedItems;
  }
  
  /**
   * Formats currency data to a chat friendly structure
   *
   * @param itemPile
   * @param currencies
   * @returns {Array}
   */
  static _formatCurrencyData(itemPile, currencies) {
    const currencyList = PileUtilities.getActorCurrencyAttributes(itemPile);
    return Object.entries(currencies).map(entry => {
      const currency = currencyList.find(currency => currency.path === entry[0]);
      return {
        name: game.i18n.localize(currency.name),
        img: currency.img ?? "",
        quantity: entry[1],
        index: currencyList.indexOf(currency)
      }
    });
  }
  
  /**
   * Outputs the transferred data in chat
   *
   * @param sourceUuid
   * @param targetUuid
   * @param items
   * @param currencies
   * @param userId
   * @param interactionId
   * @returns {Promise}
   */
  static async _outputPickupToChat(sourceUuid, targetUuid, items, currencies, userId, interactionId) {
    
    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);
    
    const now = (+new Date());
    
    // Get all messages younger than 3 hours, and grab the last 10, then reverse them (latest to oldest)
    const messages = Array.from(game.messages).filter(message => (now - message.data.timestamp) <= (10800000)).slice(-10);
    messages.reverse()
    
    for (let [index, message] of messages.entries()) {
      const flags = getProperty(message.data, CONSTANTS.FLAGS.PILE);
      if (flags && flags.source === sourceUuid && flags.target === targetUuid && (flags.interactionId === interactionId || index === 0)) {
        return this._updateExistingPickupMessage(message, sourceActor, targetActor, items, currencies, interactionId)
      }
    }
    
    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/looted.html", {
      message: game.i18n.format("ITEM-PILES.Chat.Pickup", { name: targetActor.name }),
      itemPile: sourceActor,
      actor: targetActor,
      items: items,
      currencies: currencies
    });
    
    return this._createNewChatMessage(userId, {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: chatCardHtml,
      flavor: "Item Piles",
      speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
      [CONSTANTS.FLAGS.PILE]: {
        source: sourceUuid,
        target: targetUuid,
        items: items,
        currencies: currencies,
        interactionId: interactionId
      }
    })
    
  }
  
  static _matchEntries(existingEntries, incomingEntries) {
    
    const combinedEntries = existingEntries.map(existingEntry => {
      const foundEntry = incomingEntries.find(item => item.name === existingEntry.name && existingEntry.img === item.img);
      if (foundEntry) {
        existingEntry.quantity += foundEntry.quantity;
        incomingEntries.splice(incomingEntries.indexOf(foundEntry), 1)
      }
      return existingEntry;
    });
    
    incomingEntries.forEach(item => combinedEntries.push(item));
    
    return combinedEntries;
    
  }
  
  static async _updateExistingPickupMessage(message, sourceActor, targetActor, items, currencies, interactionId) {
    
    const flags = getProperty(message.data, CONSTANTS.FLAGS.PILE);
    
    const newItems = this._matchEntries(flags.items, items);
    const newCurrencies = this._matchEntries(flags.currencies, currencies);
    
    newCurrencies.sort((a, b) => {
      return a.index - b.index;
    })
    
    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/looted.html", {
      message: game.i18n.format("ITEM-PILES.Chat.Pickup", { name: targetActor.name }),
      itemPile: sourceActor,
      actor: targetActor,
      items: newItems,
      currencies: newCurrencies
    });
    
    return message.update({
      content: chatCardHtml,
      [`${CONSTANTS.FLAGS.PILE}.interactionId`]: interactionId,
      [`${CONSTANTS.FLAGS.PILE}.items`]: newItems,
      [`${CONSTANTS.FLAGS.PILE}.currencies`]: newCurrencies,
    });
    
  }
  
  static async _outputSplitToChat(sourceUuid, transferData, userId) {
    
    const source = await fromUuid(sourceUuid);
    
    const sourceActor = source?.actor ?? source;
    
    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/looted.html", {
      message: game.i18n.format("ITEM-PILES.Chat.Split", { num_players: transferData.num_players }),
      itemPile: sourceActor,
      items: transferData.items,
      currencies: transferData.currencies
    });
    
    return this._createNewChatMessage(userId, {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: chatCardHtml,
      flavor: "Item Piles",
      speaker: ChatMessage.getSpeaker({ alias: game.user.name })
    });
    
  }
  
  static async _outputTradeStartedToChat(party_1, party_2, publicTradeId) {
    
    const party_1_actor = Utilities.getActor(party_1.actor);
    const party_2_actor = Utilities.getActor(party_2.actor);
    
    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/trade-started.html", {
      party_1_actor,
      party_2_actor,
      publicTradeId,
      userId: game.user.id
    });
    
    return this._createNewChatMessage(game.user.id, {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: chatCardHtml,
      flavor: "Item Piles",
      speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
      [`flags.${CONSTANTS.MODULE_NAME}`]: {
        publicTradeId,
        tradeUsers: [party_1.user, party_2.user]
      }
    });
  }
  
  static async _outputTradeCompleteToChat(party_1, party_2, publicTradeId, isPrivate) {
    
    if (party_1.user !== game.user.id) return;
    
    let party_1_actor = await fromUuid(party_1.actor);
    party_1_actor = party_1_actor?.actor ?? party_1_actor;
    const party_1_data = {
      actor: party_1_actor,
      items: party_2.items,
      currencies: party_2.currencies
    }
    party_1_data.got_nothing = !party_1_data.items.length && !party_1_data.currencies.length;
    
    let party_2_actor = await fromUuid(party_2.actor);
    party_2_actor = party_2_actor?.actor ?? party_2_actor;
    const party_2_data = {
      actor: party_2_actor,
      items: party_1.items,
      currencies: party_1.currencies
    }
    party_2_data.got_nothing = !party_2_data.items.length && !party_2_data.currencies.length;
    
    if (party_1.got_nothing && party_2.got_nothing) return;
    
    const enableCollapse = (party_1_data.items.length + party_1_data.currencies.length + party_2_data.items.length + party_2_data.currencies.length) > 6;
    
    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/trade-complete.html", {
      party_1: party_1_data,
      party_2: party_2_data,
      publicTradeId,
      isPrivate,
      enableCollapse
    });
    
    return this._createNewChatMessage(game.user.id, {
      user: game.user.id,
      type: isPrivate ? CONST.CHAT_MESSAGE_TYPES.WHISPER : CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: chatCardHtml,
      flavor: "Item Piles" + (isPrivate ? ": " + game.i18n.localize("ITEM-PILES.Chat.PrivateTrade") : ""),
      speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
      whisper: isPrivate ? [party_2.user] : []
    });
    
  }
  
  static _createNewChatMessage(userId, chatData) {
    
    if (!chatData.whisper) {
      
      const mode = Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT);
      
      if (mode > 1) {
        chatData.whisper = Array.from(game.users)
          .filter(user => user.isGM)
          .map(user => user.id);
        if (mode === 2) {
          chatData.whisper.push(userId);
        }
        chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      }
      
    }
    
    return ChatMessage.create(chatData);
    
  }
  
}