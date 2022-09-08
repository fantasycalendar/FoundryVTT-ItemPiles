import DropCurrencyDialogShell from "./drop-currency-dialog-shell.svelte";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class DropCurrencyDialog extends SvelteApplication {
  
  /**
   *
   * @param sourceActor
   * @param targetActor
   * @param settings
   * @param options
   * @param dialogData
   */
  constructor(sourceActor, targetActor, settings = {}, options = {}) {
    super({
      id: `item-pile-drop-currency-${targetActor.id}-${targetActor.id}`,
      title: settings?.title ?? game.i18n.localize("ITEM-PILES.Applications.DropCurrencies.Title"),
      svelte: {
        class: DropCurrencyDialogShell,
        target: document.body,
        props: {
          sourceActor,
          targetActor,
          settings
        }
      },
      close: () => this.options.resolve?.(null),
      ...options
    })
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 430,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }
  
  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-drop-currency-${id}`);
  }
  
  static async show(sourceActor, targetActor, settings = {}, options = {}) {
    const apps = this.getActiveApps(sourceActor.id + "-" + targetActor.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(sourceActor, targetActor, settings, options).render(true, { focus: true });
    })
  }
  
}