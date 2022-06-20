import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import * as Helpers from "./helpers/helpers.js";
import ItemPileSocket from "./socket.js";
import { TradePromptDialog } from "./applications/trade-dialogs/trade-dialogs.js";
import CustomDialog from "./applications/components/CustomDialog.svelte";

export default class TradeAPI {
  
  static async _requestTrade(user = false) {
    
    // Grab all of the active users (not self)
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
      userId = result.userId;
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
        
        /*if (data === "cancelled") return;
        
        cancelDialog.close();
        
        // If they declined, show warning
        if (!data || !data.fullPrivateTradeId.includes(privateTradeId)) {
          return custom_warning(game.i18n.localize("ITEM-PILES.Trade.Declined"), true);
        }
        
        let traderActor = await fromUuid(data.actorUuid);
        traderActor = traderActor?.actor ?? traderActor;
        
        // Otherwise, open trade interface and spawn private trade instance
        new TradingApp({ user: game.user, actor }, {
          user: game.users.get(userId),
          actor: traderActor
        }, data.fullPublicTradeId, data.fullPrivateTradeId, isPrivate).render(true, this.getAppOptions(actor).tradeApp);
        ongoingTrades[data.fullPrivateTradeId] = new OngoingTrade({
          user: game.user,
          actor
        }, {
          user: game.users.get(userId),
          actor: traderActor
        }, data.fullPublicTradeId, data.fullPrivateTradeId, isPrivate);
        
        actor.sheet.render(true, this.getAppOptions(actor).actorSheet);
        
        if (isPrivate) {
          return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.CALL_HOOK, [game.user.id, userId], HOOKS.TRADE.STARTED, {
            user: game.user.id,
            actor: actor.uuid
          }, { user: userId, actor: data.actorUuid }, data.fullPublicTradeId, isPrivate);
        }
        
        return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, HOOKS.TRADE.STARTED, {
          user: game.user.id,
          actor: actor.uuid
        }, { user: userId, actor: data.actorUuid }, data.fullPublicTradeId, isPrivate);*/
        
      }).catch((err) => {
        // If the counterparty disconnected, show that and close dialog
        custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true);
        cancelDialog.close()
      });
    
  }
  
}