import StringListEditorShell from './string-list-editor.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class StringListEditor extends SvelteApplication {

  constructor(stringList, options) {
    super({
      svelte: {
        class: StringListEditorShell,
        target: document.body,
        props: {
          stringList
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 400,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }

  static async show(stringList, options = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      return new this(stringList, options).render(true, { focus: true });
    });
  }
}
