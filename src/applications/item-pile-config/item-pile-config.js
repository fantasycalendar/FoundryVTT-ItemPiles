import CONSTANTS from "../../constants/constants.js";
import * as Utilities from "../../helpers/utilities.js";
import * as PileUtilities from "../../helpers/pile-utilities.js";

import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileConfigShell from './item-pile-config.svelte';

export default class ItemPileConfig extends TJSDialog {
  
  constructor(pileActor, options = {}, dialogData = {}) {
    
    const pileData = PileUtilities.getActorFlagData(pileActor);
    
    super({
      ...dialogData,
      title: `${game.i18n.localize("ITEM-PILES.Applications.ItemPileConfig.Title")}: ${pileActor.name}`,
      zIndex: 101,
      content: {
        class: ItemPileConfigShell,
        props: {
          pileActor,
          pileData
        }
      },
      autoClose: true, // Don't automatically close on button onclick.
      close: () => this.options.resolve?.(null)
    }, {
      id: `item-pile-config-${pileActor.id}`,
      width: 430,
      height: 617,
      classes: ["sheet", "item-piles-config"],
      ...options
    });
    this.pileActor = pileActor;
  }
  
  static getActiveApp(id) {
    return Object.values(ui.windows).find(app => app.id === `item-pile-config-${id}`)
  }
  
  static async show(target, options = {}, dialogData = {}) {
    const targetActor = Utilities.getActor(target);
    const app = this.getActiveApp(targetActor.id);
    if (app) return app.render(false, { focus: true });
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(targetActor, options, dialogData).render(true);
    })
  }
  
  async close(options) {
    super.close(options);
    Object.values(ui.windows).forEach(app => {
      if (app !== this && app.rendered && app.id.endsWith(`item-pile-config-${this.pileActor.id}`)) {
        app.close();
      }
    })
  }
}