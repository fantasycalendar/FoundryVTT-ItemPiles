import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import * as lib from "./lib/lib.js";
import { TradeRequestDialog, TradePromptDialog } from "./formapplications/trade-dialogs.js";

export class TradeAPI {

    static async promptUser(user = false){

        const users = game.users.filter(user => user.active && user !== game.user);

        if(!users.length){
            return new Dialog({
                title: game.i18n.localize("ITEM-PILES.Trade.Title"),
                content: lib.dialogLayout({
                    title: game.i18n.localize("ITEM-PILES.Trade.NoActiveUsers.Title"),
                    message: game.i18n.localize("ITEM-PILES.Trade.NoActiveUsers.Content"),
                    icon: "fas fa-heart-broken"
                }),
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("Okay")
                    }
                }
            }).render(true);
        }

        let userId;
        let actorUuid;

        const actors = game.actors.filter(actor => actor.isOwner);
        if(actors.length === 1 && user){
            userId = user.id;
            actorUuid = actors[0].uuid;
        }else {
            const result = await TradePromptDialog.show({ actors, users, user });
            if (!result) return;
            userId = result.userId;
            actorUuid = result.actorUuid;
        }

        const actor = await fromUuid(actorUuid);
        const actorOwner = game.users.find(user => user.character === actor && user !== game.user);
        if(actorOwner){
            const doContinue = await Dialog.confirm({
                title: game.i18n.localize("ITEM-PILES.Trade.Title"),
                content: lib.dialogLayout({
                    message: actorOwner.active
                        ? game.i18n.format("ITEM-PILES.Trade.UserCharacterWarning", { actor_name: actor.name, player_name: actorOwner.name })
                        : game.i18n.format("ITEM-PILES.Trade.UserActiveCharacterWarning", { actor_name: actor.name, player_name: actorOwner.name })
                }),
                defaultYes: false
            });
            if(!doContinue){
                return;
            }
        }

        if(!actorUuid) return false;

        const tradeId = randomID();

        const cancel = Dialog.prompt({
            title: game.i18n.localize("ITEM-PILES.Trade.Title"),
            content: `<p style="text-align: center">${game.i18n.format("ITEM-PILES.Trade.OngoingRequest.Content", { user_name: game.users.get(userId).name })}</p>`,
            label: game.i18n.localize("ITEM-PILES.Trade.OngoingRequest.Label"),
            callback: () => { return true },
            options: {
                top: 50,
                width: 300
            }
        });

        let response = itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_PROMPT, userId, game.user.id, actorUuid, tradeId);

        cancel.then((result) => {
            if(!result) return;
            response = null;
            itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_CANCELLED, userId, game.user.id, tradeId);
        })

        response.then(() => {

            if(!response || !response.includes(tradeId)) return false;

            itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_ACCEPTED, userId, game.user.id, tradeId);

        })

    }

    static async _respondPrompt(tradingUserId, tradingActorUuid, tradeId){

        const fullTradeId = tradeId + randomID();

        const tradingUser = game.users.get(tradingUserId);
        const tradingActor = await fromUuid(tradingActorUuid);

        await TradeRequestDialog.show({ tradeId, tradingUser, tradingActor });

        return fullTradeId;

    }

    static async _tradeCancelled(userId, tradeId){

        Dialog.prompt({
            title: game.i18n.localize("ITEM-PILES.Trade.Title"),
            content: lib.dialogLayout({
                message: game.i18n.format("ITEM-PILES.Trade.CancelledRequest.Content", { user_name: game.users.get(userId).name })
            }),
            callback: () => {},
            options: {
                width: 300
            }
        });

        return TradeRequestDialog.cancel(tradeId);

    }

}