import ItemSimilaritiesShell from './item-similarities-editor.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class ItemSimilaritiesEditor extends SvelteApplication {
  
  constructor(itemSimilarities, options) {
    super({
      svelte: {
        class: ItemSimilaritiesShell,
        target: document.body,
        props: {
          itemSimilarities
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.SimilaritiesEditor.Title"),
      width: 400,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }
  
  static async show(itemSimilarities, options = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      return new this(itemSimilarities, options).render(true, { focus: true });
    });
  }
}