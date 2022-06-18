import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemSimilaritiesShell from './item-similarities-editor.svelte';

export default class ItemSimilaritiesEditor extends TJSDialog {

  constructor(options, dialogData = {}) {
    super({
      ...dialogData,
      title: "ITEM-PILES.Applications.SimilaritiesEditor.Title",
      content: {
        class: ItemSimilaritiesShell,
      },
      buttons: {
        save: {
          icon: 'fas fa-save',
          label: "ITEM-PILES.Applications.SimilaritiesEditor.Submit",
          onclick: "requestSubmit"
        },
        no: {
          icon: 'fas fa-times',
          label: 'Cancel',
          onclick: () => {
            this.close();
          }
        }
      },
      zIndex: 102,
      default: 'save',
      autoClose: false, // Don't automatically close on button onclick.
    }, {
      width: 400,
      height: "auto",
      ...options
    });
  }

  static async show(options = {}, dialogData = {}) {
    return new this(options, dialogData).render(true, { focus: true });
  }
}