import { SvelteApplication }  from '@typhonjs-fvtt/runtime/svelte/application';

import { HOOKS, CONSTANTS } from "../../constants.js";
import { getDocument } from "../../lib/utils";
import ItemPileConfig from "../item-pile-config/item-pile-config";
import ItemPileInventoryShell from "./item-pile-inventory-shell.svelte";

export class ItemPileInventory extends SvelteApplication {

    /**
     *
     * @param pile
     * @param recipient
     * @param overrides
     * @param options
     * @param dialogData
     */
    constructor(pile, recipient, overrides = {}, options = {}, dialogData = {}) {

        let pileActor = pile?.actor ?? pile;

        super({
            id: `pile-inventory-${pileActor.uuid}`,
            title: pile.name,
            zIndex: 100,
            svelte: {
                class: ItemPileInventoryShell,
                target: document.body,
                props: {
                    pile: getDocument(pile),
                    recipient: getDocument(recipient),
                    overrides
                }
            },
            ...options
        }, dialogData);

        this.pile = pile;
        this.pileActor = pileActor;

        Hooks.callAll(HOOKS.PILE.OPEN_INVENTORY, this, pile, recipient, overrides);

    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            closeOnSubmit: false,
            classes: ["app window-app sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-inventory.html`,
            width: 550,
            height: "auto",
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-item-drop-container" }],
        });
    }

    static async show(pile, recipient = false, overrides = {}, options = {}, dialogData = {}) {
        return new Promise((resolve) => {
            options.resolve = resolve;
            new this(pile, recipient, overrides, options, dialogData).render(true, { focus: true });
        })
    }

    static getActiveAppFromPile(uuid){
        for(let app of Object.values(ui.windows)){
            if(app instanceof this && (app.pile.uuid === uuid || app.pileActor.uuid === uuid)){
                return app;
            }
        }
        return false;
    }

    static async updateActiveApp(uuid){
        const app = this.getActiveAppFromPile(uuid)
        if(app){
            return app.svelte.applicationShell.updateContents();
        }
        return false;
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

}