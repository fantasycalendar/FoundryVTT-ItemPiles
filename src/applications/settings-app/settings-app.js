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
      classes: ["item-piles-app"],
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


  /** @override */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    if (game.user.isGM) {
      buttons = [
        {
          label: "ITEM-PILES.Applications.Settings.Export",
          class: "item-piles-export-settings",
          icon: "fas fa-file-export",
          onclick: () => {
            const settings = Object.entries(this.svelte.applicationShell.settings)
              .filter(([_, setting]) => {
                return setting.system && setting.name;
              }).map(([key, setting]) => [key, setting.value]);
            const a = document.createElement("a");
            const file = new Blob([JSON.stringify(Object.fromEntries(settings), null, 4)], { type: "text/json" });
            a.href = URL.createObjectURL(file);
            a.download = `item-piles-${game.system.id}.json`;
            a.click();
            a.remove();
          }
        },
        {
          label: "ITEM-PILES.Applications.Settings.Import",
          class: "item-piles-import-settings",
          icon: "fas fa-file-import",
          onclick: () => {

            const input = document.createElement('input');
            input.type = 'file';

            input.onchange = e => {

              input.remove();

              // getting a hold of the file reference
              const file = e.target.files[0];

              const reader = new FileReader();
              reader.addEventListener('load', async () => {
                try {
                  const incomingSettings = JSON.parse(reader.result);
                  this.svelte.applicationShell.importSettings(incomingSettings)
                } catch (err) {
                  console.error(err);
                }
              });

              reader.readAsText(file);

            }

            input.click();
          }
        },
      ].concat(buttons);
    }
    return buttons
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
