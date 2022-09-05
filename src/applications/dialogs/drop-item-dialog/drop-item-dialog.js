import DropItemDialogShell from "./drop-item-dialog-shell.svelte";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class DropItemDialog extends SvelteApplication {
    
    /**
     *
     * @param droppedItem
     * @param itemPile
     * @param options
     * @param dialogData
     */
    constructor(droppedItem, itemPile, options = {}) {
        super({
            id: `item-pile-drop-item-${droppedItem.id}${itemPile ? "-" + itemPile.id : ""}`,
            svelte: {
                class: DropItemDialogShell,
                target: document.body,
                props: {
                    droppedItem,
                    itemPile
                }
            },
            close: () => this.options.resolve?.(null),
            ...options
        });
        this.droppedItem = droppedItem;
        this.itemPile = itemPile;
    }
    
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.Applications.DropItem.Title"),
            width: 430,
            height: "auto",
            classes: ["item-piles-app"]
        })
    }
    
    static getActiveApps(id) {
        return Object.values(ui.windows).filter(app => app.id === `item-pile-drop-item-${id}`);
    }
    
    static async show(droppedItem, itemPile, options = {}) {
        const apps = this.getActiveApps(droppedItem.id + (itemPile ? "-" + itemPile.id : ""));
        if (apps.length) {
            for (let app of apps) {
                app.render(false, { focus: true });
            }
            return;
        }
        return new Promise((resolve) => {
            options.resolve = resolve;
            new this(droppedItem, itemPile, options).render(true, { focus: true });
        })
    }
    
}