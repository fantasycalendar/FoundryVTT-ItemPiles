import PricePresetEditorShell from "./price-preset-editor-shell.svelte";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class PricePresetEditor extends SvelteApplication {
  
  constructor(prices, options) {
    super({
      id: `item-pile-price-preset-editor`,
      title: game.i18n.format("ITEM-PILES.Applications.PricePresetEditor.Title"),
      svelte: {
        class: PricePresetEditorShell,
        target: document.body,
        props: {
          prices
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 500,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }
  
  static getActiveApp() {
    return Object.values(ui.windows).find(app => app.id === `item-pile-price-preset-editor`)
  }
  
  static async show(prices, options = {}, dialogData = {}) {
    const app = this.getActiveApp();
    if (app) return app.render(false, { focus: true });
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(prices, options, dialogData).render(true, { focus: true });
    })
  }
}