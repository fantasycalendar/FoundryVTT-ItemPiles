import UnstackableItemTypesEditorShell from './unstackable-item-types-editor.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class UnstackableItemTypesEditor extends SvelteApplication {

  constructor(unstackableItemTypes, options) {
    super({
      svelte: {
        class: UnstackableItemTypesEditorShell,
        target: document.body,
        props: {
          unstackableItemTypes
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.UnstackableItemTypesEditor.Title"),
      width: 300,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }

  static async show(unstackableItemTypes, options = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      return new this(unstackableItemTypes, options).render(true, { focus: true });
    });
  }
}
