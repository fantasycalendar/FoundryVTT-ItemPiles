import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";
import DropDialog from "./formapplications/dropDialog.js";
import { HOOKS } from "./hooks.js";
import { getItemPileAttributes, getItemPileTokenImage, getItemPileTokenScale, tokens_close_enough } from "./lib/lib.js";

export default class API {

    /**
     * The actor class type used for the original item pile actor in this system
     *
     * @returns {string}
     */
    static get ACTOR_CLASS_TYPE() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "actorClassType");
    }

    /**
     * The attributes used to track dynamic attributes in this system
     *
     * @returns {array}
     */
    static get DYNAMIC_ATTRIBUTES() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "dynamicAttributes");
    }

    /**
     * The attribute used to track the quantity of items in this system
     *
     * @returns {string}
     */
    static get ITEM_QUANTITY_ATTRIBUTE() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemQuantityAttribute");
    }

    /**
     * The attribute used to track the item type in this system
     *
     * @returns {string}
     */
    static get ITEM_TYPE_ATTRIBUTE() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemTypeAttribute");
    }

    /**
     * The filters for item types eligible for interaction within this system
     *
     * @returns {Array}
     */
    static get ITEM_TYPE_FILTERS() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemTypeFilters").split(',').map(str => str.trim().toLowerCase());
    }

    /**
     * Sets the actor class type used for the original item pile actor in this system
     *
     * @param {string} inClassType
     * @returns {Promise}
     */
    static async setActorClassType(inClassType) {
        if (typeof inClassType !== "string") {
            throw lib.custom_error("setActorTypeClass | inClassType must be of type string");
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "actorClassType", inClassType);
    }

    /**
     * Sets the attributes used to track dynamic attributes in this system
     *
     * @param {array} inAttributes
     * @returns {Promise}
     */
    static async setDynamicAttributes(inAttributes) {
        if (!Array.isArray(inAttributes)) {
            throw lib.custom_error("setDynamicAttributes | inAttributes must be of type array");
        }
        inAttributes.forEach(attribute => {
            if (typeof attribute !== "object") {
                throw lib.custom_error("setDynamicAttributes | each entry in the inAttributes array must be of type object");
            }
            if (typeof attribute.name !== "string") {
                throw lib.custom_error("setDynamicAttributes | attribute.name must be of type string");
            }
            if (typeof attribute.attribute !== "string") {
                throw lib.custom_error("setDynamicAttributes | attribute.path must be of type string");
            }
            if (attribute.img && typeof attribute.img !== "string") {
                throw lib.custom_error("setDynamicAttributes | attribute.img must be of type string");
            }
        })
        return game.settings.set(CONSTANTS.MODULE_NAME, "dynamicAttributes", inAttributes);
    }

    /**
     * Sets the inAttribute used to track the quantity of items in this system
     *
     * @param {string} inAttribute
     * @returns {Promise}
     */
    static async setItemQuantityAttribute(inAttribute) {
        if (typeof inAttribute !== "string") {
            throw lib.custom_error("setItemQuantityAttribute | inAttribute must be of type string");
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemQuantityAttribute", inAttribute);
    }

    /**
     * Sets the attribute used to track the item type in this system
     *
     * @param {string} inAttribute
     * @returns {string}
     */
    static async setItemTypeAttribute(inAttribute) {
        if (typeof inAttribute !== "string") {
            throw lib.custom_error("setItemTypeAttribute | inAttribute must be of type string");
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemTypeAttribute", inAttribute);
    }

    /**
     * Sets the filters for item types eligible for interaction within this system
     *
     * @param {string/array} inFilters
     * @returns {Promise}
     */
    static async setItemTypeFilters(inFilters) {
        if (!Array.isArray(inFilters)) {
            if (typeof inFilters !== "string") {
                throw lib.custom_error("setItemTypeFilters | inFilters must be of type string or array");
            }
            inFilters = inFilters.split(',')
        } else {
            inFilters.forEach(filter => {
                if (typeof filter !== "string") {
                    throw lib.custom_error("setItemTypeFilters | each entry in inFilters must be of type string");
                }
            })
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemTypeFilters", inFilters.join(','));
    }

    /**
     * Creates the default item pile token at a location.
     *
     * @param {object} position                         The position to create the item pile at
     * @param {array/boolean} [items=false]             Any items to create on the item pile
     * @param {string/boolean} [pileActorName=false]    Whether to use an existing item pile actor as the basis of this new token
     *
     * @returns {Promise}
     */
    static async createItemPile(position, { items = false, pileActorName = false } = {}) {

        const hookResult = Hooks.call(HOOKS.PILE.PRE_CREATE, position, pileActorName);
        if (hookResult === false) return;

        if (pileActorName) {
            const pileActor = game.actors.getName(pileActorName);
            if (!pileActor) {
                throw lib.custom_error(`There is no actor of the name "${pileActorName}"`, true);
            } else if (!lib.isValidItemPile(pileActor)) {
                throw lib.custom_error(`The actor of name "${pileActorName}" is not a valid item pile actor.`, true);
            }
        }

        if (items) {
            items = items.map(item => {
                return item instanceof Item
                    ? item.toObject()
                    : item;
            })
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.CREATE_PILE, position, { items, pileActorName });
    }

    /**
     * @param {object} position
     * @param {string/boolean} [pileActorName=false]
     * @param {array/boolean} [items=false]
     * @returns {Promise<string>}
     * @private
     */
    static async _createItemPile(position, { pileActorName = false, items = false } = {}) {

        let pileActor;

        if (!pileActorName) {

            pileActor = game.settings.get(CONSTANTS.MODULE_NAME, "defaultItemPileActorID") ? game.actors.get(game.settings.get(CONSTANTS.MODULE_NAME, "defaultItemPileActorID")) : false;

            if (!pileActor) {

                lib.custom_notify("A Default Item Pile has been added to your Actors list. You can configure the default look and behavior on it, or duplicate it to create different styles.")

                const pileDataDefaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

                pileDataDefaults.deleteWhenEmpty = true;

                pileActor = await Actor.create({
                    name: "Default Item Pile",
                    type: game.settings.get(CONSTANTS.MODULE_NAME, "actorClassType"),
                    img: "icons/svg/item-bag.svg",
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileDataDefaults
                });

                await pileActor.update({
                    "token": {
                        name: "Item Pile",
                        actorLink: false,
                        bar1: { attribute: "" },
                        vision: false,
                        displayName: 50,
                        [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileDataDefaults
                    }
                })

                await game.settings.set(CONSTANTS.MODULE_NAME, "defaultItemPileActorID", pileActor.id);

            }

        } else {

            pileActor = game.actors.getName(pileActorName);

        }

        const overrideData = { ...position };

        if (!pileActor.data.token.actorLink) {

            overrideData['actorData'] = { "items": items || {} };

            const pileConfig = lib.getItemPileData(pileActor);
            const attributes = getItemPileAttributes(pileActor);

            const numItems = items.length + attributes.length;

            if (pileConfig.displayOne && numItems === 1) {
                overrideData["img"] = items.length > 0
                    ? items[0].img
                    : attributes[0].img;
                if (pileConfig.overrideSingleItemScale) {
                    overrideData["scale"] = pileConfig.singleItemScale;
                }
            }

            if (pileConfig.isContainer) {

                overrideData["img"] = lib.getItemPileTokenImage(pileActor);
                overrideData["scale"] = lib.getItemPileTokenScale(pileActor);

            }

        } else {

            overrideData["img"] = lib.getItemPileTokenImage(pileActor);
            overrideData["scale"] = lib.getItemPileTokenScale(pileActor);

        }

        const tokenData = await pileActor.getTokenData(overrideData);

        const [tokenDocument] = await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);

        return lib.getUuid(tokenDocument);

    }

    /**
     * Turns tokens and its actors into item piles
     *
     * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be turned into item piles
     * @param {object} pileSettings                                     Overriding settings to be put on the item piles' settings
     * @param {object} tokenSettings                                    Overriding settings that will update the tokens' settings
     *
     * @return {Promise<Array>}                                         The uuids of the targets after they were turned into item piles
     */
    static async turnTokensIntoItemPiles(targets, { pileSettings = {}, tokenSettings = {} } = {}) {

        const hookResult = Hooks.call(HOOKS.PILE.PRE_TURN_INTO, targets, pileSettings, tokenSettings);
        if (hookResult === false) return;

        if(!Array.isArray(targets)) targets = [targets];

        const targetUuids = targets.map(target => {
            if(!(target instanceof Token || target instanceof TokenDocument)){
                throw lib.custom_error(`turnTokensIntoItemPiles | Target must be of type Token or TokenDocument`, true)
            }
            const targetUuid = lib.getUuid(target);
            if (!targetUuid) throw lib.custom_error(`turnTokensIntoItemPiles | Could not determine the UUID, please provide a valid target`, true)
            return targetUuid;
        })

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TURN_INTO_PILE, targetUuids, pileSettings, tokenSettings);
    }

    /**
     * @private
     */
    static async _turnTokensIntoItemPiles(targetUuids, pileSettings = {}, tokenSettings = {}) {

        const tokenUpdateGroups = {};
        const defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        for(const targetUuid of targetUuids) {

            let target = await fromUuid(targetUuid);

            const existingPileSettings = foundry.utils.mergeObject(defaults, lib.getItemPileData(target));
            pileSettings = foundry.utils.mergeObject(existingPileSettings, pileSettings);
            pileSettings.enabled = true;

            tokenSettings = foundry.utils.mergeObject(tokenSettings, {
                "img": getItemPileTokenImage(target, pileSettings),
                "scale": getItemPileTokenScale(target, pileSettings),
            });

            const [_, sceneId, __, tokenId] = targetUuid.split('.');

            if (!tokenUpdateGroups[sceneId]) {
                tokenUpdateGroups[sceneId] = []
            }

            tokenUpdateGroups[sceneId].push({
                "_id": tokenId,
                ...tokenSettings,
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
                [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings
            });

        }

        for(const [sceneId, updateData] of Object.entries(tokenUpdateGroups)){
            const scene = game.scenes.get(sceneId);
            await scene.updateEmbeddedDocuments("Token", updateData);
        }

        setTimeout(API.rerenderTokenHud, 100);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.TURN_INTO, targetUuids);

        return targetUuids;

    }

    /**
     * Reverts tokens from an item pile into a normal token and actor
     *
     * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be reverted from item piles
     * @param {object} tokenSettings                                    Overriding settings that will update the tokens
     *
     * @return {Promise<Array>}                                         The uuids of the targets after they were reverted from being item piles
     */
    static async revertTokensFromItemPiles(targets, { tokenSettings = {} } = {}) {
        const hookResult = Hooks.call(HOOKS.PILE.PRE_REVERT_FROM, targets, tokenSettings);
        if (hookResult === false) return;

        if(!Array.isArray(targets)) targets = [targets];

        const targetUuids = targets.map(target => {
            if(!(target instanceof Token || target instanceof TokenDocument)){
                throw lib.custom_error(`revertTokensFromItemPiles | Target must be of type Token or TokenDocument`, true)
            }
            const targetUuid = lib.getUuid(target);
            if (!targetUuid) throw lib.custom_error(`revertTokensFromItemPiles | Could not determine the UUID, please provide a valid target`, true)
            return targetUuid;
        })

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REVERT_FROM_PILE, targetUuids, tokenSettings);
    }

    /**
     * @private
     */
    static async _revertTokensFromItemPiles(targetUuids, tokenSettings) {

        const tokenUpdateGroups = {};
        const defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        for(const targetUuid of targetUuids) {

            let target = await fromUuid(targetUuid);

            const pileSettings = foundry.utils.mergeObject(defaults, lib.getItemPileData(target));
            pileSettings.enabled = false;

            const [_, sceneId, __, tokenId] = targetUuid.split('.');

            if (!tokenUpdateGroups[sceneId]) {
                tokenUpdateGroups[sceneId] = [];
            }

            tokenUpdateGroups[sceneId].push({
                "_id": tokenId,
                ...tokenSettings,
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
                [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings
            });

        }

        for(const [sceneId, updateData] of Object.entries(tokenUpdateGroups)){
            const scene = game.scenes.get(sceneId);
            await scene.updateEmbeddedDocuments("Token", updateData);
        }

        setTimeout(API.rerenderTokenHud, 100);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.REVERT_FROM, targetUuids);

        return targetUuids;

    }

    /**
     * Opens a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    static async openItemPile(target, interactingToken = false) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        const wasLocked = data.locked;
        const wasClosed = data.closed;
        data.closed = false;
        data.locked = false;
        if (wasLocked) {
            const hookResult = Hooks.call(HOOKS.PILE.PRE_UNLOCK, target, data, interactingToken);
            if (hookResult === false) return;
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_OPEN, target, data, interactingToken);
        if (hookResult === false) return;
        if (wasClosed && data.openSound) {
            AudioHelper.play({ src: data.openSound })
        }
        return API.updateItemPile(target, data, { interactingToken });
    }

    /**
     * Closes a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to close
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    static async closeItemPile(target, interactingToken = false) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        const wasClosed = data.closed;
        data.closed = true;
        const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, target, data, interactingToken);
        if (hookResult === false) return;
        if (!wasClosed && data.closeSound) {
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updateItemPile(target, data, interactingToken);
    }

    /**
     * Toggles a pile's closed state if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to open or close
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    static async toggleItemPileClosed(target, interactingToken = false) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        if (data.closed) {
            await API.openItemPile(target, interactingToken);
        } else {
            await API.closeItemPile(target, interactingToken);
        }
        return !data.closed;
    }

    /**
     * Locks a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to lock
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    static async lockItemPile(target, interactingToken = false) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        const wasClosed = data.closed;
        data.closed = true;
        data.locked = true;
        if (!wasClosed) {
            const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, target, data, interactingToken);
            if (hookResult === false) return;
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_LOCK, target, data, interactingToken);
        if (hookResult === false) return;
        if (!wasClosed && data.closeSound) {
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updateItemPile(target, data, interactingToken);
    }

    /**
     * Unlocks a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to unlock
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    static async unlockItemPile(target, interactingToken = false) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        data.locked = false;
        Hooks.call(HOOKS.PILE.PRE_UNLOCK, target, data, interactingToken);
        return API.updateItemPile(target, data, interactingToken);
    }

    /**
     * Toggles a pile's locked state if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to lock or unlock
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    static async toggleItemPileLocked(target, interactingToken = false) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        if (data.locked) {
            return API.unlockItemPile(target, interactingToken);
        }
        return API.lockItemPile(target, interactingToken);
    }

    /**
     * Causes the item pile to play a sound as it was attempted to be opened, but was locked
     *
     * @param {Token/TokenDocument} target
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     *
     * @return {Promise<boolean>}
     */
    static async rattleItemPile(target, interactingToken = false) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer || !data?.locked) return false;
        Hooks.call(HOOKS.PILE.PRE_RATTLE, target, data, interactingToken);
        if (data.lockedSound) {
            AudioHelper.play({ src: data.lockedSound })
        }
        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.RATTLE, lib.getUuid(target), data, lib.getUuid(interactingToken));
        return true;
    }

    /**
     * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {boolean}
     */
    static isItemPileLocked(target) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        return data.locked;
    }

    /**
     * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {boolean}
     */
    static isItemPileClosed(target) {
        const data = lib.getItemPileData(target);
        if (!data?.enabled || !data?.isContainer) return false;
        return data.closed;
    }

    /**
     * Whether an item pile is a container. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {boolean}
     */
    static isItemPileContainer(target) {
        const data = lib.getItemPileData(target);
        return data?.enabled && data?.isContainer;
    }

    /**
     * Updates a pile with new data.
     *
     * @param {Token/TokenDocument} target
     * @param {object} newData
     * @param {Token/TokenDocument/boolean} [interactingToken=false]
     * @param {object/boolean} [tokenSettings=false]
     *
     * @return {Promise}
     */
    static async updateItemPile(target, newData, { interactingToken = false, tokenSettings = false } = {}) {

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`, true);

        const interactingTokenUuid = interactingToken ? lib.getUuid(interactingToken) : false;
        if (interactingToken && !interactingTokenUuid) throw lib.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`, true);

        const hookResult = Hooks.call(HOOKS.PILE.PRE_UPDATE, target, newData, interactingToken, tokenSettings);
        if (hookResult === false) return;

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_PILE, targetUuid, newData, {
            interactingTokenUuid,
            tokenSettings
        })
    }

    /**
     * @private
     */
    static async _updateItemPile(targetUuid, newData, { interactingTokenUuid = false, tokenSettings = false } = {}) {

        const target = await fromUuid(targetUuid);

        const oldData = lib.getItemPileData(target);

        const data = foundry.utils.mergeObject(
            foundry.utils.duplicate(oldData),
            foundry.utils.duplicate(newData)
        );

        const diff = foundry.utils.diffObject(oldData, data);

        await lib.wait(15);

        await lib.updateItemPile(target, data, tokenSettings);

        if (data.isEnabled && data.isContainer) {
            if (diff?.closed === true) {
                API._executeItemPileMacro(targetUuid, {
                    action: "closeItemPile",
                    source: interactingTokenUuid,
                    target: targetUuid
                });
            }
            if (diff?.locked === true) {
                API._executeItemPileMacro(targetUuid, {
                    action: "lockItemPile",
                    source: interactingTokenUuid,
                    target: targetUuid
                });
            }
            if (diff?.locked === false) {
                API._executeItemPileMacro(targetUuid, {
                    action: "unlockItemPile",
                    source: interactingTokenUuid,
                    target: targetUuid
                });
            }
            if (diff?.closed === false) {
                API._executeItemPileMacro(targetUuid, {
                    action: "openItemPile",
                    source: interactingTokenUuid,
                    target: targetUuid
                });
            }
        }

        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.UPDATED_PILE, targetUuid, diff, interactingTokenUuid);
    }

    /**
     * @private
     */
    static async _updatedItemPile(targetUuid, diffData, interactingTokenUuid) {

        const target = await lib.getToken(targetUuid);

        const interactingToken = interactingTokenUuid ? await fromUuid(interactingTokenUuid) : false;

        if (foundry.utils.isObjectEmpty(diffData)) return;

        const data = lib.getItemPileData(target);

        Hooks.callAll(HOOKS.PILE.UPDATE, target, diffData, interactingToken)

        if (data.isEnabled && data.isContainer) {
            if (diffData?.closed === true) {
                Hooks.callAll(HOOKS.PILE.CLOSE, target, interactingToken)
            }
            if (diffData?.locked === true) {
                Hooks.callAll(HOOKS.PILE.LOCK, target, interactingToken)
            }
            if (diffData?.locked === false) {
                Hooks.callAll(HOOKS.PILE.UNLOCK, target, interactingToken)
            }
            if (diffData?.closed === false) {
                Hooks.callAll(HOOKS.PILE.OPEN, target, interactingToken)
            }
        }
    }

    /**
     * Deletes a pile, calling the relevant hooks.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {Promise}
     */
    static async deleteItemPile(target) {
        if (!lib.isValidItemPile(target)) {
            if (!targetUuid) throw lib.custom_error(`deleteItemPile | This is not an item pile, please provide a valid target`, true);
        }
        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`deleteItemPile | Could not determine the UUID, please provide a valid target`, true);
        if (!targetUuid.includes("Token")) {
            throw lib.custom_error(`deleteItemPile | Please provide a Token or TokenDocument`, true);
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_DELETE, target);
        if (hookResult === false) return;
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DELETE_PILE, targetUuid);
    }

    static async _deleteItemPile(targetUuid) {
        const target = await lib.getToken(targetUuid);
        return target.delete();
    }

    /**
     * Whether a given document is a valid pile or not
     *
     * @param {TokenDocument|Actor} document
     * @return {boolean}
     */
    static isValidItemPile(document) {
        return lib.isValidItemPile(document);
    }

    /**
     * Whether the item pile is empty
     *
     * @param {TokenDocument|Actor} target
     * @returns {boolean}
     */
    static isItemPileEmpty(target){
        return lib.isItemPileEmpty(target);
    }

    /**
     * Returns the item type filters for a given item pile
     *
     * @param target
     * @returns {Array}
     */
    static getItemPileItemTypeFilters(target){
        return lib.getItemPileItemTypeFilters(target);
    }

    /**
     * Returns the items this item pile can transfer
     *
     * @param {TokenDocument|Actor} target
     * @param {array/boolean} [itemTypeFilters=false]   Array of item types disallowed - will default to pile settings or module settings if none provided
     * @returns {Array}
     */
    static getItemPileItems(target, itemTypeFilters = false){
        return lib.getItemPileItems(target, itemTypeFilters);
    }

    /**
     * Returns the attributes this item pile can transfer
     *
     * @param {TokenDocument|Actor} target
     * @returns {array}
     */
    static getItemPileAttributes(target){
        return lib.getItemPileAttributes(target);
    }

    /**
     * Refreshes the target image of an item pile, ensuring it remains in sync
     *
     * @param target
     * @return {Promise}
     */
    static async refreshItemPile(target) {
        if (!lib.isValidItemPile(target)) return;
        const targetUuid = lib.getUuid(target);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REFRESH_PILE, targetUuid)
    }

    /**
     * @private
     */
    static async _refreshItemPile(targetUuid) {
        const targetDocument = await fromUuid(targetUuid);

        if (!lib.isValidItemPile(targetDocument)) return;

        let targets = [targetDocument]
        if (targetDocument instanceof Actor) {
            targets = Array.from(canvas.tokens.getDocuments()).filter(token => token.actor === targetDocument);
        }

        return Promise.allSettled(targets.map(_target => {
            return new Promise(async (resolve) => {
                const uuid = lib.getUuid(_target);
                const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(uuid);
                if (!shouldBeDeleted) {
                    await _target.update({
                        "img": lib.getItemPileTokenImage(targetDocument),
                        "scale": lib.getItemPileTokenScale(targetDocument),
                    })
                }
                resolve();
            })
        }));
    }

    /**
     * Causes all connected users to re-render a specific pile's inventory UI
     *
     * @param {string} inPileUuid           The uuid of the pile to be re-rendered
     * @param {boolean} [deleted=false]     Whether the pile was deleted as a part of this re-render
     * @return {Promise}
     */
    static async rerenderItemPileInventoryApplication(inPileUuid, deleted = false) {
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, inPileUuid, deleted);
    }

    /**
     * @private
     */
    static async _rerenderItemPileInventoryApplication(inPileUuid, deleted = false) {
        return ItemPileInventory.rerenderActiveApp(inPileUuid, deleted);
    }

    /* --- ITEM AND ATTRIBUTE METHODS --- */

    /**
     * Adds item to an actor, increasing item quantities if matches were found
     *
     * @param {Actor/TokenDocument/Token} target        The target to add an item to
     * @param {array} items                             An array of item objects
     * @param {array/boolean} [itemTypeFilters=false]   Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<array>}                        An array containing each item added as an object, with their quantities updated to match the new amounts
     */
    static async addItems(target, items, { itemTypeFilters = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_ADD, target, items);
        if (hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`AddItems | Could not determine the UUID, please provide a valid target`, true)

        if (itemTypeFilters) {
            itemTypeFilters.forEach(filter => {
                if (typeof filter !== "string") throw lib.custom_error(`AddItem | entries in the itemTypeFilters must be of type string`);
            })
        }

        for (const index in items) {
            const item = items[index];
            if (item instanceof Item) {
                items[index] = item.toObject();
            }
            const disallowedType = API.isItemTypeDisallowed(item, itemTypeFilters);
            if (disallowedType) {
                throw lib.custom_error(`AddItems | Could not add item of type "${disallowedType}"`, true)
            }
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ITEMS, targetUuid, items);
    }

    /**
     * @private
     */
    static async _addItems(targetUuid, items, { isTransfer = false } = {}) {

        const target = await fromUuid(targetUuid);
        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const targetActorItems = Array.from(targetActor.items);

        const itemsAdded = [];
        const itemsToCreate = [];
        const itemsToUpdate = [];
        for (const itemData of items) {

            const item = lib.getSimilarItem(targetActorItems, { itemId: itemData._id, itemName: itemData.name, itemType: itemData.type });

            const incomingQuantity = Number(getProperty(itemData, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1);

            const itemAdded = item ? item.toObject() : foundry.utils.duplicate(itemData);

            if (item) {
                const currentQuantity = Number(getProperty(item.data, API.ITEM_QUANTITY_ATTRIBUTE));
                const newQuantity = currentQuantity + incomingQuantity;
                itemsToUpdate.push({
                    "_id": item.id,
                    [API.ITEM_QUANTITY_ATTRIBUTE]: newQuantity
                });

                const itemAdded = item.toObject();
                setProperty(itemAdded, API.ITEM_QUANTITY_ATTRIBUTE, newQuantity)
                itemsAdded.push(itemAdded);
            } else {
                setProperty(itemAdded, API.ITEM_QUANTITY_ATTRIBUTE, incomingQuantity)
                itemsToCreate.push(itemData);
            }

        }

        const itemsCreated = await targetActor.createEmbeddedDocuments("Item", itemsToCreate);
        await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);

        itemsCreated.forEach(item => itemsAdded.push(item.toObject()));

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.ADD, targetUuid, itemsAdded);

        if (!isTransfer) {

            const macroData = {
                action: "addItems",
                target: targetUuid,
                items: itemsAdded
            };

            await API._executeItemPileMacro(targetUuid, macroData);

            await API.rerenderItemPileInventoryApplication(targetUuid);

        }

        return itemsAdded;

    }

    /**
     * Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.
     *
     * @param {Actor/Token/TokenDocument} target        The target to remove a items from
     * @param {array} items                             An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity"), or an array of IDs to remove all quantities of
     * @param {array/boolean} [itemTypeFilters=false]   Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<array>}                        An array containing the objects of each item that was removed, with their quantities set to the number removed
     */
    static async removeItems(target, items, { itemTypeFilters = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_REMOVE, target, items);
        if (hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`RemoveItems | Could not determine the UUID, please provide a valid target`, true);

        if (itemTypeFilters) {
            itemTypeFilters.forEach(filter => {
                if (typeof filter !== "string") throw lib.custom_error(`RemoveItems | entries in the itemTypeFilters must be of type string`);
            })
        }

        const targetActorItems = API.getItemPileItems(target);

        items.forEach(item => {
            const itemId = typeof item === "string" ? item : item._id;
            const actorItem = targetActorItems.find(actorItem => actorItem.id === itemId);
            if (!actorItem) {
                throw lib.custom_error(`RemoveItems | Could not find item with id "${itemId}" on target "${targetUuid}"`, true)
            }
            const disallowedType = API.isItemTypeDisallowed(actorItem, itemTypeFilters);
            if (disallowedType) {
                throw lib.custom_error(`RemoveItems | Could not transfer item of type "${disallowedType}"`, true)
            }
        });

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ITEMS, targetUuid, items);
    }

    /**
     * @private
     */
    static async _removeItems(targetUuid, items, { isTransfer = false } = {}) {

        const target = await fromUuid(targetUuid);
        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const itemsRemoved = [];
        const itemsToUpdate = [];
        const itemsToDelete = [];
        for (const item of items) {

            const itemId = typeof item === "string" ? item : item._id;

            const actorItem = targetActor.items.get(itemId);
            const removedItem = actorItem.toObject();

            const currentQuantity = Number(getProperty(actorItem.data, API.ITEM_QUANTITY_ATTRIBUTE));

            const quantityToRemove = Number(getProperty(item, API.ITEM_QUANTITY_ATTRIBUTE) ?? item.quantity ?? currentQuantity);

            const newQuantity = Math.max(0, currentQuantity - quantityToRemove);

            if (newQuantity >= 1) {
                setProperty(removedItem, API.ITEM_QUANTITY_ATTRIBUTE, quantityToRemove);
                itemsToUpdate.push({ _id: actorItem.id, [API.ITEM_QUANTITY_ATTRIBUTE]: newQuantity });
            } else {
                setProperty(removedItem, API.ITEM_QUANTITY_ATTRIBUTE, currentQuantity);
                itemsToDelete.push(actorItem.id);
            }

            itemsRemoved.push(removedItem);

        }

        await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);
        await targetActor.deleteEmbeddedDocuments("Item", itemsToDelete);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.REMOVE, targetUuid, itemsRemoved);

        if (!isTransfer) {

            const macroData = {
                action: "removeItems",
                target: targetUuid,
                items: itemsRemoved
            };

            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(targetUuid);

            await API.rerenderItemPileInventoryApplication(targetUuid, shouldBeDeleted);

            if (shouldBeDeleted) {
                await API._deleteItemPile(targetUuid);
            }

        }

        return itemsRemoved;

    }

    /**
     * Transfers items from the source to the target, subtracting a number of quantity from the source's item and adding it to the target's item, deleting items from the source if their quantity reaches 0
     *
     * @param {Actor/Token/TokenDocument} source        The source to transfer the items from
     * @param {Actor/Token/TokenDocument} target        The target to transfer the items to
     * @param {array} items                             An array of objects each containing the item id (key "_id") and the quantity to transfer (key "quantity")
     * @param {array/boolean} [itemTypeFilters=false]   Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<object>}                       An object containing a key value pair for each item added to the target, key being item ID, value being quantities added
     */
    static async transferItems(source, target, items, { itemTypeFilters = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_TRANSFER, source, target, items);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferItems | Could not determine the UUID, please provide a valid source`, true)

        if (itemTypeFilters) {
            itemTypeFilters.forEach(filter => {
                if (typeof filter !== "string") throw lib.custom_error(`TransferItems | entries in the itemTypeFilters must be of type string`);
            })
        }

        const sourceActorItems = API.getItemPileItems(source);

        items.forEach(item => {
            const actorItem = sourceActorItems.find(actorItem => actorItem.id === item._id);
            if (!actorItem) {
                throw lib.custom_error(`TransferItems | Could not find item with id "${item._id}" on source "${sourceUuid}"`, true)
            }
            const disallowedType = API.isItemTypeDisallowed(actorItem, itemTypeFilters);
            if (disallowedType) {
                throw lib.custom_error(`TransferItems | Could not transfer item of type "${disallowedType}"`, true)
            }
        });

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferItems | Could not determine the UUID, please provide a valid target`, true)

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ITEMS, sourceUuid, targetUuid, items, { itemTypeFilters });

    }

    /**
     * @private
     */
    static async _transferItems(sourceUuid, targetUuid, items, { itemTypeFilters = false, isEverything = false } = {}) {

        const itemsRemoved = await API._removeItems(sourceUuid, items, { itemTypeFilters, isTransfer: true });

        const itemsAdded = await API._addItems(targetUuid, itemsRemoved, { itemTypeFilters, isTransfer: true });

        if (!isEverything) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.TRANSFER, sourceUuid, targetUuid, itemsAdded);

            const macroData = {
                action: "transferItems",
                source: sourceUuid,
                target: targetUuid,
                itemsAdded: itemsAdded
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API.rerenderItemPileInventoryApplication(sourceUuid, shouldBeDeleted);
            await API.rerenderItemPileInventoryApplication(targetUuid);

            if (shouldBeDeleted) {
                await API._deleteItemPile(sourceUuid);
            }

        }

        return itemsAdded;

    }

    /**
     * Transfers all items between the source and the target.
     *
     * @param {Actor/Token/TokenDocument} source        The actor to transfer all items from
     * @param {Actor/Token/TokenDocument} target        The actor to receive all the items
     * @param {array/boolean} [itemTypeFilters=false]   Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<array>}                        An array containing all of the items that were transferred to the target
     */
    static async transferAllItems(source, target, { itemTypeFilters = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_TRANSFER_ALL, source, target, itemTypeFilters);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid target`, true)

        if (itemTypeFilters) {
            itemTypeFilters.forEach(filter => {
                if (typeof filter !== "string") throw lib.custom_error(`revertFromItemPiles | entries in the itemTypeFilters must be of type string`);
            })
        }

        return itemPileSocket.executeAsGM(
            SOCKET_HANDLERS.TRANSFER_ALL_ITEMS,
            sourceUuid,
            targetUuid,
            {
                itemTypeFilters
            }
        );
    }

    /**
     * @private
     */
    static async _transferAllItems(sourceUuid, targetUuid, { itemTypeFilters = false, isEverything = false } = {}) {

        const source = await fromUuid(sourceUuid);

        const itemsToRemove = API.getItemPileItems(source, itemTypeFilters).map(item => item.toObject());

        const itemsRemoved = await API._removeItems(sourceUuid, itemsToRemove, { isTransfer: true });
        const itemsAdded = await API._addItems(targetUuid, itemsRemoved, { isTransfer: true });

        if (!isEverything) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, HOOKS.ITEM.TRANSFER_ALL, sourceUuid, targetUuid, itemsAdded);

            const macroData = {
                action: "transferAllItems",
                source: sourceUuid,
                target: targetUuid,
                items: itemsAdded
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API.rerenderItemPileInventoryApplication(sourceUuid, shouldBeDeleted);
            await API.rerenderItemPileInventoryApplication(targetUuid);

            if (shouldBeDeleted) {
                await API._deleteItemPile(sourceUuid);
            }

        }

        return itemsAdded;
    }

    /**
     * Adds to attributes on an actor
     *
     * @param {Actor/Token/TokenDocument} target    The target whose attribute will have a set quantity added to it
     * @param {object} attributes                   An object with each key being an attribute path, and its value being the quantity to add
     *
     * @returns {Promise<object>}                   Returns an array containing a key value pair of the attribute path and the quantity of that attribute that was removed
     *
     */
    static async addAttributes(target, attributes) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_ADD, target, attributes);
        if (hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`AddAttributes | Could not determine the UUID, please provide a valid target`, true)

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        Object.entries(attributes).forEach(entry => {
            const [attribute, quantity] = entry;
            if (!hasProperty(targetActor.data, attribute)) {
                throw lib.custom_error(`AddAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
            }
            if (!lib.is_real_number(quantity) && quantity > 0) {
                throw lib.custom_error(`AddAttributes | Attribute "${attribute}" must be of type number and greater than 0`, true)
            }
        });

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ATTRIBUTE, targetUuid, attributes);

    }

    /**
     * @private
     */
    static async _addAttributes(targetUuid, attributes, { isTransfer = false } = {}) {

        const target = await fromUuid(targetUuid);
        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const updates = {};
        const attributesAdded = {};

        for (const [attribute, quantityToAdd] of Object.entries(attributes)) {

            const currentQuantity = Number(getProperty(targetActor.data, attribute));

            updates[attribute] = currentQuantity + quantityToAdd;
            attributesAdded[attribute] = currentQuantity + quantityToAdd;

        }

        await targetActor.update(updates);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.ADD, targetUuid, attributesAdded);

        if (isTransfer) {

            const macroData = {
                action: "addAttributes",
                target: targetUuid,
                attributes: attributesAdded
            };
            await API._executeItemPileMacro(targetUuid, macroData);

            await API.rerenderItemPileInventoryApplication(targetUuid);
        }

        return attributesAdded;

    }

    /**
     * Subtracts attributes on the target
     *
     * @param {Token/TokenDocument} target  The target whose attributes will be subtracted from
     * @param {array/object} attributes     This can be either an array of attributes to subtract (to zero out a given attribute), or an object with each key being an attribute path, and its value being the quantity to subtract
     *
     * @returns {Promise<object>}           Returns an array containing a key value pair of the attribute path and the quantity of that attribute that was removed
     */
    static async removeAttributes(target, attributes) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_REMOVE, target, attributes);
        if (hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`RemoveAttributes | Could not determine the UUID, please provide a valid target`, true)

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        if (Array.isArray(attributes)) {
            attributes.forEach(attribute => {
                if (typeof attribute !== "string") {
                    throw lib.custom_error(`RemoveAttributes | Each attribute in the array must be of type string`, true)
                }
                if (!hasProperty(targetActor.data, attribute)) {
                    throw lib.custom_error(`RemoveAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
                }
            });
        } else {
            Object.entries(attributes).forEach(entry => {
                const [attribute, quantity] = entry;
                if (!hasProperty(targetActor.data, attribute)) {
                    throw lib.custom_error(`RemoveAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
                }
                if (!lib.is_real_number(quantity) && quantity > 0) {
                    throw lib.custom_error(`RemoveAttributes | Attribute "${attribute}" must be of type number and greater than 0`, true)
                }
            });
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ATTRIBUTES, targetUuid, attributes);

    }

    /**
     * @private
     */
    static async _removeAttributes(targetUuid, attributes, { isTransfer = false } = {}) {

        const target = await fromUuid(targetUuid);
        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const updates = {};
        const attributesRemoved = {};

        if (Array.isArray(attributes)) {
            attributes = Object.fromEntries(attributes.map(attribute => {
                return [attribute, Number(getProperty(targetActor.data, attribute))];
            }))
        }

        for (const [attribute, quantityToRemove] of Object.entries(attributes)) {

            const currentQuantity = Number(getProperty(targetActor.data, attribute));
            const newQuantity = Math.max(0, currentQuantity - quantityToRemove);

            updates[attribute] = newQuantity;

            // if the target's quantity is above 1, we've removed the amount we expected, otherwise however many were left
            attributesRemoved[attribute] = newQuantity ? quantityToRemove : currentQuantity;
        }

        await targetActor.update(updates);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.REMOVE, targetUuid, attributesRemoved);

        if (!isTransfer) {

            const macroData = {
                action: "removeAttributes",
                target: targetUuid,
                attributes: attributesRemoved
            };
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(targetUuid);
            await API.rerenderItemPileInventoryApplication(targetUuid, shouldBeDeleted);

            if (shouldBeDeleted) {
                await API._deleteItemPile(targetUuid);
            }
        }

        return attributesRemoved;

    }

    /**
     * Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target
     *
     * @param {Actor/Token/TokenDocument} source    The source to transfer the attribute from
     * @param {Actor/Token/TokenDocument} target    The target to transfer the attribute to
     * @param {array/object} attributes             This can be either an array of attributes to transfer (to transfer all of a given attribute), or an object with each key being an attribute path, and its value being the quantity to transfer
     *
     * @returns {Promise<object>}                   An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
     */
    static async transferAttributes(source, target, attributes) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER, source, target, attributes);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferAttributes | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferAttributes | Could not determine the UUID, please provide a valid target`, true)

        const sourceActor = source instanceof TokenDocument
            ? source.actor
            : source;

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        if (Array.isArray(attributes)) {
            attributes.forEach(attribute => {
                if (typeof attribute !== "string") {
                    throw lib.custom_error(`TransferAttributes | Each attribute in the array must be of type string`, true)
                }
                if (!hasProperty(sourceActor.data, attribute)) {
                    throw lib.custom_error(`TransferAttributes | Could not find attribute ${attribute} on source's actor with UUID "${targetUuid}"`, true)
                }
                if (!hasProperty(targetActor.data, attribute)) {
                    throw lib.custom_error(`TransferAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
                }
            });
        } else {
            Object.entries(attributes).forEach(entry => {
                const [attribute, quantity] = entry;
                if (!hasProperty(sourceActor.data, attribute)) {
                    throw lib.custom_error(`TransferAttributes | Could not find attribute ${attribute} on source's actor with UUID "${targetUuid}"`, true)
                }
                if (!hasProperty(targetActor.data, attribute)) {
                    throw lib.custom_error(`TransferAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`, true)
                }
                if (!lib.is_real_number(quantity) && quantity > 0) {
                    throw lib.custom_error(`TransferAttributes | Attribute "${attribute}" must be of type number and greater than 0`, true)
                }
            });
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ATTRIBUTES, sourceUuid, targetUuid, attributes);

    }

    /**
     * @private
     */
    static async _transferAttributes(sourceUuid, targetUuid, attributes, { isEverything = false } = {}) {

        const attributesRemoved = await API._removeAttributes(sourceUuid, attributes, { isTransfer: true });

        const attributesAdded = await API._addAttributes(targetUuid, attributesRemoved, { isTransfer: true });

        if (!isEverything) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.TRANSFER, sourceUuid, targetUuid, attributesAdded);

            const macroData = {
                action: "transferAttributes",
                source: sourceUuid,
                target: targetUuid,
                attributes: attributesAdded
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API.rerenderItemPileInventoryApplication(sourceUuid, shouldBeDeleted);
            await API.rerenderItemPileInventoryApplication(targetUuid);

            if (shouldBeDeleted) {
                await API._deleteItemPile(sourceUuid);
            }

        }

        return attributesAdded

    }

    /**
     * Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target
     *
     * @param {Actor/Token/TokenDocument} source    The source to transfer the attributes from
     * @param {Actor/Token/TokenDocument} target    The target to transfer the attributes to
     *
     * @returns {Promise<object>}                   An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
     */
    static async transferAllAttributes(source, target) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER_ALL, source, target);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid source`, true);

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid target`, true);

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ALL_ATTRIBUTES, sourceUuid, targetUuid);

    }

    /**
     * @private
     */
    static async _transferAllAttributes(sourceUuid, targetUuid, { isEverything = false } = {}) {

        const source = await fromUuid(sourceUuid);

        const sourceActor = source instanceof TokenDocument
            ? source.actor
            : source;

        const target = await fromUuid(targetUuid);

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const sourceAttributes = API.getItemPileAttributes(sourceActor);

        const attributesToTransfer = sourceAttributes.filter(attribute => {
            return hasProperty(sourceActor.data, attribute.path)
                && Number(getProperty(sourceActor.data, attribute.path)) > 0
                && hasProperty(targetActor.data, attribute.path);
        }).map(attribute => attribute.path);

        const attributesRemoved = await API._removeAttributes(sourceUuid, attributesToTransfer, { isTransfer: true });
        const attributesAdded = await API._addAttributes(targetUuid, attributesRemoved, { isTransfer: true });

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.TRANSFER_ALL, sourceUuid, targetUuid, attributesAdded);

        if (!isEverything) {

            const macroData = {
                action: "transferAllAttributes",
                source: sourceUuid,
                target: targetUuid,
                attributes: attributesAdded
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API.rerenderItemPileInventoryApplication(sourceUuid, shouldBeDeleted);

            if (shouldBeDeleted) {
                await API._deleteItemPile(sourceUuid);
            }

        }

        return attributesAdded;

    }

    /**
     * Transfers all items and attributes between the source and the target.
     *
     * @param {Actor/Token/TokenDocument} source        The actor to transfer all items and attributes from
     * @param {Actor/Token/TokenDocument} target        The actor to receive all the items and attributes
     * @param {array/boolean} [itemTypeFilters=false]   Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<object>}                       An object containing all items and attributes transferred to the target
     */
    static async transferEverything(source, target, { itemTypeFilters = false } = {}) {

        const hookResult = Hooks.call(HOOKS.PRE_TRANSFER_EVERYTHING, source, target, itemTypeFilters);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid target`, true)

        if (itemTypeFilters) {
            itemTypeFilters.forEach(filter => {
                if (typeof filter !== "string") throw lib.custom_error(`TransferEverything | entries in the itemTypeFilters must be of type string`);
            })
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, { itemTypeFilters })

    }

    /**
     * @private
     */
    static async _transferEverything(sourceUuid, targetUuid, { itemTypeFilters = false } = {}) {

        const itemsTransferred = await API._transferAllItems(sourceUuid, targetUuid, { itemTypeFilters, isEverything: true });
        const attributesTransferred = await API._transferAllAttributes(sourceUuid, targetUuid, { isEverything: true });

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, itemsTransferred, attributesTransferred);

        const macroData = {
            action: "transferEverything",
            source: sourceUuid,
            target: targetUuid,
            items: itemsTransferred,
            attributes: attributesTransferred
        };
        await API._executeItemPileMacro(sourceUuid, macroData);
        await API._executeItemPileMacro(targetUuid, macroData);

        const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
        await API.rerenderItemPileInventoryApplication(sourceUuid, shouldBeDeleted);
        await API.rerenderItemPileInventoryApplication(targetUuid);

        if (shouldBeDeleted) {
            await API._deleteItemPile(sourceUuid);
        }

        return {
            itemsTransferred,
            attributesTransferred
        };

    }

    /* -------- UTILITY METHODS -------- */

    /**
     * Causes every user's token HUD to rerender
     *
     * @return {Promise}
     */
    static async rerenderTokenHud() {
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_TOKEN_HUD);
    }

    /**
     * @private
     */
    static async _rerenderTokenHud() {
        if (!canvas.tokens.hud.rendered) return;
        await canvas.tokens.hud.render(true)
        return true;
    }

    /**
     * Checks whether an item (or item data) is of a type that is not allowed. If an array whether that type is allowed
     * or not, returning the type if it is NOT allowed.
     *
     * @param {Item/Object} item
     * @param {array/boolean} [itemTypeFilters=false]
     * @return {boolean/string}
     */
    static isItemTypeDisallowed(item, itemTypeFilters = false) {
        if (!API.ITEM_TYPE_ATTRIBUTE) return false;
        if (!Array.isArray(itemTypeFilters)) itemTypeFilters = API.ITEM_TYPE_FILTERS;
        const itemType = getProperty(item, API.ITEM_TYPE_ATTRIBUTE);
        if (itemTypeFilters.includes(itemType)) {
            return itemType;
        }
        return false;
    }

    /* -------- PRIVATE ITEM PILE METHODS -------- */

    /**
     * Initializes a pile on the client-side.
     *
     * @param {TokenDocument} tokenDocument
     * @return {Promise<boolean>}
     * @private
     */
    static async _initializeItemPile(tokenDocument) {

        if (!lib.isValidItemPile(tokenDocument)) return false;

        const pileData = lib.getItemPileData(tokenDocument);

        if (game.settings.get(CONSTANTS.MODULE_NAME, "preloadFiles")) {
            await Promise.allSettled(Object.entries(pileData).map(entry => {
                return new Promise(async (resolve) => {
                    const [key, value] = entry;
                    if (preloadedFiles.has(value) || !value){
                        return resolve();
                    }
                    if (key.toLowerCase().includes("image")) {
                        preloadedFiles.add(value);
                        lib.debug(`Preloaded image: ${value}`);
                        await loadTexture(value);
                    } else if (key.toLowerCase().includes("sound")) {
                        preloadedFiles.add(value);
                        lib.debug(`Preloaded sound: ${value}`);
                        await AudioHelper.preloadSound(value);
                    }
                    return resolve();
                });
            }));
        }

        lib.debug(`Initialized item pile with uuid ${tokenDocument.uuid}`);

        return true;
    }

    /**
     * This executes any macro that is configured on the item pile, providing the macro with extra data relating to the
     * action that prompted the execution (if the advanced-macros module is installed)
     *
     * @param {String} targetUuid
     * @param {Object} macroData
     * @return {Promise}
     * @private
     */
    static async _executeItemPileMacro(targetUuid, macroData) {

        const target = await fromUuid(targetUuid);

        if (!lib.isValidItemPile(target)) return;

        const pileData = lib.getItemPileData(target);

        if (!pileData.macro) return;

        const macro = game.macros.getName(pileData.macro);

        if (!macro) {
            throw lib.custom_error(`Could not find macro with name "${pileData.macro}" on target with UUID ${target.uuid}`);
        }

        // Reformat macro data to contain useful information
        if (macroData.source) {
            macroData.source = await fromUuid(macroData.source);
        }

        if (macroData.target) {
            macroData.target = await fromUuid(macroData.target);
        }

        const targetActor = macroData.target instanceof TokenDocument
            ? macroData.target.actor
            : macroData.target;

        if (macroData.item) {
            macroData.items = macroData.items.map(item => targetActor.items.get(item._id));
        }

        return macro.execute([macroData]);

    }

    /**
     * This handles any dropped data onto the canvas or a set item pile
     *
     * @param {canvas} canvas
     * @param {object} data
     * @param {Actor/Token/TokenDocument/boolean}[target=false]
     * @return {Promise}
     * @private
     */
    static async _dropDataOnCanvas(canvas, data, { target = false } = {}) {

        if (data.type !== "Item") return;

        let itemData;
        if(data.pack){
            const uuid = `Compendium.${data.pack}.${data.id}`;
            const item = await fromUuid(uuid);
            itemData = item.toObject();
        }else if(data.id){
            itemData = game.items.get(data.id)?.toObject();
        }else{
            itemData = data.data;
        }

        if (!itemData) {
            console.error(data);
            throw lib.custom_error("Something went wrong when dropping this item!")
        }

        const dropData = {
            source: false,
            target: target,
            itemData: itemData,
            position: false,
            force: false
        }

        const disallowedType = API.isItemTypeDisallowed(itemData);
        if (disallowedType) {
            if (!game.user.isGM) {
                return lib.custom_warning(game.i18n.format("ITEM-PILES.Errors.DisallowedItemDrop", { type: disallowedType }), true)
            }
            if (!game.keyboard.downKeys.has("ShiftLeft")) {
                dropData.force = await Dialog.confirm({
                    title: game.i18n.localize("ITEM-PILES.Dialogs.DropTypeWarning.Title"),
                    content: `<p class="item-piles-dialog">${game.i18n.format("ITEM-PILES.Dialogs.DropTypeWarning.Content", { type: disallowedType })}</p>`,
                    defaultYes: false
                });
                if (!dropData.force) {
                    return;
                }
            }
        }

        if (data.tokenId) {
            dropData.source = canvas.tokens.get(data.tokenId).actor;
        } else if (data.actorId) {
            dropData.source = game.actors.get(data.actorId);
        }

        if (!dropData.source && !game.user.isGM) {
            return lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
        }

        const pre_drop_determined_hook = Hooks.call(HOOKS.ITEM.PRE_DROP_DETERMINED, dropData.source, dropData.target, dropData.position, dropData.itemData, dropData.force);
        if (pre_drop_determined_hook === false) return;

        let action = "addToPile";
        let droppableDocuments = [];
        let x;
        let y;

        if (dropData.target) {

            droppableDocuments.push(dropData.target);

        } else {

            const position = canvas.grid.getTopLeft(data.x, data.y);
            x = position[0];
            y = position[1];

            droppableDocuments = lib.getTokensAtLocation({ x, y })
                .map(token => token.document)
                .filter(token => lib.isValidItemPile(token));

        }

        if (droppableDocuments.length > 0 && !game.user.isGM) {

            const sourceToken = canvas.tokens.placeables.find(token => token.actor === dropData.source);

            if(sourceToken){

                const targetToken = droppableDocuments[0];

                const distance = Math.floor(lib.distance_between_rect(sourceToken, targetToken.object) / canvas.grid.size) + 1

                const pileData = lib.getItemPileData(targetToken);

                const maxDistance = pileData.distance ? pileData.distance : Infinity;

                if(distance > maxDistance) {
                    lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
                    return;
                }
            }

            droppableDocuments = droppableDocuments.filter(token => !API.isItemPileLocked(token));

            if (!droppableDocuments.length) {
                lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileLocked"), true);
                return;
            }
        }

        if (game.keyboard.downKeys.has("AltLeft")) {

            if (droppableDocuments.length) {
                action = "addToPile";
            }

            setProperty(dropData.itemData, API.ITEM_QUANTITY_ATTRIBUTE, 1);

        } else {

            const result = await DropDialog.query(itemData, droppableDocuments);

            if (!result) return;
            action = result.action;
            setProperty(dropData.itemData, API.ITEM_QUANTITY_ATTRIBUTE, Number(result.quantity))

        }

        if (action === "addToPile") {
            dropData.target = droppableDocuments[0];
        } else {
            dropData.position = { x, y };
        }

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_DROP, dropData.source, dropData.target, dropData.position, dropData.itemData, dropData.force);
        if (hookResult === false) return;

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DROP_ITEMS, {
            sourceUuid: lib.getUuid(dropData.source),
            targetUuid: lib.getUuid(dropData.target),
            position: dropData.position,
            itemData: dropData.itemData,
            force: dropData.force
        });

    }

    /**
     * If not given an actor, this method creates an item pile at a location, then adds an item to it.
     *
     * If a target was provided, it will just add the item to that target actor.
     *
     * If an actor was provided, it will transfer the item from the actor to the target actor.
     *
     * @param {string/boolean} [sourceUuid=false]
     * @param {string/boolean} [targetUuid=false]
     * @param {object/boolean} [position=false]
     * @param {object} [itemData=false]
     * @param {boolean} [force=false]
     *
     * @returns {Promise<{sourceUuid: string/boolean, targetUuid: string/boolean, position: object/boolean, itemsDropped: array }>}
     * @private
     */
    static async _dropItems({
        sourceUuid = false,
        targetUuid = false,
        itemData = false,
        position = false,
        force = false
    } = {}) {

        const itemTypeFilters = force ? [] : API.ITEM_TYPE_FILTERS;

        let itemsDropped = [itemData];

        // If there's a source of the item (it wasn't dropped from the item bar)
        if (sourceUuid) {

            // If there's a target token, add the item to it, otherwise create a new pile at the drop location
            if (targetUuid) {
                itemsDropped = await API._transferItems(sourceUuid, targetUuid, itemsDropped, { itemTypeFilters });
            } else {
                const itemsRemoved = await API._removeItems(sourceUuid, itemsDropped, { itemTypeFilters });
                targetUuid = await API._createItemPile(position, { items: itemsRemoved });
                const target = await fromUuid(targetUuid);
                itemsDropped = Array.from(target.actor.items).map(item => item.toObject());
            }

            // If there's no source (it was dropped from the item bar)
        } else {

            // If there's a target token, add the item to it, otherwise create a new pile at the drop location
            if (targetUuid) {
                itemsDropped = await API._addItems(targetUuid, itemsDropped, { itemTypeFilters });
            } else {
                targetUuid = await API._createItemPile(position, { items: itemsDropped });
                const target = await fromUuid(targetUuid);
                itemsDropped = Array.from(target.actor.items).map(item => item.toObject());
            }

        }

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.DROP, sourceUuid, targetUuid, itemsDropped, position);

        return { sourceUuid, targetUuid, position, itemsDropped };

    }

    /**
     * @private
     */
    static async _itemPileClicked(pileDocument) {

        if(!lib.isValidItemPile(pileDocument)) return;

        const pileToken = pileDocument.object;

        if (!lib.isGMConnected()){
            lib.custom_warning(`Item Piles requires a GM to be connected for players to be able to loot item piles.`, true)
            return;
        }

        lib.debug(`Clicked: ${pileDocument.uuid}`);

        const data = lib.getItemPileData(pileDocument);

        const maxDistance = data.distance ? data.distance : Infinity;

        let validTokens;

        if(canvas.tokens.controlled.length > 0){
            validTokens = [...canvas.tokens.controlled];
        }else{
            validTokens = [...canvas.tokens.placeables];
            if(_token){
                validTokens.unshift(_token);
            }
        }

        validTokens = validTokens.filter(token => {
            return lib.tokens_close_enough(pileToken, token, maxDistance) || game.user.isGM;
        }).filter(token => token.owner && token.document !== pileDocument);

        if (!validTokens.length && !game.user.isGM) {
            lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
            return;
        }

        let interactingToken;
        if(validTokens.length) {
            if (validTokens.includes(_token)) {
                interactingToken = _token.document;
            } else {
                validTokens.sort((potentialTargetA, potentialTargetB) => {
                    return lib.grids_between_tokens(pileToken, potentialTargetA) - lib.grids_between_tokens(pileToken, potentialTargetB);
                })
                interactingToken = validTokens[0].document;
            }
        }

        if (data.isContainer && interactingToken) {

            if (data.locked && !game.user.isGM) {
                lib.debug(`Attempted to locked item pile with UUID ${pileDocument.uuid}`);
                return API.rattleItemPile(pileDocument, interactingToken);
            }

            if (data.closed) {
                lib.debug(`Opened item pile with UUID ${pileDocument.uuid}`);
                await API.openItemPile(pileDocument, interactingToken);
            }

        }

        const result = Hooks.call(HOOKS.PILE.PRE_OPEN_INVENTORY, pileDocument, interactingToken);
        if(result === false) return;

        return ItemPileInventory.show(pileDocument, interactingToken);

    }

    /**
     * @private
     */
    static async _checkItemPileShouldBeDeleted(targetUuid) {

        const target = await fromUuid(targetUuid);

        if (!(target instanceof TokenDocument)) return false;

        const pileData = lib.getItemPileData(target);

        const shouldDelete = {
            "default": game.settings.get(CONSTANTS.MODULE_NAME, "deleteEmptyPiles"),
            "true": true,
            "false": false
        }[pileData?.deleteWhenEmpty ?? "default"]

        return pileData?.enabled && shouldDelete && lib.isItemPileEmpty(target);

    }

}

const preloadedFiles = new Set();