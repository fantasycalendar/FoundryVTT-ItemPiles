import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";
import { hotkeyState } from "../hotkeys.js";
import DropCurrencyDialog from "./drop-currency-dialog.js";
import { itemPileSocket, SOCKET_HANDLERS } from "../socket.js";
import { TradeAPI } from "../trade-api.js";
import API from "../api.js";
import { getMerchantItemsForActor } from "../lib/lib.js";
import HOOKS from "../hooks.js";
import { ItemPileConfig } from "./item-pile-config.js";

export class MerchantApp extends FormApplication {

    constructor(merchant, buyer = false) {
        super();

        this.merchant = merchant?.actor ?? merchant;
        this.buyer = buyer?.actor ?? buyer;

        this.merchantItems = {};

    }

    /**
     *
     * @param inPileUuid
     * @param buyerUuid
     * @returns {Array<ItemPileInventory>[]|boolean}
     */
    static getActiveAppFromPile(inPileUuid, buyerUuid = false) {

        const openApps = Object.values(ui.windows).filter(app => {
            return app instanceof this
                && (app?.merchant?.uuid === inPileUuid || app?.merchant?.actor?.uuid === inPileUuid)
                && (!buyerUuid || (app?.buyer?.uuid === buyerUuid || app?.buyer?.actor?.uuid === buyerUuid))
        })

        if (openApps.length) {
            return openApps;
        }

        return false;
    }

    static async show(merchant, buyer = false) {
        const merchantUuid = lib.getUuid(merchant);
        const buyerUuid = buyer ? lib.getUuid(buyer) : false;

        let app = this.getActiveAppFromPile(merchantUuid, buyerUuid);
        if (app) {
            return app[0].render(true, { focus: true });
        }

        return new this(merchant, buyer).render(true);
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `${CONSTANTS.PATH}templates/merchant-app.html`,
            classes: ["dialog", "item-piles-merchant-sheet"],
            width: 800,
            height: 700,
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-item-drop-container" }],
            tabs: [{ navSelector: ".tabs", contentSelector: ".tab-body", initial: "description" }],
            closeOnSubmit: false,
            resizable: true
        });
    }

    get title(){
        return `Merchant: ${this.merchant.name}`
    }

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
                        this.merchant.sheet.render(true, { focus: true });
                    }
                },
                {
                    label: "ITEM-PILES.HUD.Configure",
                    class: "item-piles-configure-pile",
                    icon: "fas fa-box-open",
                    onclick: () => {
                        ItemPileConfig.show(this.merchant);
                    }
                },
            ].concat(buttons);
        }
        return buttons
    }

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        html.find(".item-piles-name-container .item-piles-clickable").click(function () {
            const itemId = $(this).closest(".item-piles-item-row").attr('data-item-id');
            self.previewItem(itemId);
        });

        html.find(".item-piles-buy-button").click(function () {
            const itemId = $(this).closest(".item-piles-item-row").attr('data-item-id');
            self.buyItem(itemId);
        });
    }

    previewItem(itemId){
        const item = this.merchant.items.get(itemId);
        if (game.user.isGM || item.data.permission[game.user.id] === 3) {
            return item.sheet.render(true);
        }

        const cls = item._getSheetClass()
        const sheet = new cls(item, { editable: false })
        return sheet._render(true);
    }

    buyItem(itemId){
        return API.buyItem(this.merchant, this.buyer, itemId);
    }

    getData(options){
        const data = super.getData(options);

        const items = {};

        let merchantItems = lib.getMerchantItemsForActor(this.merchant);

        merchantItems.sort((a, b) => {
            return a.type < b.type || a.name < b.name ? -1 : 1;
        })

        merchantItems.forEach(item => {
            if(!items[item.type]){
                items[item.type] = [];
            }
            items[item.type].push(item);
        })

        data.merchant = {
            name: this.merchant.name,
            img: this.merchant.img,
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            items: items
        };

        data.buyer = this.buyer;

        return data;
    }

}