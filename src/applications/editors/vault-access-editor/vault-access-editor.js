import VaultAccessEditorShell from './vault-access-editor-shell.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class VaultAccessEditor extends SvelteApplication {

  constructor(vaultAccess, options) {

    super({
      svelte: {
        class: VaultAccessEditorShell,
        target: document.body,
        props: {
          vaultAccess
        }
      },
      close: () => this.options.resolve?.(false),
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 600,
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
