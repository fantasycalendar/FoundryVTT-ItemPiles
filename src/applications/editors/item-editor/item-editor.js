import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemEditorShell from './item-editor-shell.svelte';

export default class ItemEditor extends TJSDialog {
  
  constructor(data = false, options, dialogData = {}) {
    super({
      ...dialogData,
      title: "ITEM-PILES.Applications.ItemEditor.Title",
      content: {
        class: ItemEditorShell,
        props: {
          itemFilters: data
        }
      },
      buttons: {
        save: {
          icon: 'fas fa-save',
          label: "ITEM-PILES.Applications.ItemEditor.Submit",
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
      close: () => this.options.resolve(null)
    }, {
      width: 400,
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