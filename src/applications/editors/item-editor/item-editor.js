import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemEditorShell from './item-editor-shell.svelte';

export default class ItemEditor extends TJSDialog {
  
  constructor(item = false, options, dialogData = {}) {
    super({
      ...dialogData,
      id: `item-pile-item-editor-${item.id}`,
      title: game.i18n.format("ITEM-PILES.Applications.ItemEditor.Title", { item_name: item.name }),
      content: {
        class: ItemEditorShell,
        props: {
          item
        }
      },
      buttons: {
        save: {
          icon: 'fas fa-save',
          label: "Update",
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
      width: 500,
      zIndex: 202,
      height: "auto",
      ...options
    });
  }

  static getActiveApp(id) {
    return Object.values(ui.windows).find(app => app.id === `item-pile-item-editor-${id}`)
  }

  static async show(item = false, options = {}, dialogData = {}) {
    const app = this.getActiveApp(item.id);
    if (app) return app.render(false, { focus: true });
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(item, options, dialogData).render(true, { focus: true });
    })
  }
}