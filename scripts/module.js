import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js"
import registerSettings from "./settings.js";
import { itemPileSocket, registerSocket, SOCKET_HANDLERS } from "./socket.js";
import API from "./api.js";

const pileManager = {

    piles: new Map(),

    initialize(){
        registerSettings();

        Hooks.once("socketlib.ready", registerSocket);
        Hooks.on("dropCanvasData", this._dropCanvasData.bind(this));
        Hooks.on("canvasReady", this._canvasReady.bind(this));
        Hooks.on("createToken", this._createPile.bind(this));
        Hooks.on("updateToken", this._updatePile.bind(this));
        Hooks.on("deleteToken", this._deletePile.bind(this));
        Hooks.on("getActorSheetHeaderButtons", this._insertItemPileHeaderButtons.bind(this));
    },

    _insertItemPileHeaderButtons(actorSheet, buttons){

        let obj = actorSheet.object;

        if(!obj.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)) return;

        buttons.unshift({
            label: "ITEM-PILES.Defaults.Configure",
            icon: "fas fa-clock",
            class: "item-piles-config",
            onclick: () => {
                new ItemPileConfig(obj).render(true);
            }
        })
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

        let droppableDocuments = lib.getTokensAtLocation({ x, y })
            .filter(actor => actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME));

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

        return API.handleDrop(dropData);
    },

    _canvasReady(){
        pileManager.piles.forEach((pile) => pile._disableEvents());
        pileManager.piles = new Map();
        const tokens = canvas.tokens.placeables.filter((token) => token.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME));
        tokens.forEach(token => ItemPile.make(token.document));
    },

    _createPile(doc){
        if(!doc.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)) return;
        ItemPile.make(doc);
    },

    _updatePile(doc, changes){
        const pile = pileManager.piles.get(doc.uuid);
        if(!pile) return;
        pile.updated();
    },

    _deletePile(doc){
        const pile = pileManager.piles.get(doc.uuid);
        if(!pile) return;
        pile.remove();
    }
}

Hooks.once('init', pileManager.initialize.bind(pileManager));

class ItemPile {

    /**
     * Sets up a managed item pile
     *
     * @param {TokenDocument} tokenDocument
     */
    static make(tokenDocument){
        const pile = new ItemPile(tokenDocument);
        pileManager.piles.set(tokenDocument.uuid, pile);
        return pile;
    }

    constructor(tokenDocument) {
        this.tokenDocument = tokenDocument;
        this._clicked = false;
        this._data = this.tokenDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        this._preloaded = new Set();
        this._setup();
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
            if(this._preloaded.has(value) || !value) continue;
            if(key.toLowerCase().includes("image")){
                loadTexture(value);
                lib.debug(`Preloaded image: ${value}`);
            }else if(key.toLowerCase().includes("sound")){
                AudioHelper.preloadSound(value);
                lib.debug(`Preloaded sound: ${value}`);
            }
            this._preloaded.add(value);
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
                img = data.openedImage;
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

    remove(){
        pileManager.piles.delete(this.tokenDocument.uuid);
        lib.debug(`Removed pile: ${this.tokenDocument.uuid}`);
    }

    async updated(){
        lib.debug(`Updated pile: ${this.tokenDocument.uuid}`);
        this._data = this.tokenDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        await lib.wait(50);
        this._enableEvents();
        this._preloadTextures();
    }

    get items(){
        return this.tokenDocument.actor.items;
    }

    async update(inData = false){
        if(!inData) inData = this._data;
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_PILE, this.tokenDocument.uuid, {
            "img": this._getImage(inData),
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

class ItemPileConfig extends FormApplication {

    constructor(actor) {
        super();
        this.document = actor?.token ?? actor;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.Defaults.Title"),
            classes: ["sheet", "token-sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-config.html`,
            width: 430,
            height: "auto"
        });
    }

    async getData(options) {
        const data = super.getData(options);
        data.pile_data = this.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        return data;
    }

    async _updateObject(event, formData) {
        const data = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, formData);

        if (this.document instanceof TokenDocument) {
            const pile = pileManager.piles.get(this.document.uuid);
            return pile.update(data);
        }

        return this.document.update({
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data,
            [`token.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data
        });

    }

}
