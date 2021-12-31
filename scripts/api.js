import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import ItemPile from "./itemPile.js";
import { managedPiles } from "./module.js";
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
     * @param itemPile
     * @param force
     * @return {Promise}
     */
    static async dropData(canvas, data, { itemPile = false, force = false }={}) {

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

        if(!itemPile){

            const position = canvas.grid.getTopLeft(data.x, data.y);
            x = position[0];
            y = position[1];

            droppableDocuments = lib.getTokensAtLocation({ x, y })
                .filter(token => token.actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled)
                .map(token => managedPiles.get(token.document.uuid));

        }else{

            droppableDocuments.push(itemPile);

        }

        if (droppableDocuments.length > 0 && !game.user.isGM) {
            droppableDocuments = droppableDocuments.filter(pile => !pile.isLocked);
            if (!droppableDocuments.length) {
                return Dialog.prompt({
                    title: game.i18n.localize("ITEM-PILES.Dialogs.LockedWarning.Title"),
                    content: `<p>${game.i18n.localize("ITEM-PILES.Dialogs.LockedWarning.Title")}</p>`,
                    label: "OK",
                    callback: () => {
                    },
                    rejectClose: false
                });
            }
        }

        if (game.keyboard.downKeys.has("AltLeft")) {

            if (droppableDocuments.length) {
                action = "addToPile";
            }

        } else {

            const result = await DropDialog.query(itemData, droppableDocuments);

            if (!result) return;
            action = result.action;
            dropData.quantity = Number(result.quantity);

        }

        if (action === "addToPile") {
            dropData.target = droppableDocuments[0].actor;
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

        const sourceUuid = API.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`handleDrop | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = API.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`handleDrop | Could not determine the UUID, please provide a valid target`, true)

        const disallowedType = API.isItemTypeDisallowed(itemData);
        if(disallowedType && !force){
            throw lib.custom_error(`handleDrop | Could not drop item of type ${disallowedType}`, true)
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DROP, {
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
            const pile = await API.createPile(position);
            targetUuid = pile.tokenDocument.uuid;
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

        const [ tokenDocument ] = await canvas.scene.createEmbeddedDocuments("Token", [ tokenData ])

        await lib.wait(50)

        ItemPile.make(tokenDocument)

        return API.getUuid(tokenDocument);

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

        const sourceUuid = API.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`transferItem | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = API.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`transferItem | Could not determine the UUID, please provide a valid target`, true)

        const actorItem = source.items.get(itemId);
        if(!actorItem){
            throw lib.custom_error(`transferItem | Could not find item with id ${itemId} on actor ${sourceUuid}`, true)
        }

        const disallowedType = API.isItemTypeDisallowed(actorItem);
        if(disallowedType && !force){
            throw lib.custom_error(`transferItem | Could not drop item of type ${disallowedType}`, true)
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ITEM, sourceUuid, targetUuid, itemId, quantity);

    }

    static async _transferItem(sourceUuid, targetUuid, itemId, { quantity = 1, force = false }={}) {

        const source = await API.getActor(sourceUuid);
        if(!source){
            throw lib.custom_error(`TransferItem | Could not find actor with UUID ${sourceUuid}`, true)
        }

        const target = await API.getActor(targetUuid);
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

        const targetUuid = API.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`removeItem | Could not determine the UUID, please provide a valid target`, true)

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ITEM, targetUuid, itemId, { quantity, force });
    }

    static async _removeItem(targetUuid, itemId, { quantity = 1, force = false }={}) {

        const target = await API.getActor(targetUuid);
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
            lib.debug(`Removed the last "${item.name}" from target ${target.id}`)

            if (target.token) {
                const pile = managedPiles.get(target.token.uuid);
                if (game.settings.get(CONSTANTS.MODULE_NAME, "deleteEmptyPiles") && pile && pile.items.size === 0) {
                    await target.sheet.close();
                    await pile.document.delete();
                }
            }

        }

        await API.rerenderPileInventoryApplication(target);

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

        const targetUuid = API.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`addItem | Could not determine the UUID, please provide a valid target`, true)

        const disallowedType = API.isItemTypeDisallowed(itemData);
        if(disallowedType && !force){
            throw lib.custom_error(`addItem | Could not add item of type ${disallowedType}`, true)
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ITEM, targetUuid, itemData, { quantity, force });
    }

    static async _addItem(targetUuid, itemData, { quantity = 1, force = false }){

        const target = await API.getActor(targetUuid);
        if (!target) {
            throw lib.custom_error(`AddItem | Could not find target with UUID ${targetUuid}`, true)
        }

        const disallowedType = API.isItemTypeDisallowed(itemData);
        if(disallowedType && !force){
            throw lib.custom_error(`addItem | Could not add item of type ${disallowedType}`, true)
        }

        const targetItems = Array.from(target.items);

        const item = this.getSimilarItem(targetItems, itemData.name, itemData.type);

        const currentQuantity = item ? (getProperty(item.data, this.QUANTITY_ATTRIBUTE) ?? 0) : 0;

        const newQuantity = currentQuantity + quantity;

        if (item) {
            await item.update({ [this.QUANTITY_ATTRIBUTE]: newQuantity });
            lib.debug(`Added ${newQuantity} "${item.name}" to pile ${target.uuid} (now has ${newQuantity})`);
        } else {
            setProperty(itemData, this.QUANTITY_ATTRIBUTE, newQuantity);
            await target.createEmbeddedDocuments("Item", [itemData]);
            lib.debug(`Added ${newQuantity} "${itemData.name}" to pile ${target.uuid}`)
        }

        await API.rerenderPileInventoryApplication(target);

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
    static async transferAllItems(source, target, { itemTypeFilters = false }){

        const sourceUuid = API.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`revertFromItemPile | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = API.getUuid(target);
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

    static async _transferAllItems(sourceUuid, targetUuid, { itemTypeFilters = false }) {

        const source = await API.getActor(sourceUuid);
        if(!source){
            throw lib.custom_error(`TransferAllItems | Could not find source with UUID ${sourceUuid}`, true)
        }

        const target = await API.getActor(targetUuid);
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

            const similarItem = this.getSimilarItem(targetItems, item.name, item.type);

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

        // Refresh potential piles and any relevant open UIs
        await API.updatePile(source);
        await API.updatePile(target);
        await API.rerenderPileInventoryApplication(source);
        await API.rerenderPileInventoryApplication(target);

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
        const targetUuid = API.getUuid(target);
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

        await API._updateTargetPileSettings(target, pileSettings);

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
        const targetUuid = API.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`revertFromItemPile | Could not determine the UUID, please provide a valid target`, true)
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REVERT_FROM_PILE, targetUuid, tokenSettings);
    }

    static async _revertTokenFromItemPile(targetUuid, tokenSettings) {

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`revertFromItemPile | Could not find target with UUID ${targetUuid}`, true)

        const targetPileSettings = target.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? {};
        const pileSettings = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, targetPileSettings);

        pileSettings.enabled = false;

        await API._updateTargetPileSettings(target, pileSettings);

        await API.rerenderTokenHud();

        return targetUuid;

    }

    static async _updateTargetPileSettings(target, pileSettings){
        if(target instanceof Actor){
            return target.update({
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
                "token": {
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
                    ...tokenSettings
                },
            });
        }

        return target.update({
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
            [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileSettings,
            ...tokenSettings
        });
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
     * @param inPile
     * @return {Promise<*>}
     */
    static async rerenderPileInventoryApplication(inPile) {
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, API.getUuid(inPile));
    }

    static async _rerenderPileInventoryApplication(inPileUuid){
        const pile = await API.getActor(inPileUuid);
        ItemPileInventory.rerenderActiveApp(pile);
    }

    /**
     * Updates a pile if it exists
     *
     * @param {Actor|Token|TokenDocument} target
     * @return <Promise>
     */
    static async updatePile(target){
        const pile = await API.getItemPile(target)
        if(pile){
            return pile.update();
        }
    }

    /* -------- UTILITY METHODS -------- */

    static async getItemPile(target){
        const uuid = typeof target === "string" ? target : (await API.getUuid(target));
        return managedPiles.get(uuid);
    }

    static async isItemPile(target){
        const uuid = typeof target === "string" ? target : (await API.getUuid(target));
        return managedPiles.has(uuid);
    }

    static getSimilarItem(items, itemName, itemType){
        for(const item of items){
            if(item.name === itemName && item.type === itemType){
                return item;
            }
        }
        return false;
    }

    static async getActor(documentUuid){
        const document = await fromUuid(documentUuid);
        return document?.actor ?? document;
    }

    static getUuid(target){
        const document = target?.token ?? target?.document ?? target;
        return document?.uuid ?? false;
    }

    static isItemTypeDisallowed(item, itemTypeFilter = false){
        if(!API.ITEM_TYPE_ATTRIBUTE) return false;
        if(!Array.isArray(itemTypeFilter)) itemTypeFilter = API.ITEM_TYPE_FILTERS;
        const itemType = getProperty(item, API.ITEM_TYPE_ATTRIBUTE);
        if(itemTypeFilter.includes(itemType)){
            return itemType;
        }
        return false;
    }

    static async updateDocument(documentUuid, updates){
        const document = await fromUuid(documentUuid);
        return document.update(updates);
    }

}