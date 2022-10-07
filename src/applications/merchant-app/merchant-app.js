import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileConfig from "../item-pile-config/item-pile-config";
import MerchantAppShell from "./merchant-app-shell.svelte";
import * as Helpers from "../../helpers/helpers.js";
import HOOKS from "../../constants/hooks.js";

export default class MerchantApp extends SvelteApplication {

  constructor(merchant, recipient = false, options = {}, dialogData = {}) {
    super({
      title: `Merchant: ${merchant.name}`,
      id: `item-pile-merchant-${merchant.id}`,
      svelte: {
        class: MerchantAppShell,
        target: document.body,
        props: {
          merchant,
          recipient
        }
      },
      zIndex: 100,
      ...options
    }, dialogData);
    this.merchant = merchant;
    this.recipient = recipient;
    Helpers.hooks.callAll(HOOKS.OPEN_INTERFACE, this, merchant, recipient, options, dialogData);
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["app window-app sheet", "item-piles-merchant-sheet", "item-piles"],
      width: 800,
      height: 700,
      closeOnSubmit: false,
      resizable: true
    });
  }

  static getActiveApp(id) {
    return Object.values(ui.windows).find(app => app.id === `item-pile-merchant-${id}`);
  }

  static async show(merchant, recipient = false, options = {}, dialogData = {}) {
    merchant = merchant?.actor ?? merchant;
    recipient = recipient?.actor ?? recipient
    const result = Helpers.hooks.call(HOOKS.PRE_OPEN_INTERFACE, merchant, recipient, options, dialogData);
    if (result === false) return;
    const app = this.getActiveApp(merchant.id);
    if (app) return app.render(false, { focus: true });
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(merchant, recipient, options, dialogData).render(true, { focus: true });
    })
  }

  refreshItems() {
    this.svelte.applicationShell.store.refreshItems();
  }

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
            this.merchant.sheet.render(true, { focus: true });
          }
        },
        {
          label: "ITEM-PILES.ContextMenu.ShowToPlayers",
          class: "item-piles-show-to-players",
          icon: "fas fa-eye",
          onclick: () => {
            const users = Array.from(game.users).filter(u => u.active && u !== game.user).map(u => u.id);
            if (!users.length) {
              Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.NoPlayersActive"), true);
              return;
            }
            Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ShownToPlayers", { actor_name: this.merchant.name }))
            return game.itempiles.API.renderItemPileInterface(this.merchant, {
              userIds: users,
              useDefaultCharacter: true
            });
          }
        },
        {
          label: "ITEM-PILES.HUD.Configure",
          class: "item-piles-configure-pile",
          icon: "fas fa-box-open",
          onclick: () => {
            ItemPileConfig.show(this.merchant);
          }
        },
      ].concat(buttons);
    }
    return buttons
  }

  async close(options) {
    const result = Helpers.hooks.call(HOOKS.PRE_CLOSE_INTERFACE, this, this.actor, this.recipient);
    if (result === false) return;
    for (const app of Object.values(ui.windows)) {
      if (app !== this && this.svelte.applicationShell.store === app?.svelte?.applicationShell?.store) {
        app.close();
      }
    }
    Helpers.hooks.callAll(HOOKS.CLOSE_INTERFACE, this, this.merchant, this.recipient);
    return super.close(options);
  }

}