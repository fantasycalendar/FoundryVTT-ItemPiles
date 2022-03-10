import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { ItemPileInventory } from "./formapplications/item-pile-inventory.js";
import DropItemDialog from "./formapplications/drop-item-dialog.js";
import HOOKS from "./hooks.js";
import { hotkeyState } from "./hotkeys.js";

const preloadedFiles = new Set();

const API = {

    /**
     * The actor class type used for the original item pile actor in this system
     *
     * @returns {String}
     */
    get ACTOR_CLASS_TYPE() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "actorClassType");
    },

    /**
     * The currencies used in this system
     *
     * @returns {Array<{name: String, currency: String, img: String}>}
     */
    get CURRENCIES() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "currencies");
    },

    /**
     * The attribute used to track the quantity of items in this system
     *
     * @returns {String}
     */
    get ITEM_QUANTITY_ATTRIBUTE() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemQuantityAttribute");
    },

    /**
     * The filters for item types eligible for interaction within this system
     *
     * @returns {Array<{name: String, filters: String}>}
     */
    get ITEM_FILTERS() {
        return lib.cleanItemFilters(game.settings.get(CONSTANTS.MODULE_NAME, "itemFilters"));
    },

    /**
     * The attributes for detecting item similarities
     *
     * @returns {Array<String>}
     */
    get ITEM_SIMILARITIES() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemSimilarities");
    },

    /**
     * Sets the actor class type used for the original item pile actor in this system
     *
     * @param {String} inClassType
     * @returns {Promise}
     */
    async setActorClassType(inClassType) {
        if (typeof inClassType !== "string") {
            throw lib.custom_error("setActorTypeClass | inClassType must be of type string");
        }
        await game.settings.set(CONSTANTS.MODULE_NAME, "preconfiguredSystem", true);
        return game.settings.set(CONSTANTS.MODULE_NAME, "actorClassType", inClassType);
    },

    /**
     * Sets the currencies used in this system
     *
     * @param {Array<{name: String, currency: String, img: String}>} inCurrencies
     * @returns {Promise}
     */
    async setCurrencies(inCurrencies) {
        if (!Array.isArray(inCurrencies)) {
            throw lib.custom_error("setCurrencies | inCurrencies must be of type array");
        }
        inCurrencies.forEach(currency => {
            if (typeof currency !== "object") {
                throw lib.custom_error("setCurrencies | each entry in the inCurrencies array must be of type object");
            }
            if (typeof currency.name !== "string") {
                throw lib.custom_error("setCurrencies | currency.name must be of type string");
            }
            if (typeof currency.currency !== "string") {
                throw lib.custom_error("setCurrencies | currency.path must be of type string");
            }
            if (currency.img && typeof currency.img !== "string") {
                throw lib.custom_error("setCurrencies | currency.img must be of type string");
            }
        })
        await game.settings.set(CONSTANTS.MODULE_NAME, "preconfiguredSystem", true);
        return game.settings.set(CONSTANTS.MODULE_NAME, "currencies", inCurrencies);
    },

    /**
     * Sets the inAttribute used to track the quantity of items in this system
     *
     * @param {String} inAttribute
     * @returns {Promise}
     */
    async setItemQuantityAttribute(inAttribute) {
        if (typeof inAttribute !== "string") {
            throw lib.custom_error("setItemQuantityAttribute | inAttribute must be of type string");
        }
        await game.settings.set(CONSTANTS.MODULE_NAME, "preconfiguredSystem", true);
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemQuantityAttribute", inAttribute);
    },

    /**
     * Sets the items filters for interaction within this system
     *
     * @param {Array<{path: String, filters: String}>} inFilters
     * @returns {Promise}
     */
    async setItemFilters(inFilters) {
        if (!Array.isArray(inFilters)) {
            throw lib.custom_error("setItemFilters | inFilters must be of type array");
        }
        inFilters.forEach(filter => {
            if (typeof filter?.path !== "string") {
                throw lib.custom_error("setItemFilters | each entry in inFilters must have a \"path\" property with a value that is of type string");
            }
            if (typeof filter?.filters !== "string") {
                throw lib.custom_error("setItemFilters | each entry in inFilters must have a \"filters\" property with a value that is of type string");
            }
        });
        await game.settings.set(CONSTANTS.MODULE_NAME, "preconfiguredSystem", true);
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemFilters", inFilters);
    },

    /**
     * Sets the attributes for detecting item similarities
     *
     * @param {Array<String>} inPaths
     * @returns {Promise}
     */
    async setItemSimilarities(inPaths) {
        if (!Array.isArray(inPaths)) {
            throw lib.custom_error("setItemSimilarities | inPaths must be of type array");
        }
        inPaths.forEach(path => {
            if (typeof path !== "string") {
                throw lib.custom_error("setItemSimilarities | each entry in inPaths must be of type string");
            }
        });
        await game.settings.set(CONSTANTS.MODULE_NAME, "preconfiguredSystem", true);
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemSimilarities", inPaths);
    },

    /**
     * Creates the default item pile token at a location.
     *
     * @param {Object} position                         The position to create the item pile at
     * @param {String/Boolean} [sceneId=false]          Which scene to create the item pile on
     * @param {Array/Boolean} [items=false]             Any items to create on the item pile
     * @param {String/Boolean} [pileActorName=false]    Whether to use an existing item pile actor as the basis of this new token
     *
     * @returns {Promise}
     */
    async createItemPile(position, { sceneId = game.user.viewedScene, items = false, pileActorName = false } = {}) {

        const hookResult = Hooks.call(HOOKS.PILE.PRE_CREATE, position, items, pileActorName);
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

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.CREATE_PILE, sceneId, position, { pileActorName, items });
    },

    /**
     * Turns tokens and its actors into item piles
     *
     * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be turned into item piles
     * @param {Object} pileSettings                                     Overriding settings to be put on the item piles' settings
     * @param {Object} tokenSettings                                    Overriding settings that will update the tokens' settings
     *
     * @return {Promise<Array>}                                         The uuids of the targets after they were turned into item piles
     */
    async turnTokensIntoItemPiles(targets, { pileSettings = {}, tokenSettings = {} } = {}) {

        const hookResult = Hooks.call(HOOKS.PILE.PRE_TURN_INTO, targets, pileSettings, tokenSettings);
        if (hookResult === false) return;

        if (!Array.isArray(targets)) targets = [targets];

        const targetUuids = targets.map(target => {
            if (!(target instanceof Token || target instanceof TokenDocument)) {
                throw lib.custom_error(`turnTokensIntoItemPiles | Target must be of type Token or TokenDocument`, true)
            }
            const targetUuid = lib.getUuid(target);
            if (!targetUuid) throw lib.custom_error(`turnTokensIntoItemPiles | Could not determine the UUID, please provide a valid target`, true)
            return targetUuid;
        })

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TURN_INTO_PILE, targetUuids, pileSettings, tokenSettings);
    },

    /**
     * @private
     */
    async _turnTokensIntoItemPiles(targetUuids, pileSettings = {}, tokenSettings = {}) {

        const tokenUpdateGroups = {};
        const actorUpdateGroups = {};
        const defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        for (const targetUuid of targetUuids) {

            let target = await fromUuid(targetUuid);

            const existingPileSettings = foundry.utils.mergeObject(defaults, lib.getItemPileData(target));
            pileSettings = foundry.utils.mergeObject(existingPileSettings, pileSettings);
            pileSettings.enabled = true;

            const targetItems = lib.getActorItems(target, pileSettings.overrideItemFilters);
            const targetCurrencies = lib.getActorCurrencies(target, pileSettings.overrideCurrencies);

            const data = { data: pileSettings, items: targetItems, currencies: targetCurrencies };

            tokenSettings = foundry.utils.mergeObject(tokenSettings, {
                "img": lib.getItemPileTokenImage(target, data),
                "scale": lib.getItemPileTokenScale(target, data),
                "name": lib.getItemPileName(target, data)
            });

            const sceneId = targetUuid.split('.')[1];
            const tokenId = targetUuid.split('.')[3];

            if (!tokenUpdateGroups[sceneId]) {
                tokenUpdateGroups[sceneId] = []
            }

            tokenUpdateGroups[sceneId].push({
                "_id": tokenId,
                ...tokenSettings,
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileSettings,
                [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileSettings
            });

            if (target.isLinked) {
                if (actorUpdateGroups[target.actor.id]) continue;
                actorUpdateGroups[target.actor.id] = {
                    "_id": target.actor.id,
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileSettings
                }
            }
        }

        await Actor.updateDocuments(Object.values(actorUpdateGroups));

        for (const [sceneId, updateData] of Object.entries(tokenUpdateGroups)) {
            const scene = game.scenes.get(sceneId);
            await scene.updateEmbeddedDocuments("Token", updateData);
        }

        setTimeout(API.rerenderTokenHud, 100);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.TURN_INTO, targetUuids);

        return targetUuids;

    },

    /**
     * Reverts tokens from an item pile into a normal token and actor
     *
     * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be reverted from item piles
     * @param {Object} tokenSettings                                    Overriding settings that will update the tokens
     *
     * @return {Promise<Array>}                                         The uuids of the targets after they were reverted from being item piles
     */
    async revertTokensFromItemPiles(targets, { tokenSettings = {} } = {}) {
        const hookResult = Hooks.call(HOOKS.PILE.PRE_REVERT_FROM, targets, tokenSettings);
        if (hookResult === false) return;

        if (!Array.isArray(targets)) targets = [targets];

        const targetUuids = targets.map(target => {
            if (!(target instanceof Token || target instanceof TokenDocument)) {
                throw lib.custom_error(`revertTokensFromItemPiles | Target must be of type Token or TokenDocument`, true)
            }
            const targetUuid = lib.getUuid(target);
            if (!targetUuid) throw lib.custom_error(`revertTokensFromItemPiles | Could not determine the UUID, please provide a valid target`, true)
            return targetUuid;
        })

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REVERT_FROM_PILE, targetUuids, tokenSettings);
    },

    /**
     * @private
     */
    async _revertTokensFromItemPiles(targetUuids, tokenSettings) {

        const actorUpdateGroups = {};
        const tokenUpdateGroups = {};
        const defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

        for (const targetUuid of targetUuids) {

            let target = await fromUuid(targetUuid);

            const pileSettings = foundry.utils.mergeObject(defaults, lib.getItemPileData(target));
            pileSettings.enabled = false;

            const sceneId = targetUuid.split('.')[1];
            const tokenId = targetUuid.split('.')[3];

            if (!tokenUpdateGroups[sceneId]) {
                tokenUpdateGroups[sceneId] = [];
            }

            tokenUpdateGroups[sceneId].push({
                "_id": tokenId,
                ...tokenSettings,
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileSettings,
                [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileSettings
            });

            if (target.isLinked) {
                if (actorUpdateGroups[target.actor.id]) continue;
                actorUpdateGroups[target.actor.id] = {
                    "_id": target.actor.id,
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileSettings
                }
            }

        }

        await Actor.updateDocuments(Object.values(actorUpdateGroups));

        for (const [sceneId, updateData] of Object.entries(tokenUpdateGroups)) {
            const scene = game.scenes.get(sceneId);
            await scene.updateEmbeddedDocuments("Token", updateData);
        }

        setTimeout(API.rerenderTokenHud, 100);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.REVERT_FROM, targetUuids);

        return targetUuids;

    },

    /**
     * Opens a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    async openItemPile(target, interactingToken = false) {
        const targetDocument = lib.getDocument(target);
        const interactingTokenDocument = interactingToken ? lib.getDocument(interactingToken) : false;

        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        const wasLocked = data.locked;
        const wasClosed = data.closed;
        data.closed = false;
        data.locked = false;
        if (wasLocked) {
            const hookResult = Hooks.call(HOOKS.PILE.PRE_UNLOCK, targetDocument, data, interactingTokenDocument);
            if (hookResult === false) return;
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_OPEN, targetDocument, data, interactingTokenDocument);
        if (hookResult === false) return;
        if (wasClosed && data.openSound) {
            AudioHelper.play({ src: data.openSound })
        }
        return API.updateItemPile(targetDocument, data, { interactingToken: interactingTokenDocument });
    },

    /**
     * Closes a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to close
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    async closeItemPile(target, interactingToken = false) {
        const targetDocument = lib.getDocument(target);
        const interactingTokenDocument = interactingToken ? lib.getDocument(interactingToken) : false;

        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        const wasClosed = data.closed;
        data.closed = true;
        const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, targetDocument, data, interactingTokenDocument);
        if (hookResult === false) return;
        if (!wasClosed && data.closeSound) {
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updateItemPile(targetDocument, data, { interactingToken: interactingTokenDocument });
    },

    /**
     * Toggles a pile's closed state if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to open or close
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    async toggleItemPileClosed(target, interactingToken = false) {
        const targetDocument = lib.getDocument(target);
        const interactingTokenDocument = interactingToken ? lib.getDocument(interactingToken) : false;

        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        if (data.closed) {
            await API.openItemPile(targetDocument, interactingTokenDocument);
        } else {
            await API.closeItemPile(targetDocument, interactingTokenDocument);
        }
        return !data.closed;
    },

    /**
     * Locks a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to lock
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    async lockItemPile(target, interactingToken = false) {
        const targetDocument = lib.getDocument(target);
        const interactingTokenDocument = interactingToken ? lib.getDocument(interactingToken) : false;

        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        const wasClosed = data.closed;
        data.closed = true;
        data.locked = true;
        if (!wasClosed) {
            const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, targetDocument, data, interactingTokenDocument);
            if (hookResult === false) return;
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_LOCK, targetDocument, data, interactingTokenDocument);
        if (hookResult === false) return;
        if (!wasClosed && data.closeSound) {
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updateItemPile(targetDocument, data, { interactingToken: interactingTokenDocument });
    },

    /**
     * Unlocks a pile if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to unlock
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    async unlockItemPile(target, interactingToken = false) {
        const targetDocument = lib.getDocument(target);
        const interactingTokenDocument = interactingToken ? lib.getDocument(interactingToken) : false;

        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        data.locked = false;
        Hooks.call(HOOKS.PILE.PRE_UNLOCK, targetDocument, data, interactingTokenDocument);
        return API.updateItemPile(targetDocument, data, { interactingToken: interactingTokenDocument });
    },

    /**
     * Toggles a pile's locked state if it is enabled and a container
     *
     * @param {Token/TokenDocument} target          Target pile to lock or unlock
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     *
     * @return {Promise}
     */
    async toggleItemPileLocked(target, interactingToken = false) {
        const targetDocument = lib.getDocument(target);
        const interactingTokenDocument = interactingToken ? lib.getDocument(interactingToken) : false;

        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        if (data.locked) {
            return API.unlockItemPile(targetDocument, interactingTokenDocument);
        }
        return API.lockItemPile(targetDocument, interactingTokenDocument);
    },

    /**
     * Causes the item pile to play a sound as it was attempted to be opened, but was locked
     *
     * @param {Token/TokenDocument} target
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     *
     * @return {Promise<boolean>}
     */
    async rattleItemPile(target, interactingToken = false) {
        const targetDocument = lib.getDocument(target);
        const interactingTokenDocument = interactingToken ? lib.getDocument(interactingToken) : false;

        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer || !data?.locked) return false;
        Hooks.call(HOOKS.PILE.PRE_RATTLE, targetDocument, data, interactingTokenDocument);
        if (data.lockedSound) {
            AudioHelper.play({ src: data.lockedSound })
        }
        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.RATTLE, lib.getUuid(targetDocument), data, lib.getUuid(interactingTokenDocument));
        return true;
    },

    /**
     * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {Boolean}
     */
    isItemPileLocked(target) {
        const targetDocument = lib.getDocument(target);
        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        return data.locked;
    },

    /**
     * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {Boolean}
     */
    isItemPileClosed(target) {
        const targetDocument = lib.getDocument(target);
        const data = lib.getItemPileData(targetDocument);
        if (!data?.enabled || !data?.isContainer) return false;
        return data.closed;
    },

    /**
     * Whether an item pile is a container. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {Boolean}
     */
    isItemPileContainer(target) {
        const targetDocument = lib.getDocument(target);
        const data = lib.getItemPileData(targetDocument);
        return data?.enabled && data?.isContainer;
    },

    /**
     * Updates a pile with new data.
     *
     * @param {Token/TokenDocument} target
     * @param {Object} newData
     * @param {Token/TokenDocument/Boolean} [interactingToken=false]
     * @param {Object/Boolean} [tokenSettings=false]
     *
     * @return {Promise}
     */
    async updateItemPile(target, newData, { interactingToken = false, tokenSettings = false } = {}) {

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
    },

    /**
     * @private
     */
    async _updateItemPile(targetUuid, newData, { interactingTokenUuid = false, tokenSettings = false } = {}) {

        const target = await fromUuid(targetUuid);

        const oldData = lib.getItemPileData(target);

        const data = foundry.utils.mergeObject(
            foundry.utils.duplicate(oldData),
            foundry.utils.duplicate(newData)
        );

        const diff = foundry.utils.diffObject(oldData, data);

        await lib.wait(15);

        await lib.updateItemPileData(target, data, tokenSettings);

        if (data.enabled && data.isContainer) {
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
    },

    /**
     * @private
     */
    async _updatedItemPile(targetUuid, diffData, interactingTokenUuid) {

        const target = await lib.getToken(targetUuid);

        const interactingToken = interactingTokenUuid ? await fromUuid(interactingTokenUuid) : false;

        if (foundry.utils.isObjectEmpty(diffData)) return;

        const data = lib.getItemPileData(target);

        Hooks.callAll(HOOKS.PILE.UPDATE, target, diffData, interactingToken)

        if (data.enabled && data.isContainer) {
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
    },

    /**
     * Deletes a pile, calling the relevant hooks.
     *
     * @param {Token/TokenDocument} target
     *
     * @return {Promise}
     */
    async deleteItemPile(target) {
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
    },

    async _deleteItemPile(targetUuid) {
        const target = await lib.getToken(targetUuid);
        return target.delete();
    },

    /**
     * @deprecated
     */
    async openItemPileInventory(...args) {
        lib.custom_warning("deprecation warning - openItemPileInventory has been renamed to renderItemPileInventory")
        return this.renderItemPileInterface(...args);
    },

    /**
     * Remotely opens an item pile's inventory, if you have permission to edit the item pile. Passing a user ID, or a list of user IDs, will cause those users to open the item pile.
     *
     * @param {Token/TokenDocument/Actor} target                                The item pile actor or token whose inventory to open
     * @param {Array<string>} userIds                                           The IDs of the users that should open this item pile inventory
     * @param {boolean/Token/TokenDocument/Actor} [inspectingTarget=false]      This will force the users to inspect this item pile as a specific character
     * @param {Boolean} [useDefaultCharacter=true]                              Causes the users to inspect the item pile inventory as their default character
     * @returns {Promise}
     */
    async renderItemPileInterface(target, userIds = [game.user.id], {
        inspectingTarget = false,
        useDefaultCharacter = true
    } = {}) {

        const targetDocument = lib.getDocument(target);
        const targetUuid = lib.getUuid(targetDocument);
        if (!targetUuid) throw lib.custom_error(`renderItemPileInterface | Could not determine the UUID, please provide a valid target item pile`);

        if (!lib.isValidItemPile(targetDocument)) {
            throw lib.custom_error("renderItemPileInterface | This target is not a valid item pile")
        }

        if (inspectingTarget && useDefaultCharacter) {
            throw lib.custom_error("renderItemPileInterface | You cannot force users to use both their default character and a specific character to inspect the pile")
        }

        if (!Array.isArray(userIds)) userIds = [userIds];

        if (!game.user.isGM) {
            if (userIds.length > 1 || !userIds.includes(game.user.id)) {
                throw lib.custom_error(`renderItemPileInterface | You are not a GM, so you cannot force others to render an item pile's interface`);
            }
            userIds = [game.user.id];
        }

        for (const userId of userIds) {
            const user = game.users.get(userId);
            if (!user) throw lib.custom_error(`renderItemPileInterface | No user with ID "${userId}" exists`);
            if (useDefaultCharacter) {
                if (!user.character) {
                    lib.custom_warning(`renderItemPileInterface | User with id "${userId}" has no default character`, true);
                    return;
                }
            }
        }

        const inspectingTargetUuid = inspectingTarget ? lib.getUuid(inspectingTarget) : false;
        if (inspectingTarget && !inspectingTargetUuid) throw lib.custom_error(`renderItemPileInterface | Could not determine the UUID, please provide a valid inspecting target`);

        return itemPileSocket.executeForUsers(SOCKET_HANDLERS.RENDER_INTERFACE, userIds, targetUuid, inspectingTargetUuid, useDefaultCharacter)
    },

    async _renderItemPileInterface(targetUuid, inspectingTargetUuid, useDefaultCharacter) {
        const target = await fromUuid(targetUuid);

        let inspectingTarget;
        if (useDefaultCharacter && !game.user.isGM) {
            inspectingTarget = game.user.character;
        } else {
            inspectingTarget = inspectingTargetUuid ? (await fromUuid(inspectingTargetUuid)) : false;
        }

        return ItemPileInventory.show(target, inspectingTarget, { remote: true });
    },

    /**
     * Whether a given document is a valid pile or not
     *
     * @param {Token/TokenDocument/Actor} document
     * @return {Boolean}
     */
    isValidItemPile(document) {
        return lib.isValidItemPile(document);
    },

    /**
     * Whether the item pile is empty
     *
     * @param {Token/TokenDocument/Actor} target
     * @returns {Boolean}
     */
    isItemPileEmpty(target) {
        return lib.isItemPileEmpty(target);
    },

    /**
     * Returns the items this item pile can transfer
     *
     * @param {Token/TokenDocument/Actor} target
     * @param {Array/Boolean} [itemFilters=false]   Array of item types disallowed - will default to pile settings or module settings if none provided
     * @returns {Array}
     */
    getItemPileItems(target, itemFilters = false) {
        return lib.getActorItems(target, itemFilters);
    },

    /**
     * Returns the currencies this item pile can transfer
     *
     * @param {Token/TokenDocument/Actor} target
     * @returns {Array}
     */
    getItemPileCurrencies(target) {
        return lib.getActorCurrencies(target);
    },

    /**
     * Refreshes the target image of an item pile, ensuring it remains in sync
     *
     * @param {Token/TokenDocument/Actor} target
     * @return {Promise}
     */
    async refreshItemPile(target) {
        if (!lib.isValidItemPile(target)) return;
        const targetUuid = lib.getUuid(target);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REFRESH_PILE, targetUuid)
    },

    /**
     * @private
     */
    async _refreshItemPile(targetUuid) {
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
                        "name": lib.getItemPileName(targetDocument)
                    })
                }
                resolve();
            })
        }));
    },

    /**
     * Causes all connected users to re-render a specific pile's inventory UI
     *
     * @param {String} inPileUuid           The uuid of the pile to be re-rendered
     * @param {Boolean} [deleted=false]     Whether the pile was deleted as a part of this re-render
     * @return {Promise}
     */
    async rerenderItemPileInventoryApplication(inPileUuid, deleted = false) {
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, inPileUuid, deleted);
    },

    /**
     * @private
     */
    async _rerenderItemPileInventoryApplication(inPileUuid, deleted = false) {
        return ItemPileInventory.rerenderActiveApp(inPileUuid, deleted);
    },

    /**
     * Splits an item pile's content between all players (or a specified set of target actors).
     *
     * @param itemPile {Token/TokenDocument/Actor}                                              The item pile to split
     * @param targets {boolean/TokenDocument/Actor/Array<TokenDocument/Actor>} [targets=false]  The targets to receive the split contents
     * @param instigator {boolean/TokenDocument/Actor} [instigator=false]                       Whether this was triggered by a specific actor
     * @returns {Promise<object>}
     */
    async splitItemPileContents(itemPile, { targets = false, instigator = false } = {}) {

        if (!lib.isValidItemPile(itemPile)) return false;

        const itemPileUuid = lib.getUuid(itemPile);
        if (!itemPileUuid) throw lib.custom_error(`SplitItemPileContents | Could not determine the UUID, please provide a valid item pile`, true)

        const itemPileActor = itemPile?.actor ?? itemPile;

        if (targets) {
            if (!Array.isArray(targets)) {
                targets = [targets]
            }
            targets.forEach(actor => {
                if (!(actor instanceof TokenDocument || actor instanceof Actor)) {
                    throw lib.custom_error("SplitItemPileContents | Each of the entries in targets must be of type TokenDocument or Actor")
                }
            })
            targets = targets.map(target => target?.character ?? target?.actor ?? target);
        }

        if (instigator && !(instigator instanceof TokenDocument || instigator instanceof Actor)) {
            throw lib.custom_error("SplitItemPileContents | splitter must be of type TokenDocument or Actor")
        }

        const actorUuids = (targets || lib.getPlayersForItemPile(itemPileActor).map(u => u.character)).map(actor => lib.getUuid(actor));

        const hookResult = Hooks.call(HOOKS.PILE.PRE_SPLIT_INVENTORY, itemPile, targets, game.user.id, instigator);
        if (hookResult === false) return;

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.SPLIT_PILE, itemPileUuid, actorUuids, game.user.id, instigator);

    },

    /**
     * @private
     */
    async _splitItemPileContents(itemPileUuid, actorUuids, userId, instigator) {

        const itemPile = await fromUuid(itemPileUuid);

        const itemPileActor = itemPile?.actor ?? itemPile;

        const actors = await Promise.all(actorUuids.map((uuid) => fromUuid(uuid)));

        const itemsToRemove = {};
        const currenciesToRemove = {}

        const transferData = {
            items: {},
            currencies: {},
            num_players: actors.length
        }

        for(const actor of actors){

            const itemsToTransfer = lib.getItemPileItemsForActor(itemPileActor, actor, true).filter(item => item.toShare).map(item => {
                itemsToRemove[item.id] = (itemsToRemove[item.id] ?? 0) + item.shareLeft;
                transferData.items[item.id] = {
                    id: item.id,
                    name: item.name,
                    img: item.img,
                    quantity: (transferData.items[item.id]?.quantity ?? 0) + (item.shareLeft + item.previouslyTaken)
                }
                return { _id: item.id, quantity: item.shareLeft };
            }).filter(item => item.quantity);

            const currenciesToTransfer = Object.fromEntries(lib.getItemPileCurrenciesForActor(itemPileActor, actor, true).filter(item => item.toShare).map(currency => {
                currenciesToRemove[currency.path] = (currenciesToRemove[currency.path] ?? 0) + currency.shareLeft;
                transferData.currencies[currency.path] = {
                    path: currency.path,
                    name: currency.name,
                    img: currency.img,
                    quantity: (transferData.currencies[currency.path]?.quantity ?? 0) + (currency.shareLeft + currency.previouslyTaken),
                    index: currency.index
                }
                return [currency.path, currency.shareLeft]
            }).filter(currency => currency[1]));

            await API._addItems(actor.uuid, itemsToTransfer, userId, { runHooks: false });
            await API._addAttributes(actor.uuid, currenciesToTransfer, userId, { runHooks: false });

        }

        transferData.items = Object.values(transferData.items).map(item => {
            item.quantity = item.quantity / actors.length;
            return item;
        });

        transferData.currencies = Object.values(transferData.currencies).map(currency => {
            currency.quantity = currency.quantity / actors.length;
            return currency;
        });

        await lib.clearItemPileSharingData(itemPileActor);

        await API._removeItems(itemPileUuid, Object.entries(itemsToRemove).map(entry => ({ _id: entry[0], quantity: entry[1] })), userId, { runHooks: false });
        await API._removeAttributes(itemPileUuid, currenciesToRemove, userId, { runHooks: false });

        await itemPileSocket.executeForEveryone(
            SOCKET_HANDLERS.CALL_HOOK,
            HOOKS.PILE.SPLIT_INVENTORY,
            itemPileUuid,
            transferData,
            userId,
            instigator
        );

        const macroData = {
            action: "splitInventory",
            source: itemPileUuid,
            target: actorUuids,
            transfers: transferData,
            userId: userId,
            instigator: instigator
        };

        await API._executeItemPileMacro(itemPileUuid, macroData);

        const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(itemPileUuid);
        await API.rerenderItemPileInventoryApplication(itemPileUuid, shouldBeDeleted);

        if (shouldBeDeleted) {
            await API._deleteItemPile(itemPileUuid);
        }

        return transferData;

    },

    /* --- ITEM AND ATTRIBUTE METHODS --- */

    /**
     * Adds item to an actor, increasing item quantities if matches were found
     *
     * @param {Actor/TokenDocument/Token} target        The target to add an item to
     * @param {Array} items                             An array of objects, with the key "item" being an item object or an Item class (the foundry class), with an optional key of "quantity" being the amount of the item to add
     * @param {Boolean} [mergeSimilarItems=true]        Whether to merge similar items based on their name and type
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<array>}                        An array of objects, each containing the item that was added or updated, and the quantity that was added
     */
    async addItems(target, items, { mergeSimilarItems = true, interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_ADD, target, items, interactionId);
        if (hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`AddItems | Could not determine the UUID, please provide a valid target`, true)

        const itemsToAdd = []
        items.forEach(itemData => {

            let item = itemData;
            if (itemData instanceof Item) {
                item = itemData.toObject();
            } else if (itemData.item instanceof Item) {
                item = itemData.item.toObject();
            } else if (itemData.item) {
                item = itemData.item;
            }

            if (itemData?.quantity !== undefined) {
                setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, itemData?.quantity)
            }

            const existingItems = mergeSimilarItems ? lib.findSimilarItem(itemsToAdd, item) : false;
            if (existingItems) {
                setProperty(existingItems, API.ITEM_QUANTITY_ATTRIBUTE, lib.getItemQuantity(existingItems) + lib.getItemQuantity(item))
            } else {
                itemsToAdd.push(item);
            }

        });

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`AddItems | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ITEMS, targetUuid, itemsToAdd, game.user.id, { interactionId });
    },

    /**
     * @private
     */
    async _addItems(targetUuid, items, userId, { runHooks = true, interactionId = false } = {}) {

        const target = await fromUuid(targetUuid);
        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const targetActorItems = Array.from(targetActor.items);

        const itemsAdded = [];
        const itemsToCreate = [];
        const itemsToUpdate = [];
        for (const itemData of items) {

            let item = itemData?.item ?? itemData;
            delete item._id;

            const foundItem = lib.findSimilarItem(targetActorItems, item);

            const incomingQuantity = Number(itemData?.quantity ?? lib.getItemQuantity(itemData));

            if (foundItem) {
                item = foundItem.toObject();
                const currentQuantity = lib.getItemQuantity(item);
                const newQuantity = currentQuantity + incomingQuantity;
                itemsToUpdate.push({
                    "_id": item._id,
                    [API.ITEM_QUANTITY_ATTRIBUTE]: newQuantity
                });

                setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, newQuantity)
                itemsAdded.push({
                    item: item,
                    quantity: incomingQuantity
                });
            } else {
                setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, incomingQuantity)
                itemsToCreate.push(item);
            }

        }

        const itemsCreated = await targetActor.createEmbeddedDocuments("Item", itemsToCreate);
        await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);

        itemsCreated.forEach(item => {
            const itemObject = item.toObject()
            itemsAdded.push({
                item: itemObject,
                quantity: lib.getItemQuantity(itemObject)
            })
        });

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.ADD, targetUuid, itemsAdded, userId, interactionId);

            const macroData = {
                action: "addItems",
                target: targetUuid,
                items: itemsAdded,
                userId: userId,
                interactionId: interactionId
            };

            await API._executeItemPileMacro(targetUuid, macroData);

            await API.rerenderItemPileInventoryApplication(targetUuid);

        }

        return itemsAdded;

    },

    /**
     * Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.
     *
     * @param {Actor/Token/TokenDocument} target        The target to remove a items from
     * @param {Array} items                             An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity"), or Items (the foundry class) or strings of IDs to remove all quantities of
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<array>}                        An array of objects, each containing the item that was removed or updated, the quantity that was removed, and whether the item was deleted
     */
    async removeItems(target, items, { interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_REMOVE, target, items, interactionId);
        if (hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`RemoveItems | Could not determine the UUID, please provide a valid target`, true);

        const targetActorItems = API.getItemPileItems(target);

        items = items.map(itemData => {

            let item;
            if (typeof itemData === "string" || itemData._id) {
                const itemId = typeof itemData === "string" ? itemData : itemData._id;
                item = targetActorItems.find(actorItem => actorItem.id === itemId);
                if (!item) {
                    throw lib.custom_error(`RemoveItems | Could not find item with id "${itemId}" on target "${targetUuid}"`, true)
                }
                item = item.toObject();
            } else {
                if (itemData.item instanceof Item) {
                    item = itemData.item.toObject();
                } else {
                    item = itemData.item;
                }
                let foundActorItem = targetActorItems.find(actorItem => actorItem.id === item._id);
                if (!foundActorItem) {
                    throw lib.custom_error(`RemoveItems | Could not find item with id "${item._id}" on target "${targetUuid}"`, true)
                }
            }

            return {
                _id: item._id,
                quantity: itemData?.quantity ?? lib.getItemQuantity(item)
            }
        });

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`RemoveItems | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ITEMS, targetUuid, items, game.user.id, { interactionId });
    },

    /**
     * @private
     */
    async _removeItems(targetUuid, items, userId, { runHooks = true, interactionId = false } = {}) {

        const target = await fromUuid(targetUuid);
        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const itemsRemoved = [];
        const itemsToUpdate = [];
        const itemsToDelete = [];
        for (const itemData of items) {

            let item = targetActor.items.get(itemData._id);

            if (!item) continue;

            item = item.toObject();

            const currentQuantity = lib.getItemQuantity(item);

            const quantityToRemove = itemData.quantity;

            const newQuantity = Math.max(0, currentQuantity - quantityToRemove);

            if (newQuantity >= 1) {
                itemsToUpdate.push({ _id: item._id, [API.ITEM_QUANTITY_ATTRIBUTE]: newQuantity });
                setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, quantityToRemove);
                itemsRemoved.push({
                    item: item,
                    quantity: quantityToRemove,
                    deleted: false
                });
            } else {
                itemsToDelete.push(item._id);
                setProperty(item, API.ITEM_QUANTITY_ATTRIBUTE, currentQuantity);
                itemsRemoved.push({
                    item: item,
                    quantity: currentQuantity,
                    deleted: true
                });
            }

        }

        await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);
        await targetActor.deleteEmbeddedDocuments("Item", itemsToDelete);

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.REMOVE, targetUuid, itemsRemoved, userId, interactionId);

            const macroData = {
                action: "removeItems",
                target: targetUuid,
                items: itemsRemoved,
                userId: userId,
                interactionId: interactionId
            };

            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(targetUuid);

            await API.rerenderItemPileInventoryApplication(targetUuid, shouldBeDeleted);

            if (shouldBeDeleted) {
                await API._deleteItemPile(targetUuid);
            }

        }

        return itemsRemoved;

    },

    /**
     * Transfers items from the source to the target, subtracting a number of quantity from the source's item and adding it to the target's item, deleting items from the source if their quantity reaches 0
     *
     * @param {Actor/Token/TokenDocument} source        The source to transfer the items from
     * @param {Actor/Token/TokenDocument} target        The target to transfer the items to
     * @param {Array} items                             An array of objects each containing the item id (key "_id") and the quantity to transfer (key "quantity"), or Items (the foundry class) or strings of IDs to transfer all quantities of
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<object>}                       An array of objects, each containing the item that was added or updated, and the quantity that was transferred
     */
    async transferItems(source, target, items, { interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_TRANSFER, source, target, items, interactionId);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferItems | Could not determine the UUID, please provide a valid source`, true)

        const sourceActorItems = API.getItemPileItems(source);

        items = items.map(itemData => {

            let item;
            if (typeof itemData === "string" || itemData._id) {
                const itemId = typeof itemData === "string" ? itemData : itemData._id;
                item = sourceActorItems.find(actorItem => actorItem.id === itemId);
                if (!item) {
                    throw lib.custom_error(`TransferItems | Could not find item with id "${itemId}" on target "${sourceUuid}"`, true)
                }
                item = item.toObject();
            } else if (itemData.item instanceof Item) {
                item = itemData.item.toObject();
            } else {
                item = itemData.item;
            }

            let foundActorItem = sourceActorItems.find(actorItem => actorItem.id === item._id);
            if (!foundActorItem) {
                throw lib.custom_error(`TransferItems | Could not find item with id "${item._id}" on target "${sourceUuid}"`, true)
            }

            return {
                _id: item._id,
                quantity: Math.max((itemData?.quantity ?? 0) ?? lib.getItemQuantity(itemData))
            }
        });

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferItems | Could not determine the UUID, please provide a valid target`, true)

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`TransferItems | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ITEMS, sourceUuid, targetUuid, items, game.user.id, { interactionId });

    },

    /**
     * @private
     */
    async _transferItems(sourceUuid, targetUuid, items, userId, { runHooks = true, interactionId = false } = {}) {

        const itemsRemoved = await API._removeItems(sourceUuid, items, userId, { runHooks: false });

        const itemsAdded = await API._addItems(targetUuid, itemsRemoved, userId, { runHooks: false });

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.TRANSFER, sourceUuid, targetUuid, itemsAdded, userId, interactionId);

            const macroData = {
                action: "transferItems",
                source: sourceUuid,
                target: targetUuid,
                itemsAdded: itemsAdded,
                userId: userId,
                interactionId: interactionId
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API.rerenderItemPileInventoryApplication(sourceUuid, shouldBeDeleted);
            await API.rerenderItemPileInventoryApplication(targetUuid);

            const itemPile = await fromUuid(sourceUuid);

            if (shouldBeDeleted) {
                await API._deleteItemPile(sourceUuid);
            } else if (lib.isItemPileEmpty(itemPile)) {
                await lib.clearItemPileSharingData(itemPile);
            } else {
                await lib.setItemPileSharingData(sourceUuid, targetUuid, { items: itemsAdded });
            }

        }

        return itemsAdded;

    },

    /**
     * Transfers all items between the source and the target.
     *
     * @param {Actor/Token/TokenDocument} source        The actor to transfer all items from
     * @param {Actor/Token/TokenDocument} target        The actor to receive all the items
     * @param {Array/Boolean} [itemFilters=false]       Array of item types disallowed - will default to module settings if none provided
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<array>}                        An array containing all of the items that were transferred to the target
     */
    async transferAllItems(source, target, { itemFilters = false, interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_TRANSFER_ALL, source, target, itemFilters, interactionId);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid target`, true)

        if (itemFilters) {
            if (!Array.isArray(itemFilters)) throw lib.custom_error(`TransferAllItems | itemFilters must be of type array`);
            itemFilters.forEach(entry => {
                if (typeof entry?.path !== "string") throw lib.custom_error(`TransferAllItems | each entry in the itemFilters must have a "path" property that is of type string`);
                if (typeof entry?.filter !== "string") throw lib.custom_error(`TransferAllItems | each entry in the itemFilters must have a "filter" property that is of type string`);
            })
        }

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`TransferAllItems | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, sourceUuid, targetUuid, game.user.id, {
            itemFilters,
            interactionId
        });
    },

    /**
     * @private
     */
    async _transferAllItems(sourceUuid, targetUuid, userId, {
        itemFilters = false,
        runHooks = false,
        interactionId = false
    } = {}) {

        const source = await fromUuid(sourceUuid);

        const itemsToRemove = API.getItemPileItems(source, itemFilters).map(item => item.toObject());

        const itemsRemoved = await API._removeItems(sourceUuid, itemsToRemove, userId, {
            runHooks: false,
            interactionId
        });
        const itemAdded = await API._addItems(targetUuid, itemsRemoved, userId, { runHooks: false, interactionId });

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, HOOKS.ITEM.TRANSFER_ALL, sourceUuid, targetUuid, itemAdded, userId, interactionId);

            const macroData = {
                action: "transferAllItems",
                source: sourceUuid,
                target: targetUuid,
                items: itemAdded,
                userId: userId,
                interactionId: interactionId
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

        return itemAdded;
    },

    /**
     * Adds to attributes on an actor
     *
     * @param {Actor/Token/TokenDocument} target        The target whose attribute will have a set quantity added to it
     * @param {Object} attributes                       An object with each key being an attribute path, and its value being the quantity to add
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<object>}                       An array containing a key value pair of the attribute path and the quantity of that attribute that was removed
     *
     */
    async addAttributes(target, attributes, { interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_ADD, target, attributes, interactionId);
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

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`AddAttributes | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ATTRIBUTE, targetUuid, attributes, game.user.id, { interactionId });

    },

    /**
     * @private
     */
    async _addAttributes(targetUuid, attributes, userId, { runHooks = true, interactionId = false } = {}) {

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

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.ADD, targetUuid, attributesAdded, userId, interactionId);

            const macroData = {
                action: "addAttributes",
                target: targetUuid,
                attributes: attributesAdded,
                userId: userId,
                interactionId: interactionId
            };
            await API._executeItemPileMacro(targetUuid, macroData);

            await API.rerenderItemPileInventoryApplication(targetUuid);
        }

        return attributesAdded;

    },

    /**
     * Subtracts attributes on the target
     *
     * @param {Token/TokenDocument} target              The target whose attributes will be subtracted from
     * @param {Array/object} attributes                 This can be either an array of attributes to subtract (to zero out a given attribute), or an object with each key being an attribute path, and its value being the quantity to subtract
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<object>}                       An array containing a key value pair of the attribute path and the quantity of that attribute that was removed
     */
    async removeAttributes(target, attributes, { interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_REMOVE, target, attributes, interactionId);
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

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`RemoveAttributes | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ATTRIBUTES, targetUuid, attributes, game.user.id, { interactionId });

    },

    /**
     * @private
     */
    async _removeAttributes(targetUuid, attributes, userId, { runHooks = true, interactionId = false } = {}) {

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

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.REMOVE, targetUuid, attributesRemoved, userId, interactionId);

            const macroData = {
                action: "removeAttributes",
                target: targetUuid,
                attributes: attributesRemoved,
                userId: userId,
                interactionId: interactionId
            };
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(targetUuid);
            await API.rerenderItemPileInventoryApplication(targetUuid, shouldBeDeleted);

            if (shouldBeDeleted) {
                await API._deleteItemPile(targetUuid);
            }
        }

        return attributesRemoved;

    },

    /**
     * Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target
     *
     * @param {Actor/Token/TokenDocument} source        The source to transfer the attribute from
     * @param {Actor/Token/TokenDocument} target        The target to transfer the attribute to
     * @param {Array/object} attributes                 This can be either an array of attributes to transfer (to transfer all of a given attribute), or an object with each key being an attribute path, and its value being the quantity to transfer
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<object>}                       An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
     */
    async transferAttributes(source, target, attributes, { interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER, source, target, attributes, interactionId);
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

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`TransferAttributes | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ATTRIBUTES, sourceUuid, targetUuid, attributes, game.user.id, { interactionId });

    },

    /**
     * @private
     */
    async _transferAttributes(sourceUuid, targetUuid, attributes, userId, {
        runHooks = true,
        interactionId = false
    } = {}) {

        const attributesRemoved = await API._removeAttributes(sourceUuid, attributes, userId, { runHooks: false });

        await API._addAttributes(targetUuid, attributesRemoved, userId, { runHooks: false });

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.TRANSFER, sourceUuid, targetUuid, attributesRemoved, userId, interactionId);

            const macroData = {
                action: "transferAttributes",
                source: sourceUuid,
                target: targetUuid,
                attributes: attributesRemoved,
                userId: userId,
                interactionId: interactionId
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            const shouldBeDeleted = await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API.rerenderItemPileInventoryApplication(sourceUuid, shouldBeDeleted);
            await API.rerenderItemPileInventoryApplication(targetUuid);

            const itemPile = await fromUuid(sourceUuid)

            if (shouldBeDeleted) {
                await API._deleteItemPile(sourceUuid);
            } else if (lib.isItemPileEmpty(itemPile)) {
                await lib.clearItemPileSharingData(itemPile);
            } else {
                await lib.setItemPileSharingData(sourceUuid, targetUuid, { currencies: attributesRemoved });
            }

        }

        return attributesRemoved;

    },

    /**
     * Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target
     *
     * @param {Actor/Token/TokenDocument} source        The source to transfer the attributes from
     * @param {Actor/Token/TokenDocument} target        The target to transfer the attributes to
     * @param {String/Boolean} [interactionId=false]    The interaction ID of this action
     *
     * @returns {Promise<object>}                       An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
     */
    async transferAllAttributes(source, target, { interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER_ALL, source, target, interactionId);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid source`, true);

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid target`, true);

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`TransferAllAttributes | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ALL_ATTRIBUTES, sourceUuid, targetUuid, game.user.id, { interactionId });

    },

    /**
     * @private
     */
    async _transferAllAttributes(sourceUuid, targetUuid, userId, { runHooks = true, interactionId = false } = {}) {

        const source = await fromUuid(sourceUuid);

        const sourceActor = source instanceof TokenDocument
            ? source.actor
            : source;

        const target = await fromUuid(targetUuid);

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const sourceAttributes = API.getItemPileCurrencies(sourceActor);

        const attributesToTransfer = sourceAttributes.filter(attribute => {
            return hasProperty(targetActor.data, attribute.path);
        }).map(attribute => attribute.path);

        const attributesRemoved = await API._removeAttributes(sourceUuid, attributesToTransfer, userId, { runHooks: false });
        const attributesAdded = await API._addAttributes(targetUuid, attributesRemoved, userId, { runHooks: false });

        if (runHooks) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.TRANSFER_ALL, sourceUuid, targetUuid, attributesAdded, userId, interactionId);

            const macroData = {
                action: "transferAllAttributes",
                source: sourceUuid,
                target: targetUuid,
                attributes: attributesAdded,
                userId: userId,
                interactionId: interactionId
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

    },

    /**
     * Transfers all items and attributes between the source and the target.
     *
     * @param {Actor/Token/TokenDocument} source        The actor to transfer all items and attributes from
     * @param {Actor/Token/TokenDocument} target        The actor to receive all the items and attributes
     * @param {Array/Boolean} [itemFilters=false]       Array of item types disallowed - will default to module settings if none provided
     * @param {String/Boolean} [interactionId=false]    The ID of this interaction
     *
     * @returns {Promise<object>}                       An object containing all items and attributes transferred to the target
     */
    async transferEverything(source, target, { itemFilters = false, interactionId = false } = {}) {

        const hookResult = Hooks.call(HOOKS.PRE_TRANSFER_EVERYTHING, source, target, itemFilters, interactionId);
        if (hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if (!sourceUuid) throw lib.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if (!targetUuid) throw lib.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid target`, true)

        if (itemFilters) {
            if (!Array.isArray(itemFilters)) throw lib.custom_error(`TransferEverything | itemFilters must be of type array`);
            itemFilters.forEach(entry => {
                if (typeof entry?.path !== "string") throw lib.custom_error(`TransferEverything | each entry in the itemFilters must have a "path" property that is of type string`);
                if (typeof entry?.filter !== "string") throw lib.custom_error(`TransferEverything | each entry in the itemFilters must have a "filter" property that is of type string`);
            })
        }

        if (interactionId) {
            if (typeof interactionId !== "string") throw lib.custom_error(`TransferEverything | interactionId must be of type string`);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, game.user.id, {
            itemFilters,
            interactionId
        })

    },

    /**
     * @private
     */
    async _transferEverything(sourceUuid, targetUuid, userId, { itemFilters = false, interactionId } = {}) {

        const itemsTransferred = await API._transferAllItems(sourceUuid, targetUuid, userId, {
            itemFilters,
            isEverything: true,
            interactionId
        });
        const currenciesTransferred = await API._transferAllAttributes(sourceUuid, targetUuid, userId, {
            isEverything: true,
            interactionId
        });

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, itemsTransferred, currenciesTransferred, userId, interactionId);

        const macroData = {
            action: "transferEverything",
            source: sourceUuid,
            target: targetUuid,
            items: itemsTransferred,
            attributes: currenciesTransferred,
            userId: userId,
            interactionId: interactionId
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
            currenciesTransferred
        };

    },

    /* -------- UTILITY METHODS -------- */

    /**
     * Causes every user's token HUD to rerender
     *
     * @return {Promise}
     */
    async rerenderTokenHud() {
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_TOKEN_HUD);
    },

    /**
     * @private
     */
    async _rerenderTokenHud() {
        if (!canvas.tokens.hud.rendered) return;
        await canvas.tokens.hud.render(true)
        return true;
    },

    /* -------- PRIVATE ITEM PILE METHODS -------- */

    /**
     * Initializes a pile on the client-side.
     *
     * @param {TokenDocument} tokenDocument
     * @return {Promise<boolean>}
     * @private
     */
    async _initializeItemPile(tokenDocument) {

        if (!lib.isValidItemPile(tokenDocument)) return false;

        const pileData = lib.getItemPileData(tokenDocument);

        if (game.settings.get(CONSTANTS.MODULE_NAME, "preloadFiles")) {
            await Promise.allSettled(Object.entries(pileData).map(entry => {
                return new Promise(async (resolve) => {
                    const [key, value] = entry;
                    if (preloadedFiles.has(value) || !value) {
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
    },

    /**
     * This executes any macro that is configured on the item pile, providing the macro with extra data relating to the
     * action that prompted the execution (if the advanced-macros module is installed)
     *
     * @param {String} targetUuid
     * @param {Object} macroData
     * @return {Promise}
     * @private
     */
    async _executeItemPileMacro(targetUuid, macroData) {

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

    },

    /**
     * This handles any dropped data onto the canvas or a set item pile
     *
     * @param {canvas} canvas
     * @param {Object} data
     * @param {Actor/Token/TokenDocument/Boolean}[target=false]
     * @return {Promise}
     * @private
     */
    async _dropData(canvas, data, { target = false } = {}) {

        if (data.type !== "Item") return;

        let item = await Item.implementation.fromDropData(data)
        let itemData = item.toObject();

        if (!itemData) {
            console.error(data);
            throw lib.custom_error("Something went wrong when dropping this item!")
        }

        const dropData = {
            source: false,
            target: target,
            itemData: {
                item: itemData,
                quantity: 1
            },
            position: false
        }

        if (data.tokenId) {
            dropData.source = canvas.tokens.get(data.tokenId).actor;
        } else if (data.actorId) {
            dropData.source = game.actors.get(data.actorId);
        }

        if (!dropData.source && !game.user.isGM) {
            return lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
        }

        const pre_drop_determined_hook = Hooks.call(HOOKS.ITEM.PRE_DROP_DETERMINED, dropData.source, dropData.target, dropData.position, dropData.itemData);
        if (pre_drop_determined_hook === false) return;

        let action;
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

        if (droppableDocuments.length && game.modules.get("midi-qol")?.active && game.settings.get('midi-qol', "DragDropTarget")) {
            lib.custom_warning("You have Drag & Drop Targetting enabled in MidiQOL, which disables drag & drop items")
            return;
        }

        if (droppableDocuments.length > 0 && !game.user.isGM) {

            if (!(droppableDocuments[0] instanceof Actor && dropData.source instanceof Actor)) {

                const sourceToken = canvas.tokens.placeables.find(token => token.actor === dropData.source);

                if (sourceToken) {

                    const targetToken = droppableDocuments[0];

                    const distance = Math.floor(lib.distance_between_rect(sourceToken, targetToken.object) / canvas.grid.size) + 1

                    const pileData = lib.getItemPileData(targetToken);

                    const maxDistance = pileData.distance ? pileData.distance : Infinity;

                    if (distance > maxDistance) {
                        lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
                        return;
                    }
                }
            }

            droppableDocuments = droppableDocuments.filter(token => !API.isItemPileLocked(token));

            if (!droppableDocuments.length) {
                lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileLocked"), true);
                return;
            }
        }

        const disallowedType = lib.isItemInvalid(droppableDocuments?.[0], item);
        if (disallowedType) {
            if (!game.user.isGM) {
                return lib.custom_warning(game.i18n.format("ITEM-PILES.Errors.DisallowedItemDrop", { type: disallowedType }), true)
            }
            if (!hotkeyState.shiftDown) {
                const force = await Dialog.confirm({
                    title: game.i18n.localize("ITEM-PILES.Dialogs.DropTypeWarning.Title"),
                    content: `<p class="item-piles-dialog">${game.i18n.format("ITEM-PILES.Dialogs.DropTypeWarning.Content", { type: disallowedType })}</p>`,
                    defaultYes: false
                });
                if (!force) {
                    return;
                }
            }
        }

        if (hotkeyState.altDown) {

            if (droppableDocuments.length) {
                action = "addToPile";
            }

            setProperty(dropData.itemData.item, API.ITEM_QUANTITY_ATTRIBUTE, 1);
            dropData.itemData.quantity = 1;

        } else {

            const result = await DropItemDialog.query(item, droppableDocuments[0]);

            if (!result) return;
            action = result.action;
            setProperty(dropData.itemData.item, API.ITEM_QUANTITY_ATTRIBUTE, Number(result.quantity))
            dropData.itemData.quantity = Number(result.quantity);

        }

        if (action === "addToPile") {
            dropData.target = droppableDocuments[0];
        } else {
            dropData.position = { x, y };
        }

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_DROP, dropData.source, dropData.target, dropData.position, dropData.itemData);
        if (hookResult === false) return;

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DROP_ITEMS, {
            userId: game.user.id,
            sceneId: canvas.scene.id,
            sourceUuid: lib.getUuid(dropData.source),
            targetUuid: lib.getUuid(dropData.target),
            position: dropData.position,
            itemData: dropData.itemData
        });

    },

    /**
     * If not given an actor, this method creates an item pile at a location, then adds an item to it.
     *
     * If a target was provided, it will just add the item to that target actor.
     *
     * If an actor was provided, it will transfer the item from the actor to the target actor.
     *
     * @param {String} userId
     * @param {String} sceneId
     * @param {String/Boolean} [sourceUuid=false]
     * @param {String/Boolean} [targetUuid=false]
     * @param {Object/Boolean} [position=false]
     * @param {Object} [itemData=false]
     *
     * @returns {Promise<{sourceUuid: string/boolean, targetUuid: string/boolean, position: object/boolean, itemsDropped: array }>}
     * @private
     */
    async _dropItems({
                         userId,
                         sceneId,
                         sourceUuid = false,
                         targetUuid = false,
                         itemData = false,
                         position = false
                     } = {}) {

        let itemsDropped;

        // If there's a source of the item (it wasn't dropped from the item bar)
        if (sourceUuid) {

            const itemsToTransfer = [{ _id: itemData.item._id, quantity: itemData.quantity }];

            // If there's a target token, add the item to it, otherwise create a new pile at the drop location
            if (targetUuid) {
                itemsDropped = await API._transferItems(sourceUuid, targetUuid, itemsToTransfer, userId);
            } else {
                itemsDropped = await API._removeItems(sourceUuid, itemsToTransfer, userId);
                targetUuid = await API._createItemPile(sceneId, position, { items: itemsDropped });
            }

            // If there's no source (it was dropped from the item bar)
        } else {

            // If there's a target token, add the item to it, otherwise create a new pile at the drop location
            if (targetUuid) {
                itemsDropped = await API._addItems(targetUuid, [itemData], userId);
            } else {
                targetUuid = await API._createItemPile(sceneId, position, { items: [itemData] });
            }

        }

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.DROP, sourceUuid, targetUuid, itemsDropped, position);

        return { sourceUuid, targetUuid, position, itemsDropped };

    },

    /**
     * @param {String} sceneId
     * @param {Object} position
     * @param {String/Boolean} [pileActorName=false]
     * @param {Array/Boolean} [items=false]
     * @returns {Promise<string>}
     * @private
     */
    async _createItemPile(sceneId, position, { pileActorName = false, items = false } = {}) {

        let pileActor;

        if (!pileActorName) {

            pileActor = game.settings.get(CONSTANTS.MODULE_NAME, "defaultItemPileActorID") ? game.actors.get(game.settings.get(CONSTANTS.MODULE_NAME, "defaultItemPileActorID")) : false;

            if (!pileActor) {

                lib.custom_notify("A Default Item Pile has been added to your Actors list. You can configure the default look and behavior on it, or duplicate it to create different styles.")

                const pileDataDefaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

                pileDataDefaults.enabled = true;
                pileDataDefaults.deleteWhenEmpty = true;
                pileDataDefaults.displayOne = true;
                pileDataDefaults.showItemName = true;
                pileDataDefaults.overrideSingleItemScale = true;
                pileDataDefaults.singleItemScale = 0.75;

                pileActor = await Actor.create({
                    name: "Default Item Pile",
                    type: game.settings.get(CONSTANTS.MODULE_NAME, "actorClassType"),
                    img: "icons/svg/item-bag.svg",
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileDataDefaults
                });

                await pileActor.update({
                    "token": {
                        name: "Item Pile",
                        actorLink: false,
                        bar1: { attribute: "" },
                        vision: false,
                        displayName: 50,
                        [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileDataDefaults
                    }
                })

                await game.settings.set(CONSTANTS.MODULE_NAME, "defaultItemPileActorID", pileActor.id);

            }

        } else {

            pileActor = game.actors.getName(pileActorName);

        }

        let overrideData = { ...position };

        const pileData = lib.getItemPileData(pileActor);

        if (!pileActor.data.token.actorLink) {

            items = items ? items.map(itemData => itemData.item ?? itemData) : [];

            overrideData['actorData'] = {
                items: items
            }

            const data = { data: pileData, items: items };

            overrideData = foundry.utils.mergeObject(overrideData, {
                "img": lib.getItemPileTokenImage(pileActor, data),
                "scale": lib.getItemPileTokenScale(pileActor, data),
                "name": lib.getItemPileName(pileActor, data),
            });

        }

        const tokenData = await pileActor.getTokenData(overrideData);

        const scene = game.scenes.get(sceneId);

        const [tokenDocument] = await scene.createEmbeddedDocuments("Token", [tokenData]);

        return lib.getUuid(tokenDocument);

    },

    /**
     * @private
     */
    async _itemPileClicked(pileDocument) {

        if (!lib.isValidItemPile(pileDocument)) return;

        const pileToken = pileDocument.object;

        if (!lib.isGMConnected()) {
            lib.custom_warning(`Item Piles requires a GM to be connected for players to be able to loot item piles.`, true)
            return;
        }

        lib.debug(`Clicked: ${pileDocument.uuid}`);

        const data = lib.getItemPileData(pileDocument);

        const maxDistance = data.distance ? data.distance : Infinity;

        let validTokens = [];

        if (canvas.tokens.controlled.length > 0) {
            validTokens = [...canvas.tokens.controlled];
            validTokens = validTokens.filter(token => token.document !== pileDocument);
        }

        if (!validTokens.length && !game.user.isGM) {
            validTokens.push(...canvas.tokens.placeables);
            if (_token) {
                validTokens.unshift(_token);
            }
        }

        validTokens = validTokens.filter(token => token.owner && token.document !== pileDocument).filter(token => {
            return lib.tokens_close_enough(pileToken, token, maxDistance) || game.user.isGM;
        });

        if (!validTokens.length && !game.user.isGM && maxDistance !== Infinity) {
            lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.PileTooFar"), true);
            return;
        }

        let interactingActor;
        if (validTokens.length) {
            if (validTokens.includes(_token)) {
                interactingActor = _token.actor;
            } else {
                validTokens.sort((potentialTargetA, potentialTargetB) => {
                    return lib.grids_between_tokens(pileToken, potentialTargetA) - lib.grids_between_tokens(pileToken, potentialTargetB);
                })
                interactingActor = validTokens[0].actor;
            }
        } else if (game.user.character && !game.user.isGM) {
            interactingActor = game.user.character;
        }

        if (data.isContainer && interactingActor) {

            if (data.locked && !game.user.isGM) {
                lib.debug(`Attempted to locked item pile with UUID ${pileDocument.uuid}`);
                return API.rattleItemPile(pileDocument, interactingActor);
            }

            if (data.closed) {
                lib.debug(`Opened item pile with UUID ${pileDocument.uuid}`);
                await API.openItemPile(pileDocument, interactingActor);
            }

        }

        return ItemPileInventory.show(pileDocument, interactingActor);

    },

    /**
     * @private
     */
    async _checkItemPileShouldBeDeleted(targetUuid) {

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

};

export default API;
