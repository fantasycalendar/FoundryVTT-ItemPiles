import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { managedPiles, preloadedImages } from "./module.js";
import { ItemPileInventory } from "./formapplications/itemPileInventory.js";

export default class ItemPile {

    /**
     * Sets up a managed item pile
     *
     * @param {TokenDocument} tokenDocument
     * @param {object} settings
     */
    static make(tokenDocument, settings = {}){
        const pile = new ItemPile(tokenDocument, settings);
        managedPiles.set(tokenDocument.uuid, pile);
        return pile;
    }

    constructor(tokenDocument, settings = {}) {
        this.tokenDocument = tokenDocument;
        this._clicked = false;
        this._data = this.tokenDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME) ?? settings;
        this._enableEvents();
        this._preloadTextures();
        lib.debug(`Initialized pile: ${this.tokenDocument.uuid}`);
    }

    get actor(){
        return this.tokenDocument.actor;
    }

    _preloadTextures(){
        if(!game.settings.get(CONSTANTS.MODULE_NAME, "preloadFiles")) return;
        for(let [key, value] of Object.entries(this._data)){
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

    _enableEvents(){
        if(!lib.object_has_event(this.tokenDocument.object, "pointerdown", this.clicked.bind(this))){
            this.tokenDocument.object.on('pointerdown', this.clicked.bind(this));
        }
    }

    _disableEvents(){
        this.tokenDocument.object.off('pointerdown', this.clicked.bind(this));
    }

    _getImage(data){

        let img;
        if(data.isContainer){

            img = data.lockedImage || data.closedImage || data.openedImage || data.emptyImage;

            if(data.locked && data.lockedImage){
                img = data.lockedImage;
            }else if(data.closed && data.closedImage){
                img = data.closedImage;
            }else if(data.openedImage && this.items.size > 0) {
                img = data.openedImage;
            }else if(data.emptyImage){
                img = data.emptyImage;
            }

        }else if(data.displayOne && this.items.size === 1){

            img = Array.from(this.items)[0].data.img;

        }

        if(!img) {
            img = this.tokenDocument.actor.data.img;
        }

        return img;

    }

    _getScale(data){
        let scale = this.tokenDocument.actor.data.token.scale;
        if(data.overrideSingleItemScale && this.items.size === 1){
            scale = data.singleItemScale;
        }
        return scale;
    }

    remove(){
        managedPiles.delete(this.tokenDocument.uuid);
        lib.debug(`Removed pile: ${this.tokenDocument.uuid}`);
        Hooks.callAll('itemPileDeleted', this.tokenDocument, this.tokenDocument.uuid)
    }

    async updated(){
        const newData = this.tokenDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        this._fireHooks(newData);
        this._data = newData;
        await lib.wait(50);
        this._enableEvents();
        this._preloadTextures();
    }

    _fireHooks(newData){

        const diff = foundry.utils.diffObject(this._data, newData);

        if(foundry.utils.isObjectEmpty(diff)) return;

        Hooks.callAll('updateItemPile', this.tokenDocument, diff, this.tokenDocument.uuid)

        if(newData.isContainer) {

            if (!this._data.closed && newData.closed) {
                Hooks.callAll("closedItemPile", this.tokenDocument, this.tokenDocument.uuid)
            }
            if (!this._data.locked && newData.locked) {
                Hooks.callAll("lockedItemPile", this.tokenDocument, this.tokenDocument.uuid)
            }
            if (this._data.locked && !newData.locked) {
                Hooks.callAll("unlockedItemPile", this.tokenDocument, this.tokenDocument.uuid)
            }
            if (this._data.closed && !newData.closed) {
                Hooks.callAll("openedItemPile", this.tokenDocument, this.tokenDocument.uuid)
            }

        }

    }

    get items(){
        return this.tokenDocument.actor.items;
    }

    async update(inData = false){
        if(!inData) inData = this._data;
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_DOCUMENT, this.tokenDocument.uuid, {
            "img": this._getImage(inData),
            "scale": this._getScale(inData),
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: inData,
            [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: inData
        });
    }

    get isContainer(){
        return this._data.isContainer;
    }

    get isLocked(){
        return this.isContainer && this._data.locked;
    }

    get isClosed(){
        return this.isContainer && this._data.closed;
    }

    async lock(){
        const data = foundry.utils.duplicate(this._data);
        data.closed = true;
        data.locked = true;
        return this.update(data);
    }

    async unlock(){
        const data = foundry.utils.duplicate(this._data);
        data.locked = false;
        if(data.unlockedSound){
            AudioHelper.play({
                src: data.unlockedSound,
                volume: 0.6
            }, true)
        }
        return this.update(data);
    }

    async toggleLocked(){
        if(this.isLocked){
            return this.unlock();
        }
        return this.lock();
    }

    async open(){
        const data = foundry.utils.duplicate(this._data);
        data.closed = false;
        data.locked = false;
        if(data.openSound){
            AudioHelper.play({
                src: data.openSound,
                volume: 0.6
            }, true)
        }
        return this.update(data);
    }

    async close(){
        const data = foundry.utils.duplicate(this._data);
        data.closed = true;
        if(data.closeSound){
            AudioHelper.play({
                src: data.closeSound,
                volume: 0.6
            }, true)
        }
        return this.update(data);
    }

    async toggleClosed(){
        if(this.isClosed){
            return this.open();
        }
        return this.close();
    }

    rattle(){
        if(this._data.lockedSound){
            AudioHelper.play({
                src: this._data.lockedSound,
                volume: 0.6
            })
        }
    }

    clicked(event){
        if(this._clicked){
            this._clicked = false;
            return this.doubleClicked();
        }
        this._clicked = true;
        setTimeout(() => { this._clicked = false }, 500);
    }

    async doubleClicked(){

        lib.debug(`Clicked: ${this.tokenDocument.uuid}`);

        let controlledToken = canvas.tokens.controlled?.[0] ?? false;

        if(!controlledToken || controlledToken.document === this.tokenDocument) return;

        const distance = Math.floor(lib.distance_between_rect(this.tokenDocument.object, controlledToken) / canvas.grid.size)+1;

        if(this._data.distance < distance) return;

        if(this.isLocked){
            return this.rattle();
        }

        if(this.isClosed){
            await this.open();
        }

        new ItemPileInventory(this.actor, controlledToken.actor).render(true);

    }

}
