import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import TradingAppShell from "./trading-app-shell.svelte";
import ItemPileSocket from "../../socket.js";

export default class TradingApp extends SvelteApplication {
  constructor(store, options = {}, dialogData = {}) {
    super({
      title: game.i18n.format("ITEM-PILES.Trade.Between", {
        actor_1: store.leftTraderActor.name,
        actor_2: store.rightTraderActor.name
      }),
      svelte: {
        class: TradingAppShell,
        target: document.body,
        props: {
          store
        }
      },
      ...options
    }, dialogData);
    
    this.publicTradeId = store.publicTradeId;
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      zIndex: 100,
      classes: ["dialog", "item-piles-trading-sheet"],
      width: 800,
      height: "auto",
      dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-item-drop-container" }],
      closeOnSubmit: false
    });
  }
  
  static getActiveApp(publicTradeId) {
    for (const app of Object.values(ui.windows)) {
      if (app instanceof this && app?.publicTradeId === publicTradeId) {
        return app;
      }
    }
    return false;
  }
  
  async close(options = {}) {
    if (!options?.callback) {
      await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.TRADE_CLOSED, this.store.publicTradeId, game.user.id);
    }
    return super.close(options)
  }
}