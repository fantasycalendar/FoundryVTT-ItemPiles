import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";
import DropDialog from "./formapplications/dropDialog.js";
import { HOOKS } from "./hooks.js";
import { is_real_number } from "./lib/lib.js";

export default class API {

    /**
     * The actor class type used for the original item pile actor in this system
     *
     * @returns {string}
     */
    static get ACTOR_CLASS_TYPE(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "actorClassType");
    }

    /**
     * Sets the actor class type used for the original item pile actor in this system
     *
     * @param {string} inClassType
     * @returns {Promise}
     */
    static async setActorClassType(inClassType) {
        if(typeof inAttribute !== "string"){
            throw lib.custom_error("setActorTypeClass | inClassType must be of type string");
        }
        return game.settings.set(CONSTANTS.MODULE_NAME, "actorClassType", inClassType);
    }

    /**
     * The attributes used to track dynamic attributes in this system
     *
     * @returns {array}
     */
    static get DYNAMIC_ATTRIBUTES(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "dynamicAttributes");
    }

    /**
     * Sets the attributes used to track dynamic attributes in this system
     *
     * @param {array} inAttributes
     * @returns {Promise}
     */
    static async setDynamicAttributes(inAttributes) {
        if(!Array.isArray(inAttributes)) {
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
     * The attribute used to track the quantity of items in this system
     *
     * @returns {string}
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
     * @returns {string}
     */
    static get ITEM_TYPE_ATTRIBUTE(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "itemTypeAttribute");
    }

    /**
     * Sets the attribute used to track the item type in this system
     *
     * @param {string} inAttribute
     * @returns {string}
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
     * @returns {array}
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
    static async _dropDataOnCanvas(canvas, data, { target = false, force = false }={}) {

        if (data.type !== "Item") return;

        const itemData = data.id ? game.items.get(data.id)?.toObject() : data.data;
        if (!itemData) {
            throw lib.custom_error("Something went wrong when dropping this item!")
        }

        const disallowedType = API.isItemTypeDisallowed(itemData);

        const dropData = {
            source: false,
            target: false,
            itemData: itemData,
            position: false,
            quantity: 1,
            force: false
        }

        if (disallowedType) {
            if(!game.user.isGM){
                return lib.custom_warning(`Could not drag & drop item of type ""${disallowedType}"`, true)
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
            droppableDocuments = droppableDocuments.filter(token => API.isItemPileLocked(token));
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

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_DROP, dropData.source, dropData.target, dropData.itemData, dropData.position, dropData.quantity);
        if(hookResult === false) return;

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DROP_ITEMS, dropData);

    }

    /**
     * If not given an actor, this method creates an item pile at a location, then adds an item to it.
     *
     * If a target was provided, it will just add the item to that target actor.
     *
     * If an actor was provided, it will transfer the item from the actor to the target actor.
     *
     * @param {Actor|Boolean} source
     * @param {TokenDocument|Boolean} target
     * @param {Object|Boolean} position
     * @param {Object} itemData
     * @param {Number} quantity
     * @param {Boolean} force
     */
    static async _dropItems({
        sourceUuid = false,
        targetUuid = false,
        itemData = false,
        position = false,
        quantity = 1,
        force = false
    }={}) {

        if(!targetUuid && position) {
            targetUuid = await API.createPile(position);
        }

        if(sourceUuid){
            await API._transferItems(sourceUuid, targetUuid, itemData._id, { quantity, force })
        }else{
            await API._addItems(targetUuid, itemData, { quantity, force });
        }

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.DROP, sourceUuid, targetUuid, itemData, position, quantity);

        return { sourceUuid, targetUuid, position, itemData, quantity, force };

    }

    /**
     * Creates the default item pile at a location. If provided an actor's name, an item
     * pile will be created of that actor, if it is a valid item pile.
     *
     * @param {object} position
     * @param {string|boolean} pileActorName
     *
     * @returns {Promise}
     */
    static async createPile(position, pileActorName = false) {

        const hookResult = Hooks.call(HOOKS.PILE.PRE_CREATE, position, pileActorName);
        if(hookResult === false) return;

        if(pileActorName){
            const pileActor = game.actors.getName(pileActorName);
            if(!pileActor){
                throw lib.custom_error(`There is no actor of the name "${pileActorName}"`, true);
            }else if(!API.isValidItemPile(pileActor)){
                throw lib.custom_error(`The actor of name "${pileActorName}" is not a valid item pile actor.`, true);
            }
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.CREATE_PILE, position, pileActorName);
    }

    static async _createPile(position, pileActorName){

        let pileActor;

        if (!pileActorName) {

            pileActor = game.settings.get(CONSTANTS.MODULE_NAME, "defaultItemPileActorID") ? game.actors.get(game.settings.get(CONSTANTS.MODULE_NAME, "defaultItemPileActorID")) : false;

            if(!pileActor) {

                lib.custom_notify("A Default Item Pile has been added to your Actors list. You can configure the default look and behavior on it, or duplicate it to create different styles.")

                const pileDataDefaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS)

                pileActor = await Actor.create({
                    name: "Default Item Pile",
                    type: game.settings.get(CONSTANTS.MODULE_NAME, "actorClassType"),
                    img: "icons/svg/item-bag.svg",
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: pileDataDefaults
                });

                pileActor.update({
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

        }else{
            pileActor = game.actors.getName(pileActorName);
        }

        const tokenData = await pileActor.getTokenData();

        tokenData.update({
            ...position,
            actorData: { items: {} }
        });

        const [ tokenDocument ] = await canvas.scene.createEmbeddedDocuments("Token", [ tokenData ]);

        return lib.getUuid(tokenDocument);

    }

    /**
     * Transfers items from the source to the target, subtracting a number of quantity from the source's item and adding it to the target's item, deleting items from the source if their quantity reaches 0
     *
     * @param {Actor|Token|TokenDocument} source    The source to transfer the items from
     * @param {Actor|Token|TokenDocument} target    The target to transfer the items to
     * @param {Array} items                         An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity")
     * @param {Boolean} force                       Whether to ignore item type restrictions
     *
     * @returns {Promise<Object>}                   An object containing a key value pair for each item added to the target, key being item ID, value being quantities added
     */
    static async transferItems(source, target, items, { force = false }={}) {

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_TRANSFER, source, target, items);
        if(hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`TransferItems | Could not determine the UUID, please provide a valid source`, true)

        const sourceActorItems = source instanceof TokenDocument
            ? source.actor.items
            : source.items;

        items.forEach(item => {
            const actorItem = sourceActorItems.get(item._id);
            if(!actorItem){
                throw lib.custom_error(`TransferItems | Could not find item with id "${item._id}" on source "${sourceUuid}"`, true)
            }
            const disallowedType = API.isItemTypeDisallowed(actorItem);
            if(disallowedType && !force){
                throw lib.custom_error(`TransferItems | Could not transfer item of type "${disallowedType}"`, true)
            }
        });

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`TransferItems | Could not determine the UUID, please provide a valid target`, true)

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ITEMS, sourceUuid, targetUuid, items, { force });

    }

    /**
     * @private
     */
    static async _transferItems(sourceUuid, targetUuid, items, { force = false, isEverything = false }={}) {

        const source = await fromUuid(sourceUuid);
        if(!source) throw lib.custom_error(`TransferItems | Could not find actor with UUID "${sourceUuid}"`, true)

        const sourceActorItems = source instanceof TokenDocument
            ? source.actor.items
            : source.items;

        items.forEach(item => {
            const actorItem = sourceActorItems.get(item._id);
            if(!actorItem){
                throw lib.custom_error(`TransferItems | Could not find item with id "${item._id}" on source "${sourceUuid}"`, true)
            }
            const disallowedType = API.isItemTypeDisallowed(actorItem);
            if(disallowedType && !force){
                throw lib.custom_error(`TransferItems | Could not transfer item of type "${disallowedType}"`, true)
            }
            return actorItem;
        });

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`TransferItems | Could not find actor with UUID "${targetUuid}"`, true)

        const itemsRemoved = await API._removeItems(sourceUuid, items, { force, isTransfer: true });

        const itemsAdded = await API._addItems(targetUuid, itemsRemoved, { force, isTransfer: true });

        if(!isEverything){

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.TRANSFER, sourceUuid, targetUuid, itemsAdded);

            const macroData = {
                action: "transferItems",
                source: sourceUuid,
                target: targetUuid,
                itemsAdded: itemsAdded
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            // Check if piles should be deleted
            await API._checkItemPileShouldBeDeleted(targetUuid);
            await API._checkItemPileShouldBeDeleted(sourceUuid);

            // Refresh open inventory UIs of piles
            await API.rerenderItemPileInventoryApplication(targetUuid);
            await API.rerenderItemPileInventoryApplication(sourceUuid);

        }

        return itemsAdded;

    }

    /**
     * Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.
     *
     * @param {Actor|Token|TokenDocument} target    The target to remove a items from
     * @param {Array} items                         An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity")
     * @param {Array|Boolean} itemTypeFilters       Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<Array>}                    An array containing the objects of each item that was removed, with their quantities set to the number removed
     */
    static async removeItems(target, items, { itemTypeFilters = false }={}){

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_REMOVE, target, items);
        if(hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`RemoveItems | Could not determine the UUID, please provide a valid target`, true);

        if(itemTypeFilters){
            itemTypeFilters.forEach(filter => {
                if(typeof filter !== "string") throw lib.custom_error(`RemoveItems | entries in the itemTypeFilters must be of type string`);
            })
        }

        const targetActorItems = target instanceof TokenDocument
            ? target.actor.items
            : target.items;

        items.forEach(item => {
            const actorItem = targetActorItems.get(item._id);
            if(!actorItem){
                throw lib.custom_error(`RemoveItems | Could not find item with id "${item._id}" on target "${targetUuid}"`, true)
            }
            const disallowedType = API.isItemTypeDisallowed(actorItem, itemTypeFilters);
            if(disallowedType){
                throw lib.custom_error(`RemoveItems | Could not transfer item of type "${disallowedType}"`, true)
            }
        });

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ITEMS, targetUuid, items, { itemTypeFilters });
    }

    static async _removeItems(targetUuid, items, { itemTypeFilters = false, isTransfer = false }={}) {

        const target = await fromUuid(targetUuid);
        if (!target) {
            throw lib.custom_error(`RemoveItems | Could not find target with UUID "${targetUuid}"`, true)
        }

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        if(itemTypeFilters){
            itemTypeFilters.forEach(filter => {
                if(typeof filter !== "string") throw lib.custom_error(`RemoveItems | entries in the itemTypeFilters must be of type string`);
            })
        }

        items.forEach(item => {
            const actorItem = targetActor.items.get(item._id);
            if(!actorItem){
                throw lib.custom_error(`RemoveItems | Could not find item with id "${item._id}" on target "${targetUuid}"`, true)
            }
            const disallowedType = API.isItemTypeDisallowed(actorItem, itemTypeFilters);
            if(disallowedType){
                throw lib.custom_error(`RemoveItems | Could not transfer item of type "${disallowedType}"`, true)
            }
        });

        const itemsRemoved = [];
        const itemsToUpdate = [];
        const itemsToDelete = [];
        for(const item of items) {

            const actorItem = targetActor.items.get(item.id);

            const currentQuantity = getProperty(actorItem.data, this.ITEM_QUANTITY_ATTRIBUTE);

            const quantityToRemove = item.quantity ?? currentQuantity;

            const newQuantity = Math.max(0, currentQuantity - quantityToRemove);

            const removedItem = actorItem.toObject();

            if (newQuantity >= 1) {
                setProperty(removedItem, API.ITEM_QUANTITY_ATTRIBUTE, quantityToRemove);
                itemsToUpdate.push({ [this.ITEM_QUANTITY_ATTRIBUTE]: newQuantity });
            } else {
                setProperty(removedItem, API.ITEM_QUANTITY_ATTRIBUTE, currentQuantity);
                itemsToDelete.push(actorItem.id);
            }

            itemsRemoved.push(removedItem);

        }

        await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);
        await targetActor.deleteEmbeddedDocuments("Item", itemsToDelete);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.REMOVE, targetUuid, itemsRemoved);

        if(!isTransfer){

            const macroData = {
                action: "removeItems",
                target: targetUuid,
                items: itemsRemoved
            };

            await API._executeItemPileMacro(targetUuid, macroData);

            await API._checkItemPileShouldBeDeleted(targetUuid);
            await API.rerenderItemPileInventoryApplication(targetUuid);

        }

        return itemsRemoved;

    }

    /**
     * Adds item to an actor, increasing item quantities if matches were found
     *
     * @param {Actor|TokenDocument|Token} target    The target to add an item to
     * @param {Array} items                         An array of item objects
     * @param {Array|Boolean} itemTypeFilters       Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<Array>}                    An array containing each item added as an object, with their quantities updated to match the new amounts
     */
    static async addItems(target, items, { itemTypeFilters = false }){

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_ADD, target, items);
        if(hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`AddItems | Could not determine the UUID, please provide a valid target`, true)

        if(itemTypeFilters){
            itemTypeFilters.forEach(filter => {
                if(typeof filter !== "string") throw lib.custom_error(`AddItem | entries in the itemTypeFilters must be of type string`);
            })
        }

        for(const index in items) {
            const item = items[index];
            if(item instanceof Item){
                items[index] = item.toObject();
            }
            const disallowedType = API.isItemTypeDisallowed(item);
            if (disallowedType && !force) {
                throw lib.custom_error(`AddItems | Could not add item of type "${disallowedType}"`, true)
            }
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ITEMS, targetUuid, items, { itemTypeFilters });
    }

    static async _addItems(targetUuid, items, { itemTypeFilters = false, isTransfer = false }){

        const target = await fromUuid(targetUuid);
        if (!target) {
            throw lib.custom_error(`AddItems | Could not find target with UUID "${targetUuid}"`, true)
        }

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const targetActorItems = Array.from(targetActor.items);

        const itemsAdded = [];
        const itemsToCreate = [];
        const itemsToUpdate = [];
        for(const itemData of items){

            const disallowedType = API.isItemTypeDisallowed(itemData, itemTypeFilters);
            if (disallowedType) {
                throw lib.custom_error(`AddItems | Could not add item of type "${disallowedType}"`, true);
            }

            const item = lib.getSimilarItem(targetActorItems, itemData._id, itemData.name, itemData.type);

            const incomingQuantity = getProperty(itemData, API.ITEM_QUANTITY_ATTRIBUTE) ?? 1;

            const itemAdded = item ? item.toObject() : foundry.utils.duplicate(itemData);

            if(item){
                const currentQuantity = getProperty(item.data, API.ITEM_QUANTITY_ATTRIBUTE);
                const newQuantity = currentQuantity + incomingQuantity;
                itemsToUpdate.push({
                    "_id": item.id,
                    [API.ITEM_QUANTITY_ATTRIBUTE]: newQuantity
                });

                const itemAdded = item.toObject();
                setProperty(itemAdded, API.ITEM_QUANTITY_ATTRIBUTE, newQuantity)
                itemsAdded.push(itemAdded);
            }else{
                setProperty(itemAdded, API.ITEM_QUANTITY_ATTRIBUTE, incomingQuantity)
                itemsToCreate.push(itemData);
            }

        }

        const itemsCreated = await targetActor.createEmbeddedDocuments("Item", itemsToCreate);
        await targetActor.updateEmbeddedDocuments("Item", itemsToUpdate);

        itemsCreated.forEach(item => itemsAdded.push(item.toObject()));

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ITEM.ADD, targetUuid, itemsAdded);

        if(!isTransfer){

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
     * Transfers all items between the source and the target.
     *
     * @param {Actor|Token|TokenDocument} source    The actor to transfer all items from
     * @param {Actor|Token|TokenDocument} target    The actor to receive all the items
     * @param {Array|Boolean} itemTypeFilters       Array of item types to filter out - will default to module settings if none provided
     *
     * @returns {Promise<Object>}                   An object containing an array of the IDs of every item that was removed
     *                                              from the source, and the IDs of every item that was added to the target
     */
    static async transferAllItems(source, target, { itemTypeFilters = false }={}){

        const hookResult = Hooks.call(HOOKS.ITEM.PRE_TRANSFER_ALL, source, target, itemTypeFilters);
        if(hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`TransferAllItems | Could not determine the UUID, please provide a valid target`, true)

        if(itemTypeFilters){
            itemTypeFilters.forEach(filter => {
                if(typeof filter !== "string") throw lib.custom_error(`RevertFromItemPile | entries in the itemTypeFilters must be of type string`);
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

    static async _transferAllItems(sourceUuid, targetUuid, { itemTypeFilters = false, isEverything = false }={}) {

        const source = await fromUuid(sourceUuid);
        if(!source) throw lib.custom_error(`TransferAllItems | Could not find source with UUID "${sourceUuid}"`, true)

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`TransferAllItems | Could not find target with UUID "${targetUuid}"`, true)

        if(!Array.isArray(itemTypeFilters)){
            itemTypeFilters = API.ITEM_TYPE_FILTERS;
        }else{
            itemTypeFilters.forEach(filter => {
                if(typeof filter !== "string") throw lib.custom_error(`TransferAllItems | entries in the itemTypeFilters must be of type string`);
            })
        }

        const sourceActor = source instanceof TokenDocument
            ? source.actor
            : source;

        const itemsToRemove = Array.from(sourceActor.items).filter(item => !API.isItemTypeDisallowed(item, itemTypeFilters)).map(item => item.toObject());

        const itemsRemoved = API._removeItems(sourceUuid, itemsToRemove, { itemTypeFilters, isTransfer: true });
        const itemsAdded = API._addItems(targetUuid, itemsRemoved, { itemTypeFilters, isTransfer: true });

        if(!isEverything) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.TRANSFER_ALL_ITEMS, HOOKS.ITEM.TRANSFER_ALL, sourceUuid, targetUuid, itemsAdded);

            const macroData = {
                action: "transferAllItems",
                source: sourceUuid,
                target: targetUuid,
                items: itemsAdded
            };

            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            // Check if piles should be deleted
            await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API._checkItemPileShouldBeDeleted(targetUuid);

            // Refresh open inventory UIs of piles
            await API.rerenderItemPileInventoryApplication(sourceUuid);
            await API.rerenderItemPileInventoryApplication(targetUuid);

        }

        return itemsAdded;
    }

    /**
     * Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target
     *
     * @param {Actor|Token|TokenDocument} source    The source to transfer the attribute from
     * @param {Actor|Token|TokenDocument} target    The target to transfer the attribute to
     * @param {Array} attributes                    An array of attributes to transfer, each entry should either be a string of the attribute path to transfer all of a given attribute, or an object with the key being the attribute path, and the value being the quantity to transfer
     *
     * @returns {Promise}                           The number of the attribute that were transferred
     */
    static async transferAttributes(source, target, attributes){

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER, source, target, attributes);
        if(hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`TransferAttributes | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`TransferAttributes | Could not determine the UUID, please provide a valid target`, true)

        const sourceActor = source instanceof TokenDocument
            ? source.actor
            : source;

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        attributes.forEach(attribute => {
            let attributePath = attribute;
            if(typeof attributePath !== "string"){
                [ attributePath ] = Object.keys(attribute);
                const [ quantity ] = Object.value(attribute);
                if(!lib.is_real_number(quantity) && quantity > 0){
                    throw lib.custom_error(`TransferAttributes | Attribute "${attributePath}" must be of type number and greater than 0`, true)
                }
            }
            if(!hasProperty(sourceActor.data, attributePath)){
                throw lib.custom_error(`TransferAttributes | Could not find attribute ${attributePath} on source's actor with UUID "${sourceUuid}"`, true)
            }
            if(!hasProperty(targetActor.data, attributePath)){
                throw lib.custom_error(`TransferAttributes | Could not find attribute ${attributePath} on target's actor with UUID "${targetUuid}"`, true)
            }
        })

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ATTRIBUTES, sourceUuid, targetUuid, attributes);

    }

    /**
     * @private
     */
    static async _transferAttributes(sourceUuid, targetUuid, attributes, {  isEverything = false }={}) {

        const source = await fromUuid(sourceUuid);
        if(!source) throw lib.custom_error(`TransferAttribute | Could not find actor with UUID "${sourceUuid}"`, true)

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`TransferAttribute | Could not find actor with UUID "${targetUuid}"`, true)

        const { attributesRemoved } = await API._removeAttributes(sourceUuid, attributes, { isTransfer: true });

        const { attributesAdded } = await API._addAttributes(targetUuid, attributesRemoved, { isTransfer: true });

        if(!isEverything) {

            await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.TRANSFER, sourceUuid, targetUuid, attributesAdded);

            const macroData = {
                action: "transferAttributes",
                source: sourceUuid,
                target: targetUuid,
                attributes: attributesAdded
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API._checkItemPileShouldBeDeleted(targetUuid);

            await API.rerenderItemPileInventoryApplication(sourceUuid);
            await API.rerenderItemPileInventoryApplication(targetUuid);

        }

        return attributesAdded

    }

    /**
     * Subtracts attributes on the target
     *
     * @param {Token|TokenDocument} target  The target whose attribute will have a set quantity from it
     * @param {Array} attributes            An array of attributes to transfer, each entry should either be a string of the attribute path to transfer all of a given attribute, or an object with the key being the attribute path, and the value being the quantity to transfer
     *
     * @returns {Promise}                   Returns how much quantity of the attribute were removed from the target
     */
    static async removeAttributes(target, attributes){

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_REMOVE, target, attributes);
        if(hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`RemoveAttributes | Could not determine the UUID, please provide a valid target`, true)

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        attributes.forEach(attribute => {
            let attributePath = attribute;
            if(typeof attributePath !== "string"){
                [ attributePath ] = Object.keys(attribute);
                const [ quantity ] = Object.value(attribute);
                if(!lib.is_real_number(quantity) && quantity > 0){
                    throw lib.custom_error(`RemoveAttributes | Attribute "${attributePath}" must be of type number and greater than 0`, true)
                }
            }
            if(!hasProperty(targetActor.data, attributePath)){
                throw lib.custom_error(`RemoveAttributes | Could not find attribute ${attributePath} on target's actor with UUID "${targetUuid}"`, true)
            }
        })

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REMOVE_ATTRIBUTES, targetUuid, attributes);

    }

    /**
     * @private
     */
    static async _removeAttributes(targetUuid, attributes, { isTransfer = false }={}){

        const target = await fromUuid(targetUuid);
        if (!target) {
            throw lib.custom_error(`RemoveAttributes | Could not find target with UUID "${targetUuid}"`, true)
        }

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const updates = {};
        const attributesRemoved = {};

        for(const attribute of attributes){
            let attributePath = attribute;
            let quantityToRemove = getProperty(targetActor.data, attributePath);

            if(typeof attributePath !== "string"){
                [ attributePath ] = Object.keys(attribute);
                [ quantityToRemove ] = Object.value(attribute);
            }

            const currentQuantity = getProperty(targetActor.data, attribute);
            const newQuantity = Math.max(0, currentQuantity - quantityToRemove);

            updates[attributePath] = newQuantity;

            // if the target's quantity is above 1, we've removed the amount we expected, otherwise however many were left
            attributesRemoved[attributePath] = newQuantity ? quantityToRemove : currentQuantity;
        }

        await targetActor.update(updates);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.REMOVE, targetUuid, attributesRemoved);

        if(!isTransfer) {

            const macroData = {
                action: "removeAttributes",
                target: targetUuid,
                attributes: attributesRemoved
            };
            await API._executeItemPileMacro(targetUuid, macroData);

            await API._checkItemPileShouldBeDeleted(targetUuid);
            await API.rerenderItemPileInventoryApplication(targetUuid);
        }

        return attributesRemoved;

    }

    /**
     * Adds to attributes on an actor
     *
     * @param {Actor|Token|TokenDocument} target    The target whose attribute will have a set quantity added to it
     * @param {Array} attributes                    An array of attributes to transfer, each entry should either be a string of the attribute path to transfer all of a given attribute, or an object with the key being the attribute path, and the value being the quantity to transfer
     *
     * @returns {Promise}                           Returns how much quantity of the attribute were added to the target
     *
     */
    static async addAttributes(target, attributes){

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_ADD, target, attributes);
        if(hookResult === false) return;

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`AddAttribute | Could not determine the UUID, please provide a valid target`, true)

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        attributes.forEach(attribute => {
            let attributePath = attribute;
            if(typeof attributePath !== "string"){
                [ attributePath ] = Object.keys(attribute);
                const [ quantity ] = Object.value(attribute);
                if(!lib.is_real_number(quantity) && quantity > 0){
                    throw lib.custom_error(`AddAttribute | Attribute "${attributePath}" must be of type number and greater than 0`, true)
                }
            }
            if(!hasProperty(targetActor.data, attributePath)){
                throw lib.custom_error(`AddAttribute | Could not find attribute ${attributePath} on target's actor with UUID "${targetUuid}"`, true)
            }
        })

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.ADD_ATTRIBUTE, targetUuid, attributes);

    }

    /**
     * @private
     */
    static async _addAttributes(targetUuid, attributes, { isTransfer = false }={}){

        const target = await fromUuid(targetUuid);
        if (!target) {
            throw lib.custom_error(`addAttribute | Could not find target with UUID "${targetUuid}"`, true)
        }

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const updates = {};
        const attributesAdded = {};

        for(const attribute of attributes){

            let attributePath = attribute;
            let quantityToAdd = getProperty(targetActor.data, attributePath);

            if(typeof attributePath !== "string"){
                [ attributePath ] = Object.keys(attribute);
                [ quantityToAdd ] = Object.value(attribute);
            }

            const currentQuantity = getProperty(targetActor.data, attribute);

            updates[attributePath] = currentQuantity + quantityToAdd;
            attributesAdded[attributePath] = currentQuantity + quantityToAdd;

        }

        await targetActor.update(updates);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.ADD, targetUuid, attributesAdded);

        if(isTransfer) {

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
     * Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target
     *
     * @param {Actor|Token|TokenDocument} source    The source to transfer the attributes from
     * @param {Actor|Token|TokenDocument} target    The target to transfer the attributes to
     *
     * @returns {Promise<Object>}                   An object containing attributes that were transferred as keys with
     *                                              the values being the quantity of that attribute that was transferred
     */
    static async transferAllAttributes(source, target){

        const hookResult = Hooks.call(HOOKS.ATTRIBUTE.PRE_TRANSFER_ALL, source, target);
        if(hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid source`, true);

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`TransferAllAttributes | Could not determine the UUID, please provide a valid target`, true);

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_ALL_ATTRIBUTES, sourceUuid, targetUuid);

    }

    static async _transferAllAttributes(sourceUuid, targetUuid, { isEverything = false }={}) {

        const source = await fromUuid(sourceUuid);
        if(!source) throw lib.custom_error(`TransferAllAttributes | Could not find actor with UUID "${sourceUuid}"`, true)

        const sourceActor = source instanceof TokenDocument
            ? source.actor
            : source;

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`TransferAllAttributes | Could not find actor with UUID "${targetUuid}"`, true)

        const targetActor = target instanceof TokenDocument
            ? target.actor
            : target;

        const attributesToTransfer = API.DYNAMIC_ATTRIBUTES.filter(attribute => {
            return hasProperty(sourceActor.data, attribute.path)
                && getProperty(sourceActor.data, attribute.path) > 0
                && hasProperty(targetActor.data, attribute.path);
        }).map(attribute => attribute.path);

        const attributesRemoved = await API._removeAttributes(sourceUuid, attributesToTransfer, { isTransfer: true });
        const attributesAdded = await API._addAttributes(targetUuid, attributesRemoved, { isTransfer: true });

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.ATTRIBUTE.TRANSFER_ALL, sourceUuid, targetUuid, attributesAdded);

        if(!isEverything) {

            const macroData = {
                action: "transferAllAttributes",
                source: sourceUuid,
                target: targetUuid,
                attributes: attributesAdded
            };
            await API._executeItemPileMacro(sourceUuid, macroData);
            await API._executeItemPileMacro(targetUuid, macroData);

            await API._checkItemPileShouldBeDeleted(sourceUuid);
            await API._checkItemPileShouldBeDeleted(targetUuid);

            await API.rerenderItemPileInventoryApplication(sourceUuid);
            await API.rerenderItemPileInventoryApplication(targetUuid);

        }

        return attributesAdded;

    }

    /**
     * Transfers all items and attributes between the source and the target.
     *
     * @param {Actor|Token|TokenDocument} source    The actor to transfer all items and attributes from
     * @param {Actor|Token|TokenDocument} target    The actor to receive all the items and attributes
     * @param {Array|Boolean} itemTypeFilters       Array of item types disallowed - will default to module settings if none provided
     *
     * @returns {Promise<Object>}                   An object containing an array of the IDs of every item that was removed
     *                                              from the source, and the IDs of every item that was added to the target
     */
    static async transferEverything(source, target, { itemTypeFilters = false }={}){

        const hookResult = Hooks.call(HOOKS.PRE_TRANSFER_EVERYTHING, source, target, itemTypeFilters);
        if(hookResult === false) return;

        const sourceUuid = lib.getUuid(source);
        if(!sourceUuid) throw lib.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid source`, true)

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`TransferEverything | Could not determine the UUID, please provide a valid target`, true)

        if(itemTypeFilters){
            itemTypeFilters.forEach(filter => {
                if(typeof filter !== "string") throw lib.custom_error(`TransferEverything | entries in the itemTypeFilters must be of type string`);
            })
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, { itemTypeFilters })

    }

    /**
     * @private
     */
    static async _transferEverything(sourceUuid, targetUuid, { itemTypeFilters = false }={}){

        const source = await fromUuid(sourceUuid);
        if(!source) throw lib.custom_error(`TransferEverything | Could not find actor with UUID "${sourceUuid}"`, true)

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`TransferEverything | Could not find actor with UUID "${targetUuid}"`, true)

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

        await API._checkItemPileShouldBeDeleted(sourceUuid);
        await API._checkItemPileShouldBeDeleted(targetUuid);

        await API.rerenderItemPileInventoryApplication(sourceUuid);
        await API.rerenderItemPileInventoryApplication(targetUuid);

        return {
            itemsTransferred,
            attributesTransferred
        };

    }

    /**
     * Turns a token and its actor into an item pile
     *
     * @param {Token|TokenDocument} target
     * @param {object} settings
     * @param {object} tokenSettings
     * @return {Promise}
     */
    static async turnTokenIntoItemPile(target, { pileSettings = {}, tokenSettings = {} }={}) {
        const hookResult = Hooks.call(HOOKS.PILE.PRE_TURN_INTO, target, pileSettings, tokenSettings);
        if(hookResult === false) return;
        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`TurnIntoItemPile | Could not determine the UUID, please provide a valid target`, true)
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TURN_INTO_PILE, targetUuid, pileSettings, tokenSettings);
    }

    /**
     * @private
     */
    static async _turnTokenIntoItemPile(targetUuid, pileSettings={}, tokenSettings={}) {

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`TurnIntoItemPile | Could not find target with UUID "${targetUuid}"`, true)

        const targetPileSettings = target.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? {};
        const existingPileSettings = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, targetPileSettings);

        const newPileSettings = foundry.utils.mergeObject(existingPileSettings, pileSettings);
        newPileSettings.enabled = true;

        await API.updateItemPile(target, pileSettings, { tokenSettings });

        setTimeout(API.rerenderTokenHud, 100);

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.TURN_INTO, targetUuid, newPileSettings);

        return targetUuid;

    }

    /**
     * Reverts a token from an item pile into a normal token and actor
     *
     * @param {Token|TokenDocument} target
     * @param {object} tokenSettings
     * @return {Promise}
     */
    static async revertTokenFromItemPile(target, { tokenSettings={} }={}) {
        const hookResult = Hooks.call(HOOKS.PILE.PRE_REVERT_FROM, target, tokenSettings);
        if(hookResult === false) return;
        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`RevertFromItemPile | Could not determine the UUID, please provide a valid target`, true)
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REVERT_FROM_PILE, targetUuid, tokenSettings);
    }

    /**
     * @private
     */
    static async _revertTokenFromItemPile(targetUuid, tokenSettings) {

        const target = await fromUuid(targetUuid);
        if(!target) throw lib.custom_error(`RevertFromItemPile | Could not find target with UUID "${targetUuid}"`, true)

        const targetPileSettings = target.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? {};
        const pileSettings = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, targetPileSettings);

        pileSettings.enabled = false;

        await API.updateItemPile(target, pileSettings, { tokenSettings });

        setTimeout(API.rerenderTokenHud, 100);

        if(target instanceof TokenDocument){
            await API.rerenderItemPileInventoryApplication(targetUuid);
        }

        await itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.PILE.REVERT_FROM, targetUuid);

        return targetUuid;

    }

    /**
     * Causes every user's token HUD to rerender
     *
     * @return {Promise}
     */
    static async rerenderTokenHud(){
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_TOKEN_HUD);
    }

    /**
     * @private
     */
    static async _rerenderTokenHud(){
        if(!canvas.tokens.hud.rendered) return;
        await canvas.tokens.hud.render(true)
        return true;
    }

    /**
     * Opens a pile if it is enabled and a container
     *
     * @param {Token|TokenDocument} target
     * @param {Token|TokenDocument|Boolean} interactingToken
     *
     * @return {Promise}
     */
    static async openItemPile(target, interactingToken = false){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        const wasLocked = data.locked;
        data.closed = false;
        data.locked = false;
        if(wasLocked){
            const hookResult = Hooks.call(HOOKS.PILE.PRE_UNLOCK, target, data, interactingToken);
            if(hookResult === false) return;
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_OPEN, target, data, interactingToken);
        if(hookResult === false) return;
        if(data.openSound){
            AudioHelper.play({ src: data.openSound })
        }
        return API.updateItemPile(target, data, { interactingToken });
    }

    /**
     * Closes a pile if it is enabled and a container
     *
     * @param {Token|TokenDocument} target          Target pile to close
     * @param {Token|TokenDocument|Boolean} interactingToken
     *
     * @return {Promise}
     */
    static async closeItemPile(target, interactingToken = false){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        data.closed = true;
        const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, target, data, interactingToken);
        if(hookResult === false) return;
        if(data.closeSound){
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updateItemPile(target, data, interactingToken);
    }

    /**
     * Toggles a pile's closed state if it is enabled and a container
     *
     * @param {Token|TokenDocument} target          Target pile to open or close
     * @param {Token|TokenDocument|Boolean} interactingToken
     *
     * @return {Promise}
     */
    static async toggleItemPileClosed(target, interactingToken = false){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.closed){
            await API.openItemPile(target, interactingToken);
        }else{
            await API.closeItemPile(target, interactingToken);
        }
        return !data.closed;
    }

    /**
     * Locks a pile if it is enabled and a container
     *
     * @param {Token|TokenDocument} target          Target pile to lock
     * @param {Token|TokenDocument|Boolean} interactingToken
     *
     * @return {Promise}
     */
    static async lockItemPile(target, interactingToken = false){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        const wasClosed = data.closed;
        data.closed = true;
        data.locked = true;
        if(!wasClosed){
            const hookResult = Hooks.call(HOOKS.PILE.PRE_CLOSE, target, data, interactingToken);
            if(hookResult === false) return;
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_LOCK, target, data, interactingToken);
        if(hookResult === false) return;
        if(data.closeSound && !wasClosed){
            AudioHelper.play({ src: data.closeSound })
        }
        return API.updateItemPile(target, data, interactingToken);
    }

    /**
     * Unlocks a pile if it is enabled and a container
     *
     * @param {Token|TokenDocument} target          Target pile to unlock
     * @param {Token|TokenDocument|Boolean} interactingToken
     *
     * @return {Promise}
     */
    static async unlockItemPile(target, interactingToken = false){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        data.locked = false;
        Hooks.call(HOOKS.PILE.PRE_UNLOCK, target, data, interactingToken);
        return API.updateItemPile(target, data, interactingToken);
    }

    /**
     * Toggles a pile's locked state if it is enabled and a container
     *
     * @param {Token|TokenDocument} target          Target pile to lock or unlock
     * @param {Token|TokenDocument|Boolean} interactingToken
     *
     * @return {Promise}
     */
    static async toggleItemPileLocked(target, interactingToken = false){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        if(data.locked){
            return API.unlockItemPile(target, interactingToken);
        }
        return API.lockItemPile(target, interactingToken);
    }

    /**
     * Causes the item pile to play a sound as it was attempted to be opened, but was locked
     *
     * @param {Token|TokenDocument} target
     *
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
     * @param {Token|TokenDocument} target
     *
     * @return {boolean}
     */
    static isItemPileLocked(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        return data.locked;
    }

    /**
     * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
     *
     * @param {Token|TokenDocument} target
     *
     * @return {boolean}
     */
    static isItemPileClosed(target){
        const data = API._getFreshFlags(target);
        if(!data?.enabled || !data?.isContainer) return false;
        return data.closed;
    }

    /**
     * Whether an item pile is a container. If it is not enabled, it is always false.
     *
     * @param {Token|TokenDocument} target
     *
     * @return {boolean}
     */
    static isItemPileContainer(target){
        const data = API._getFreshFlags(target);
        return data?.enabled && data?.isContainer;
    }

    /**
     * Updates a pile with new data.
     *
     * @param {Token|TokenDocument} target
     * @param {object} newData
     * @param {Token|TokenDocument|boolean} interactingToken
     * @param {object|boolean} tokenSettings
     *
     * @return {Promise}
     */
    static async updateItemPile(target, newData, { interactingToken = false, tokenSettings = false }={}){

        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`updatePile | Could not determine the UUID, please provide a valid target`, true);

        const interactingTokenUuid = interactingToken ? lib.getUuid(interactingToken) : false;
        if(interactingToken && !interactingTokenUuid) throw lib.custom_error(`updatePile | Could not determine the UUID, please provide a valid target`, true);

        const hookResult = Hooks.call(HOOKS.PILE.PRE_UPDATE, target, newData, interactingToken, tokenSettings);
        if(hookResult === false) return;

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_PILE, targetUuid, newData, { interactingTokenUuid, tokenSettings })
    }

    static async _updateItemPile(targetUuid, newData, { interactingTokenUuid = false, tokenSettings = false}={}){

        const target = await fromUuid(targetUuid);

        const oldData = API._getFreshFlags(target);

        const data = foundry.utils.mergeObject(
            foundry.utils.duplicate(oldData),
            foundry.utils.duplicate(newData)
        );

        await target.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME, data);

        const diff = foundry.utils.diffObject(oldData, data);

        if(target instanceof TokenDocument){
            let updates = {
                "img": API._getItemPileTokenImage(target, data),
                "scale": API._getItemPileTokenScale(target, data),
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data,
                [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data
            };
            if(tokenSettings){
                updates = foundry.utils.mergeObject(updates, tokenSettings);
            }
            await target.update(updates);
        }else{
            let updates = {
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data,
                "token": {
                    "img": API._getItemPileTokenImage(target, data),
                    "scale": API._getItemPileTokenScale(target, data),
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data
                }
            };
            if(tokenSettings){
                updates["token"] = foundry.utils.mergeObject(updates["token"], tokenSettings);
            }
            await target.update(updates);
            await API._refreshItemPile(target);
        }
        
        if(data.isEnabled && data.isContainer) {
            if (diff?.closed === true) {
                await API._executeItemPileMacro(targetUuid, {
                    action: "closeItemPile",
                    source: interactingTokenUuid,
                    target: targetUuid
                });
            }
            if (diff?.locked === true) {
                await API._executeItemPileMacro(targetUuid, {
                    action: "lockItemPile",
                    source: interactingTokenUuid,
                    target: targetUuid
                });
            }
            if (diff?.locked === false) {
                await API._executeItemPileMacro(targetUuid, {
                    action: "unlockItemPile",
                    source: interactingTokenUuid,
                    target: targetUuid
                });
            }
            if (diff?.closed === false) {
                await API._executeItemPileMacro(targetUuid, {
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
    static async _updatedItemPile(targetUuid, diffData, interactingTokenUuid){

        const target = await lib.getToken(targetUuid);

        const interactingToken = interactingTokenUuid ? await fromUuid(interactingTokenUuid) : false;

        if(foundry.utils.isObjectEmpty(diffData)) return;

        const data = API._getFreshFlags(target);

        Hooks.callAll(HOOKS.PILE.UPDATE, target, diffData, interactingToken)

        if(data.isEnabled && data.isContainer) {
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
     * @param {Token|TokenDocument} target
     *
     * @return {Promise}
     */
    static async deleteItemPile(target){
        if(!API.isValidItemPile(target)) {
            if(!targetUuid) throw lib.custom_error(`deletePile | This is not an item pile, please provide a valid target`, true);
        }
        const targetUuid = lib.getUuid(target);
        if(!targetUuid) throw lib.custom_error(`deletePile | Could not determine the UUID, please provide a valid target`, true);
        if(!targetUuid.includes("Token")){
            throw lib.custom_error(`deletePile | Please provide a Token or TokenDocument`, true);
        }
        const hookResult = Hooks.call(HOOKS.PILE.PRE_DELETE, target);
        if(hookResult === false) return;
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.DELETE_PILE, targetUuid);
    }

    static async _deleteItemPile(targetUuid){
        const target = await lib.getToken(targetUuid);
        return target.delete();
    }

    /**
     * Initializes a pile on the client-side.
     *
     * @param tokenDocument
     * @return {Promise<boolean>}
     * @private
     */
    static async _initializeItemPile(tokenDocument){

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
     * @param document
     * @return {boolean}
     */
    static isValidItemPile(document) {
        return !!document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)?.enabled;
    }

    /**
     * Refreshes the target image of an item pile, ensuring it remains in sync
     *
     * @param target
     * @return {Promise}
     */
    static async refreshItemPile(target) {
        if (!API.isValidItemPile(target)) return;
        const targetUuid = lib.getUuid(target);
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.REFRESH_PILE, targetUuid)
    }

    /**
     * @private
     */
    static async _refreshItemPile(targetUuid){
        const targetDocument = await fromUuid(targetUuid);

        if (!API.isValidItemPile(targetDocument)) return;

        let targets = [targetDocument]
        if(targetDocument instanceof Actor){
            targets = Array.from(canvas.tokens.getDocuments()).filter(token => token.actor === targetDocument);
        }

        return Promise.allSettled(targets.map(_target =>  _target.update({
            "img": API._getItemPileTokenImage(targetDocument),
            "scale": API._getItemPileTokenScale(targetDocument),
        })));
    }

    /**
     * Causes all connected users to re-render a specific pile's inventory UI
     *
     * @param inPileUuid
     * @param deleted
     * @return {Promise}
     */
    static async rerenderItemPileInventoryApplication(inPileUuid, deleted = false) {
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.RERENDER_PILE_INVENTORY, inPileUuid, deleted);
    }

    /**
     * @private
     */
    static async _rerenderItemPileInventoryApplication(inPileUuid, deleted = false){
        return ItemPileInventory.rerenderActiveApp(inPileUuid, deleted);
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
    static async _executeItemPileMacro(targetUuid, macroData){

        const target = await fromUuid(targetUuid);

        if (!API.isValidItemPile(target)) return;

        const pileData = API._getFreshFlags(target);

        if (!pileData.macro) return;

        const macro = game.macros.getName(pileData.macro);

        if(!macro){
            throw lib.custom_error(`Could not find macro with name "${pileData.macro}" on target with UUID ${target.uuid}`);
        }

        // Reformat macro data to contain useful information
        if(macroData.source){
            macroData.source = await fromUuid(macroData.source);
        }

        if(macroData.target){
            macroData.target = await fromUuid(macroData.target);
        }

        const targetActor = macroData.target instanceof TokenDocument
            ? macroData.target.actor
            : macroData.target;

        if(macroData.item){
            macroData.items = macroData.items.map(item => targetActor.items.get(item._id));
        }

        return macro.execute([macroData]);

    }

    /* -------- UTILITY METHODS -------- */

    /**
     * Checks whether an item (or item data) is of a type that is not allowed. If an array whether that type is allowed
     * or not, returning the type if it is NOT allowed.
     *
     * @param {Item|Object} item
     * @param {Array|Boolean} itemTypeFilters
     * @return {boolean|string}
     */
    static isItemTypeDisallowed(item, itemTypeFilters = false){
        if(!API.ITEM_TYPE_ATTRIBUTE) return false;
        if(!Array.isArray(itemTypeFilters)) itemTypeFilters = API.ITEM_TYPE_FILTERS;
        const itemType = getProperty(item, API.ITEM_TYPE_ATTRIBUTE);
        if(itemTypeFilters.includes(itemType)){
            return itemType;
        }
        return false;
    }

    /* -------- PRIVATE ITEM PILE METHODS -------- */

    static _getFreshFlags(document){
        return foundry.utils.duplicate(document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? {});
    }

    static async _itemPileClicked(pileDocument){

        lib.debug(`Clicked: ${pileDocument.uuid}`);

        const data = API._getFreshFlags(pileDocument);

        let validTokens = (canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled : canvas.tokens.placeables).filter(token => token.owner && token.document !== pileDocument);

        let closestTokens = validTokens.map(token => {
                const distance = Math.floor(lib.distance_between_rect(pileDocument.object, token) / canvas.grid.size) + 1;
                return {
                    token,
                    distance
                };
            }).filter(potentialTarget => {
                return data.distance >= potentialTarget?.distance;
            })

        if(!closestTokens.length && !game.user.isGM){
            lib.custom_warning("You're too far away to interact with this pile!", true);
            return;
        }

        closestTokens.sort((potentialTargetA, potentialTargetB) => {
            return potentialTargetA.distance - potentialTargetB.distance;
        })

        closestTokens = closestTokens.map(potentialTarget => potentialTarget.token.document);

        if(data.isContainer && closestTokens.length) {

            if (data.locked) {
                lib.debug(`Attempted to locked item pile with UUID ${pileDocument.uuid}`);
                return API.rattleItemPile(pileDocument);
            }

            if (data.closed) {
                lib.debug(`Opened item pile with UUID ${pileDocument.uuid}`);
                await API.openItemPile(pileDocument);
            }

        }

        return ItemPileInventory.show(pileDocument, closestTokens[0]);

    }

    static _getItemPileTokenImage(pileDocument, data = false){

        if(!data){
            data = API._getFreshFlags(pileDocument);
        }

        const pileActor = pileDocument instanceof TokenDocument
            ? pileDocument.actor
            : pileDocument;

        const items = Array.from(pileActor.items);

        let img;
        if(data.isContainer){

            img = data.lockedImage || data.closedImage || data.openedImage || data.emptyImage;

            if(data.locked && data.lockedImage){
                img = data.lockedImage;
            }else if(data.closed && data.closedImage){
                img = data.closedImage;
            }else if(data.emptyImage && items.length === 0){
                img = data.emptyImage;
            }else if(data.openedImage) {
                img = data.openedImage;
            }

        }else if(data.displayOne && items.length === 1){

            img = items[0].data.img;

        }

        if(!img) {
            img = pileDocument instanceof TokenDocument
                ? pileDocument.actor.data.img
                : pileDocument.data.img;
        }

        return img;

    }

    static _getItemPileTokenScale(pileDocument, data){

        if(!data){
            data = API._getFreshFlags(pileDocument);
        }

        const pileActor = pileDocument instanceof TokenDocument
            ? pileDocument.actor
            : pileDocument;

        const items = Array.from(pileActor.items);

        return data.overrideSingleItemScale && items.length === 1
            ? data.singleItemScale
            : pileActor.data.token.scale;

    }

    static async _checkItemPileShouldBeDeleted(pileDocument){

        if(!(pileDocument instanceof TokenDocument)) return;

        const data = pileDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);

        const shouldDelete = {
            "default": game.settings.get(CONSTANTS.MODULE_NAME, "deleteEmptyPiles"),
            "true": true,
            "false": false
        }[data?.deleteWhenEmpty ?? "default"]

        const hasItems = Array.from(pileDocument.actor.items).length > 0;
        const hasNonZeroAttributes = API.DYNAMIC_ATTRIBUTES.find(attribute => {
            return !!getProperty(pileDocument.actor.data, attribute.path);
        })

        if(!data?.enabled || !shouldDelete || hasItems || hasNonZeroAttributes) return false;

        return API.deleteItemPile(pileDocument);

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
