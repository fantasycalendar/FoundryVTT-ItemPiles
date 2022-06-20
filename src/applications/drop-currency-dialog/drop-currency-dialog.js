import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import DropCurrencyDialogShell from "./drop-currency-dialog-shell.svelte";

export default class DropCurrencyDialog extends TJSDialog {
  
  /**
   *
   * @param actor
   * @param itemPile
   * @param settings
   * @param options
   * @param dialogData
   */
  constructor(actor, itemPile, settings = {}, options = {}, dialogData = {}) {
    super({
      ...dialogData,
      title: game.i18n.localize("ITEM-PILES.DropCurrencies.Title"),
      zIndex: 1000,
      content: {
        class: DropCurrencyDialogShell,
        props: {
          actor,
          itemPile,
          settings
        }
      },
      autoClose: true, // Don't automatically close on button onclick.
      close: () => this.options.resolve?.(null)
    }, {
      id: `item-pile-drop-currency-${actor.id}-${itemPile.id}`,
      width: 430,
      height: "auto",
      classes: ["dialog"],
      ...options
    });
    this.actor = actor;
    this.itemPile = itemPile;
  }
  
  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-drop-currency-${id}`);
  }
  
  static async show(actor, itemPile, settings = {}, options = {}, dialogData = {}) {
    const apps = this.getActiveApps(actor.id + "-" + itemPile.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(actor, itemPile, settings, options, dialogData).render(true, { focus: true });
    })
  }
  
}