import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import { getActiveApps } from "../../helpers/helpers.js";

export default class Editor extends SvelteApplication {

  constructor(data, options, dialogOptions) {
    super({
      svelte: {
        props: {
          data
        }
      },
      ...options
    }, dialogOptions);
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

  static async show(data, options = {}, dialogOptions = {}) {
    const app = options?.id ? getActiveApps(options?.id, true) : false;
    if (app) return app.render(false, { focus: true });
    return new Promise(resolve => {
      options.resolve = resolve;
      return new this(data, options, dialogOptions).render(true, { focus: true });
    });
  }
}
