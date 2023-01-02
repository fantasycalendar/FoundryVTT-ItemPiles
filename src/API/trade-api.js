import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import CustomDialog from "../applications/components/CustomDialog.svelte";
import { TradePromptDialog, TradeRequestDialog } from "../applications/trade-dialogs/trade-dialogs.js";

import CONSTANTS from "../constants/constants.js";
import ItemPileSocket from "../socket.js";
import * as Helpers from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import TradeStore from "../applications/trading-app/trade-store.js";
import TradingApp from "../applications/trading-app/trading-app.js";
import Transaction from "../helpers/transaction.js";

const mutedUsers = new Set();
const ongoingTrades = new Map();

export default class TradeAPI {

  static initialize() {
    Hooks.on("renderPlayerList", this._userDisconnected.bind(this));
  }

  static async _requestTrade(user = false) {

    // Grab all the active users (not self)
    const users = game.users.filter(user => user.active && user !== game.user);

    // No users!
    if (!users.length) {
      return TJSDialog.prompt({
        title: game.i18n.localize("ITEM-PILES.Trade.Title"), content: {
          class: CustomDialog, props: {
            header: game.i18n.localize("ITEM-PILES.Trade.NoActiveUsers.Title"),
            content: game.i18n.localize("ITEM-PILES.Trade.NoActiveUsers.Content"),
            icon: "fas fa-heart-broken"
          }
        }, modal: true, draggable: false, options: {
          height: "auto"
        }
      });
    }

    let userId;
    let actor;
    let isPrivate;

    // Find actors you own
    const actors = game.actors.filter(actor => actor.isOwner);

    // If you only own one actor, and the user was already preselected (through the right click menu in the actors list)
    if (actors.length === 1 && user) {
      userId = user.id;
      actor = actors[0];
      isPrivate = false;
    } else {
      // If you have more than 1 owned actor, prompt to choose which one
      const result = await TradePromptDialog.show({ actors, users, user });
      if (!result) return;
      userId = result.user.id;
      actor = result.actor;
      isPrivate = result.private;
    }

    if (!actor) return false;

    actor = Utilities.getActor(actor);

    const actorOwner = game.users.find(user => user.character === actor && user !== game.user);
    if (actorOwner) {

      const doContinue = TJSDialog.confirm({
        title: game.i18n.localize("ITEM-PILES.Trade.Title"), content: {
          class: CustomDialog, props: {
            header: game.i18n.localize("ITEM-PILES.Trade.Title"),
            content: actorOwner.active ? game.i18n.format("ITEM-PILES.Trade.UserActiveCharacterWarning", {
              actor_name: actor.name, player_name: actorOwner.name
            }) : game.i18n.format("ITEM-PILES.Trade.UserCharacterWarning", {
              actor_name: actor.name, player_name: actorOwner.name
            }),
            icon: "fas fa-exclamation-triangle",
          }
        }, modal: true, draggable: false, rejectClose: false, defaultYes: true, options: {
          height: "auto"
        }
      });
      if (!doContinue) {
        return;
      }
    }

    const privateTradeId = randomID();
    const publicTradeId = randomID();

    // Spawn a cancel dialog
    const cancelDialog = new Dialog({
      title: game.i18n.localize("ITEM-PILES.Trade.Title"),
      content: `<p style="text-align: center">${game.i18n.format("ITEM-PILES.Trade.OngoingRequest.Content", { user_name: game.users.get(userId).name })}</p>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("ITEM-PILES.Trade.OngoingRequest.Label"),
          callback: () => {
            ItemPileSocket.executeAsUser(ItemPileSocket.HANDLERS.TRADE_REQUEST_CANCELLED, userId, game.user.id, privateTradeId);
          }
        }
      }
    }, {
      top: 50, width: 300
    }).render(true);

    // Send out the request
    return ItemPileSocket.executeAsUser(ItemPileSocket.HANDLERS.TRADE_REQUEST_PROMPT, userId, game.user.id, actor.uuid, privateTradeId, publicTradeId, isPrivate)
      .then(async (data) => {

        if (data === "cancelled") return;
        cancelDialog.close();

        if (data === "same-actor") {
          return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.SameActor"), true);
        }

        // If they declined, show warning
        if (!data || !data.fullPrivateTradeId.includes(privateTradeId)) {
          return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Declined"), true);
        }

        const traderActor = Utilities.getActor(data.actorUuid);

        if (traderActor === actor) {
          return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.SameActor"), true);
        }

        const store = new TradeStore(game.user.id, {
          user: game.user, actor
        }, {
          user: game.users.get(userId), actor: traderActor
        }, data.fullPublicTradeId, data.fullPrivateTradeId, isPrivate);

        const app = new TradingApp(store, this.getAppOptions(actor).tradeApp).render(true);

        ongoingTrades.set(data.fullPublicTradeId, { app, store });

        actor.sheet.render(true, this.getAppOptions(actor).actorSheet);

        if (isPrivate) {
          return ItemPileSocket.callHookForUsers(CONSTANTS.HOOKS.TRADE.STARTED, [game.user.id, userId], {
            user: game.user.id, actor: actor.uuid
          }, { user: userId, actor: data.actorUuid }, data.fullPublicTradeId, isPrivate);
        }

        return ItemPileSocket.callHook(CONSTANTS.HOOKS.TRADE.STARTED, {
          user: game.user.id, actor: actor.uuid
        }, { user: userId, actor: data.actorUuid }, data.fullPublicTradeId, isPrivate);

      }).catch((err) => {
        console.error(err);
        // If the counterparty disconnected, show that and close dialog
        Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true);
        cancelDialog.close()
      });

  }

  static async _respondPrompt(tradingUserId, tradingActorUuid, privateTradeId, publicTradeId, isPrivate) {

    // If the user was previously muted, wait for a random amount of time and respond with false
    if (mutedUsers.has(tradingUserId)) {
      await Helpers.wait(Math.random() * 15000);
      return false;
    }

    // Complete the private and public trade IDs
    const fullPrivateTradeId = privateTradeId + randomID();
    const fullPublicTradeId = publicTradeId + randomID();

    const tradingUser = game.users.get(tradingUserId);
    const tradingActor = Utilities.getActor(tradingActorUuid);

    // Make em pick an actor (if more than one) and accept/decline/mute
    const result = await TradeRequestDialog.show({ tradeId: privateTradeId, tradingUser, tradingActor, isPrivate });

    if (!result) return false;

    if (result === "cancelled") {
      return "cancelled";
    }

    // If muted, add user to blacklist locally
    if (result === "mute") {
      mutedUsers.push(tradingUserId);
      return false;
    }

    const actor = result.actor ?? result;

    if (actor === tradingActor) {
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.SameActor"), true);
      return "same-actor";
    }

    const store = new TradeStore(tradingUserId, {
      user: game.user, actor
    }, {
      user: tradingUser, actor: tradingActor
    }, fullPublicTradeId, fullPrivateTradeId, isPrivate);

    const app = new TradingApp(store, this.getAppOptions(actor).tradeApp).render(true);

    ongoingTrades.set(fullPublicTradeId, { app, store });

    actor.sheet.render(true, this.getAppOptions(actor).actorSheet);

    return {
      fullPrivateTradeId, fullPublicTradeId, actorUuid: result.uuid
    };

  }

  static getAppOptions(actor) {
    const midPoint = (window.innerWidth / 2) - 200;
    return {
      actorSheet: { left: midPoint - actor.sheet.position.width - 25 }, tradeApp: { left: midPoint + 25 }
    }
  }

  static async _tradeCancelled(userId, privateTradeId) {

    TJSDialog.prompt({
      title: game.i18n.localize("ITEM-PILES.Trade.Title"), content: {
        class: CustomDialog, props: {
          header: game.i18n.localize("ITEM-PILES.Trade.Title"),
          content: game.i18n.format("ITEM-PILES.Trade.CancelledRequest.Content", { user_name: game.users.get(userId).name }),
          icon: "fas fa-exclamation-triangle"
        }
      }, modal: true, draggable: false, options: {
        height: "auto"
      }
    });

    return TradeRequestDialog.cancel(privateTradeId);

  }

  static async _requestTradeData({ tradeId, tradeUser } = {}) {

    const ongoingTrade = this._getOngoingTrade(tradeId);
    if (ongoingTrade) {
      return ongoingTrade.store.export();
    }

    const user = game.users.get(tradeUser);
    if (!user?.active) {
      return false;
    }

    const ongoingTradeData = await ItemPileSocket.executeAsUser(ItemPileSocket.HANDLERS.REQUEST_TRADE_DATA, tradeUser, tradeId, game.user.id);
    if (!ongoingTradeData) {
      return false;
    }

    return ongoingTradeData;

  }

  static async _spectateTrade({ tradeId, tradeUser } = {}) {

    const existingApp = TradingApp.getActiveApp(tradeId);
    if (existingApp) {
      return existingApp.render(false, { focus: true });
    }

    const ongoingTradeData = await this._requestTradeData({ tradeId, tradeUser });
    if (!ongoingTradeData) {
      if (Helpers.isGMConnected()) {
        ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
      }
      return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Over"), true);
    }

    const store = TradeStore.import(...ongoingTradeData);

    const app = new TradingApp(store).render(true);

    ongoingTrades.set(store.publicTradeId, { app, store });

  }

  static async _respondActiveTradeData(tradeId, requesterId) {
    const trade = this._getOngoingTrade(tradeId, requesterId);
    if (!trade) return;
    return trade.store.export();
  }

  static _getOngoingTrade(tradeId, requesterId = game.user.id) {
    if (!ongoingTrades.has(tradeId)) return false;
    const trade = ongoingTrades.get(tradeId);
    if (!trade.store.isPrivate) {
      return trade;
    }
    if (trade.store.leftTraderUser.id !== requesterId && trade.store.rightTraderUser.id !== requesterId) return false;
    return trade;
  }

  static async _updateItems(tradeId, userId, items) {
    const trade = this._getOngoingTrade(tradeId);
    if (!trade) return;
    trade.store.updateItems(userId, items);
  }

  static async _updateItemCurrencies(tradeId, userId, items) {
    const trade = this._getOngoingTrade(tradeId);
    if (!trade) return;
    trade.store.updateItemCurrencies(userId, items);
  }

  static async _updateCurrencies(tradeId, userId, currencies) {
    const trade = this._getOngoingTrade(tradeId);
    if (!trade) return;
    trade.store.updateCurrencies(userId, currencies);
  }

  static async _updateAcceptedState(tradeId, userId, status) {
    const trade = this._getOngoingTrade(tradeId);
    if (!trade) return;
    trade.store.updateAcceptedState(userId, status);
    if (userId === game.user.id && (trade.store.leftTraderUser.id === game.user.id || trade.store.rightTraderUser.id === game.user.id)) {
      if (trade.store.tradeIsAccepted) {
        setTimeout(async () => {
          if (trade.store.tradeIsAccepted) {
            ItemPileSocket.executeForUsers(
              ItemPileSocket.HANDLERS.EXECUTE_TRADE,
              [trade.store.leftTraderUser.id, trade.store.rightTraderUser.id],
              trade.store.publicTradeId,
              trade.store.privateTradeId,
              userId);
          }
        }, 2000);
      }
    }
  }

  static async _userDisconnected() {
    const tradesToDelete = [];
    const activeUsers = game.users.filter(user => user.active);
    for (let [tradeId, trade] of ongoingTrades) {
      const foundLeft = activeUsers.find(u => u === trade.store.leftTraderUser);
      const foundRight = activeUsers.find(u => u === trade.store.rightTraderUser);
      if (foundLeft && foundRight) continue;
      tradesToDelete.push(tradeId);
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true);
      await trade.app.close({ callback: true });
      if (foundLeft === game.user || foundRight === game.user) {
        if (Helpers.isGMConnected()) {
          await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
        }
      }
    }
    tradesToDelete.forEach(tradeId => ongoingTrades.delete(tradeId));
  }

  static async _tradeClosed(tradeId, closeUserId) {
    const trade = this._getOngoingTrade(tradeId);
    if (!trade) return;

    if (trade.store.leftTraderUser.id === game.user.id || trade.store.rightTraderUser.id === game.user.id) {

      if (closeUserId === trade.store.rightTraderUser.id) {

        TJSDialog.prompt({
          title: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"), content: {
            class: CustomDialog, props: {
              header: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
              content: game.i18n.format("ITEM-PILES.Trade.Closed.Them", {
                user_name: trade.store.rightTraderUser.name
              }),
              icon: "fas fa-exclamation-triangle",
            }
          }, modal: false, draggable: true, options: {
            height: "auto"
          }
        });

      } else {

        if (trade.store.isPrivate) {
          const otherUserId = trade.store.leftTraderUser.id === game.user.id ? trade.store.rightTraderUser.id : trade.store.leftTraderUser.id;
          ItemPileSocket.executeAsUser(ItemPileSocket.HANDLERS.TRADE_CLOSED, otherUserId, tradeId, game.user.id);
        } else {
          ItemPileSocket.executeForOthers(ItemPileSocket.HANDLERS.TRADE_CLOSED, tradeId, game.user.id);
        }

        TJSDialog.prompt({
          title: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"), content: {
            class: CustomDialog, props: {
              header: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
              content: game.i18n.format("ITEM-PILES.Trade.Closed.You"),
              icon: "fas fa-exclamation-triangle",
            }
          }, modal: false, draggable: true, options: {
            height: "auto"
          }
        });

        if (Helpers.isGMConnected()) {
          await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
        }
      }

    } else {

      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Closed.Someone"), true);

    }

    trade.app.close({ callback: true });
    ongoingTrades.delete(tradeId);
  }

  static async _executeTrade(tradeId, privateId, userId) {
    const trade = this._getOngoingTrade(tradeId);
    if (!trade) return;
    if (trade.store.privateTradeId !== privateId) return;
    const updates = trade.store.getTradeData();

    const itemsToAdd = updates.add.items.map(entry => {
      const itemData = updates.targetActor.items.get(entry.id).toObject();
      return Utilities.setItemQuantity(itemData, entry.quantity, true);
    });

    const itemsToRemove = updates.remove.items.map(entry => {
      const itemData = updates.sourceActor.items.get(entry.id).toObject();
      return Utilities.setItemQuantity(itemData, entry.quantity, true);
    });

    const transaction = new Transaction(updates.sourceActor);
    await transaction.appendItemChanges(itemsToAdd);
    await transaction.appendItemChanges(itemsToRemove, { remove: true });
    await transaction.appendActorChanges(updates.add.attributes);
    await transaction.appendActorChanges(updates.remove.attributes, { remove: true });
    await transaction.commit();

    if (trade.store.isPrivate) {
      trade.app.close({ callback: true });
      ongoingTrades.delete(tradeId);
    } else if (userId === game.user.id) {
      if (Helpers.isGMConnected()) {
        await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
      }
      return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.TRADE_COMPLETED, tradeId, updates);
    }
  }

  static async _tradeCompleted(tradeId) {
    const trade = this._getOngoingTrade(tradeId);
    if (!trade) return;
    const data = trade.store.export();
    ItemPileSocket.executeForEveryone(
      ItemPileSocket.HANDLERS.CALL_HOOK,
      CONSTANTS.HOOKS.TRADE.COMPLETE,
      trade.store.instigator,
      data[0],
      data[1],
      tradeId,
      trade.store.isPrivate
    )
    trade.app.close({ callback: true });
    ongoingTrades.delete(tradeId);
  }

}

