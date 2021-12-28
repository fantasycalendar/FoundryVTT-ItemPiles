import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import ItemPile from "./itemPile.js";
import { managedPiles } from "./module.js";

export default class API {

    /**
     * The attribute used to track the quantity of items in this system
     *
     * @returns {String}
     */
    static get quantity_attribute(){
        return game.settings.get(CONSTANTS.MODULE_NAME, "quantityAttribute");
    }

    /**
     * If not given an actor, this method creates an item pile at a location, then adds an item to it.
     *
     * If a target was provided, it will just add the item to that target actor.
     *
     * If an actor was provided, it will transfer the item from the actor to the target actor.
     *
     * @param {Actor|Boolean} actor
     * @param {Actor|Boolean} target
     * @param {Object|Boolean} position
     * @param {Object} itemData
     * @param {Number} quantity
     * @returns {Promise<Actor>}
     */
    static async handleDrop({
        actor = false,
        target = false,
        position = { x: 0, y: 0},
        itemData = false,
        quantity = 1
    }={}) {

        if(!target) {
            const token = await API.createPile(position);
            target = token.actor;
        }

        if(actor){
            await API.transferItem(actor, target, itemData._id, quantity)
        }else{
            await API.addItem(target, itemData, quantity);
        }

        return target;

    }

    /**
     * Creates an empty tile at a location
     *
     * @param position
     * @returns {Promise<TokenDocument>}
     */
    static async createPile(position){

        let pileActor = game.actors.getName("Item Pile")

        if (!pileActor) {

            lib.custom_notify("The primary item pile has been added to your Actors list.<br>You can configure the default look and behavior on it.")

            const pileDataDefaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS)

            pileActor = await Actor.create({
                name: "Item Pile",
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

        return tokenDocument;

    }

    /**
     * Transfers an item from one actor to another, removing it or subtracting a number of quantity from the first
     * to the second one, deleting the item if its quantity reaches 0
     *
     * @param {Actor|ItemPile} fromActor        The actor or pile to transfer the item from
     * @param {Actor|ItemPile} toActor          The actor or pile to transfer the item to
     * @param {String} itemId                   The ID of the item to transfer
     * @param {Number} quantity                 How many of the item to transfer
     * @returns {Promise<Number>}               The number of items that were transferred
     */
    static async transferItem(fromActor, toActor, itemId, quantity = 1) {

        const actorItem = fromActor.items.get(itemId);

        if(!actorItem){
            lib.custom_warning(`Could not find item with id ${itemId} on actor ${fromActor.uuid}`, true)
            return;
        }

        const itemData = actorItem.toObject();

        const quantityRemoved = await API.removeItem(fromActor, itemId, quantity);

        return API.addItem(toActor, itemData, quantityRemoved);

    }

    /**
     * Subtracts the quantity of an item on an actor. If its quantity reaches 0, the item is removed from the actor.
     * @param {Actor} actor                     The actor to remove an item from
     * @param {String} itemId                   The itemId to remove from the actor
     * @param {Number} quantity         How many of the items to remove
     * @returns {Promise<Number>}               Returns how many items were removed from the actor
     */
    static async removeItem(actor, itemId, quantity = 1){

        const item = actor.items.get(itemId);

        if(!item){
            lib.custom_warning(`Could not delete item with id ${itemId} from actor ${actor.uuid}`, true)
            return;
        }

        const currentQuantity = item ? (getProperty(item.data, this.quantity_attribute) ?? 1) : 1;

        const newQuantity = Math.max(0, currentQuantity - quantity);

        if(newQuantity >= 1){

            await item.update({ [this.quantity_attribute]: newQuantity });
            lib.debug(`Removed 1 "${item.name}" from actor ${actor.id}`)

        }else{

            quantity = currentQuantity;

            await item.delete();
            lib.debug(`Removed the last "${item.name}" from actor ${actor.id}`)

            if(actor.token) {
                const pile = managedPiles.get(actor.token.uuid);
                if (game.settings.get(CONSTANTS.MODULE_NAME, "deleteEmptyPiles") && pile && pile.items.size === 0) {
                    await actor.sheet.close();
                    await pile.document.delete();
                }
            }

        }

        return quantity;

    }

    /**
     * Adds an item to an actor
     *
     * @param {Actor} actor             The actor to add an item to
     * @param {Object} itemData         The item's data to add to this actor
     * @param {Number} quantity    Number of them items to add
     * @returns {Promise<Number>}
     */
    static async addItem(actor, itemData, quantity = 1){

        let item;
        for(const _item of Array.from(actor.items)){
            if(_item.name === itemData.name && _item.type === itemData.type){
                item = _item;
                break
            }
        }

        const currentQuantity = item ? (getProperty(item.data, this.quantity_attribute) ?? 0) : 0;

        const newQuantity = currentQuantity + quantity;

        if(item){
            await item.update({ [this.quantity_attribute]: newQuantity });
            lib.debug(`Added ${newQuantity} "${item.name}" to pile ${actor.uuid} (now has ${newQuantity})`)
        }else{
            setProperty(itemData, this.quantity_attribute, newQuantity);
            await actor.createEmbeddedDocuments('Item', [ itemData ])
            lib.debug(`Added ${newQuantity} "${itemData.name}" to pile ${actor.uuid}`)
        }

        return newQuantity;

    }

    /**
     * Updates a pile with certain updates
     *
     * @param documentUuid
     * @param updates
     * @returns {Promise}
     */
    static async updatePile(documentUuid, updates){
        const document = await fromUuid(documentUuid);
        return document.update(updates);
    }

}