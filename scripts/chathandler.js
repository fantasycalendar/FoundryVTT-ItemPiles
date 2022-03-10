import API from "./api.js";
import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { TradeAPI } from "./trade-api.js";
import HOOKS from "./hooks.js";

const chatHandler = {

    init() {

        Hooks.on("preCreateChatMessage", chatHandler._preCreateChatMessage.bind(chatHandler));
        Hooks.on("renderChatMessage", chatHandler._renderChatMessage.bind(chatHandler));
        Hooks.on(HOOKS.ITEM.TRANSFER, chatHandler._outputTransferItem.bind(chatHandler));
        Hooks.on(HOOKS.ATTRIBUTE.TRANSFER, chatHandler._outputTransferCurrency.bind(chatHandler));
        Hooks.on(HOOKS.TRANSFER_EVERYTHING, chatHandler._outputTransferEverything.bind(chatHandler));
        Hooks.on(HOOKS.PILE.SPLIT_INVENTORY, chatHandler._outputSplitItemPileInventory.bind(chatHandler));
        Hooks.on(HOOKS.TRADE.STARTED, chatHandler._outputTradeStarted.bind(chatHandler));
        Hooks.on(HOOKS.TRADE.COMPLETE, chatHandler._outputTradeComplete.bind(chatHandler));

        $(document).on("click", ".item-piles-chat-card .item-piles-collapsible", async function () {
            if ($(this).attr("open")) return;
            await lib.wait(25);
            $(this).parent()[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        });

    },

    _preCreateChatMessage(chatMessage) {
        if (!game.settings.get(CONSTANTS.MODULE_NAME, "enableTrading")) return;

        const content = chatMessage.data.content.toLowerCase();

        if (!(content.startsWith("!itempiles") || content.startsWith("!ip"))) return;

        const args = content.split(" ").slice(1);

        if (args[0] === "trade") {
            setTimeout(() => {
                TradeAPI.requestTrade();
            });
        }

        return false;

    },

    _renderChatMessage(app, html) {
        html.find(".item-piles-specate-trade").click(function () {
            TradeAPI.spectateTrade($(this).data());
        });
    },


    _disableTradingButton(publicTradeId) {
        const message = Array.from(game.messages).find(message => {
            return message.getFlag(CONSTANTS.MODULE_NAME, "publicTradeId") === publicTradeId;
        });
        if (!message) return;
        const html = $(message.data.content);
        html.find(".item-piles-specate-trade")
            .prop('disabled', true)
            .text(game.i18n.localize("ITEM-PILES.Chat.SpectateDisabled"));
        return message.update({
            content: html.prop("outerHTML")
        })
    },

    /**
     * Outputs to chat based on transferring an item from or to an item pile
     *
     * @param source
     * @param target
     * @param items
     * @param userId
     * @param interactionId
     * @returns {Promise}
     * @private
     */
    async _outputTransferItem(source, target, items, userId, interactionId) {
        if (!API.isValidItemPile(source)) return;
        if (!interactionId || game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const itemData = await this._formatItemData(items);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, [], userId, interactionId);
    },

    /**
     * Outputs to chat based on transferring a currency from or to an item pile
     *
     * @param source
     * @param target
     * @param currencies
     * @param userId
     * @param interactionId
     * @returns {Promise}
     * @private
     */
    _outputTransferCurrency(source, target, currencies, userId, interactionId) {
        if (!API.isValidItemPile(source)) return;
        if (!interactionId || game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const currencyData = this._formatCurrencyData(source, currencies);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, [], currencyData, userId, interactionId);
    },

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
     * @private
     */
    async _outputTransferEverything(source, target, items, currencies, userId, interactionId) {
        if (!API.isValidItemPile(source)) return;
        if (!interactionId || game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const itemData = await this._formatItemData(items);
        const currencyData = this._formatCurrencyData(source, currencies);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, currencyData, userId, interactionId);
    },

    _outputSplitItemPileInventory(source, transferData, userId) {
        if (!API.isValidItemPile(source)) return;
        if (game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.SPLIT_CHAT_MESSAGE, source.uuid, transferData, userId);
    },

    async _outputTradeStarted(party_1, party_2, publicTradeId, isPrivate) {
        if (party_1.user !== game.user.id || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off" || isPrivate) return;
        return this._outputTradeStartedToChat(party_1, party_2, publicTradeId);
    },

    async _outputTradeComplete(party_1, party_2, publicTradeId, isPrivate) {
        if (game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        return this._outputTradeCompleteToChat(party_1, party_2, publicTradeId, isPrivate);
    },

    /**
     * Formats item data to a chat friendly structure
     *
     * @param items
     * @returns {Array}
     * @private
     */
    async _formatItemData(items) {
        const formattedItems = [];
        for(const itemData of items){
            const tempItem = await Item.implementation.create(itemData.item, { temporary: true });
            formattedItems.push({
                name: tempItem.name,
                img: itemData.item.img ?? "",
                quantity: itemData.quantity
            });
        }
        return formattedItems;
    },

    /**
     * Formats currency data to a chat friendly structure
     *
     * @param itemPile
     * @param currencies
     * @returns {Array}
     * @private
     */
    _formatCurrencyData(itemPile, currencies) {
        const currencyList = lib.getActorCurrencyList(itemPile);
        return Object.entries(currencies).map(entry => {
            const currency = currencyList.find(currency => currency.path === entry[0]);
            return {
                name: currency.name,
                img: currency.img ?? "",
                quantity: entry[1],
                index: currencyList.indexOf(currency)
            }
        });
    },

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
     * @private
     */
    async _outputPickupToChat(sourceUuid, targetUuid, items, currencies, userId, interactionId) {

        const source = await fromUuid(sourceUuid);
        const target = await fromUuid(targetUuid);

        const sourceActor = source?.actor ?? source;
        const targetActor = target?.actor ?? target;

        const now = (+new Date());

        // Get all messages younger than 3 hours, and grab the last 10, then reverse them (latest to oldest)
        const messages = Array.from(game.messages).filter(message => (now - message.data.timestamp) <= (1000 * 60 * 60 * 3)).slice(-10);
        messages.reverse()

        for (let [index, message] of messages.entries()) {
            const flags = message.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);
            if (flags && flags.source === sourceUuid && flags.target === targetUuid && (flags.interactionId === interactionId || index === 0)) {
                return this._updateExistingPickupMessage(message, sourceActor, targetActor, items, currencies, interactionId)
            }
        }

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/loot-chat-message.html", {
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
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: {
                source: sourceUuid,
                target: targetUuid,
                items: items,
                currencies: currencies,
                interactionId: interactionId
            }
        })

    },

    _matchEntries(existingEntries, incomingEntries) {

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

    },

    async _updateExistingPickupMessage(message, sourceActor, targetActor, items, currencies, interactionId) {

        const flags = message.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);

        const newItems = this._matchEntries(flags.items, items);
        const newCurrencies = this._matchEntries(flags.currencies, currencies);

        newCurrencies.sort((a, b) => {
            return a.index - b.index;
        })

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/loot-chat-message.html", {
            message: game.i18n.format("ITEM-PILES.Chat.Pickup", { name: targetActor.name }),
            itemPile: sourceActor,
            actor: targetActor,
            items: newItems,
            currencies: newCurrencies
        });

        return message.update({
            content: chatCardHtml,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}.interactionId`]: interactionId,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}.items`]: newItems,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}.currencies`]: newCurrencies,
        });

    },

    async _outputSplitToChat(sourceUuid, transferData, userId) {

        const source = await fromUuid(sourceUuid);

        const sourceActor = source?.actor ?? source;

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/loot-chat-message.html", {
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

    },

    async _outputTradeStartedToChat(party_1, party_2, publicTradeId) {

        let party_1_actor = await fromUuid(party_1.actor);
        party_1_actor = party_1_actor?.actor ?? party_1_actor;

        let party_2_actor = await fromUuid(party_2.actor);
        party_2_actor = party_2_actor?.actor ?? party_2_actor;

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/trade-started-chat-message.html", {
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
    },

    async _outputTradeCompleteToChat(party_1, party_2, publicTradeId, isPrivate) {

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

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/trade-complete-chat-message.html", {
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

    },

    _createNewChatMessage(userId, chatData) {

        if (!chatData.whisper) {

            const mode = game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat");

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

export default chatHandler;