import CONSTANTS from "./constants.js";
import registerSettings from "./settings.js";
import * as lib from "./lib/lib.js"
import { getTokensAtLocation } from "./lib/lib.js";

const pileManager = {

    piles: new Map(),

    initialize(){
        registerSettings();
        this.setupConstants();
        Hooks.on('dropCanvasData', this._dropCanvasData.bind(this));
        Hooks.on("canvasReady", this._canvasReady.bind(this));
        Hooks.on("updateToken", this._updatePile.bind(this));
        Hooks.on('deleteToken', this._deletePile.bind(this));
    },

    setupConstants(){
        CONSTANTS.SETTINGS.QUANTITY = game.settings.get(CONSTANTS.MODULE_NAME, "quantityAttribute");
    },

    async _dropCanvasData(canvas, data){

        if(data.type !== "Item") return;

        const itemData = data.id ? game.items.get(data.id)?.toObject() : data.data;
        if(!itemData){
            throw lib.custom_error("Something went wrong when dropping this item!")
        }

        const dropData = {
            itemData: itemData,
            actor: false,
            target: false,
            location: false,
            quantity: 1
        }

        if(data.tokenId){
            dropData.actor = canvas.tokens.get(data.tokenId).actor;
        } else if(data.actorId){
            dropData.actor = game.actors.get(data.actorId);
        }

        const [ x, y ] = canvas.grid.getTopLeft(data.x, data.y);

        const droppableDocuments = lib.getTokensAtLocation({ x, y });

        let dropType = "newPile";
        if(droppableDocuments.length > 0){
            dropType = await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("ITEM-PILES.AddToPile.Title"),
                    content: `<p>${game.i18n.localize("ITEM-PILES.AddToPile.Content")}</p>`,
                    buttons: {
                         addToPile: {
                              icon: '<i class="fas fa-check"></i>',
                              label: game.i18n.localize("ITEM-PILES.AddToPile.AddToPile"),
                              callback: () => {
                                  resolve("addToPile")
                              }
                         },
                         newPile: {
                              icon: '<i class="fas fa-times"></i>',
                              label: game.i18n.localize("ITEM-PILES.AddToPile.NewPile"),
                              callback: () => {
                                  resolve("newPile")
                              }
                         },
                         cancel: {
                              icon: '<i class="fas fa-times"></i>',
                              label: game.i18n.localize("ITEM-PILES.AddToPile.Cancel"),
                              callback: () => {
                                  resolve(false)
                              }
                         },
                    },
                    default: "cancel",
                    close: html => {
                        resolve(false);
                    }
                }).render(true);
            });

            if(!dropType) return;

        }

        if(dropType === "addToPile"){
            dropData.target = droppableDocuments[0];
        }else{
            dropData.position = { x, y };
        }

        return ItemPilesAPI.handleDrop(dropData);
    },

    _canvasReady(){
        pileManager.piles.forEach((pile) => pile._disableEvents());
        pileManager.piles = new Map();
        const tokens = canvas.tokens.placeables.filter((token) => token.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME));
        tokens.forEach(token => ItemPile.make(token));
    },

    _updatePile(doc){
        const pile = pileManager.piles.get(doc.uuid);
        if(!pile) return;
        pile.data = pile.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
    },

    _deletePile(doc){
        const pile = pileManager.piles.get(doc.uuid);
        if(!pile) return;
        pile.remove();
    }
}

Hooks.once('init', pileManager.initialize.bind(pileManager));

/**
 * Checks whether a given string is a valid UUID or not
 *
 * @param {string} inId
 * @returns {boolean}
 */
export function is_UUID(inId) {
    return typeof inId === "string"
        && inId.startsWith("Scene")
        && (inId.match(/\./g) || []).length
        && !inId.endsWith(".");
}

class ItemPilesAPI {

    /**
     * If not given a pile, this method creates an item pile at a location, then adds an item to it.
     *
     * If a target was provided, it will just add the item to that target.
     *
     * If an actor was provided, it will transfer the item from the actor to the target.
     *
     * @param {Actor|ItemPile|Boolean} actor
     * @param {Actor|ItemPile|Boolean} target
     * @param {Object|Boolean} position
     * @param {Object} itemData
     * @param {Number} quantity
     * @returns {Promise<ItemPile>}
     */
    static async handleDrop({
        actor = false,
        target = false,
        position = { x: 0, y: 0},
        itemData = false,
        quantity = 1
    }={}) {

        if(!target) {
            target = await ItemPilesAPI.createPile(position);
        }

        if(actor){
            await ItemPilesAPI.transferItem(actor, target, itemData._id, quantity)
        }else{
            await ItemPilesAPI.addItem(target, itemData, quantity);
        }

        return target;

    }

    static async createPile(position){

        let pileActor = game.actors.getName("Item Pile")
        if (!pileActor) {
            pileActor = await Actor.create({
                name: "Item Pile",
                type: "character",
                img: "icons/svg/mystery-man.svg"
            });
        }

        const tokenData = await pileActor.getTokenData();

        tokenData.update({
            ...position,
            "flags.item-piles.data": {},
            actorData: { items: {} }
        });

        const [ token ] = await canvas.scene.createEmbeddedDocuments("Token", [ tokenData ])

        await new Promise(resolve => setTimeout(resolve, 50));

        return ItemPile.make(token.object);

    }

    /**
     * Transfers an item from one actor to another, removing it or subtracting a number of quantity from the first
     * to the second one, deleting the item if its quantity reaches 0
     *
     * @param {Actor|ItemPile} fromActor        The actor or pile to transfer the item from
     * @param {Actor|ItemPile} toActor          The actor or pile to transfer the item to
     * @param {String} itemId                   The ID of the item to transfer
     * @param {Number} quantityToTransfer       How many of the item to transfer
     * @returns {Promise<Item>}                 The item that was transferred
     */
    static async transferItem(fromActor, toActor, itemId, quantityToTransfer = 1) {

        const actorItem = fromActor.items.get(itemId);

        if(!actorItem){
            lib.custom_warning(`Could not find item with id ${itemId} on actor ${fromActor.uuid}`, true)
            return;
        }

        const itemData = actorItem.toObject();

        const quantityRemoved = await ItemPilesAPI.removeItem(fromActor, itemId);

        return ItemPilesAPI.addItem(toActor, itemData, quantityRemoved);

    }

    /**
     * Subtracts the quantity of an item on an actor. If its quantity reaches 0, the item is removed from the actor.
     * @param {Actor} actor                     The actor to remove an item from
     * @param {String} itemId                   The itemId to remove from the actor
     * @param {Number} quantityToRemove         How many of the items to remove
     * @returns {Promise<Number>}               Returns how many items were removed from the actor
     */
    static async removeItem(actor, itemId, quantityToRemove = 1){

        const item = actor.items.get(itemId);

        if(!item){
            lib.custom_warning(`Could not delete item with id ${itemId} from actor ${actor.uuid}`, true)
            return;
        }

        const currentQuantity = item ? (getProperty(item.data, CONSTANTS.SETTINGS.QUANTITY) ?? 1) : 1;

        const newQuantity = Math.max(0, currentQuantity - quantityToRemove);

        if(newQuantity >= 1){

            await actorItem.update({ [CONSTANTS.SETTINGS.QUANTITY]: newQuantity });
            lib.debug(`Removed 1 "${item.name}" from actor ${actor.id}`)

        }else{

            quantityToRemove = currentQuantity;

            await item.delete();
            lib.debug(`Removed the last "${item.name}" from actor ${actor.id}`)

            if(actor.token) {
                const pile = pileManager.piles.get(actor.token.uuid);
                if (game.settings.get(CONSTANTS.MODULE_NAME, "deleteEmptyPiles") && pile && pile.items.size === 0) {
                    await pile.document.delete();
                }
            }

        }

        return quantityToRemove;

    }

    /**
     * Adds an item to an actor
     *
     * @param {Actor} actor
     * @param {Object} itemData
     * @param {Number} [quantityToAdd=1] quantityToAdd
     * @returns {Promise<Number>}
     */
    static async addItem(actor, itemData, quantityToAdd = 1){

        let item;
        for(const actorItem of Array.from(actor.items)){
            const diff = foundry.utils.diffObject(actorItem.toObject(), itemData);
            delete diff._id;
            if(diff?.data.equipped){
                delete diff.data.equipped;
                if(foundry.utils.isObjectEmpty(diff.data)){
                    delete diff.data;
                }
            }
            if(foundry.utils.isObjectEmpty(diff)){
                item = actorItem;
                break;
            }
        }

        const currentQuantity = item ? (getProperty(item.data, CONSTANTS.SETTINGS.QUANTITY) ?? 0) : 0;

        const newQuantity = currentQuantity + quantityToAdd;

        if(newQuantity > 1){
            await item.update({ [CONSTANTS.SETTINGS.QUANTITY]: newQuantity });
            lib.debug(`Added 1 "${item.name}" to pile ${actor.uuid} (now has ${newQuantity})`)
        }else{
            await actor.createEmbeddedDocuments('Item', [ itemData ])
            lib.debug(`Added "${itemData.name}" to pile ${actor.uuid}`)
        }

        return newQuantity;

    }

}

class ItemPile {

    /**
     * Sets up a managed item pile
     *
     * @param {Token} token
     */
    static make(token){
        const pile = new ItemPile(token);
        pileManager.piles.set(token.document.uuid, pile);
        return pile;
    }

    constructor(token) {
        this.token = token;
        this.data = this.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)
        this._clicked = false;
        this.setup();
    }

    get document(){
        return this.token.document;
    }

    get actor(){
        return this.token.actor
    }

    get uuid(){
        return this.document.uuid;
    }

    get items(){
        return this.actor.items;
    }

    async setup(){
        lib.debug(`Initialized pile: ${this.uuid}`);
        this._enableEvents();
    }

    remove(){
        lib.debug(`Removed pile: ${this.uuid}`);
        this._disableEvents();
        pileManager.piles.delete(this.uuid);
    }

    _enableEvents(){
        this.token.on('pointerdown', this.clicked.bind(this));
    }

    _disableEvents(){
        this.token.off('pointerdown', this.clicked.bind(this));
    }

    clicked(event){
        if(this._clicked){
            this._clicked = false;
            return this.doubleClicked();
        }
        this._clicked = true;
        setTimeout(() => { this._clicked = false }, 500);
    }

    doubleClicked(){
        lib.debug(`Clicked: ${this.uuid}`)
    }

}