import StylesEditorShell from './styles-editor.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class StylesEditor extends SvelteApplication {

  constructor(styles, options) {
    super({
      svelte: {
        class: StylesEditorShell,
        target: document.body,
        props: {
          styles
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.StylesEditor.Title"),
      width: 400,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }

  static async show(styles, options = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      return new this(styles, options).render(true, { focus: true });
    });
  }
}
