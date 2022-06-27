import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemFiltersShell from './item-filters-editor.svelte';

export default class ItemFiltersEditor extends TJSDialog {
  
  constructor(item, options, dialogData = {}) {
    super({
      title: "ITEM-PILES.Applications.FilterEditor.Title",
      content: {
        class: ItemFiltersShell,
        props: {
          item
        }
      },
      buttons: {
        save: {
          icon: 'fas fa-save',
          label: "ITEM-PILES.Applications.FilterEditor.Submit",
          onclick: "requestSubmit"
        },
        no: {
          icon: 'fas fa-times',
          label: 'Cancel',
          onclick: () => {
            this.options.resolve(false);
            this.close();
          }
        }
      },
      default: 'save',
      autoClose: false, // Don't automatically close on button onclick.
      close: () => this.options.resolve(null),
      ...dialogData
    }, {
      width: 400,
      zIndex: 202,
      height: "auto",
      ...options
    });
  }
  
  static async show(item, options = {}, dialogData = {}) {
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(item, options, dialogData).render(true, { focus: true });
    })
  }
}