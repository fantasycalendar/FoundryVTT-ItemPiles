import SETTINGS from "../constants/settings.js";
import * as Helpers from "../helpers/helpers.js";
import CONSTANTS from "../constants/constants.js";
import ItemPileSocket from "../socket.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as Utilities from "../helpers/utilities.js";
import TradeAPI from "./trade-api.js";
import { isItemPileLootable } from "../helpers/pile-utilities.js";

export default class ChatAPI {

  static initialize() {

    Helpers.hooks.on("preCreateChatMessage", this._preCreateChatMessage.bind(this));
    Helpers.hooks.on("renderChatMessage", this._renderChatMessage.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.ITEM.TRANSFER, this._outputTransferItem.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.ATTRIBUTE.TRANSFER, this._outputTransferCurrency.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.TRANSFER_EVERYTHING, this._outputTransferEverything.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.PILE.SPLIT_INVENTORY, this._outputSplitItemPileInventory.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.TRADE.STARTED, this._outputTradeStarted.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.TRADE.COMPLETE, this._outputTradeComplete.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.ITEM.TRADE, this._outputMerchantTradeComplete.bind(this));
    Helpers.hooks.on(CONSTANTS.HOOKS.ITEM.GIVE, this._outputGiveItem.bind(this));

    $(document).on("click", ".item-piles-chat-card .item-piles-collapsible", async function () {
      if ($(this).attr("open")) return;
      await Helpers.wait(25);
      $(this).parent()[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
  }

  static _preCreateChatMessage(chatMessage) {

    if (!Helpers.getSetting(SETTINGS.ENABLE_TRADING)) return;

    const content = chatMessage.content.toLowerCase();

    if (!(content.startsWith("!itempiles") || content.startsWith("!ip"))) return;

    const args = content.split(" ").slice(1);

    if (args[0] === "trade") {
      setTimeout(() => {
        game.itempiles.API.requestTrade();
      });
    }

    return false;

  }

  static _renderChatMessage(app, html) {
    html.find(".item-piles-specate-trade").click(function () {
      game.itempiles.API.spectateTrade($(this).data());
    });
  }

  static _disableTradingButton(publicTradeId) {
    const message = Array.from(game.messages).find(message => {
      return getProperty(message, CONSTANTS.FLAGS.PUBLIC_TRADE_ID) === publicTradeId;
    });
    if (!message) return;
    const update = this._replaceChatContent(message);
    return message.update(update)
  }

  static async disablePastTradingButtons() {
    if (!game.user.isGM) return;

    const messages = Array.from(game.messages).filter(message => {
      return getProperty(message, CONSTANTS.FLAGS.PUBLIC_TRADE_ID);
    });

    if (!messages.length) return;
    const updates = [];
    for (let message of messages) {
      const update = this._replaceChatContent(message);
      const tradeId = getProperty(message, CONSTANTS.FLAGS.PUBLIC_TRADE_ID);
      const tradeUsers = getProperty(message, CONSTANTS.FLAGS.TRADE_USERS);
      const bothUsersActive = tradeUsers.filter(userId => game.users.get(userId).active).length === tradeUsers.length;
      if (!bothUsersActive) {
        updates.push(update);
      } else {
        const otherUsers = tradeUsers.filter(userId => userId !== game.user.id);
        const tradeData = await TradeAPI._requestTradeData({ tradeId, tradeUser: otherUsers[0] });
        if (!tradeData) {
          updates.push(update);
        }
      }
    }

    if (!updates.length) return;

    return ChatMessage.updateDocuments(updates);

  }

  static _replaceChatContent(message) {
    const tradeId = getProperty(message, CONSTANTS.FLAGS.PUBLIC_TRADE_ID);
    const stringToFind = `data-trade-id="${tradeId}"`;
    let content = message.content;
    content = content.replace(stringToFind, "");
    content = content.replace(stringToFind, "disabled");
    content = content.replace(game.i18n.localize("ITEM-PILES.Chat.TradeSpectate"), game.i18n.localize("ITEM-PILES.Chat.SpectateDisabled"));
    return {
      _id: message.id,
      content,
      [`flags.-=${CONSTANTS.MODULE_NAME}`]: null
    };
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
    if (!PileUtilities.isItemPileLootable(source)) return;
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
    if (!PileUtilities.isItemPileLootable(source)) return;
    if (!interactionId || game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    const currencyData = this._formatCurrencyData(source, currencies);
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, [], currencyData, userId, interactionId);
  }

  /**
   * Outputs to chat based on giving an item from one actor to another
   *
   * @param source
   * @param target
   * @param item
   * @param userId
   * @returns {Promise}
   */
  static async _outputGiveItem(source, target, item, userId) {
    if (game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    const itemData = await this._formatItemData([item]);
    return this._giveChatMessage(source, target, itemData, userId);
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
    if (!PileUtilities.isItemPileLootable(source)) return;
    if (!interactionId || game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    const itemData = await this._formatItemData(items);
    const currencyData = this._formatCurrencyData(source, currencies);
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, currencyData, userId, interactionId);
  }

  static _outputSplitItemPileInventory(source, pileDeltas, actorDeltas, userId) {
    if (!PileUtilities.isItemPileLootable(source)) return;
    if (game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.SPLIT_CHAT_MESSAGE, source.uuid, pileDeltas, actorDeltas, userId);
  }

  static async _outputTradeStarted(party_1, party_2, publicTradeId, isPrivate) {
    if (party_1.user !== game.user.id || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT) || isPrivate) return;
    return this._outputTradeStartedToChat(party_1, party_2, publicTradeId);
  }

  static async _outputTradeComplete(instigator, party_1, party_2, publicTradeId, isPrivate) {
    if (!Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    return this._outputTradeCompleteToChat(instigator, party_1, party_2, publicTradeId, isPrivate);
  }

  static async _outputMerchantTradeComplete(source, target, priceInformation, userId, interactionId) {
    if (!Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    if (!PileUtilities.isItemPileMerchant(source)) return;
    if (!interactionId || game.user.id !== userId || !Helpers.getSetting(SETTINGS.OUTPUT_TO_CHAT)) return;
    return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.MERCHANT_TRADE_CHAT_MESSAGE, source.uuid, target.uuid, priceInformation, userId, interactionId);
  }

  /**
   * Formats item data to a chat friendly structure
   *
   * @param items
   * @param divideBy
   * @returns {Promise<Array>}
   */
  static async _formatItemData(items, divideBy = 1) {
    const formattedItems = [];
    for (const itemData of items) {
      const tempItem = await Item.implementation.create(itemData.item, { temporary: true });
      formattedItems.push({
        name: game.i18n.localize(tempItem.name),
        img: tempItem.img ?? itemData?.item?.img ?? "",
        quantity: Math.abs(itemData.quantity) / divideBy
      });
    }
    return formattedItems;
  }

  /**
   * Formats currency data to a chat friendly structure
   *
   * @param itemPile
   * @param currencies
   * @param divideBy
   * @returns {Array}
   */
  static _formatCurrencyData(itemPile, currencies, divideBy = 1) {
    const currencyList = PileUtilities.getActorCurrencies(itemPile, { getAll: true });
    return Object.entries(currencies).map(entry => {
      const currency = currencyList.find(currency => currency.id === entry[0]);
      return {
        name: game.i18n.localize(currency.name),
        img: currency.img ?? "",
        quantity: Math.abs(entry[1]) / divideBy,
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
    const messages = Array.from(game.messages).filter(message => (now - message.timestamp) <= (10800000)).slice(-10);
    messages.reverse()

    for (let [index, message] of messages.entries()) {
      const flags = getProperty(message, CONSTANTS.FLAGS.PILE);
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

    const flags = getProperty(message, CONSTANTS.FLAGS.PILE);

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

  static async _outputSplitToChat(sourceUuid, pileDeltas, actorDeltas, userId) {

    const sourceActor = Utilities.getActor(sourceUuid);

    const divideBy = Object.values(actorDeltas).length;

    const items = await this._formatItemData(pileDeltas.itemDeltas, divideBy);
    const currencies = this._formatCurrencyData(sourceActor, pileDeltas.attributeDeltas, divideBy);

    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/looted.html", {
      message: game.i18n.format("ITEM-PILES.Chat.Split", { num_players: divideBy }),
      itemPile: sourceActor,
      items: items,
      currencies: currencies
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
      [CONSTANTS.FLAGS.PUBLIC_TRADE_ID]: publicTradeId,
      [CONSTANTS.FLAGS.TRADE_USERS]: [party_1.user, party_2.user]
    });
  }

  static async _outputTradeCompleteToChat(instigator, party_1, party_2, publicTradeId, isPrivate) {

    if (instigator !== game.user.id) return;

    const party_1_actor = Utilities.getActor(party_1.actor);
    const party_1_data = {
      actor: party_1_actor,
      items: party_2.items,
      currencies: party_2.currencies.concat(party_2.itemCurrencies)
    }
    party_1_data.got_nothing = !party_1_data.items.length && !party_1_data.currencies.length;

    const party_2_actor = Utilities.getActor(party_2.actor);
    const party_2_data = {
      actor: party_2_actor,
      items: party_1.items,
      currencies: party_1.currencies.concat(party_1.itemCurrencies)
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

  static async _outputMerchantTradeToChat(sourceUuid, targetUuid, priceInformation, userId, interactionId) {

    const sourceActor = Utilities.getActor(sourceUuid);
    const targetActor = Utilities.getActor(targetUuid);

    const newItems = priceInformation.buyerReceive;

    const now = (+new Date());

    // Get all messages younger than 3 hours, and grab the last 10, then reverse them (latest to oldest)
    const messages = Array.from(game.messages).filter(message => (now - message.timestamp) <= (10800000)).slice(-10);
    messages.reverse();

    for (let [index, message] of messages.entries()) {
      const flags = getProperty(message, CONSTANTS.FLAGS.PILE);
      if (flags && flags.source === sourceUuid && flags.target === targetUuid && (flags.interactionId === interactionId || index === 0)) {
        return this._updateExistingMerchantMessage(message, sourceActor, targetActor, newItems, interactionId)
      }
    }

    const pileData = PileUtilities.getActorFlagData(sourceActor);

    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/merchant-traded.html", {
      message: game.i18n.format("ITEM-PILES.Chat.MerchantTraded", {
        name: targetActor.name,
        merchant: sourceActor.name
      }),
      merchant: {
        name: sourceActor.name,
        img: pileData.merchantImage || sourceActor.img
      },
      actor: targetActor,
      items: newItems
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
        items: newItems,
        interactionId: interactionId
      }
    });

  }

  static async _giveChatMessage(source, target, items) {

    const now = (+new Date());

    const sourceActor = Utilities.getActor(source);
    const targetActor = Utilities.getActor(target);

    // Get all messages younger than 1 minute, and grab the last 5, then reverse them (latest to oldest)
    const messages = Array.from(game.messages)
      .filter(message => (now - message.timestamp) <= (60000))
      .slice(-5)
      .reverse();

    for (const message of messages) {
      const flags = getProperty(message, CONSTANTS.FLAGS.PILE);
      if (flags && flags.source === sourceActor.uuid && flags.target === targetActor.uuid && message.isAuthor) {
        return this._updateExistingGiveMessage(message, sourceActor, targetActor, items)
      }
    }

    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/gave-items.html", {
      message: game.i18n.format("ITEM-PILES.Chat.GaveItems", { source: sourceActor.name, target: targetActor.name }),
      source: sourceActor,
      target: targetActor,
      items: items
    });

    return this._createNewChatMessage(game.user.id, {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: chatCardHtml,
      flavor: "Item Piles",
      speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
      [CONSTANTS.FLAGS.PILE]: {
        source: sourceActor.uuid,
        target: targetActor.uuid,
        items: items
      }
    })

  }

  static async _updateExistingGiveMessage(message, sourceActor, targetActor, items) {

    const flags = getProperty(message, CONSTANTS.FLAGS.PILE);

    const newItems = this._matchEntries(flags.items, items);

    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/gave-items.html", {
      message: game.i18n.format("ITEM-PILES.Chat.GaveItems", { source: sourceActor.name, target: targetActor.name }),
      source: sourceActor,
      target: targetActor,
      items: newItems
    });

    return message.update({
      content: chatCardHtml,
      [`${CONSTANTS.FLAGS.PILE}.items`]: newItems
    });

  }

  static async _updateExistingMerchantMessage(message, sourceActor, targetActor, newItems, interactionId) {

    const flags = getProperty(message, CONSTANTS.FLAGS.PILE);

    const mergedItems = this._matchEntries(flags.items, newItems);

    const pileData = PileUtilities.getActorFlagData(sourceActor);

    const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/chat/merchant-traded.html", {
      message: game.i18n.format("ITEM-PILES.Chat.MerchantTraded", {
        name: targetActor.name,
        merchant: sourceActor.name
      }),
      merchant: {
        name: sourceActor.name,
        img: pileData.merchantImage || sourceActor.img
      },
      actor: targetActor,
      items: mergedItems
    });

    return message.update({
      content: chatCardHtml,
      [`${CONSTANTS.FLAGS.PILE}.interactionId`]: interactionId,
      [`${CONSTANTS.FLAGS.PILE}.items`]: mergedItems
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
