import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";
import { hotkeyState } from "../hotkeys.js";
import DropCurrencyDialog from "./drop-currency-dialog.js";
import { itemPileSocket, SOCKET_HANDLERS } from "../socket.js";

export class TradingApp extends FormApplication {

    constructor(leftTrader, rightTrader, publicTradeId, privateTradeId = false) {
        super();

        this.leftTraderActor = leftTrader.actor;
        this.leftTraderUser = leftTrader.user;
        this.leftTraderActorItems = [];
        this.leftTraderActorCurrencies = [];
        this.leftTraderAccepted = false;

        this.rightTraderActor = rightTrader.actor;
        this.rightTraderUser = rightTrader.user;
        this.rightTraderActorItems = [];
        this.rightTraderActorCurrencies = [];
        this.rightTraderAccepted = false;

        this.users = [this.leftTraderUser.id, this.rightTraderUser.id];

        this.publicTradeId = publicTradeId;
        this.privateTradeId = privateTradeId;
    }


    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["dialog", "item-piles-trading-sheet"],
            template: `${CONSTANTS.PATH}templates/trading-app.html`,
            width: 800,
            height: "auto",
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-item-drop-container" }],
        });
    }

    static getAppByPublicTradeId(publicTradeId){
        for(const app of Object.values(ui.windows)){
            if(app instanceof TradingApp && app?.publicTradeId === publicTradeId){
                return app;
            }
        }
        return false;
    }

    get title(){
        return `Trade between ${this.leftTraderActor.name} and ${this.rightTraderActor.name}`
    }

    async _onDrop(event) {

        if(game.user !== this.leftTraderUser) return;

        super._onDrop(event);

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        if (data.type !== "Item") return;

        if (!data.actorId) {
            if (!game.user.isGM) return lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
        }

        if(data.actorId && data.actorId !== this.leftTraderActor.id){
            throw lib.custom_error(`You cannot drop items into the trade UI from a different actor than ${this.leftTraderActor.name}!`)
        }

        let itemData;
        if(data.pack){
            const uuid = `Compendium.${data.pack}.${data.id}`;
            const item = await fromUuid(uuid);
            itemData = item.toObject();
        }else if(data.id){
            itemData = game.items.get(data.id)?.toObject();
        }else{
            itemData = data.data;
        }

        if (!itemData) {
            console.error(data);
            throw lib.custom_error("Something went wrong when dropping this item!")
        }

        const disallowedType = lib.isItemInvalid(this.rightTraderActor, itemData);
        if (disallowedType) {
            if (!game.user.isGM) {
                return lib.custom_warning(game.i18n.format("ITEM-PILES.Errors.DisallowedItemTrade", { type: disallowedType }), true)
            }
            if (!hotkeyState.shiftDown) {
                const force = await Dialog.confirm({
                    title: game.i18n.localize("ITEM-PILES.Dialogs.TradeTypeWarning.Title"),
                    content: `<p class="item-piles-dialog">${game.i18n.format("ITEM-PILES.Dialogs.TradeTypeWarning.Content", { type: disallowedType })}</p>`,
                    defaultYes: false
                });
                if (!force) {
                    return false;
                }
            }
        }

        return this.addItem(itemData, !!data.actorId);

    }

    async addItem(newItem, limitQuantity = true){

        const item = lib.findSimilarItem(this.leftTraderActorItems, newItem)

        if(!item){
            this.leftTraderActorItems.push({
                id: newItem._id,
                name: newItem.name,
                img: newItem?.img ?? "",
                quantity: 1,
                maxQuantity: limitQuantity ? lib.getItemQuantity(newItem) : Infinity,
                data: newItem
            })
        }else{
            if(item.quantity >= lib.getItemQuantity(newItem)) return;
            item.quantity += Math.min(item.quantity+1, lib.getItemQuantity(newItem));
        }

        await itemPileSocket.executeForUsers(SOCKET_HANDLERS.PRIVATE.TRADE_UPDATE_ITEMS, this.users, this.privateTradeId, game.user.id, this.leftTraderActorItems);
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_ITEMS, this.publicTradeId, game.user.id, this.leftTraderActorItems);

    }

    static _updateItems(publicTradeId, userId, itemData){
        const app = TradingApp.getAppByPublicTradeId(publicTradeId);
        if(app){
            return app.updateItems(userId, itemData);
        }
        return false;
    }

    updateItems(userId, inItems){
        if(userId === this.leftTraderUser.id){
            this.leftTraderActorItems = inItems;
        }else if(userId === this.rightTraderUser.id){
            this.rightTraderActorItems = inItems;
        }
        this.leftTraderAccepted = false;
        this.rightTraderAccepted = false;
        this.render(true);
    }

    async addCurrency(){

        const currencyToAdd = await DropCurrencyDialog.query({
            dropper: this.leftTraderActor,
            target: this.rightTraderActor,
            existingCurrencies: this.leftTraderActorCurrencies,
            title: game.i18n.localize("ITEM-PILES.Trade.AddCurrency.Title"),
            content: game.i18n.format("ITEM-PILES.Trade.AddCurrency.Content", { trader_actor_name: this.rightTraderActor.name }),
            button: game.i18n.localize("ITEM-PILES.Trade.AddCurrency.Label")
        });
        if(!currencyToAdd) return;

        const currencies = lib.getActorCurrencies(this.leftTraderActor);

        Object.entries(currencyToAdd).forEach(entry => {

            const existingCurrency = this.leftTraderActorCurrencies.find(currency => currency.path === entry[0]);

            if(existingCurrency){
                existingCurrency.quantity = entry[1];
                return;
            }

            const currency = currencies.find(currency => currency.path === entry[0]);

            this.leftTraderActorCurrencies.push({
                path: entry[0],
                quantity: entry[1],
                name: currency.name,
                img: currency.img,
                maxQuantity: currency.quantity,
                index: currency.index
            });

        });

        this.leftTraderActorCurrencies.sort((a, b) => a.index - b.index);

        await itemPileSocket.executeForUsers(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_CURRENCIES, this.users, this.privateTradeId, game.user.id, this.leftTraderActorCurrencies);
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_CURRENCIES, this.publicTradeId, game.user.id, this.leftTraderActorCurrencies);

    }

    static _updateCurrencies(publicTradeId, userId, currencyData){
        const app = TradingApp.getAppByPublicTradeId(publicTradeId);
        if(app){
            return app.updateCurrencies(userId, currencyData);
        }
        return false;
    }

    updateCurrencies(userId, inCurrencies){
        if(userId === this.leftTraderUser.id){
            this.leftTraderActorCurrencies = inCurrencies;
        }else if(userId === this.rightTraderUser.id){
            this.rightTraderActorCurrencies = inCurrencies;
        }
        this.leftTraderAccepted = false;
        this.rightTraderAccepted = false;
        this.render(true);
    }

    static _setAcceptedState(publicTradeId, userId, state){
        const app = TradingApp.getAppByPublicTradeId(publicTradeId);
        if(app){
            return app.setAcceptedState(userId, state);
        }
        return false;
    }

    setAcceptedState(userId, state){
        if(userId === this.leftTraderUser.id){
            this.leftTraderAccepted = state;
        }else if(userId === this.rightTraderUser.id){
            this.rightTraderAccepted = state;
        }
        this.render(true);
    }

    static _tradeAccepted(publicTradeId){
        const app = TradingApp.getAppByPublicTradeId(publicTradeId);
        if(app){
            return app.close({ accepted: true });
        }
        return false;
    }

    static _tradeClosed(publicTradeId, userId){
        const app = TradingApp.getAppByPublicTradeId(publicTradeId);
        if(app){
            return app.close({ userId });
        }
        return false;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let self = this;

        html.find('.item-piles-item-row .item-piles-quantity').keyup(function(event){

            const parent = $(this).closest(".item-piles-item-row");

            let quantity;
            const value = Number($(this).val());
            if(parent.attr('data-type') === "item") {
                const itemId = parent.attr("data-item");
                const item = self.leftTraderActorItems.find(item => item.id === itemId);
                quantity = Math.min(value, item.maxQuantity);
            }else{
                const currencyPath = parent.attr("data-currency");
                const currency = self.leftTraderActorCurrencies.find(currency => currency.path === currencyPath);
                quantity = Math.min(value, currency.maxQuantity);
            }

            $(this).val(quantity);

            if(event.key === "Enter"){
                parent.find(".item-piles-confirm-quantity").click();
            }

        });

        html.find(".item-piles-quantity-text").dblclick(function(){
            self.resetInputs();
            const parent = $(this).closest(".item-piles-item-row");
            $(this).hide();
            parent.find(".item-piles-quantity-container").show();
            parent.find(".item-piles-confirm-quantity").show();
            const quantityInput = parent.find(".item-piles-quantity");
            quantityInput.focus().select();
        });

        html.find(".item-piles-confirm-quantity").click(function(){
            const parent = $(this).closest(".item-piles-item-row");
            $(this).hide();
            parent.find(".item-piles-quantity-container").hide();
            parent.find(".item-piles-quantity-text").show();
            const value = Number(parent.find(".item-piles-quantity").val())

            if(value === 0){
                parent.remove();
            }

            parent.find(".item-piles-quantity-text").text(value);

            if(parent.attr('data-type') === "item"){
                return self.setItemQuantity(parent.attr('data-item'), value)
            }

            return self.setCurrencyQuantity(parent.attr('data-currency'), value)

        })

        html.find(".item-piles-add-currency").click(() => {
            this.addCurrency()
        });

        html.find(".item-piles-accept-button").click(() => {
            itemPileSocket.executeForUsers(SOCKET_HANDLERS.PRIVATE.TRADE_STATE, this.users, this.privateTradeId, game.user.id, !this.leftTraderAccepted);
            itemPileSocket.executeForEveryone(SOCKET_HANDLERS.PUBLIC.TRADE_STATE, this.publicTradeId, game.user.id, !this.leftTraderAccepted);
        });

    }

    resetInputs(){
        this.element.find(".item-piles-confirm-quantity").each(function(){
            const parent = $(this).closest(".item-piles-item-row");
            $(this).hide();
            parent.find(".item-piles-quantity-container").hide();
            const quantityText = parent.find(".item-piles-quantity-text");
            quantityText.show();
            parent.find(".item-piles-quantity").val(quantityText.text());
        });
    }

    async setItemQuantity(itemId, quantity){
        const item = this.leftTraderActorItems.find(item => item.id === itemId);
        item.quantity = quantity;
        if(!quantity){
            this.leftTraderActorItems.splice(this.leftTraderActorItems.indexOf(item), 1);
        }
        await itemPileSocket.executeForusers(SOCKET_HANDLERS.PRIVATE.TRADE_STATE, this.users, this.privateTradeId, game.user.id, this.leftTraderActorItems);
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_ITEMS, this.publicTradeId, game.user.id, this.leftTraderActorItems);
    }

    async setCurrencyQuantity(currencyPath, quantity){
        const currency = this.leftTraderActorCurrencies.find(currency => currency.path === currencyPath);
        currency.quantity = quantity;
        if(!quantity){
            this.leftTraderActorCurrencies.splice(this.leftTraderActorCurrencies.indexOf(quantity), 1);
            this.setPosition()
        }
        await itemPileSocket.executeForusers(SOCKET_HANDLERS.PRIVATE.TRADE_UPDATE_CURRENCIES, this.users, this.privateTradeId, game.user.id, this.leftTraderActorCurrencies);
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_CURRENCIES, this.publicTradeId, game.user.id, this.leftTraderActorCurrencies);
    }

    getData(options) {
        const data = super.getData(options);

        data.leftActor = {
            name: this.leftTraderActor.name,
            img: this.leftTraderActor.img,
            items: this.leftTraderActorItems,
            currencies: this.leftTraderActorCurrencies,
            hasItems: !!this.leftTraderActorItems.length,
            accepted: this.leftTraderAccepted
        };

        data.leftActor.hasItems = !!data.leftActor.items.length;

        data.rightActor = {
            name: this.rightTraderActor.name,
            img: this.rightTraderActor.img,
            items: this.rightTraderActorItems,
            currencies: this.rightTraderActorCurrencies,
            hasItems: !!this.rightTraderActorItems.length,
            accepted: this.rightTraderAccepted
        };

        return data;
    }

    async close(options){
        if(!options?.accepted){
            if(!options?.userId && (this.leftTraderUser.id === game.user.id || this.rightTraderUser.id === game.user.id)) {
                itemPileSocket.executeForOthers(SOCKET_HANDLERS.PUBLIC.TRADE_CLOSED, this.publicTradeId, game.user.id);
                Dialog.prompt({
                    title: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
                    content: lib.dialogLayout({ message: game.i18n.localize("ITEM-PILES.Trade.Closed.You") }),
                    callback: () => {},
                    rejectClose: false
                })
            }else{
                if(this.leftTraderUser.id === game.user.id && options?.userId === this.rightTraderUser.id){
                    Dialog.prompt({
                        title: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
                        content: lib.dialogLayout({ message: game.i18n.format("ITEM-PILES.Trade.Closed.Them", { user_name: this.rightTraderUser.name }) }),
                        callback: () => {},
                        rejectClose: false
                    })
                }else{
                    lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Closed.Sometime"), true)
                }
            }
        }
        return super.close(options);
    }


}