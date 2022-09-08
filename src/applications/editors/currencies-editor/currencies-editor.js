import CurrenciesEditorShell from './currencies-editor-shell.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class CurrenciesEditor extends SvelteApplication {
  
  constructor(data = false, options = {}) {
    super({
      svelte: {
        class: CurrenciesEditorShell,
        target: document.body,
        props: {
          data
        }
      },
      close: () => this.options.resolve?.(null),
      ...options
    });
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.CurrenciesEditor.Title"),
      width: 630,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }
  
  static async show(data = false, options = {}) {
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(data, options).render(true, { focus: true });
    })
  }
}