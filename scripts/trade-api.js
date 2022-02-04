import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import * as lib from "./lib/lib.js";
import { TradeRequestDialog, TradePromptDialog } from "./formapplications/trade-dialogs.js";
import { TradingApp } from "./formapplications/trading-app.js";
import API from "./api.js";

export class TradeAPI {

    static async promptUser(user = false){

        // Grab all of the active users (not self)
        const users = game.users.filter(user => user.active && user !== game.user);

        // No users!
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
        let actor;

        // Find actors you own
        const actors = game.actors.filter(actor => actor.isOwner);

        // If you only own one actor, and the user was already preselected (through the right click menu in the actors list)
        if(actors.length === 1 && user){
            userId = user.id;
            actor = actors[0];
        }else {
            // If you have more than 1 owned actor, prompt to choose which one
            const result = await TradePromptDialog.show({ actors, users, user });
            if (!result) return;
            userId = result.userId;
            actor = result.actor;
        }

        if(!actor) return false;

        actor = actor?.actor ?? actor;

        const actorOwner = game.users.find(user => user.character === actor && user !== game.user);
        if(actorOwner){
            // If you're not the only owner of the actor you chose, make sure you picked the correct one
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
                        itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_REQUEST_CANCELLED, userId, game.user.id, privateTradeId);
                    }
                }
            }
        }, {
            top: 50,
            width: 300
        }).render(true);

        // Send out the request
        return itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_REQUEST_PROMPT, userId, game.user.id, actor.uuid, privateTradeId, publicTradeId)
            .then(async (data) => {

                if(data === "cancelled") return;

                cancelDialog.close();

                // If they declined, show warning
                if(!data || !data.fullPrivateTradeId.includes(privateTradeId)){
                    return lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Declined"), true);
                }

                let traderActor = await fromUuid(data.actorUuid);
                traderActor = traderActor?.actor ?? traderActor;

                // Otherwise, open trade interface and spawn private trade instance
                new TradingApp({ user: game.user, actor }, { user: game.users.get(userId), actor: traderActor }, data.fullPublicTradeId,  data.fullPrivateTradeId).render(true);
                ongoingTrades[data.fullPrivateTradeId] = new OngoingTrade({ user: game.user, actor }, { user: game.users.get(userId), actor: traderActor }, data.fullPublicTradeId, data.fullPrivateTradeId);

            }).catch((err) => {
                console.log(err);
                // If the counterparty disconnected, show that and close dialog
                lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true);
                cancelDialog.close()
            });

    }

    static async _respondPrompt(tradingUserId, tradingActorUuid, privateTradeId, publicTradeId){

        // If the user was previously muted, wait for a random amount of time and respond with false
        if(mutedUsers.find(u => u === tradingUserId)){
            await lib.wait(Math.random() * 10000);
            return false;
        }

        // Complete the private and public trade IDs
        const fullPrivateTradeId = privateTradeId + randomID();
        const fullPublicTradeId = publicTradeId + randomID();

        const tradingUser = game.users.get(tradingUserId);
        let tradingActor = await fromUuid(tradingActorUuid);

        tradingActor = tradingActor?.actor ?? tradingActor;

        // Make em pick an actor (if more than one) and accept/decline/mute
        const result = await TradeRequestDialog.show({ tradeId: privateTradeId, tradingUser, tradingActor });

        if(!result) return false;

        if(result === "cancelled"){
            return "cancelled";
        }

        // If muted, add user to blacklist locally
        if(result === "mute"){
            mutedUsers.push(tradingUserId);
            return false;
        }

        const actor = result?.actor ?? result;

        // Spawn trading app and new ongoing trade interface
        new TradingApp({ user: game.user, actor }, { user: tradingUser, actor: tradingActor }, fullPublicTradeId, fullPrivateTradeId).render(true);
        ongoingTrades[fullPrivateTradeId] = new OngoingTrade({ user: game.user, actor }, { user: tradingUser, actor: tradingActor }, fullPublicTradeId, fullPrivateTradeId);

        return {
            fullPrivateTradeId,
            fullPublicTradeId,
            actorUuid: result.uuid
        };

    }

    static async _tradeCancelled(userId, privateTradeId){

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

        return TradeRequestDialog.cancel(privateTradeId);

    }

    static async _updateItems(privateTradeId, userId, items){
        if(!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].updateItems(userId, items);
    }

    static async _updateCurrencies(privateTradeId, userId, items){
        if(!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].updateCurrencies(userId, items);
    }

    static async _setAcceptedState(privateTradeId, userId, status){
        if(!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].setAcceptedState(userId, status);
    }

    static async _tradeClosed(privateTradeId){
        if(!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].tradeClosed();
    }

    static async _tradeCompleted(party_1, party_2){

        if(party_1.items.length) {
            const items = party_1.items.map(item => {
                return { _id: item.id, quantity: item.quantity, item: item.data }
            })
            const itemsAdded = await API._addItems(party_2.actor, items, party_1.user, { isTransfer: true });
            const itemsRemoved = await API._removeItems(party_1.actor, items, party_1.user, { isTransfer: true });
        }

        if(party_2.items.length) {
            const items = party_2.items.map(item => {
                return { _id: item.id, quantity: item.quantity, item: item.data }
            })
            const itemsAdded = await API._addItems(party_1.actor, items, party_2.user, { isTransfer: true });
            const itemsRemoved = await API._removeItems(party_2.actor, items, party_2.user, { isTransfer: true });
        }

        if(party_1.currencies.length) {
            const currencies = Object.fromEntries(party_1.currencies.map(currency => {
                return [currency.path, currency.quantity];
            }));
            const currenciesAdded = await API._addAttributes(party_2.actor, currencies, party_1.user, { isTransfer: true });
            const currenciesRemoved = await API._removeAttributes(party_1.actor, currencies, party_1.user, { isTransfer: true });
        }

        if(party_2.currencies.length) {
            const currencies = Object.fromEntries(party_2.currencies.map(currency => {
                return [currency.path, currency.quantity];
            }));
            const currenciesAdded = await API._addAttributes(party_1.actor, currencies, party_2.user, { isTransfer: true });
            const currenciesRemoved = await API._removeAttributes(party_2.actor, currencies, party_2.user, { isTransfer: true });
        }

    }

}

const mutedUsers = [];
const ongoingTrades = {};

class OngoingTrade{

    constructor(self, rightTrader, publicTradeId, privateTradeId) {

        this.actor = self.actor;
        this.user = self.user;
        this.actorItems = [];
        this.actorCurrencies = [];
        this.accepted = false;

        this.traderActor = rightTrader.actor;
        this.traderUser = rightTrader.user;
        this.traderActorItems = [];
        this.traderActorCurrencies = [];
        this.traderAccepted = false;

        this.privateTradeId = privateTradeId;
        this.publicTradeId = publicTradeId;

        this.userHook = Hooks.on("renderPlayerList", this.userDisconnected.bind(this));

    }

    userDisconnected(app, html, data){
        if(!data.users.find(u => u === this.traderUser)){
            Hooks.off("renderPlayerList", this.userHook);
            this.tradeClosed();
        }
    }

    async tradeClosed(){
        delete ongoingTrades[this.privateTradeId];
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.PUBLIC.TRADE_CLOSED, this.publicTradeId, this.traderUser.id);
    }

    updateItems(userId, newItems){
        this.accepted = false;
        this.traderAccepted = false;
        if(userId === this.user.id){
            this.actorItems = newItems;
        }else if(userId === this.traderUser.id){
            this.traderActorItems = newItems;
        }
    }

    updateCurrencies(userId, newItems){
        this.accepted = false;
        this.traderAccepted = false;
        if(userId === this.user.id){
            this.actorCurrencies = newItems;
        }else if(userId === this.traderUser.id){
            this.traderActorCurrencies = newItems;
        }
    }

    setAcceptedState(userId, status){
        if(userId === this.user.id){
            this.accepted = status;
        }else if(userId === this.traderUser.id){
            this.traderAccepted = status;
        }
        if (this.accepted && this.traderAccepted && game.user.id === userId) {
            setTimeout(() => {
                if (this.accepted && this.traderAccepted) {
                    this.execute();
                    itemPileSocket.executeForEveryone(SOCKET_HANDLERS.PUBLIC.TRADE_ACCEPTED, this.publicTradeId);
                }
            }, 2000);
        }
    }

    async execute(){
        delete ongoingTrades[this.privateTradeId];

        Hooks.off("renderPlayerList", this.userHook);

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.TRADE_COMPLETED,
            {
                user: this.user.id,
                actor: this.actor.uuid,
                items: this.actorItems,
                currencies: this.actorCurrencies
            },
            {
                user: this.traderUser.id,
                actor: this.traderActor.uuid,
                items: this.traderActorItems,
                currencies: this.traderActorCurrencies
            });
    }
}