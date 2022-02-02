import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";
import { hotkeyState } from "../hotkeys.js";
import DropCurrencyDialog from "./drop-currency-dialog.js";

export class TradingApp extends FormApplication {

    constructor(options) {
        super();
        this.actor = options.actor;
        this.trader = options.trader;
        this.traderUserID = options.traderUserID;

        this.actorItems = [];
        this.actorCurrencies = [];
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

    get title(){
        return `Trade between ${this.actor.name} and ${this.trader.name}`
    }

    async _onDrop(event) {

        super._onDrop(event);

        let dropData;
        try {
            dropData = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        if (dropData.type !== "Item") return;

        const itemData = dropData.data;

        if (!dropData.actorId && !game.user.isGM) {
            return lib.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
        }

        const disallowedType = lib.isItemInvalid(this.trader, itemData);
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

        this.actorItems.push({
            id: itemData._id,
            name: itemData.name,
            img: itemData?.img ?? "",
            quantity: 1,
            maxQuantity: lib.getItemQuantity(itemData)
        });

        this.render(true);

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
                const item = self.actorItems.find(item => item.id === itemId);
                quantity = Math.min(value, item.maxQuantity);
            }else{
                const currencyPath = parent.attr("data-currency");
                const currency = self.actorCurrencies.find(currency => currency.path === currencyPath);
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
        })

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

    setItemQuantity(itemId, quantity){
        const item = this.actorItems.find(item => item.id === itemId);
        item.quantity = quantity;
        if(!quantity){
            this.actorItems.splice(this.actorItems.indexOf(item), 1);
        }
    }

    setCurrencyQuantity(currencyPath, quantity){
        const currency = this.actorCurrencies.find(currency => currency.path === currencyPath);
        currency.quantity = quantity;
        if(!quantity){
            this.actorCurrencies.splice(this.actorCurrencies.indexOf(quantity), 1);
            this.setPosition()
        }
    }

    async addCurrency(){
        const currencyToAdd = await DropCurrencyDialog.query({
            dropper: this.actor,
            itemPile: this.trader
        });
        if(!currencyToAdd) return;

        const currencies = lib.getActorCurrencies(this.actor);

        Object.entries(currencyToAdd).forEach(entry => {

            const existingCurrency = this.actorCurrencies.find(currency => currency.path === entry[0]);

            if(existingCurrency){
                existingCurrency.quantity = entry[1];
                return;
            }

            const currency = currencies.find(currency => currency.path === entry[0]);

            this.actorCurrencies.push({
                path: entry[0],
                quantity: entry[1],
                name: currency.name,
                img: currency.img,
                maxQuantity: currency.quantity
            });

        });

        this.render(true);
    }

    getData(options) {
        const data = super.getData(options);

        data.actor = {
            name: this.actor.name,
            img: this.actor.img,
            items: this.actorItems,
            currencies: this.actorCurrencies
        };

        data.actor.hasItems = !!data.actor.items.length;

        data.trader = {
            name: this.trader.name,
            img: this.trader.img,
            items: [],
            currencies: []
        };

        return data;
    }


}