import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemTypePriceModifiersShell from './item-type-price-modifiers-editor.svelte';

export default class ItemTypePriceModifiersEditor extends TJSDialog {
  
  constructor(itemTypePriceModifiers, options, dialogData = {}) {
    
    super({
      title: "ITEM-PILES.Applications.ItemTypePriceModifiersEditor.Title",
      content: {
        class: ItemTypePriceModifiersShell,
        props: {
          itemTypePriceModifiers
        }
      },
      buttons: {
        save: {
          icon: 'fas fa-save',
          label: "ITEM-PILES.Applications.ItemTypePriceModifiersEditor.Submit",
          onclick: "requestSubmit"
        },
        no: {
          icon: 'fas fa-times',
          label: 'Cancel',
          onclick: () => {
            this.options.resolve?.(false);
            this.close();
          }
        }
      },
      default: 'save',
      autoClose: false, // Don't automatically close on button onclick.
      close: () => this.options.resolve?.(false),
      ...dialogData
    }, {
      width: 600,
      zIndex: 202,
      height: "auto",
      ...options
    });
  }
  
  static async show(data = false, options = {}, dialogData = {}) {
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(data, options, dialogData).render(true, { focus: true });
    })
  }
  
}