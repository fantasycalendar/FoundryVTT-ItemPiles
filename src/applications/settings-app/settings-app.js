import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import SettingsShell from './settings-shell.svelte';

class SettingsApp extends SvelteApplication {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `item-piles-application-system-settings`,
      title: "Item Piles Module Configuration",
      width: 600,
      svelte: {
        class: SettingsShell,
        target: document.body
      },
      zIndex: 100,
    });
  }
  
  static getActiveApp() {
    return Object.values(ui.windows).find(app => app.id === "item-piles-application-system-settings");
  }
  
  static async show(options = {}, dialogData = {}) {
    const app = this.getActiveApp()
    if (app) return app.render(false, { focus: true });
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(options, dialogData).render(true, { focus: true });
    })
  }
}

export default class SettingsShim extends FormApplication {
  
  /**
   * @inheritDoc
   */
  constructor() {
    super({});
    SettingsApp.show();
  }
  
  async _updateObject(event, formData) {
  }
  
  render() {
    this.close();
  }
  
}