import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import { managedPiles, preloadedImages } from "./module.js";

export default class ItemPile {

    /**
     * Sets up a managed item pile
     *
     * @param {TokenDocument} tokenDocument
     */
    static make(tokenDocument){
        const pile = new ItemPile(tokenDocument);
        managedPiles.set(tokenDocument.uuid, pile);
        return pile;
    }

    constructor(tokenDocument) {
        this.tokenDocument = tokenDocument;
        this._clicked = false;
        this._data = this.tokenDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        this._setup();
    }

    get actor(){
        return this.tokenDocument.actor;
    }

    async _setup(){
        await this.update();
        await lib.wait(50);
        this._enableEvents();
        this._preloadTextures();
        lib.debug(`Initialized pile: ${this.tokenDocument.uuid}`);
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
            if(data.locked && data.lockedImage){
                img = data.lockedImage;
            }else if(!data.closed && data.openedImage){
                img = this.items.size === 0 ? data.emptyImage : data.openedImage;
            }else if(data.closedImage) {
                img = data.closedImage;
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
    }

    async updated(){
        lib.debug(`Updated pile: ${this.tokenDocument.uuid}`);
        this._data = this.tokenDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        await lib.wait(650);
        this._enableEvents();
        this._preloadTextures();
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
        this._data.closed = true;
        this._data.locked = true;
        return this.update();
    }

    async unlock(){
        this._data.locked = false;
        if(this._data.unlockedSound){
            AudioHelper.play({
                src: this._data.unlockedSound,
                volume: 0.6
            }, true)
        }
        return this.update();
    }

    async toggleLocked(){
        if(this.isLocked){
            return this.unlock();
        }
        return this.lock();
    }

    async open(){
        this._data.closed = false;
        this._data.locked = false;
        if(this._data.openSound){
            AudioHelper.play({
                src: this._data.openSound,
                volume: 0.6
            }, true)
        }
        return this.update();
    }

    async close(){
        this._data.closed = true;
        if(this._data.closeSound){
            AudioHelper.play({
                src: this._data.closeSound,
                volume: 0.6
            }, true)
        }
        return this.update();
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

    }

}
