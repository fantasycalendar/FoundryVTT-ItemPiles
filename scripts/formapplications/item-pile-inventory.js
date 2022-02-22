import CONSTANTS from "../constants.js";
import API from "../api.js";
import * as lib from "../lib/lib.js";
import { isPileInventoryOpenForOthers } from "../socket.js";
import HOOKS from "../hooks.js";
import { ItemPileConfig } from "./item-pile-config.js";
import DropCurrencyDialog from "./drop-currency-dialog.js";

export class ItemPileInventory extends FormApplication {

    /**
     *
     * @param pile
     * @param recipient
     * @param overrides
     */
    constructor(pile, recipient, overrides = {}) {
        super();
        this.pile = pile;
        this.recipient = recipient;
        this.items = [];
        this.currencies = [];
        this.deleted = false;
        this.overrides = overrides;
        this.pileData = lib.getItemPileData(this.pile);
        this.interactionId = randomID();
        Hooks.callAll(HOOKS.PILE.OPEN_INVENTORY, this, pile, recipient, overrides);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            closeOnSubmit: false,
            classes: ["sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-inventory.html`,
            width: 550,
            height: "auto",
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-item-drop-container" }],
        });
    }

    get title() {
        return this.pile.name;
    }

    /**
     *
     * @param inPileUuid
     * @param recipientUuid
     * @returns {Array<ItemPileInventory>[]|boolean}
     */
    static getActiveAppFromPile(inPileUuid, recipientUuid = false) {

        const openApps = Object.values(ui.windows).filter(app => {
            return app instanceof this
                && (app?.pile?.uuid === inPileUuid || app?.pile?.actor?.uuid === inPileUuid)
                && (!recipientUuid || (app?.recipient?.uuid === recipientUuid || app?.recipient?.actor?.uuid === recipientUuid))
        })

        if (openApps.length) {
            return openApps;
        }

        return false;
    }

    static async rerenderActiveApp(inPileUuid, deleted = false) {
        const openApps = ItemPileInventory.getActiveAppFromPile(inPileUuid);
        if (!openApps) return false;
        for (const app of openApps) {
            app.saveItems();
            app.saveCurrencies();
            app.deleted = app.deleted || deleted;
            app.render(true);
        }
        return true;
    }

    static async show(pile, recipient, overrides = {}) {
        const pileUuid = await lib.getUuid(pile);
        const recipientUuid = recipient ? await lib.getUuid(recipient) : false;

        let app = ItemPileInventory.getActiveAppFromPile(pileUuid, recipientUuid);
        if (app) {
            [app] = app;
            app.pileData = lib.getItemPileData(app.pile);
            return app.render(true, { focus: true });
        }

        const result = Hooks.call(HOOKS.PILE.PRE_OPEN_INVENTORY, pile, recipient, overrides);
        if (result === false) return;

        return new ItemPileInventory(pile, recipient, overrides).render(true);
    }

    async render(...args) {
        this.pileActor = this.pile?.actor ?? this.pile;
        this.recipientActor = this.recipient?.actor ?? this.recipient;
        this.editQuantities = !this.recipient && this.pile.isOwner && game.user.isGM;
        this.playerActors = game.actors.filter(actor => actor.isOwner && actor !== this.pileActor && actor.data.token.actorLink);
        super.render(...args);
    }

    /* -------------------------------------------- */

    /** @override */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        const canConfigure = game.user.isGM;
        if (canConfigure) {
            buttons = [
                {
                    label: "ITEM-PILES.Inspect.OpenSheet",
                    class: "item-piles-open-actor-sheet",
                    icon: "fas fa-user",
                    onclick: () => {
                        this.pileActor.sheet.render(true, { focus: true });
                    }
                },
                {
                    label: "ITEM-PILES.HUD.Configure",
                    class: "item-piles-configure-pile",
                    icon: "fas fa-box-open",
                    onclick: () => {
                        ItemPileConfig.show(this.pileActor);
                    }
                },
            ].concat(buttons);
        }
        return buttons
    }

    saveItems() {

        // Get all of the items on the actor right now
        const newItems = this.getPileItemData();

        // If there are none, stop displaying them in the UI
        if (!newItems.length) {
            this.items = [];
            return;
        }

        // Otherwise, loop through the old items
        for (let oldItem of this.items) {

            // If we find an item that was previously listed
            const foundItem = lib.findSimilarItem(newItems, oldItem);

            // We update the previously listed attribute to reflect this
            oldItem.quantity = foundItem ? foundItem.quantity : 0;
            oldItem.shareLeft = foundItem ? foundItem.shareLeft : 0;
            oldItem.currentQuantity = foundItem ? Math.min(oldItem.currentQuantity, foundItem.shareLeft) : 0;

            // We then remove it from the incoming list, as we already have it
            if (foundItem) {
                newItems.splice(newItems.indexOf(foundItem), 1)
            }

        }

        // Add the new items to the list
        this.items = this.items.concat(newItems);

    }

    getPileItemData() {
        return lib.getItemPileItemsForActor(this.pile, this.recipientActor);
    }

    saveCurrencies() {

        // Get all of the currencies on the actor right now
        const newCurrencies = this.getPileCurrenciesData();

        // If there are none, stop displaying them in the UI
        if (!newCurrencies.length) {
            this.currencies = [];
            return;
        }

        // Otherwise, loop through the old currencies
        for (let oldCurrency of this.currencies) {

            // If we find an currency that was previously listed
            const foundCurrency = newCurrencies.find(newCurrency => newCurrency.path === oldCurrency.path);

            // We update the previously listed currency to reflect this
            oldCurrency.quantity = foundCurrency ? foundCurrency.quantity : 0;
            oldCurrency.shareLeft = foundCurrency ? foundCurrency.shareLeft : 0;
            oldCurrency.currentQuantity = foundCurrency ? Math.min(oldCurrency.currentQuantity, foundCurrency.shareLeft) : 0;

            if (foundCurrency) {
                // We then remove it from the incoming list, as we already have it
                newCurrencies.splice(newCurrencies.indexOf(foundCurrency), 1)
            }

        }

        // Add the new currencies to the list
        this.currencies = this.currencies.concat(newCurrencies);

    }

    getPileCurrenciesData() {
        return lib.getItemPileCurrenciesForActor(this.pile, this.recipientActor);
    }

    _onDrop(event) {

        super._onDrop(event);

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        return API._dropData(canvas, data, { target: this.pile });

    }

    getData(options) {
        const data = super.getData(options);

        data.isDeleted = this.deleted;

        data.name = !data.isDeleted ? this.pile.name : "Nonexistent pile";

        if (this.deleted) {
            return data;
        }

        data.systemHasCurrencies = !!API.CURRENCIES.length;

        data.playerActors = this.playerActors;
        data.moreThanOneInspectableActors = data.playerActors.length > 1;

        data.overrides = this.overrides;
        data.editQuantities = this.editQuantities;
        data.hasRecipient = !!this.recipientActor;
        data.recipient = this.recipientActor;
        data.isContainer = false;

        const pileData = lib.getItemPileData(this.pile);

        data.items = this.items.length ? this.items : this.getPileItemData();
        this.items = data.items;

        data.currencies = this.currencies.length ? this.currencies : this.getPileCurrenciesData();
        this.currencies = data.currencies;

        data.isContainer = pileData.isContainer;
        data.hasItems = data.items.length > 0;
        data.hasCurrencies = data?.currencies?.length;
        data.canInspectItems = pileData.canInspectItems || game.user.isGM;

        data.isEmpty = !data?.hasItems && !data?.hasCurrencies;

        data.shareItemsEnabled = pileData.shareItemsEnabled;
        data.shareCurrenciesEnabled = pileData.shareCurrenciesEnabled;

        const sharingData = lib.getItemPileSharingData(this.pile);
        const num_players = lib.getPlayersForItemPile(this.pile).length;

        const hasSplittableItems = pileData.shareItemsEnabled && data.items && !!data.items?.find(item => {
            let quantity = item.quantity;
            if(sharingData.currencies){
                const itemSharingData = sharingData.currencies.find(sharingCurrency => sharingCurrency.path === item.path);
                if(itemSharingData){
                    quantity += itemSharingData.actors.reduce((acc, data) => acc + data.quantity, 0);
                }
            }
            return (quantity / num_players) >= 1;
        });

        const hasSplittableCurrencies = pileData.shareCurrenciesEnabled && data.currencies && !!data.currencies?.find(currency => {
            let quantity = currency.quantity;
            if(sharingData.currencies) {
                const currencySharingData = sharingData.currencies.find(sharingCurrency => sharingCurrency.path === currency.path);
                if (currencySharingData) {
                    quantity += currencySharingData.actors.reduce((acc, data) => acc + data.quantity, 0);
                }
            }
            return (quantity / num_players) >= 1;
        });

        data.buttons = [];

        if (!data.hasRecipient && data.editQuantities) {
            data.buttons.push({
                value: "update",
                icon: "fas fa-save",
                text: game.i18n.localize("ITEM-PILES.Defaults.Update")
            });
        }

        if (pileData.splitAllEnabled && (data.hasRecipient || game.user.isGM)) {

            let buttonText;
            if (pileData.shareItemsEnabled && pileData.shareCurrenciesEnabled) {
                buttonText = game.i18n.format("ITEM-PILES.Inspect.SplitAll", { num_players });
            } else if (pileData.shareItemsEnabled) {
                buttonText = game.i18n.format("ITEM-PILES.Inspect.SplitItems", { num_players });
            } else {
                buttonText = game.i18n.format("ITEM-PILES.Inspect.SplitCurrencies", { num_players });
            }

            data.buttons.push({
                value: "splitAll",
                icon: "far fa-handshake",
                text: buttonText,
                disabled: !num_players || !(hasSplittableItems || hasSplittableCurrencies),
                type: "button"
            });

        }

        if (pileData.isContainer && !this.overrides.remote) {
            data.buttons.push({
                value: "close",
                icon: "fas fa-box",
                text: game.i18n.localize("ITEM-PILES.Inspect.Close")
            })
        }

        if (data.hasRecipient && !pileData.shareItemsEnabled && !pileData.shareCurrenciesEnabled && pileData.takeAllEnabled) {

            data.buttons.push({
                value: "takeAll",
                icon: "fas fa-fist-raised",
                text: game.i18n.localize("ITEM-PILES.Inspect.TakeAll")
            });

        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let self = this;
        let timer;
        html.find('img').mouseenter(function () {
            const element = $(this);
            timer = setTimeout(function () {
                self.previewImage(html, element);
            }, 300);
        });

        html.find('img').mouseleave(function () {
            self.clearImage(html);
            clearTimeout(timer);
        });

        html.find('.item-piles-quantity').keyup(function () {
            if (!self.editQuantities) return;

            const itemId = $(this).closest(".item-piles-item-row").attr("data-item-id");

            const isItem = !!itemId;

            const currentQuantity = Number($(this).val());

            if (isItem) {
                const item = self.items.find(item => item.id === itemId)
                item.currentQuantity = currentQuantity;
                return;
            }

            const currencyPath = $(this).closest(".item-piles-item-row").attr('data-currency-path');
            const attribute = self.currencies.find(currency => currency.path === currencyPath)

            attribute.currentQuantity = currentQuantity;
        });

        html.find(".item-piles-name-container .item-piles-clickable").click(function () {
            const itemId = $(this).closest(".item-piles-item-row").attr('data-item-id');
            self.previewItem(itemId);
        })

        html.find(".item-piles-item-take-button").click(function () {
            const itemId = $(this).closest(".item-piles-item-row").attr('data-item-id');
            const inputQuantity = $(this).closest(".item-piles-item-row").find(".item-piles-quantity").val();
            self.takeItem(itemId, inputQuantity);
        })

        html.find(".item-piles-currency-take-button").click(function () {
            const currency = $(this).closest(".item-piles-item-row").attr('data-currency-path');
            const inputQuantity = $(this).closest(".item-piles-item-row").find(".item-piles-quantity").val();
            self.takeCurrency(currency, inputQuantity);
        })

        html.find('button[name="splitAll"]').click(function () {
            self.splitAll();
        })

        html.find('.item-piles-add-currency').click(function () {
            self.addCurrency();
        })

        if (this.playerActors.length > 1) {
            html.find('.item-piles-change-actor').click(function () {
                $(this).hide();
                let select = $(this).parent().find('.item-piles-change-actor-select');
                select.insertAfter($(this));
                select.css('display', 'inline-block');
            });

            html.find(".item-piles-change-actor-select").change(async function () {
                $(this).css('display', 'none');
                html.find('.item-piles-change-actor').show();
                const value = $(this).val();
                self.recipient = await fromUuid(value);
                if (!self.recipient) {
                    return;
                }
                self.render(true);
            });
        } else {
            const element = html.find('.item-piles-change-actor');
            const innerHTML = element.html();
            element.removeClass(".item-piles-change-actor")
                .replaceWith($('<span>' + innerHTML + '</span>'));
            html.find('.item-piles-change-actor-select').remove();
        }

        // Activate context menu
        this._contextMenu(html);
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _contextMenu(html) {
        ContextMenu.create(this, html, ".item-piles-item-row", this._getEntryContextOptions());
    }

    /* -------------------------------------------- */

    /**
     * Get the Macro entry context options
     * @returns {object[]}  The Macro entry context options
     * @private
     */
    _getEntryContextOptions() {
        return [
            {
                name: "JOURNAL.ActionShow",
                icon: '<i class="fas fa-eye"></i>',
                condition: (div) => {
                    return game.user.isGM && div.data("item-id");
                },
                callback: (div) => {
                    const item = this.pileActor.items.get(div.data("item-id"));
                    const popout = new ImagePopout(item.data.img, { title: item.name }).render(true);
                    popout.shareImage();
                }
            }
        ];
    }

    previewImage(html, element) {

        const src = element.prop("src");

        const pos = element.position();

        const imageContainer = html.find("#item-piles-preview-image");

        imageContainer.prop("src", src);

        let container = html.find("#item-piles-preview-container");

        setTimeout(() => {

            container.css({
                position: "absolute",
                top: (pos.top - (container.outerHeight() / 2)) + "px",
                left: (-container.outerWidth() - pos.left) + "px"
            }).fadeIn(150);

        }, 10)
    }

    clearImage(html) {
        html.find("#item-piles-preview-container").fadeOut(150);
    }

    async previewItem(itemId) {
        const item = this.pileActor.items.get(itemId);
        if (game.user.isGM || item.data.permission[game.user.id] === 3) {
            return item.sheet.render(true);
        }

        const cls = item._getSheetClass()
        const sheet = new cls(item, { editable: false })
        return sheet._render(true);
    }

    async takeItem(itemId, inputQuantity) {
        const item = this.pileActor.items.get(itemId);
        let quantity = lib.getItemQuantity(item);
        quantity = Math.min(inputQuantity, quantity);
        return API.transferItems(this.pile, this.recipient, [{
            _id: itemId,
            quantity
        }], { interactionId: this.interactionId });
    }

    async takeCurrency(attribute, inputQuantity) {
        let quantity = Number(getProperty(this.pileActor.data, attribute) ?? 0);
        quantity = Math.min(inputQuantity, quantity);
        await API.transferAttributes(this.pile, this.recipient, { [attribute]: quantity }, { interactionId: this.interactionId });
    }

    async splitAll() {
        await API.splitItemPileContents(this.pile);
    }

    async addCurrency() {

        if (this.recipient) {
            const currencyToAdd = await DropCurrencyDialog.query({
                target: this.pile,
                source: this.recipient
            })
            return API.transferAttributes(this.recipient, this.pile, currencyToAdd);
        }

        if (game.user.isGM) {
            const currencyToAdd = await DropCurrencyDialog.query({
                target: this.pile,
                source: this.recipient,
                includeAllCurrencies: true
            })
            return API.addAttributes(this.pile, currencyToAdd);
        }
    }

    async _updateObject(event, formData) {

        if (event.submitter.value === "update") {
            lib.custom_notify("Item Pile successfully updated.");
            await this.updatePile(formData);
            return this.render(true);
        }

        if (event.submitter.value === "takeAll") {
            API.transferEverything(this.pile, this.recipient, { interactionId: this.interactionId });
        }

        if (event.submitter.value === "close") {
            isPileInventoryOpenForOthers.query(this.pile).then((result) => {
                if (!result) API.closeItemPile(this.pile, this.recipient);
            });
        }

        return this.close();

    }

    updatePile(data) {

        const items = [];
        const attributes = {};

        for (let [type, quantity] of Object.entries(data)) {
            if (type.startsWith("currency-")) {
                const path = type.replace("currency-", "");
                if (quantity === this.currencies.find(currency => currency.path === path).quantity) continue;
                attributes[path] = quantity;
            } else {
                const itemId = type.replace("item-", "");
                if (itemId === this.items.find(item => item.id === itemId).itemId) continue;
                items.push({
                    _id: itemId,
                    [API.ITEM_QUANTITY_ATTRIBUTE]: quantity
                })
            }
        }

        const pileSharingData = lib.getItemPileSharingData(this.pile);

        const hasAttributes = !foundry.utils.isObjectEmpty(attributes);

        if (hasAttributes) {
            this.pileActor.update(attributes);
            if (pileSharingData?.currencies) {
                pileSharingData.currencies = pileSharingData.currencies.map(currency => {
                    if (attributes[currency.path] !== undefined) {
                        currency.actors = currency.actors.map(actor => {
                            actor.quantity = Math.max(0, Math.min(actor.quantity, attributes[currency.path]));
                            return actor;
                        })
                    }
                    return currency;
                })
            }
        }

        if (items.length) {
            this.pileActor.updateEmbeddedDocuments("Item", items);
            if (pileSharingData?.items) {
                pileSharingData.items = pileSharingData.items.map(item => {
                    const sharingItem = items.find(item => item._id === item.id);
                    if (sharingItem) {
                        item.actors = item.actors.map(actor => {
                            actor.quantity = Math.max(0, Math.min(actor.quantity, sharingItem.quantity));
                            return actor;
                        })
                    }
                    return item;
                })
            }
        }

        if (items.length || hasAttributes) {
            lib.updateItemPileSharingData(this.pile, pileSharingData);
        }

    }

}