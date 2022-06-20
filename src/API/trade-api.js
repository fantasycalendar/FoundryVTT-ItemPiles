import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import CustomDialog from "../applications/components/CustomDialog.svelte";
import { TradePromptDialog, TradeRequestDialog } from "../applications/trade-dialogs/trade-dialogs.js";

import ItemPileSocket from "../socket.js";
import * as Helpers from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import HOOKS from "../constants/hooks.js";
import TradingStore from "../applications/trading-interface/trading-store.js";
import TradingApp from "../applications/trading-interface/trading-app.js";

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
        title: game.i18n.localize("ITEM-PILES.Trade.Title"),
        content: {
          class: CustomDialog,
          props: {
            header: game.i18n.localize("ITEM-PILES.Trade.NoActiveUsers.Title"),
            content: game.i18n.localize("ITEM-PILES.Trade.NoActiveUsers.Content"),
            icon: "fas fa-heart-broken"
          }
        },
        modal: true,
        draggable: false,
        options: {
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
    
    actor = actor?.actor ?? actor;
    
    const actorOwner = game.users.find(user => user.character === actor && user !== game.user);
    if (actorOwner) {
      
      const doContinue = TJSDialog.confirm({
        title: game.i18n.localize("ITEM-PILES.Trade.Title"),
        content: {
          class: CustomDialog,
          props: {
            header: game.i18n.localize("ITEM-PILES.Trade.Title"),
            content: actorOwner.active
              ? game.i18n.format("ITEM-PILES.Trade.UserActiveCharacterWarning", {
                actor_name: actor.name,
                player_name: actorOwner.name
              })
              : game.i18n.format("ITEM-PILES.Trade.UserCharacterWarning", {
                actor_name: actor.name,
                player_name: actorOwner.name
              }),
            icon: "fas fa-exclamation-triangle",
          }
        },
        modal: true,
        draggable: false,
        rejectClose: false,
        defaultYes: true,
        options: {
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
      top: 50,
      width: 300
    }).render(true);
    
    // Send out the request
    return ItemPileSocket.executeAsUser(ItemPileSocket.HANDLERS.TRADE_REQUEST_PROMPT, userId, game.user.id, actor.uuid, privateTradeId, publicTradeId, isPrivate)
      .then(async (data) => {
        
        if (data === "cancelled") return;
        cancelDialog.close();
        
        // If they declined, show warning
        if (!data || !data.fullPrivateTradeId.includes(privateTradeId)) {
          return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Declined"), true);
        }
        
        const traderActor = Utilities.getActor(data.actorUuid);
        
        const store = new TradingStore({
          user: game.user,
          actor
        }, {
          user: game.users.get(userId),
          actor: traderActor
        }, data.fullPublicTradeId, data.fullPrivateTradeId, isPrivate);
        
        const app = new TradingApp(store).render(true);
        
        ongoingTrades.set(data.fullPublicTradeId, app);
        
        actor.sheet.render(true);
        
        if (isPrivate) {
          return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.CALL_HOOK, [game.user.id, userId], HOOKS.TRADE.STARTED, {
            user: game.user.id,
            actor: actor.uuid
          }, { user: userId, actor: data.actorUuid }, data.fullPublicTradeId, isPrivate);
        }
        
        return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.TRADE.STARTED, {
          user: game.user.id,
          actor: actor.uuid
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
    let tradingActor = Utilities.fromUuidFast(tradingActorUuid);
    
    tradingActor = tradingActor?.actor ?? tradingActor;
    
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
    
    const store = new TradingStore({ user: game.user, actor }, {
      user: tradingUser,
      actor: tradingActor
    }, fullPublicTradeId, fullPrivateTradeId, isPrivate);
    
    const app = new TradingApp(store).render(true);
    
    ongoingTrades.set(fullPublicTradeId, app);
    
    actor.sheet.render(true);
    
    return {
      fullPrivateTradeId,
      fullPublicTradeId,
      actorUuid: result.uuid
    };
    
  }
  
  static async _tradeCancelled(userId, privateTradeId) {
    
    TJSDialog.prompt({
      title: game.i18n.localize("ITEM-PILES.Trade.Title"),
      content: {
        class: CustomDialog,
        props: {
          header: game.i18n.localize("ITEM-PILES.Trade.Title"),
          content: game.i18n.format("ITEM-PILES.Trade.CancelledRequest.Content", { user_name: game.users.get(userId).name }),
          icon: "fas fa-exclamation-triangle"
        }
      },
      modal: true,
      draggable: false,
      options: {
        height: "auto"
      }
    });
    
    return TradeRequestDialog.cancel(privateTradeId);
    
  }
  
  static async spectateTrade(data) {
    
    // const { tradeId, tradeUser } = data;
    //
    // if (TradingApp.getAppByPublicTradeId(tradeId)) {
    //   return TradingApp.getAppByPublicTradeId(tradeId).render(false, { focus: true });
    // }
    //
    // const user = game.users.get(tradeUser);
    //
    // if (!user.active) {
    //   ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
    //   return custom_warning(game.i18n.localize("ITEM-PILES.Trade.Over"), true);
    // }
    //
    // const ongoingTrade = await ItemPileSocket.executeAsUser(ItemPileSocket.HANDLERS.TRADE_SPECTATE, tradeUser, tradeId);
    //
    // if (!ongoingTrade) {
    //   ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
    //   return custom_warning(game.i18n.localize("ITEM-PILES.Trade.Over"), true);
    // }
    //
    // ongoingTrade[0].user = game.users.get(ongoingTrade[0].user);
    // ongoingTrade[0].actor = await fromUuid(ongoingTrade[0].actor);
    //
    // ongoingTrade[1].user = game.users.get(ongoingTrade[1].user);
    // ongoingTrade[1].actor = await fromUuid(ongoingTrade[1].actor);
    //
    // return new TradingApp(...ongoingTrade).render(true);
    
  }
  
  static async _spectateTrade(tradeId) {
    const trade = OngoingTrade.getActiveTrade(tradeId);
    if (!trade) return false;
    return [
      {
        user: trade[1].user.id,
        actor: trade[1].actor.uuid,
        items: trade[1].actorItems,
        currencies: trade[1].actorCurrencies,
        accepted: trade[1].accepted
      },
      {
        user: trade[1].traderUser.id,
        actor: trade[1].traderActor.uuid,
        items: trade[1].traderActorItems,
        currencies: trade[1].traderActorCurrencies,
        accepted: trade[1].traderAccepted
      },
      tradeId
    ]
  }
  
  static getOngoingTrade(tradeId) {
    if (!ongoingTrades.has(tradeId)) return false;
    const tradeApp = ongoingTrades.get(tradeId);
    if (!tradeApp.store.isPrivate) {
      return tradeApp;
    }
    if (tradeApp.store.leftTraderUser !== game.user && tradeApp.store.rightTraderUser !== game.user) return false;
    return tradeApp;
  }
  
  static async _updateItems(tradeId, userId, items) {
    const tradeApp = this.getOngoingTrade(tradeId);
    if (!tradeApp) return;
    tradeApp.store.updateItems(userId, items);
  }
  
  static async _updateCurrencies(tradeId, userId, currencies) {
    const tradeApp = this.getOngoingTrade(tradeId);
    if (!tradeApp) return;
    tradeApp.store.updateCurrencies(userId, currencies);
  }
  
  static async _updateAcceptedState(tradeId, userId, status) {
    const tradeApp = this.getOngoingTrade(tradeId);
    if (!tradeApp) return;
    tradeApp.store.updateAcceptedState(userId, status);
    if (userId === game.user.id && (tradeApp.store.leftTraderUser.id === game.user.id || tradeApp.store.rightTraderUser.id === game.user.id)) {
      if (tradeApp.store.tradeIsAccepted) {
        setTimeout(async () => {
          if (tradeApp.store.tradeIsAccepted) {
            ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.EXECUTE_TRADE, [tradeApp.store.leftTraderUser.id, tradeApp.store.rightTraderUser.id], tradeId, userId);
          }
        }, 2000);
      }
    }
  }
  
  static async _userDisconnected(app, html, data) {
    const tradesToDelete = [];
    for (let [tradeId, application] of ongoingTrades) {
      const foundLeft = data.users.find(u => u === application.store.leftTraderUser);
      const foundRight = data.users.find(u => u === application.store.rightTraderUser);
      if (foundLeft && foundRight) continue;
      tradesToDelete.push(tradeId);
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true);
      application.close();
      if (foundLeft === game.user || foundRight === game.user) {
        await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
      }
    }
    tradesToDelete.forEach(tradeId => ongoingTrades.delete(tradeId));
  }
  
  static async _tradeClosed(tradeId, closeUserId) {
    const tradeApp = this.getOngoingTrade(tradeId);
    if (!tradeApp) return;
    
    if (tradeApp.store.leftTraderUser.id === game.user.id || tradeApp.store.rightTraderUser.id === game.user.id) {
      
      if (closeUserId === tradeApp.store.rightTraderUser.id) {
        
        TJSDialog.prompt({
          title: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
          content: {
            class: CustomDialog,
            props: {
              header: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
              content: game.i18n.format("ITEM-PILES.Trade.Closed.Them", {
                user_name: tradeApp.store.rightTraderUser.name
              }),
              icon: "fas fa-exclamation-triangle",
            }
          },
          modal: false,
          draggable: true,
          options: {
            height: "auto"
          }
        });
        
      } else {
        
        if (tradeApp.store.isPrivate) {
          ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
          ItemPileSocket.executeForOthers(ItemPileSocket.HANDLERS.TRADE_CLOSED, tradeId, game.user.id);
        } else {
          const otherUserId = tradeApp.store.leftTraderUser.id === game.user.id
            ? tradeApp.store.rightTraderUser.id
            : tradeApp.store.leftTraderUser.id;
          ItemPileSocket.executeAsUser(ItemPileSocket.HANDLERS.TRADE_CLOSED, otherUserId, tradeId, game.user.id);
        }
        
        TJSDialog.prompt({
          title: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
          content: {
            class: CustomDialog,
            props: {
              header: game.i18n.localize("ITEM-PILES.Trade.Closed.Title"),
              content: game.i18n.format("ITEM-PILES.Trade.Closed.You"),
              icon: "fas fa-exclamation-triangle",
            }
          },
          modal: false,
          draggable: true,
          options: {
            height: "auto"
          }
        });
        
        await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
      }
      
    } else {
      
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Closed.Someone"), true);
      
    }
    
    tradeApp.close({ callback: true });
    ongoingTrades.delete(tradeId);
  }
  
  static async _executeTrade(tradeId, userId) {
    const tradeApp = this.getOngoingTrade(tradeId);
    if (!tradeApp) return;
    const updates = tradeApp.store.getTradeData();
    
    // Todo: Actually implement each user updating the actor they own
    
    if (tradeApp.store.isPrivate) {
      tradeApp.close();
      ongoingTrades.delete(tradeId);
    } else if (userId === game.user.id) {
      return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.TRADE_COMPLETED, tradeId, updates);
    }
  }
  
  static async _tradeCompleted(tradeId, updates) {
    const tradeApp = this.getOngoingTrade(tradeId);
    if (!tradeApp) return;
    Hooks.callAll(HOOKS.TRADE.COMPLETE, updates, tradeId)
    tradeApp.close();
    ongoingTrades.delete(tradeId);
  }
  
}