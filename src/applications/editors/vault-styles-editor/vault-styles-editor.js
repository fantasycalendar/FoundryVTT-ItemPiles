import VaultStylesEditorShell from './vault-styles-editor.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class VaultStylesEditor extends SvelteApplication {

  constructor(vaultStyles, options) {
    super({
      svelte: {
        class: VaultStylesEditorShell,
        target: document.body,
        props: {
          vaultStyles
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.VaultStylesEditor.Title"),
      width: 400,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }

  static async show(vaultStyles, options = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      return new this(vaultStyles, options).render(true, { focus: true });
    });
  }
}
