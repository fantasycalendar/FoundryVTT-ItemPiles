import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import CurrenciesEditorShell from './currencies-editor-shell.svelte';

export default class CurrenciesEditor extends TJSDialog {

  constructor(data = false, options, dialogData = {}) {
    super({
      ...dialogData,
      title: game.i18n.localize("ITEM-PILES.Applications.CurrenciesEditor.Title"),
      content: {
        class: CurrenciesEditorShell,
        props: {
          data
        }
      },
      buttons: {
        save: {
          icon: 'fas fa-save',
          label: "ITEM-PILES.Applications.CurrenciesEditor.Submit",
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
      zIndex: 102,
      close: () => this.options.resolve?.(null)
    }, {
      width: 630,
      height: "auto",
      ...options,
    });
  }

  static async show(data = false, options = {}, dialogData = {}) {
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(data, options, dialogData).render(true, { focus: true });
    })
  }
}