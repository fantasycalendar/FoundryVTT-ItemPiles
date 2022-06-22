import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileInventoryShell from "./item-pile-inventory-shell.svelte";
import * as Utilities from "../../helpers/utilities.js";
import ItemPileConfig from "../item-pile-config/item-pile-config.js";
import HOOKS from "../../constants/hooks.js";
import * as Helpers from "../../helpers/helpers.js";

export class ItemPileInventory extends SvelteApplication {
  
  /**
   *
   * @param pileActor
   * @param recipientActor
   * @param overrides
   * @param options
   * @param dialogData
   */
  constructor(pileActor, recipientActor, overrides = {}, options = {}, dialogData = {}) {
    
    super({
      id: `item-pile-inventory-${pileActor.id}`,
      title: pileActor.name,
      zIndex: 100,
      svelte: {
        class: ItemPileInventoryShell,
        target: document.body,
        props: {
          pileActor,
          recipientActor,
          overrides
        }
      },
      ...options
    }, dialogData);
    
    this.pileActor = pileActor;
    
    Helpers.hooks.callAll(HOOKS.PILE.OPEN_INVENTORY, this, this.pileActor, recipientActor, overrides);
    
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
  
  static async show(pile, recipient = false, overrides = {}, options = {}, dialogData = {}) {
    const pileActor = Utilities.getActor(pile)
    const recipientActor = Utilities.getActor(recipient);
    const apps = this.getActiveApps(pileActor.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(pileActor, recipientActor, overrides, options, dialogData).render(true, { focus: true });
    })
  }
  
  refreshItems() {
    this.svelte.applicationShell.store.refreshItems();
  }
  
  refreshAttributes() {
    this.svelte.applicationShell.store.refreshAttributes();
  }
  
  refreshDeletedPile() {
    this.svelte.applicationShell.deleted = true;
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
            this.pileActor.sheet.render(true, { focus: true });
          }
        },
        {
          label: "ITEM-PILES.HUD.Configure",
          class: "item-piles-configure-pile",
          icon: "fas fa-box-open",
          onclick: () => {
            ItemPileConfig.show(this.pileActor);
          }
        },
      ].concat(buttons);
    }
    return buttons
  }
  
}