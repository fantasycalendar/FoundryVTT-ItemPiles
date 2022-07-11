import BuyItemDialogShell from "./buy-item-dialog-shell.svelte";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class BuyItemDialog extends SvelteApplication {
  
  /**
   *
   * @param item
   * @param merchant
   * @param buyer
   * @param settings
   * @param options
   */
  constructor(item, merchant, buyer, settings = {}, options = {}) {
    super({
      id: `item-pile-buy-item-dialog-${item.id}-${merchant.id}-${buyer.id}`,
      title: game.i18n.format("ITEM-PILES.Applications.BuyItem.Title", { item_name: item.name }),
      svelte: {
        class: BuyItemDialogShell,
        target: document.body,
        props: {
          item,
          merchant,
          buyer,
          settings
        }
      },
      close: () => this.options.resolve?.(null),
      ...options
    });
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 330,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }
  
  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-buy-item-dialog-${id}`);
  }
  
  static async show(item, merchant, buyer, settings = {}, options = {}) {
    const apps = this.getActiveApps(item.id + "-" + merchant.id + "-" + buyer.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(item, merchant, buyer, settings, options).render(true, { focus: true });
    })
  }
  
}