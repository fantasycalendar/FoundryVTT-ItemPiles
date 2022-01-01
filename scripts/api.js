import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";
import DropDialog from "./formapplications/dropDialog.js";

export default class API {

    /**
     * The attribute used to track the quantity of items in this system
     *
     * @returns {String}
     */
    static get QUANTITY_ATTRIBUTE(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "quantityAttribute");
    }

    /**
     * The attributes used to track each currency in this system
     *
     * @returns {Array}
     */
    static get CURRENCY_ATTRIBUTES(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "currencyAttributes").split(",").map(str => str.trim());
    }

    /**
     * The attribute used to track the item type in this system
     *
     * @returns {String}
     */
    static get ITEM_TYPE_ATTRIBUTE(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemTypeAttribute");
    }

    /**
     * The filters for item types eligible for interaction within this system
     *
     * @returns {Array}
     */
    static get ITEM_TYPE_FILTERS(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemTypeFilters").split(',').map(str => str.trim());
    }

    /**
     * This handles any dropped data onto the canvas or a set item pile
     *
     * @param canvas
     * @param data
     * @param target
     * @param force
     * @return {Promise}
     */
    static async dropData(canvas, data, { target = false, force = false }={}) {

        if (data.type !== "Item") return;

        const itemData = data.id ? game.items.get(data.id)?.toObject() : data.data;
        if (!itemData) {
            throw lib.custom_error("Something went wrong when dropping this item!")
        }

        const disallowedType = API.isItemTypeDisallowed(itemData);

        const dropData = {
            itemData: itemData,
            source: false,
            target: false,
            location: false,
            quantity: 1,
            force: false
        }

        if (disallowedType) {
            if(!game.user.isGM){
                return lib.custom_warning(`Could not drag & drop item of type "${disallowedType}"`, true)
            }
            if(!game.keyboard.downKeys.has("AltLeft")) {
                dropData.force = await Dialog.confirm({
                    title: game.i18n.localize("ITEM-PILES.Dialogs.DropTypeWarning.Title"),
                    content: `<p>${game.i18n.localize("ITEM-PILES.Dialogs.DropTypeWarning.Content")}</p>`,
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

        let action = "addToPile";
        let droppableDocuments = [];
        let x;
        let y;

        if(!target){

            const position = canvas.grid.getTopLeft(data.x, data.y);
            x = position[0];
            y = position[1];

            droppableDocuments = lib.getTokensAtLocation({ x, y })
                .filter(token => token.actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled);

        }else{

            droppableDocuments.push(target);

        }

        if (droppableDocuments.length > 0 && !game.user.isGM) {
            droppableDocuments = droppableDocuments.filter(token => API.isPileLocked(token));
            if (!droppableDocuments.length) {
                return Dialog.prompt({
                    title: game.i18n.localize("ITEM-PILES.Dialogs.LockedWarning.Title"),
                    content: `<p>${game.i18n.localize("ITEM-PILES.Dialogs.LockedWarning.Title")}</p>`,
                    label: "OK",
                    rejectClose: false
                });
            }
        }

        if (game.keyboard.downKeys.has("AltLeft")) {

            if (droppableDocuments.length) {
                action = "addToPile";
            }

            if(game.keyboard.downKeys.has("ControlLeft")){
                dropData.quantity = getProperty(itemData, API.QUANTITY_ATTRIBUTE) ?? 1;
            }

        } else {

            const result = await DropDialog.query(itemData, droppableDocuments);

            if (!result) return;
            action = result.action;
            dropData.quantity = Number(result.quantity);

        }

        if (action === "addToPile") {
            dropData.target = droppableDocuments[0];
        } else {
            dropData.position = { x, y };
        }

        return API.handleDrop(dropData);

    }

    /**
     * If not given an actor, this method creates an item pile at a location, then adds an item to it.
     *
     * If a target was provided, it will just add the item to that target actor.
     *
     * If an actor was provided, it will transfer the item from the actor to the target actor.
     *
     * @param {Actor|Boolean} source
     * @param {Actor|Boolean} target
     * @param {Object|Boolean} position
     * @param {Object} itemData
     * @param {Number} quantity
     * @param {Boolean} force
     */
    static async handleDrop({
        source = false,
        target = false,
        position = { x: 0, y: 0 },
        itemData = false,
        quantity = 1,
        force = false
    }={}) {

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`handleDrop | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target) ?? target;
        if(target && !targetUuid) throw lib.custom_error(`handleDrop | Could not determine the UUID, please provide a valid target`, true)

        const disallowedType = API.isItemTypeDisallowed(itemData);
        if(disallowedType && !force){
            throw lib.custom_error(`handleDrop | Could not drop item of type ${disallowedType}`, true)
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DROP_ITEM, {
            sourceUuid,
            targetUuid,
            position,
            itemData,
            quantity,
            force
        });

    }

    static async _handleDrop({
        sourceUuid = false,
        targetUuid = false,
        position = { x: 0, y: 0 },
        itemData = false,
        quantity = 1,
        force = false
    }={}) {

        if(!targetUuid) {
            targetUuid = await API.createPile(position);
        }

        if(sourceUuid){
            await API._transferItem(sourceUuid, targetUuid, itemData._id, { quantity, force })
        }else{
            await API._addItem(sourceUuid, itemData, { quantity, force });
        }

        return {
            sourceUuid,
            targetUuid,
            position,
            itemData,
            quantity,
            force
        }

    }

    /**
     * Creates an empty tile at a location
     *
     * @param position
     * @returns {Promise}
     */
    static async createPile(position) {
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.CREATE_PILE, position);
    }

    static async _createPile(position){

        let pileActor = game.actors.getName("Default Item Pile (do not rename)")

        if (!pileActor) {

            lib.custom_notify("A Default Item Pile has been added to your Actors list. You can configure the default look and behavior on it, or duplicate it to create different styles.")

            const pileDataDefaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS)

            pileActor = await Actor.create({
                name: "Default Item Pile (do not rename)",
                type: "character",
                img: "icons/svg/mystery-man.svg",
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileDataDefaults
            });

            await pileActor.update({ "token": {
                name: "Item Pile",
                actorLink: false,
                bar1: { attribute: "" },
                vision: false,
                displayName: 50,
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileDataDefaults
            }});

        }

        const tokenData = await pileActor.getTokenData();

        tokenData.update({
            ...position,
            actorData: { items: {} }
        });

        Hooks.call("preCreateItemPile", tokenData);

        const [ tokenDocument ] = await canvas.scene.createEmbeddedDocuments("Token", [ tokenData ]);

        return lib.getUuid(tokenDocument);

    }

    /**
     * Transfers an item from a source to a target, removing it or subtracting a number of quantity from the first
     * to the second one, deleting the item if its quantity reaches 0
     *
     * @param {Actor|Token|TokenDocument} source    The source to transfer the item from
     * @param {Actor|Token|TokenDocument} target    The target to transfer the item to
     * @param {String} itemId                       The ID of the item to transfer
     * @param {Number} quantity                     How many of the item to transfer
     * @param {Boolean} force                       Whether to ignore item type restrictions
     * @returns {Promise}                           The number of items that were transferred
     */
    static async transferItem(source, target, itemId, { quantity = 1, force = false }={}) {

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`transferItem | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`transferItem | Could not determine the UUID, please provide a valid target`, true)

        const actorItem = source.items.get(itemId);
        if(!actorItem){
            throw lib.custom_error(`transferItem | Could not find item with id ${itemId} on actor ${sourceUuid}`, true)
        }

        const disallowedType = API.isItemTypeDisallowed(actorItem);
        if(disallowedType && !force){
            throw lib.custom_error(`transferItem | Could not drop item of type ${disallowedType}`, true)
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ITEM, sourceUuid, targetUuid, itemId, { quantity, force });

    }

    static async _transferItem(sourceUuid, targetUuid, itemId, { quantity = 1, force = false }={}) {

        const source = await lib.getActor(sourceUuid);
        if(!source){
            throw lib.custom_error(`TransferItem | Could not find actor with UUID ${sourceUuid}`, true)
        }

        const target = await lib.getActor(targetUuid);
        if(!target){
            throw lib.custom_error(`TransferItem | Could not find actor with UUID ${targetUuid}`, true)
        }

        const actorItem = source.items.get(itemId);
        if(!actorItem){
            throw lib.custom_error(`TransferItem | Could not find item with id ${itemId} on actor ${sourceUuid}`, true)
        }

        const disallowedType = API.isItemTypeDisallowed(actorItem);
        if(disallowedType && !force){
            throw lib.custom_error(`transferItem | Could not transfer item of type ${disallowedType}`, true)
        }

        const itemData = actorItem.toObject();

        const quantityRemoved = await API._removeItem(sourceUuid, itemId, { quantity, force });

        return API._addItem(targetUuid, itemData, { quantity: quantityRemoved, force });

    }

    /**
     * Subtracts the quantity of an item on an actor. If its quantity reaches 0, the item is removed from the actor.
     * @param {Actor} target            The target to remove an item from
     * @param {String} itemId           The itemId to remove from the target
     * @param {Number} quantity         How many of the items to remove
     * @param {Boolean} force           Whether to ignore item type restrictions
     * @returns {Promise}               Returns how many items were removed from the target
     */
    static async removeItem(target, itemId, { quantity = 1, force = false }={}){

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`removeItem | Could not determine the UUID, please provide a valid target`, true)

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ITEM, targetUuid, itemId, { quantity, force });
    }

    static async _removeItem(targetUuid, itemId, { quantity = 1, force = false }={}) {

        const target = await lib.getActor(targetUuid);
        if (!target) {
            throw lib.custom_error(`RemoveItem | Could not find target with UUID ${targetUuid}`, true)
        }

        const item = target.items.get(itemId);
        if (!item) {
            throw lib.custom_error(`RemoveItem | Could not delete find item with id ${itemId} on target ${targetUuid}`, true);
        }

        const disallowedType = API.isItemTypeDisallowed(item);
        if(disallowedType && !force){
            throw lib.custom_error(`removeItem | Could not remove item of type ${disallowedType}`, true)
        }

        const currentQuantity = item ? (getProperty(item.data, this.QUANTITY_ATTRIBUTE) ?? 1) : 1;

        const newQuantity = Math.max(0, currentQuantity - quantity);

        if (newQuantity >= 1) {

            await item.update({ [this.QUANTITY_ATTRIBUTE]: newQuantity });
            lib.debug(`Removed 1 "${item.name}" from target ${target.id}`)

        } else {

            quantity = currentQuantity;

            await item.delete();
            lib.debug(`Removed the last "${item.name}" from target ${target.id}`);


            await API._checkPileShouldBeDeleted(target);

        }

        await API.rerenderPileInventoryApplication(targetUuid);

        return quantity;

    }

    /**
     * Adds an item to an actor
     *
     * @param {Actor|TokenDocument|Token} target    The target to add an item to
     * @param {Object} itemData                     The item's data to add to this target
     * @param {Number} quantity                     Number of them items to add
     * @param {Boolean} force                       Whether to ignore item type restrictions
     * @returns {Promise<Number>}
     */
    static async addItem(target, itemData, { quantity = 1, force = false }){

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`addItem | Could not determine the UUID, please provide a valid target`, true)

        const disallowedType = API.isItemTypeDisallowed(itemData);
        if(disallowedType && !force){
            throw lib.custom_error(`addItem | Could not add item of type ${disallowedType}`, true)
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ITEM, targetUuid, itemData, { quantity, force });
    }

    static async _addItem(targetUuid, itemData, { quantity = 1, force = false }){

        const target = await lib.getActor(targetUuid);
        if (!target) {
            throw lib.custom_error(`AddItem | Could not find target with UUID ${targetUuid}`, true)
        }

        const disallowedType = API.isItemTypeDisallowed(itemData);
        if(disallowedType && !force){
            throw lib.custom_error(`addItem | Could not add item of type ${disallowedType}`, true)
        }

        const targetItems = Array.from(target.items);

        const item = lib.getSimilarItem(targetItems, itemData.name, itemData.type);

        const currentQuantity = item ? (getProperty(item.data, this.QUANTITY_ATTRIBUTE) ?? 0) : 0;

        const newQuantity = currentQuantity + quantity;

        if (item) {
            await item.update({ [this.QUANTITY_ATTRIBUTE]: newQuantity });
            lib.debug(`Added ${newQuantity} "${item.name}" to pile ${targetUuid} (now has ${newQuantity})`);
        } else {
            setProperty(itemData, this.QUANTITY_ATTRIBUTE, newQuantity);
            await target.createEmbeddedDocuments("Item", [itemData]);
            lib.debug(`Added ${newQuantity} "${itemData.name}" to pile ${targetUuid}`)
        }

        await API.rerenderPileInventoryApplication(targetUuid);

        return newQuantity;

    }

    /**
     * Adds an item to an actor
     *
     * @param {Actor|Token|TokenDocument} source        The actor to transfer all items from
     * @param {Actor|Token|TokenDocument} target        The actor to receive all the items
     * @param {Array|Boolean} itemTypeFilters           Item types to filter
     * @returns {Promise}
     */
    static async transferAllItems(source, target, { itemTypeFilters = false }={}){

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`revertFromItemPile | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`revertFromItemPile | Could not determine the UUID, please provide a valid target`, true)

        return itemPileSocket.executeAsGM(
            SOCKET_HANDLERS.TRANSFER_ALL_ITEMS,
            sourceUuid,
            targetUuid,
            {
                itemTypeFilters
            }
        );
    }

    static async _transferAllItems(sourceUuid, targetUuid, { itemTypeFilters = false }={}) {

        const source = await lib.getActor(sourceUuid);
        if(!source){
            throw lib.custom_error(`TransferAllItems | Could not find source with UUID ${sourceUuid}`, true)
        }

        const target = await lib.getActor(targetUuid);
        if(!target){
            throw lib.custom_error(`TransferAllItems | Could not find target with UUID ${targetUuid}`, true)
        }

        if(!Array.isArray(itemTypeFilters)){
            itemTypeFilters = API.ITEM_TYPE_FILTERS;
        }

        const itemsToCreate = [];
        const itemsToUpdate = [];
        const itemsToDelete = [];

        // Filter disallowed items by type
        const sourceItems = Array.from(source.items).filter(item => !API.isItemTypeDisallowed(item, itemTypeFilters))
        const targetItems = Array.from(target.items);

        for(let item of sourceItems){

            const incomingQuantity = getProperty(item.data, this.QUANTITY_ATTRIBUTE) ?? 1;

            const similarItem = lib.getSimilarItem(targetItems, item.name, item.type);

            if(similarItem){

                const currentQuantity = getProperty(similarItem.data, this.QUANTITY_ATTRIBUTE) ?? 1;

                itemsToUpdate.push({
                    _id: similarItem.id,
                    [this.QUANTITY_ATTRIBUTE]: currentQuantity + incomingQuantity
                })

            }else {

                itemsToCreate.push(item.toObject());

            }

            itemsToDelete.push(item.id);

        }

        await target.createEmbeddedDocuments("Item", itemsToCreate);
        await target.updateEmbeddedDocuments("Item", itemsToUpdate);

        await source.deleteEmbeddedDocuments("Item", itemsToDelete);

        // Check if potential piles should be deleted
        await API._checkPileShouldBeDeleted(target);
        await API._checkPileShouldBeDeleted(target);

        // Refresh potential piles and any relevant open UIs
        await API.rerenderPileInventoryApplication(sourceUuid);
        await API.rerenderPileInventoryApplication(targetUuid);

        return {
            itemsUpdated: itemsToUpdate,
            itemsCreated: itemsToCreate
        }
    }

    /**
     * Turns a token and its actor into an item pile
     *
     * @param target
     * @param settings
     * @param tokenSettings
     * @return {Promise}
     */
    static async turnTokenIntoItemPile(target, { pileSettings = {}, tokenSettings = {} }={}) {
        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`revertFromItemPile | Could not determine the UUID, please provide a valid target`, true)
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TURN_INTO_PILE, targetUuid, pileSettings, tokenSettings);
    }

    static async _turnTokenIntoItemPile(targetUuid, pileSettings={}, tokenSettings={}) {

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`TurnIntoItemPile | Could not find target with UUID ${targetUuid}`, true)

        const targetPileSettings = target.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? {};
        const existingPileSettings = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, targetPileSettings);

        const newPileSettings = foundry.utils.mergeObject(existingPileSettings, pileSettings);
        newPileSettings.enabled = true;

        await API._updateTargetPileSettings(target, pileSettings, tokenSettings);

        await API.rerenderTokenHud();

        return targetUuid;

    }

    /**
     * Reverts a token from an item pile into a normal token and actor
     *
     * @param target
     * @param tokenSettings
     * @return {Promise}
     */
    static async revertTokenFromItemPile(target, { tokenSettings={} }={}) {
        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`revertFromItemPile | Could not determine the UUID, please provide a valid target`, true)
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REVERT_FROM_PILE, targetUuid, tokenSettings);
    }

    static async _revertTokenFromItemPile(targetUuid, tokenSettings) {

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`revertFromItemPile | Could not find target with UUID ${targetUuid}`, true)

        const targetPileSettings = target.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? {};
        const pileSettings = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, targetPileSettings);

        pileSettings.enabled = false;

        await API._updateTargetPileSettings(target, pileSettings, tokenSettings);

        await API.rerenderTokenHud();

        await API.rerenderPileInventoryApplication(targetUuid);

        return targetUuid;

    }

    static async _updateTargetPileSettings(target, pileSettings, tokenSettings){
        if(target instanceof Actor){
            return target.update({
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
                "token": {
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
                    ...tokenSettings
                },
            });
        }

        await target.update(tokenSettings);

        return API._updatePile(target.uuid, pileSettings);
    }

    /**
     * Causes every user's token HUD to rerender
     *
     * @return {Promise}
     */
    static async rerenderTokenHud(){
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_TOKEN_HUD);
    }

    static async _rerenderTokenHud(){
        if(!canvas.tokens.hud.rendered) return;
        await canvas.tokens.hud.render(true)
        return true;
    }

    /**
     * Causes all connected users to re-render a specific pile's inventory UI
     *
     * @param inPileUuid
     * @param deleted
     * @return {Promise<*>}
     */
    static async rerenderPileInventoryApplication(inPileUuid, deleted = false) {
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, inPileUuid, deleted);
    }

    static async _rerenderPileInventoryApplication(inPileUuid, deleted = false){
        ItemPileInventory.rerenderActiveApp(inPileUuid, deleted);
    }

    /**
     * Opens a pile if it is enabled and a container
     *
     * @param token
     * @return {Promise}
     */
    static async openPile(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        data.closed = false;
        data.locked = false;
        if(data.openSound){
            AudioHelper.play({ src: data.openSound })
        }
        return API.updatePile(token, data);
    }

    /**
     * Closes a pile if it is enabled and a container
     *
     * @param token
     * @return {Promise}
     */
    static async closePile(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        data.closed = true;
        if(data.closeSound){
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updatePile(token, data);
    }

    /**
     * Toggles a pile's closed state if it is enabled and a container
     *
     * @param token
     * @return {Promise}
     */
    static async togglePileClosed(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.closed){
            return API.openPile(token);
        }
        return API.closePile(token);
    }

    /**
     * Locks a pile if it is enabled and a container
     *
     * @param token
     * @return {Promise}
     */
    static async lockPile(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        data.closed = true;
        data.locked = true;
        return API.updatePile(token, data);
    }

    /**
     * Unlocks a pile if it is enabled and a container
     *
     * @param token
     * @return {Promise}
     */
    static async unlockPile(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        data.locked = false;
        return API.updatePile(token, data);
    }

    /**
     * Toggles a pile's locked state if it is enabled and a container
     *
     * @param token
     * @return {Promise}
     */
    static async togglePileLocked(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.locked){
            return API.unlockPile(token);
        }
        return API.lockPile(token);
    }

    /**
     * Causes the item pile to play a sound as it was attempted to be opened, but was locked
     * @param token
     * @return {Promise<boolean>}
     */
    static async rattleItemPile(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.locked && data.lockedSound){
            AudioHelper.play({ src: data.lockedSound })
        }
        return true;
    }

    /**
     * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
     *
     * @param token
     * @return {boolean}
     */
    static isPileLocked(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        return data.locked;
    }

    /**
     * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
     *
     * @param token
     * @return {boolean}
     */
    static isPileClosed(token){
        const data = API._getFreshFlags(token);
        if(!data?.enabled || !data?.isContainer) return false;
        return data.closed;
    }

    /**
     * Whether an item pile is a container. If it is not enabled, it is always false.
     *
     * @param token
     * @return {boolean}
     */
    static isPileContainer(token){
        const data = API._getFreshFlags(token);
        return data?.enabled && data?.isContainer;
    }

    /**
     * Updates a pile with new data.
     *
     * @param token
     * @param newData
     * @return {Promise}
     */
    static async updatePile(token, newData){
        const tokenUuid = lib.getUuid(token);
        if(!tokenUuid) throw lib.custom_error(`updatePile | Could not determine the UUID, please provide a valid token`, true);

        const diff = foundry.utils.diffObject(API._getFreshFlags(token), newData);

        Hooks.call('preUpdateItemPile', token, newData, diff)

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_PILE, tokenUuid, newData)
    }

    static async _updatePile(tokenUuid, newData){

        const token = await fromUuid(tokenUuid);
        const oldData = API._getFreshFlags(token);

        token.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME, newData);

        const diff = foundry.utils.diffObject(oldData, newData);

        await token.update({
            "img": API._getItemPileTokenImage(token, newData),
            "scale": API._getItemPileTokenScale(token, newData),
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: newData,
            [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: newData
        });

        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.UPDATED_PILE, tokenUuid, diff);
    }

    static async _updatedPile(tokenUuid, diffData){
        const token = await fromUuid(tokenUuid);

        if(foundry.utils.isObjectEmpty(diffData)) return;

        const data = API._getFreshFlags(token);

        Hooks.callAll('updateItemPile', token, diffData)

        if(data.isContainer) {
            if (diffData?.closed === true) {
                Hooks.callAll("closeItemPile", token)
            }
            if (diffData?.locked === true) {
                Hooks.callAll("lockItemPile", token)
            }
            if (diffData?.locked === false) {
                Hooks.callAll("unlockItemPile", token)
            }
            if (diffData?.closed === false) {
                Hooks.callAll("openItemPile", token)
            }
        }
    }

    /**
     * Refreshes the token image of an item pile, ensuring it remains in sync
     *
     * @param token
     * @return {Promise}
     */
    static async refreshPile(token) {
        if (!API.isValidPile(token)) return;
        const tokenUuid = lib.getUuid(token);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REFRESH_PILE, tokenUuid)
    }

    static async _refreshPile(tokenUuid){
        const token = await fromUuid(tokenUuid);
        if (!API.isValidPile(token)) return;
        return token.update({
            "img": API._getItemPileTokenImage(token),
            "scale": API._getItemPileTokenScale(token),
        });
    }

    /**
     * Deletes a pile, calling the relevant hooks.
     *
     * @param token
     * @return {Promise}
     */
    static async deletePile(token){
        if(!API.isValidPile(token)) {
            if(!tokenUuid) throw lib.custom_error(`deletePile | This is not an item pile, please provide a valid token`, true);
        }
        const tokenUuid = lib.getUuid(token);
        if(!tokenUuid) throw lib.custom_error(`deletePile | Could not determine the UUID, please provide a valid token`, true);
        Hooks.call('preDeleteItemPile', token);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DELETE_PILE, tokenUuid);
    }

    static async _deletePile(tokenUuid){
        const token = await fromUuid(tokenUuid);
        return token.delete();
    }

    /**
     * Initializes a pile on the client-side.
     *
     * @param token
     * @return {Promise<boolean>}
     */
    static async initializePile(token){

        const data = token.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        if(!data?.enabled) return false;

        const method = () => {
            return doubleClickHandler.clicked(token.document);
        }
        if(!lib.object_has_event(token, "pointerdown", method)){
            lib.debug(`Registered pointerdown method for token with uuid ${token.document.uuid}`)
            token.on('pointerdown', method);
        }

        if(game.settings.get(CONSTANTS.MODULE_NAME, "preloadFiles")){
            for(let [key, value] of Object.entries(data)){
                if(preloadedImages.has(value) || !value) continue;
                if(key.toLowerCase().includes("image")){
                    loadTexture(value);
                    lib.debug(`Preloaded image: ${value}`);
                }else if(key.toLowerCase().includes("sound")){
                    AudioHelper.preloadSound(value);
                    lib.debug(`Preloaded sound: ${value}`);
                }
                preloadedImages.add(value);
            }
        }

        lib.debug(`Initialized item pile with uuid ${token.document.uuid}`);

        return true;
    }

    /**
     * Whether a given document is a valid pile or not
     *
     * @param document
     * @return {boolean}
     */
    static isValidPile(document) {
        return !!document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled;
    }

    /* -------- UTILITY METHODS -------- */

    /**
     * Checks whether an item (or item data) is of a type that is not allowed. If an array whether that type is allowed
     * or not, returning the type if it is NOT allowed.
     *
     * @param {Item|Object} item
     * @param {Array|Boolean} itemTypeFilter
     * @return {boolean|string}
     */
    static isItemTypeDisallowed(item, itemTypeFilter = false){
        if(!API.ITEM_TYPE_ATTRIBUTE) return false;
        if(!Array.isArray(itemTypeFilter)) itemTypeFilter = API.ITEM_TYPE_FILTERS;
        const itemType = getProperty(item, API.ITEM_TYPE_ATTRIBUTE);
        if(itemTypeFilter.includes(itemType)){
            return itemType;
        }
        return false;
    }

    /* -------- PRIVATE ITEM PILE METHODS -------- */

    static _getFreshFlags(document){
        return foundry.utils.duplicate(document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? {});
    }

    static async _itemPileClicked(token){

        if(!API.isValidPile(token)) return;

        const data = API._getFreshFlags(token);

        lib.debug(`Clicked: ${token.uuid}`);

        let controlledToken = canvas.tokens.controlled?.[0] ?? false;

        if(!controlledToken || controlledToken.document === token) return;

        const distance = Math.floor(lib.distance_between_rect(token.object, controlledToken) / canvas.grid.size) + 1;

        if(data.distance < distance) return;

        if(data.isContainer) {

            if (data.locked) {
                return API.rattleItemPile(token);
            }

            if (data.closed) {
                await API.openPile(token);
            }

        }

        return new ItemPileInventory(token.actor, controlledToken.actor).render(true);

    }

    static _getItemPileTokenImage(tokenDocument, data = false){

        if(!data){
            data = API._getFreshFlags(tokenDocument);
        }

        const items = Array.from(tokenDocument.actor.items);

        let img;
        if(data.isContainer){

            img = data.lockedImage || data.closedImage || data.openedImage || data.emptyImage;

            if(data.locked && data.lockedImage){
                img = data.lockedImage;
            }else if(data.closed && data.closedImage){
                img = data.closedImage;
            }else if(data.openedImage && items.length > 0) {
                img = data.openedImage;
            }else if(data.emptyImage){
                img = data.emptyImage;
            }

        }else if(data.displayOne && items.length === 1){

            img = items[0].data.img;

        }

        if(!img) {
            img = tokenDocument.actor.data.img;
        }

        return img;

    }

    static _getItemPileTokenScale(tokenDocument, data){

        if(!data){
            data = API._getFreshFlags(tokenDocument);
        }

        const items = Array.from(tokenDocument.actor.items);

        return data.overrideSingleItemScale && items.length === 1
            ? data.singleItemScale
            : tokenDocument.actor.data.token.scale;

    }

    static async _checkPileShouldBeDeleted(target){

        if(!(target instanceof TokenDocument)) return false;

        const data = target.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);

        const shouldDelete = {
            "default": game.settings.get(CONSTANTS.MODULE_NAME, "deleteEmptyPiles"),
            "true": true,
            "false": false
        }[data?.deleteWhenEmpty ?? "default"]

        const hasItems = Array.from(target.actor.item).length > 0;

        if(!data?.enabled || !shouldDelete || hasItems) return false;

        return API.deletePile(target);
    }

}

const preloadedImages = new Set();

const doubleClickHandler = {
    _clicked: false,
    clicked(target){
        if(target !== doubleClickHandler._target) {
            doubleClickHandler._clicked = false
        }
        if(doubleClickHandler._clicked){
            doubleClickHandler._target = false;
            doubleClickHandler._clicked = false;
            return API._itemPileClicked(target);
        }
        doubleClickHandler._target = target;
        doubleClickHandler._clicked = true;
        setTimeout(() => { doubleClickHandler._clicked = false }, 500);
    }
}
