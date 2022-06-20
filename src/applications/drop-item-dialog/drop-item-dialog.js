import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import DropItemDialogShell from "./drop-item-dialog-shell.svelte";

export default class DropItemDialog extends TJSDialog {
  
  /**
   *
   * @param droppedItem
   * @param itemPile
   * @param options
   * @param dialogData
   */
  constructor(droppedItem, itemPile, options = {}, dialogData = {}) {
    super({
      ...dialogData,
      title: game.i18n.localize("ITEM-PILES.DropItem.Title"),
      zIndex: 1000,
      content: {
        class: DropItemDialogShell,
        props: {
          droppedItem,
          itemPile
        }
      },
      autoClose: true, // Don't automatically close on button onclick.
      close: () => this.options.resolve?.(null)
    }, {
      id: `item-pile-drop-item-${droppedItem.id}-${itemPile.id}`,
      width: 430,
      height: "auto",
      classes: ["dialog"],
      ...options
    });
    this.droppedItem = droppedItem;
    this.itemPile = itemPile;
  }
  
  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-drop-item-${id}`);
  }
  
  static async show(droppedItem, itemPile, options = {}, dialogData = {}) {
    const apps = this.getActiveApps(droppedItem.id + "-" + itemPile.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(droppedItem, itemPile, options, dialogData).render(true, { focus: true });
    })
  }
  
}