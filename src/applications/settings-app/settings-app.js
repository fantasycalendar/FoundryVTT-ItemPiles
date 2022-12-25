import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import { getActiveApps } from '../../helpers/helpers';
import SettingsShell from './settings-shell.svelte';

class SettingsApp extends SvelteApplication {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `item-piles-application-system-settings-${randomID()}`,
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
    return getActiveApps("item-piles-application-system-settings", true);
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