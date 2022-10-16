import PriceModifiersShell from './price-modifiers-editor.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class PriceModifiersEditor extends SvelteApplication {

  constructor(priceModifiers, options) {

    priceModifiers = priceModifiers.map(data => {
      data.actor = fromUuidSync(data.actorUuid);
      if (!data.actor) return false;
      return data;
    }).filter(Boolean);

    super({
      svelte: {
        class: PriceModifiersShell,
        target: document.body,
        props: {
          priceModifiers
        }
      },
      close: () => this.options.resolve?.(false),
      ...options
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.PriceModifiersEditor.Title"),
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