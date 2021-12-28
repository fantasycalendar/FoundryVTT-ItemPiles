import CONSTANTS from "./constants.js";
import * as lib from "./lib/lib.js"
import registerSettings from "./settings.js";
import { itemPileSocket, registerSocket, SOCKET_HANDLERS } from "./socket.js";
import ItemPilesAPI from "./api.js";

const pileManager = {

    piles: new Map(),

    initialize(){
        registerSettings();

        Hooks.once("socketlib.ready", registerSocket);
        Hooks.on("dropCanvasData", this._dropCanvasData.bind(this));
        Hooks.on("canvasReady", this._canvasReady.bind(this));
        Hooks.on("updateToken", this._updatePile.bind(this));
        Hooks.on("deleteToken", this._deletePile.bind(this));
        Hooks.on("getActorSheetHeaderButtons", this._insertItemPileHeaderButtons.bind(this));
    },

    _insertItemPileHeaderButtons(actorSheet, buttons){

        let obj = actorSheet.object;

        if(!obj.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME)) return;

        if(obj.token){
            obj = pileManager.piles.get(obj.token.uuid)
        }

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

        return ItemPilesAPI.handleDrop(dropData);
    },

    _canvasReady(){
        pileManager.piles.forEach((pile) => pile._disableEvents());
        pileManager.piles = new Map();
        const tokens = canvas.tokens.placeables.filter((token) => token.actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME));
        tokens.forEach(token => ItemPile.make(token));
    },

    _updatePile(doc, changes){
        const pile = pileManager.piles.get(doc.uuid);
        if(!pile || !changes?.actorData?.flags) return;
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
     * @param {Token} token
     */
    static make(token){
        const pile = new ItemPile(token);
        pileManager.piles.set(token.document.uuid, pile);
        return pile;
    }

    constructor(token) {
        this.token = token;
        this._clicked = false;
        this._data = this.token.actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        this.setup();
    }

    async setup(){
        lib.debug(`Initialized pile: ${this.token.document.uuid}`);
        await this.update();
        this._enableEvents();
    }

    remove(){
        lib.debug(`Removed pile: ${this.token.document.uuid}`);
        this._disableEvents();
        pileManager.piles.delete(this.token.document.uuid);
    }

    _enableEvents(){
        this.token.on('pointerdown', this.clicked.bind(this));
    }

    _disableEvents(){
        this.token.off('pointerdown', this.clicked.bind(this));
    }

    async updated(){
        lib.debug(`Updated pile: ${this.token.document.uuid}`);
        this._data = this.token.actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        await lib.wait(50);
        this._enableEvents();
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
            img = this.token.actor.data.img;
        }

        return img;

    }

    get items(){
        return this.token.actor.items;
    }

    async update(inData = false){
        if(!inData) inData = this._data;
        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_PILE, this.token.document.uuid, {
            "img": this._getImage(inData),
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

        lib.debug(`Clicked: ${this.token.document.uuid}`);

        let controlledToken = canvas.tokens.controlled?.[0] ?? false;

        if(!controlledToken || controlledToken === this.token) return;

        const distance = lib.distance_between(this.token, controlledToken) / canvas.grid.size;

        if(distance > this._data.distance) return;

        if(this.isLocked){
            return this.rattle();
        }

        if(this.isClosed){
            await this.open();
        }

    }

}

class ItemPileConfig extends FormApplication {
    constructor(object) {
        super();
        this.actor = object?.token?.actor ?? object;
        this.pile = object;
        this.isPile = object instanceof ItemPile;
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
        data.pile_data = this.actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);
        return data;
    }

    async _updateObject(event, formData) {
        const data = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, formData);
        if(this.isPile){
            await this.pile.update(data);
        }else{
            await this.actor.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME, data);
        }
    }

}
