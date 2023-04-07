import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class Editor extends SvelteApplication {

  constructor(data, options) {
    super({
      svelte: {
        props: {
          data
        }
      },
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 400,
      height: "auto",
      classes: ["item-piles-app"],
      close: () => this.options.resolve(null),
      svelte: {
        target: document.body,
      }
    })
  }

  static async show(data, options = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      return new this(data, options).render(true, { focus: true });
    });
  }
}
