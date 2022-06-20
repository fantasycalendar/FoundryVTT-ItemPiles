import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';
import TradeDialogPrompt from './trade-dialog-prompt.svelte';
import TradeDialogRequest from './trade-dialog-request.svelte';

export class TradePromptDialog extends TJSDialog {
  
  constructor(tradeOptions, options = {}, dialogData = {}) {
    super({
      ...dialogData,
      title: game.i18n.localize("ITEM-PILES.Trade.Title"),
      zIndex: 101,
      content: {
        class: TradeDialogPrompt,
        props: {
          ...tradeOptions
        }
      },
      autoClose: true, // Don't automatically close on button onclick.
      close: () => this.options.resolve?.(null)
    }, {
      width: 400,
      height: "auto",
      classes: ["dialog"],
      ...options
    });
  }
  
  static show(tradeOptions, options = {}, dialogData = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      new this(tradeOptions, options, dialogData).render(true);
    })
  }
}

export class TradeRequestDialog extends TJSDialog {
  
  constructor(tradeOptions, options = {}, dialogData = {}) {
    
    super({
      ...dialogData,
      title: game.i18n.localize("ITEM-PILES.Trade.Title"),
      zIndex: 101,
      content: {
        class: TradeDialogRequest,
        props: {
          ...tradeOptions
        }
      },
      autoClose: true, // Don't automatically close on button onclick.
      close: () => this.options.resolve?.(null)
    }, {
      width: 400,
      height: "auto",
      classes: ["dialog"],
      ...options
    });
    this.tradeId = tradeOptions.tradeId;
  }
  
  static show(tradeOptions, options = {}, dialogData = {}) {
    return new Promise(resolve => {
      options.resolve = resolve;
      new this(tradeOptions, options, dialogData).render(true);
    })
  }
  
  static cancel(tradeId) {
    for (const app of Object.values(ui.windows)) {
      if (app instanceof this && app.tradeId === tradeId) {
        app.options.resolve({ type: "cancelled" });
        return app.close();
      }
    }
    return false;
  }
  
}