import ItemEditorShell from './item-editor-shell.svelte';
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

export default class ItemEditor extends SvelteApplication {
  
  constructor(item = false, options) {
    super({
      id: `item-pile-item-editor-${item.id}`,
      title: game.i18n.format("ITEM-PILES.Applications.ItemEditor.Title", { item_name: item.name }),
      svelte: {
        class: ItemEditorShell,
        target: document.body,
        props: {
          item
        }
      },
      close: () => this.options.resolve(null),
      ...options
    });
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 500,
      height: "auto",
      classes: ["item-piles-app"]
    })
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