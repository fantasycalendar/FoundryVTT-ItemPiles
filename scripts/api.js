import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";
import DropDialog from "./formapplications/dropDialog.js";

export default class API {

    /**
     * The attributes used to track each currency in this system
     *
     * @returns {Array}
     */
    static get CURRENCY_ATTRIBUTES(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "currencyAttributes").split(",").map(str => str.trim());
    }

    /**
     * Sets the attributes used to track each currency in this system
     *
     * @param {string|array} inCurrencies
     * @returns {Promise}
     */
    static async setCurrencyAttribute(inCurrencies) {
        if(!Array.isArray(inCurrencies)){
            if(typeof inCurrencies !== "string"){
                throw lib.custom_error("setCurrencyAttribute | inCurrencies must be of type string or array");
            }
            inCurrencies = inCurrencies.split(',')
        }else {
            inCurrencies.forEach(currency => {
                if (typeof currency !== "string") {
                    throw lib.custom_error("setCurrencyAttribute | each entry in inCurrencies must be of type string");
                }
            })
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "currencyAttributes", inCurrencies.join(','));
    }

    /**
     * The attribute used to track the quantity of items in this system
     *
     * @returns {String}
     */
    static get ITEM_QUANTITY_ATTRIBUTE(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemQuantityAttribute");
    }

    /**
     * Sets the inAttribute used to track the quantity of items in this system
     *
     * @param {string} inAttribute
     * @returns {Promise}
     */
    static async setItemQuantityAttribute(inAttribute) {
        if(typeof inAttribute !== "string"){
            throw lib.custom_error("setItemQuantityAttribute | inAttribute must be of type string");
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemQuantityAttribute", inAttribute);
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
     * Sets the attribute used to track the item type in this system
     *
     * @param {string} inAttribute
     * @returns {String}
     */
    static async setItemTypeAttribute(inAttribute) {
        if(typeof inAttribute !== "string"){
            throw lib.custom_error("setItemTypeAttribute | inAttribute must be of type string");
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemTypeAttribute", inAttribute);
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
     * Sets the filters for item types eligible for interaction within this system
     *
     * @param {string|array} inFilters
     * @returns {Promise}
     */
    static async setItemTypeFilters(inFilters) {
        if(!Array.isArray(inFilters)){
            if(typeof inFilters !== "string"){
                throw lib.custom_error("setItemTypeFilters | inFilters must be of type string or array");
            }
            inFilters = inFilters.split(',')
        }else{
            inFilters.forEach(filter => {
                if (typeof filter !== "string") {
                    throw lib.custom_error("setItemTypeFilters | each entry in inFilters must be of type string");
                }
            })
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "itemTypeFilters", inFilters.join(','));
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
                dropData.quantity = getProperty(itemData, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1;
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

        const sourceUuid = lib.getUuid(source) ?? source;
        if(source && !sourceUuid) throw lib.custom_error(`handleDrop | Could not determine the UUID, please provide a valid source`, true)

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
            await API._addItem(targetUuid, itemData, { quantity, force });
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
     * Creates the default item pile at a location. If provided an actor's name, an item
     * pile will be created of that actor, if it is a valid item pile.
     *
     * @param position
     * @param pileName
     * @returns {Promise}
     */
    static async createPile(position, pileName = false) {

        if(!pileName){
            pileName = "Default Item Pile (do not rename)"
        }else{
            const pileActor = game.actors.getName(pileName);
            if(!pileActor){
                throw lib.custom_error(`There is no actor of the name "${pileName}"`, true);
            }else if(!API.isValidPile(pileActor)){
                throw lib.custom_error(`The actor of name "${pileName}" is not a valid item pile actor.`, true);
            }
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.CREATE_PILE, position, pileName);
    }

    static async _createPile(position, pileName){

        let pileActor = game.actors.getName(pileName)

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
     *
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

        const currentQuantity = item ? (getProperty(item.data, this.ITEM_QUANTITY_ATTRIBUTE) ?? 1) : 1;

        const newQuantity = Math.max(0, currentQuantity - quantity);

        if (newQuantity >= 1) {

            await item.update({ [this.ITEM_QUANTITY_ATTRIBUTE]: newQuantity });
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
     * Adds an item to an actor.
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

        const currentQuantity = item ? (getProperty(item.data, this.ITEM_QUANTITY_ATTRIBUTE) ?? 0) : 0;

        const newQuantity = currentQuantity + quantity;

        if (item) {
            await item.update({ [this.ITEM_QUANTITY_ATTRIBUTE]: newQuantity });
            lib.debug(`Added ${newQuantity} "${item.name}" to pile ${targetUuid} (now has ${newQuantity})`);
        } else {
            setProperty(itemData, this.ITEM_QUANTITY_ATTRIBUTE, newQuantity);
            await target.createEmbeddedDocuments("Item", [itemData]);
            lib.debug(`Added ${newQuantity} "${itemData.name}" to pile ${targetUuid}`)
        }

        await API.rerenderPileInventoryApplication(targetUuid);

        return newQuantity;

    }

    /**
     * Transfers all items between the source and the target.
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

            const incomingQuantity = getProperty(item.data, this.ITEM_QUANTITY_ATTRIBUTE) ?? 1;

            const similarItem = lib.getSimilarItem(targetItems, item.name, item.type);

            if(similarItem){

                const currentQuantity = getProperty(similarItem.data, this.ITEM_QUANTITY_ATTRIBUTE) ?? 1;

                itemsToUpdate.push({
                    _id: similarItem.id,
                    [this.ITEM_QUANTITY_ATTRIBUTE]: currentQuantity + incomingQuantity
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
     * @param {Actor|Token|TokenDocument} target
     * @param {object} settings
     * @param {object} tokenSettings
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
     * @param {Actor|Token|TokenDocument} target
     * @param {object} tokenSettings
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
     * Opens a pile if it is enabled and a container
     *
     * @param {Actor|Token|TokenDocument} target
     * @return {Promise}
     */
    static async openPile(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        data.closed = false;
        data.locked = false;
        if(data.openSound){
            AudioHelper.play({ src: data.openSound })
        }
        return API.updatePile(target, data);
    }

    /**
     * Closes a pile if it is enabled and a container
     *
     * @param {Actor|Token|TokenDocument} target    Target pile to close
     * @return {Promise}
     */
    static async closePile(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        data.closed = true;
        if(data.closeSound){
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updatePile(target, data);
    }

    /**
     * Toggles a pile's closed state if it is enabled and a container
     *
     * @param {Actor|Token|TokenDocument} target    Target pile to open or close
     * @return {Promise}
     */
    static async togglePileClosed(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.closed){
            await API.openPile(target);
        }else{
            await API.closePile(target);
        }
        return !data.closed;
    }

    /**
     * Locks a pile if it is enabled and a container
     *
     * @param {Actor|Token|TokenDocument} target    Target pile to lock
     * @return {Promise}
     */
    static async lockPile(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        data.closed = true;
        data.locked = true;
        return API.updatePile(target, data);
    }

    /**
     * Unlocks a pile if it is enabled and a container
     *
     * @param {Actor|Token|TokenDocument} target    Target pile to unlock
     * @return {Promise}
     */
    static async unlockPile(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        data.locked = false;
        return API.updatePile(target, data);
    }

    /**
     * Toggles a pile's locked state if it is enabled and a container
     *
     * @param {Actor|Token|TokenDocument} target    Target pile to lock or unlock
     * @return {Promise}
     */
    static async togglePileLocked(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.locked){
            return API.unlockPile(target);
        }
        return API.lockPile(target);
    }

    /**
     * Causes the item pile to play a sound as it was attempted to be opened, but was locked
     *
     * @param {Actor|Token|TokenDocument} target
     * @return {Promise<boolean>}
     */
    static async rattleItemPile(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.locked && data.lockedSound){
            AudioHelper.play({ src: data.lockedSound })
        }
        return true;
    }

    /**
     * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
     *
     * @param {Actor|Token|TokenDocument} target
     * @return {boolean}
     */
    static isPileLocked(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        return data.locked;
    }

    /**
     * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
     *
     * @param {Actor|Token|TokenDocument} target
     * @return {boolean}
     */
    static isPileClosed(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        return data.closed;
    }

    /**
     * Whether an item pile is a container. If it is not enabled, it is always false.
     *
     * @param {Actor|Token|TokenDocument} target
     * @return {boolean}
     */
    static isPileContainer(target){
        const data = API._getFreshFlags(target);
        return data?.enabled && data?.isContainer;
    }

    /**
     * Updates a pile with new data.
     *
     * @param {Actor|Token|TokenDocument} target
     * @param newData
     * @return {Promise}
     */
    static async updatePile(target, newData){
        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`updatePile | Could not determine the UUID, please provide a valid target`, true);

        const diff = foundry.utils.diffObject(API._getFreshFlags(target), newData);

        Hooks.call('preUpdateItemPile', target, newData, diff)

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_PILE, targetUuid, newData)
    }

    static async _updatePile(targetUuid, newData){

        const target = await lib.getToken(targetUuid);
        const oldData = API._getFreshFlags(target);

        const data = foundry.utils.mergeObject(oldData, newData);

        target.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME, data);

        const diff = foundry.utils.diffObject(data, newData);

        await target.update({
            "img": API._getItemPileTokenImage(target, data),
            "scale": API._getItemPileTokenScale(target, data),
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data,
            [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data
        });

        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.UPDATED_PILE, targetUuid, diff);
    }

    static async _updatedPile(targetUuid, diffData){
        const target = await lib.getToken(targetUuid);

        if(foundry.utils.isObjectEmpty(diffData)) return;

        const data = API._getFreshFlags(target);

        Hooks.callAll('updateItemPile', target, diffData)

        if(data.isContainer) {
            if (diffData?.closed === true) {
                Hooks.callAll("closeItemPile", target)
            }
            if (diffData?.locked === true) {
                Hooks.callAll("lockItemPile", target)
            }
            if (diffData?.locked === false) {
                Hooks.callAll("unlockItemPile", target)
            }
            if (diffData?.closed === false) {
                Hooks.callAll("openItemPile", target)
            }
        }
    }

    /**
     * Deletes a pile, calling the relevant hooks.
     *
     * @param target
     * @return {Promise}
     */
    static async deletePile(target){
        if(!API.isValidPile(target)) {
            if(!targetUuid) throw lib.custom_error(`deletePile | This is not an item pile, please provide a valid target`, true);
        }
        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`deletePile | Could not determine the UUID, please provide a valid target`, true);
        Hooks.call('preDeleteItemPile', target);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DELETE_PILE, targetUuid);
    }

    static async _deletePile(targetUuid){
        const target = await lib.getToken(targetUuid);
        return target.delete();
    }

    /**
     * Initializes a pile on the client-side.
     *
     * @param tokenDocument
     * @return {Promise<boolean>}
     */
    static async _initializePile(tokenDocument){

        const data = tokenDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        if(!data?.enabled) return false;

        const method = () => {
            return doubleClickHandler.clicked(tokenDocument);
        }

        if(!(tokenDocument.owner || game.user.isGM) && !lib.object_has_event(tokenDocument.object, "pointerdown", method)){
            lib.debug(`Registered pointerdown method for target with uuid ${tokenDocument.uuid}`)
            tokenDocument.object.on('pointerdown', method);
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

        lib.debug(`Initialized item pile with uuid ${tokenDocument.uuid}`);

        return true;
    }

    /**
     * Whether a given document is a valid pile or not
     *
     * @param target
     * @return {boolean}
     */
    static isValidPile(target) {
        return !!target.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled;
    }

    /**
     * Refreshes the target image of an item pile, ensuring it remains in sync
     *
     * @param target
     * @return {Promise}
     */
    static async refreshPile(target) {
        if (!API.isValidPile(target)) return;
        const targetUuid = lib.getUuid(target);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REFRESH_PILE, targetUuid)
    }

    static async _refreshPile(targetUuid){
        const target = await lib.getToken(targetUuid);
        if (!API.isValidPile(target)) return;
        return target.update({
            "img": API._getItemPileTokenImage(target),
            "scale": API._getItemPileTokenScale(target),
        });
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


    static async _itemPileClicked(tokenDocument){

        lib.debug(`Clicked: ${tokenDocument.uuid}`);

        const data = API._getFreshFlags(tokenDocument);

        let validTokens = (canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled : canvas.tokens.placeables).filter(token => token.owner && token.document !== tokenDocument);

        let closestTokens = validTokens.map(token => {
                const distance = Math.floor(lib.distance_between_rect(tokenDocument.object, token) / canvas.grid.size) + 1;
                return {
                    token,
                    distance
                };
            }).filter(token => {
                return data.distance >= token?.distance;
            })

        if(!closestTokens.length && !game.user.isGM){
            lib.custom_warning("You're too far away to interact with this pile!", true);
            return;
        }

        closestTokens.sort((tokenA, tokenB) => {
            return tokenB.distance - tokenA.distance;
        })

        closestTokens = closestTokens.map(token => token.token);

        if(data.isContainer && closestTokens.length) {

            if (data.locked) {
                return API.rattleItemPile(tokenDocument);
            }

            if (data.closed) {
                await API.openPile(tokenDocument);
            }

        }

        return new ItemPileInventory(tokenDocument.actor, closestTokens[0]?.actor).render(true);

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
