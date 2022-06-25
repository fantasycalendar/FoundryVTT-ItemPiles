import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileInventoryShell from "./item-pile-inventory-shell.svelte";
import * as Utilities from "../../helpers/utilities.js";
import ItemPileConfig from "../item-pile-config/item-pile-config.js";
import HOOKS from "../../constants/hooks.js";
import * as Helpers from "../../helpers/helpers.js";

export class ItemPileInventoryApp extends SvelteApplication {
  
  /**
   *
   * @param source
   * @param recipient
   * @param overrides
   * @param options
   * @param dialogData
   */
  constructor(source, recipient, overrides = {}, options = {}, dialogData = {}) {
    
    super({
      id: `item-pile-inventory-${source.id}`,
      title: source.name,
      zIndex: 100,
      svelte: {
        class: ItemPileInventoryShell,
        target: document.body,
        props: {
          source,
          recipient,
          overrides
        }
      },
      ...options
    }, dialogData);
    
    this.source = source;
    
    Helpers.hooks.callAll(HOOKS.PILE.OPEN_INVENTORY, this, this.source, recipient, overrides);
    
  }
  
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      closeOnSubmit: false,
      classes: ["app window-app sheet item-pile-inventory"],
      width: 550,
      height: "auto",
    });
  }
  
  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-inventory-${id}`);
  }
  
  static async show(source, recipient = false, overrides = {}, options = {}, dialogData = {}) {
    source = Utilities.getActor(source)
    recipient = Utilities.getActor(recipient);
    const apps = this.getActiveApps(source.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(source, recipient, overrides, options, dialogData).render(true, { focus: true });
    })
  }
  
  refreshItems() {
    //this.svelte.applicationShell.store.refreshItems();
  }
  
  refreshDeletedPile() {
    //this.svelte.applicationShell.deleted = true;
  }
  
  /* -------------------------------------------- */
  
  /** @override */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM;
    if (canConfigure) {
      buttons = [
        {
          label: "ITEM-PILES.Inspect.OpenSheet",
          class: "item-piles-open-actor-sheet",
          icon: "fas fa-user",
          onclick: () => {
            this.source.sheet.render(true, { focus: true });
          }
        },
        {
          label: "ITEM-PILES.HUD.Configure",
          class: "item-piles-configure-pile",
          icon: "fas fa-box-open",
          onclick: () => {
            ItemPileConfig.show(this.source);
          }
        },
      ].concat(buttons);
    }
    return buttons
  }
  
}