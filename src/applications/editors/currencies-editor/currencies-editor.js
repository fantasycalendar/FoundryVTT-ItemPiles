import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import CurrenciesEditorShell from './currencies-editor-shell.svelte';

export default class CurrenciesEditor extends SvelteApplication {

  constructor(data = false, options={}, dialogData = {}) {
    super({
      svelte: {
        class: CurrenciesEditorShell,
        selectorElement: document.body,
        props: {
          data
        }
      },
      close: () => this.options.resolve?.(null),
      ...options
    }, dialogData);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.CurrenciesEditor.Title"),
      width: 630,
      height: "auto"
    })
  }

  static async show(data = false, options = {}, dialogData = {}) {
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(data, options, dialogData).render(true, { focus: true });
    })
  }
}