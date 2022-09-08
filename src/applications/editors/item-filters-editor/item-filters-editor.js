import ItemFiltersShell from './item-filters-editor.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class ItemFiltersEditor extends SvelteApplication {
  
  constructor(itemFilters, options) {
    super({
      title: "ITEM-PILES.Applications.FilterEditor.Title",
      svelte: {
        class: ItemFiltersShell,
        target: document.body,
        props: {
          itemFilters
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.FilterEditor.Title"),
      width: 400,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }
  
  static async show(itemFilters, options = {}) {
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(itemFilters, options).render(true, { focus: true });
    })
  }
}