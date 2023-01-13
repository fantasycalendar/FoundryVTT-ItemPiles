import TradeMerchantItemDialogShell from "./trade-merchant-item-dialog-shell.svelte";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import { get } from "svelte/store";
import { getActiveApps } from "../../../helpers/helpers";

export default class TradeMerchantItemDialog extends SvelteApplication {
  
  /**
   *
   * @param item
   * @param seller
   * @param buyer
   * @param settings
   * @param options
   */
  constructor(item, seller, buyer, settings = {}, options = {}) {
    super({
      id: `item-pile-buy-item-dialog-${item.id}-${seller.id}-${buyer.id}-${randomID()}`,
      title: game.i18n.format("ITEM-PILES.Applications.TradeMerchantItem.Title", { item_name: get(item.name) }),
      svelte: {
        class: TradeMerchantItemDialogShell,
        target: document.body,
        props: {
          item,
          seller,
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
    return getActiveApps(`item-pile-buy-item-dialog-${id}`);
  }
  
  static async show(item, seller, buyer, settings = {}, options = {}) {
    const apps = this.getActiveApps(item.id + "-" + seller.id + "-" + buyer.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(item, seller, buyer, settings, options).render(true, { focus: true });
    })
  }
  
}