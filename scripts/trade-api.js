import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import * as lib from "./lib/lib.js";
import { TradeRequestDialog, TradePromptDialog } from "./formapplications/trade-dialogs.js";

export class TradingAPI {

    static async prompt(){

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

        const result = await TradePromptDialog.show(users);
        if(!result) return;

        const { userId, actorUuid } = result;

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

        const response = await itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_PROMPT, userId, game.user.id, actorUuid, tradeId);

        if(!response || !response.id.includes(tradeId)) return false;

        console.log(response.id);

    }

    static async _respondPrompt(tradingUserId, tradingActorUuid, inTradeId){

        const tradeId = inTradeId + randomID();

        const tradingUser = game.users.get(tradingUserId);
        const tradingActor = await fromUuid(tradingActorUuid);

        TradeRequestDialog.show(tradingUser, tradingActor);

        return false;

    }

}