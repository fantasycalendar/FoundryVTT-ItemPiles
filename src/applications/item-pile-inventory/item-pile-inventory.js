import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileInventoryShell from "./item-pile-inventory-shell.svelte";
import * as Utilities from "../../helpers/utilities.js";
import CONSTANTS from "../../constants/constants.js";

//import ItemPileConfig from "../item-pile-config/item-pile-config";

export class ItemPileInventory extends SvelteApplication {
  
  /**
   *
   * @param pile
   * @param recipient
   * @param overrides
   * @param options
   * @param dialogData
   */
  constructor(pile, recipient, overrides = {}, options = {}, dialogData = {}) {
    
    super({
      id: `item-pile-inventory-${pile.id}`,
      title: pile.name,
      zIndex: 100,
      svelte: {
        class: ItemPileInventoryShell,
        target: document.body,
        props: {
          pileActor: Utilities.getDocument(pile),
          recipient: Utilities.getDocument(recipient),
          overrides
        }
      },
      ...options
    }, dialogData);
    
    this.pile = pile;
    
    Hooks.callAll(HOOKS.PILE.OPEN_INVENTORY, this, pile, recipient, overrides);
    
  }
  
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      closeOnSubmit: false,
      classes: ["app window-app sheet"],
      width: 550,
      height: "auto",
    });
  }
  
  static getActiveApp(id) {
    return Object.values(ui.windows).find(app => app.id === `item-pile-inventory-${id}`);
  }
  
  static async show(pile, recipient = false, overrides = {}, options = {}, dialogData = {}) {
    let pileActor = pile?.actor ?? pile;
    const app = this.getActiveApp(pileActor.id)
    if (app) return app.render(false, { focus: true });
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(pileActor, recipient, overrides, options, dialogData).render(true, { focus: true });
    })
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
            this.pile.sheet.render(true, { focus: true });
          }
        },
        {
          label: "ITEM-PILES.HUD.Configure",
          class: "item-piles-configure-pile",
          icon: "fas fa-box-open",
          onclick: () => {
            //ItemPileConfig.show(this.pile);
          }
        },
      ].concat(buttons);
    }
    return buttons
  }
  
}