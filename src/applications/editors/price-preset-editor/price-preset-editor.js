import PricePresetEditorShell from "./price-preset-editor-shell.svelte";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import { getActiveApps } from "../../../helpers/helpers";

export default class PricePresetEditor extends SvelteApplication {
  
  constructor(prices, options) {
    super({
      id: `item-pile-price-preset-editor-${randomID()}`,
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
    return getActiveApps(`item-pile-price-preset-editor`, true);
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