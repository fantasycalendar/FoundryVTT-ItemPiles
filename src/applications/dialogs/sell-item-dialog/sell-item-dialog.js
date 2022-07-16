import SellItemDialogShell from "./sell-item-dialog-shell.svelte";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class SellItemDialog extends SvelteApplication {
  
  /**
   *
   * @param item
   * @param merchant
   * @param seller
   * @param settings
   * @param options
   */
  constructor(item, merchant, seller, settings = {}, options = {}) {
    super({
      id: `item-pile-sell-item-dialog-${item.id}-${merchant.id}-${seller.id}`,
      title: game.i18n.format("ITEM-PILES.Applications.SellItem.Title", { item_name: item.name }),
      svelte: {
        class: SellItemDialogShell,
        target: document.body,
        props: {
          item,
          merchant,
          seller,
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
    return Object.values(ui.windows).filter(app => app.id === `item-pile-sell-item-dialog-${id}`);
  }
  
  static async show(item, merchant, seller, settings = {}, options = {}) {
    const apps = this.getActiveApps(item.id + "-" + merchant.id + "-" + seller.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(item, merchant, seller, settings, options).render(true, { focus: true });
    })
  }
  
}