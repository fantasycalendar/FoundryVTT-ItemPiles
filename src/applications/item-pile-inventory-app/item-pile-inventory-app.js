import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileInventoryShell from "./item-pile-inventory-shell.svelte";
import * as Utilities from "../../helpers/utilities.js";
import ItemPileConfig from "../item-pile-config/item-pile-config.js";
import HOOKS from "../../constants/hooks.js";
import * as Helpers from "../../helpers/helpers.js";

export class ItemPileInventoryApp extends SvelteApplication {

  /**
   *
   * @param actor
   * @param recipient
   * @param overrides
   * @param options
   * @param dialogData
   */
  constructor(actor, recipient, options = {}, dialogData = {}) {
    super({
      id: `item-pile-inventory-${actor?.token?.id ?? actor.id}`,
      title: actor.name,
      svelte: {
        class: ItemPileInventoryShell,
        target: document.body,
        props: {
          actor,
          recipient
        }
      },
      zIndex: 100,
      ...options
    }, dialogData);

    this.actor = actor;
    this.recipient = recipient;

    Helpers.hooks.callAll(HOOKS.OPEN_INTERFACE, this, actor, recipient, options, dialogData);

  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      closeOnSubmit: false,
      classes: ["app window-app sheet item-pile-inventory item-piles"],
      width: 550,
      height: "auto",
    });
  }

  static getActiveApps(id) {
    return Object.values(ui.windows).filter(app => app.id === `item-pile-inventory-${id}`);
  }

  static async show(source, recipient = false, options = {}, dialogData = {}) {
    source = Utilities.getActor(source);
    recipient = Utilities.getActor(recipient);
    const result = Helpers.hooks.call(HOOKS.PRE_OPEN_INTERFACE, source, recipient, options, dialogData);
    if (result === false) return;
    const apps = this.getActiveApps(source?.token?.id ?? source.id);
    if (apps.length) {
      for (let app of apps) {
        app.render(false, { focus: true });
      }
      return;
    }
    return new Promise((resolve) => {
      options.resolve = resolve;
      new this(source, recipient, options, dialogData).render(true, { focus: true });
    })
  }

  async close(options) {
    const result = Helpers.hooks.call(HOOKS.PRE_CLOSE_INTERFACE, this, this.actor, this.recipient, options);
    if (result === false) return;
    Helpers.hooks.callAll(HOOKS.CLOSE_INTERFACE, this, this.actor, this.recipient, options);
    return super.close(options);
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
            this.actor.sheet.render(true, { focus: true });
          }
        },
        {
          label: "ITEM-PILES.ContextMenu.ShowToPlayers",
          class: "item-piles-show-to-players",
          icon: "fas fa-eye",
          onclick: () => {
            const users = Array.from(game.users).filter(u => u.active && u !== game.user).map(u => u.id);
            if (!users.length) {
              return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.NoPlayersActive"), true);
            }
            Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ShownToPlayers", { actor_name: this.actor.name }))
            return game.itempiles.API.renderItemPileInterface(this.actor, {
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
            ItemPileConfig.show(this.actor);
          }
        },
      ].concat(buttons);
    }
    return buttons
  }

}