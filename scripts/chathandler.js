import API from "./api.js";
import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";

const chatHandler = {

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
    _outputTransferItem(source, target, items, userId, interactionId) {
        if(!API.isValidItemPile(source)) return;
        if(!interactionId || game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const itemData = this._formatItemData(items);
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
        if(!API.isValidItemPile(source)) return;
        if(!interactionId || game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
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
    _outputTransferEverything(source, target, items, currencies, userId, interactionId) {
        if(!API.isValidItemPile(source)) return;
        if(!interactionId || game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const itemData = this._formatItemData(items);
        const currencyData = this._formatCurrencyData(source, currencies);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, currencyData, userId, interactionId);
    },

    _outputSplitItemPileInventory(source, transferData, userId) {
        if(!API.isValidItemPile(source)) return;
        if(game.user.id !== userId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;

        const sharingData = lib.getItemPileSharingData(source);

        let itemData = [];
        if(sharingData.items){
            itemData = sharingData.items.map(item => {
                const totalQuantity = item.actors.reduce((acc, item) => acc + item.quantity, 0)
                return {
                    name: item.name,
                    img: item.img,
                    quantity: Math.floor( totalQuantity / item.actors.length)
                }
            })
        }

        let currencyData = [];
        if(sharingData.currencies){
            const currencyList = lib.getActorCurrencyList(source);
            currencyData = sharingData.currencies.map(currencyData => {
                const currency = currencyList.find(currency => currency.path === currencyData.path);
                const totalQuantity = currencyData.actors.reduce((acc, storedCurrency) => acc + storedCurrency.quantity, 0);
                return {
                    name: game.i18n.has(currency.name) ? game.i18n.localize(currency.name) : currency.name,
                    img: currency.img ?? "",
                    quantity: Math.floor(totalQuantity / currencyData.actors.length),
                    currency: true,
                    index: currencyList.indexOf(currency)
                }
            })
        }

        const num_players = Object.keys(transferData).length;

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.SPLIT_CHAT_MESSAGE, source.uuid, num_players, itemData, currencyData, userId);
    },

    /**
     * Formats item data to a chat friendly structure
     *
     * @param items
     * @returns {Array}
     * @private
     */
    _formatItemData(items){
        return items.map(itemData => {
            return {
                name: itemData.item.name,
                img: itemData.item.img ?? "",
                quantity: itemData.quantity
            }
        });
    },

    /**
     * Formats currency data to a chat friendly structure
     *
     * @param itemPile
     * @param currencies
     * @returns {Array}
     * @private
     */
    _formatCurrencyData(itemPile, currencies){
        const currencyList = lib.getActorCurrencyList(itemPile);
        return Object.entries(currencies).map(entry => {
            const currency = currencyList.find(currency => currency.path === entry[0]);
            return {
                name: game.i18n.has(currency.name) ? game.i18n.localize(currency.name) : currency.name,
                img: currency.img ?? "",
                quantity: entry[1],
                currency: true,
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
    async _outputPickupToChat(sourceUuid, targetUuid, items, currencies, userId, interactionId){

        const source = await fromUuid(sourceUuid);
        const target = await fromUuid(targetUuid);

        const sourceActor = source?.actor ?? source;
        const targetActor = target?.actor ?? target;

        const now = (+new Date());

        // Get all messages younger than 3 hours, and grab the last 10, then reverse them (latest to oldest)
        const messages = Array.from(game.messages).filter(message => (now - message.data.timestamp) <= (1000*60*60*3)).slice(-10);
        messages.reverse()

        for(let [index, message] of messages.entries()){
            const flags = message.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);
            if(flags && flags.source === sourceUuid && flags.target === targetUuid && (flags.interactionId === interactionId || index === 0)) {
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

        return this._createChatMessage(userId, {
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

    _matchEntries(existingEntries, incomingEntries){

        const combinedEntries = existingEntries.map(existingEntry => {
            const foundEntry = incomingEntries.find(item => item.name === existingEntry.name && existingEntry.img === item.img);
            if(foundEntry){
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
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}.items`]:  newItems,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}.currencies`]:  newCurrencies,
        });

    },


    async _outputSplitToChat(sourceUuid, num_players, items, currencies, userId){

        const source = await fromUuid(sourceUuid);

        const sourceActor = source?.actor ?? source;

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/loot-chat-message.html", {
            message: game.i18n.format("ITEM-PILES.Chat.Split", { num_players: num_players }),
            itemPile: sourceActor,
            items: items,
            currencies: currencies
        });

        return this._createChatMessage(userId, {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: chatCardHtml,
            flavor: "Item Piles",
            speaker: ChatMessage.getSpeaker({ alias: game.user.name })
        });

    },

    _createChatMessage(userId, chatData){

        const mode = game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat");

        if(mode > 1){
            chatData.whisper = Array.from(game.users)
                .filter(user => user.isGM)
                .map(user => user.id);
            if(mode === 2){
                chatData.whisper.push(userId);
            }
            chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
        }

        return ChatMessage.create(chatData);

    }

}

export default chatHandler;