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
        if(game.user.id !== userId || !interactionId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const itemData = this._formatItemData(items);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, [], userId, interactionId);
    },

    /**
     * Outputs to chat based on transferring an attribute from or to an item pile
     *
     * @param source
     * @param target
     * @param attributes
     * @param userId
     * @param interactionId
     * @returns {Promise}
     * @private
     */
    _outputTransferAttribute(source, target, attributes, userId, interactionId) {
        if(!API.isValidItemPile(source)) return;
        if(game.user.id !== userId || !interactionId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const attributeData = this._formatAttributeData(source, attributes);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, [], attributeData, userId, interactionId);
    },

    /**
     * Outputs to chat based on transferring everything from or to an item pile
     *
     * @param source
     * @param target
     * @param items
     * @param attributes
     * @param userId
     * @param interactionId
     * @returns {Promise}
     * @private
     */
    _outputTransferEverything(source, target, items, attributes, userId, interactionId){
        if(!API.isValidItemPile(source)) return;
        if(game.user.id !== userId || !interactionId || game.settings.get(CONSTANTS.MODULE_NAME, "outputToChat") === "off") return;
        const itemData = this._formatItemData(items);
        const attributeData = this._formatAttributeData(source, attributes);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.PICKUP_CHAT_MESSAGE, source.uuid, target.uuid, itemData, attributeData, userId, interactionId);
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
     * Formats attribute data to a chat friendly structure
     *
     * @param itemPile
     * @param attributes
     * @returns {Array}
     * @private
     */
    _formatAttributeData(itemPile, attributes){
        return Object.entries(attributes).map(entry => {
            const attributeList = lib.getItemPileAttributeList(itemPile);
            const attribute = attributeList.find(attribute => attribute.path === entry[0]);
            return {
                name: game.i18n.has(attribute.name) ? game.i18n.localize(attribute.name) : attribute.name,
                img: attribute.img ?? "",
                quantity: entry[1],
                attribute: true,
                index: attributeList.indexOf(attribute)
            }
        });
    },

    /**
     * Outputs the transferred data in chat
     *
     * @param sourceUuid
     * @param targetUuid
     * @param items
     * @param attributes
     * @param userId
     * @param interactionId
     * @returns {Promise}
     * @private
     */
    async _outputToChat(sourceUuid, targetUuid, items, attributes, userId, interactionId){

        const source = await fromUuid(sourceUuid);
        const target = await fromUuid(targetUuid);

        const messages = Array.from(game.messages).slice(-10);

        const sourceActor = source?.actor ?? source;
        const targetActor = target?.actor ?? target;

        for(let message of messages){
            const flags = message.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);
            if(!flags || flags.interactionId !== interactionId) continue;
            return this._updateExistingMessage(message, sourceActor, targetActor, items, attributes)
        }

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/pickup-chat-message.html", {
            itemPile: sourceActor,
            actor: targetActor,
            items: items,
            attributes: attributes
        });

        const chatData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: chatCardHtml,
            flavor: "Item Piles",
            speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: {
                interactionId: interactionId,
                source: sourceUuid,
                target: targetUuid,
                items: items,
                attributes: attributes
            }
        };

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

    async _updateExistingMessage(message, sourceActor, targetActor, items, attributes) {

        const flags = message.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);

        const newItems = this._matchEntries(flags.items, items);
        const newAttributes = this._matchEntries(flags.attributes, attributes);

        newAttributes.sort((a, b) => {
            return a.index - b.index;
        })

        const chatCardHtml = await renderTemplate(CONSTANTS.PATH + "templates/pickup-chat-message.html", {
            itemPile: sourceActor,
            actor: targetActor,
            items: newItems,
            attributes: newAttributes
        });

        return message.update({
            content: chatCardHtml,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}.items`]:  newItems,
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}.attributes`]:  newAttributes,
        });

    }

}

export default chatHandler;