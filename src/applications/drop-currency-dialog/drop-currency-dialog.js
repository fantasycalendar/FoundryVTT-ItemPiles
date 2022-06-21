import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import DropCurrencyDialogShell from "./drop-currency-dialog-shell.svelte";

export default class DropCurrencyDialog extends TJSDialog {
  
  /**
   *
   * @param sourceActor
   * @param targetActor
   * @param settings
   * @param options
   * @param dialogData
   */
  constructor(sourceActor, targetActor, settings = {}, options = {}, dialogData = {}) {
    super({
      ...dialogData,
      title: settings?.title ?? game.i18n.localize("ITEM-PILES.DropCurrencies.Title"),
      zIndex: 1000,
      content: {
        class: DropCurrencyDialogShell,
        props: {
          sourceActor,
          targetActor,
          settings
        }
      },
      autoClose: true, // Don't automatically close on button onclick.
      close: () => this.options.resolve?.(null)
    }, {
      id: `item-pile-drop-currency-${targetActor.id}-${targetActor.id}`,
      width: 430,
      height: "auto",
      classes: ["dialog"],
      ...options
    });
    this.sourceActor = sourceActor;
    this.targetActor = targetActor;
  }
  
  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-drop-currency-${id}`);
  }
  
  static async show(sourceActor, targetActor, settings = {}, options = {}, dialogData = {}) {
    const apps = this.getActiveApps(sourceActor.id + "-" + targetActor.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(sourceActor, targetActor, settings, options, dialogData).render(true, { focus: true });
    })
  }
  
}