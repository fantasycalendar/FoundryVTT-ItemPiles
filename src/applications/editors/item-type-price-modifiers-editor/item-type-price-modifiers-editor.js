import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemTypePriceModifiersShell from './item-type-price-modifiers-editor.svelte';

export default class ItemTypePriceModifiersEditor extends SvelteApplication {
  
  constructor(itemTypePriceModifiers, options) {
    
    super({
      svelte: {
        class: ItemTypePriceModifiersShell,
        target: document.body,
        props: {
          itemTypePriceModifiers
        }
      },
      close: () => this.options.resolve?.(false),
      ...options
    });
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.Title"),
      width: 600,
      height: "auto",
      classes: ["item-piles-app"]
    })
  }
  
  static async show(itemTypePriceModifiers, options = {}) {
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(itemTypePriceModifiers, options).render(true, { focus: true });
    })
  }
  
}