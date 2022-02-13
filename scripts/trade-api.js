import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";
import * as lib from "./lib/lib.js";
import { TradePromptDialog, TradeRequestDialog } from "./formapplications/trade-dialogs.js";
import { TradingApp } from "./formapplications/trading-app.js";
import API from "./api.js";
import HOOKS from "./hooks.js";

export class TradeAPI {

    static async requestTrade(user = false) {

        // Grab all of the active users (not self)
        const users = game.users.filter(user => user.active && user !== game.user);

        // No users!
        if (!users.length) {
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
            // If you're not the only owner of the actor you chose, make sure you picked the correct one
            const doContinue = await Dialog.confirm({
                title: game.i18n.localize("ITEM-PILES.Trade.Title"),
                content: lib.dialogLayout({
                    message: actorOwner.active
                        ? game.i18n.format("ITEM-PILES.Trade.UserActiveCharacterWarning", {
                            actor_name: actor.name,
                            player_name: actorOwner.name
                        })
                        : game.i18n.format("ITEM-PILES.Trade.UserCharacterWarning", {
                            actor_name: actor.name,
                            player_name: actorOwner.name
                        })
                }),
                defaultYes: false
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
                        itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_REQUEST_CANCELLED, userId, game.user.id, privateTradeId);
                    }
                }
            }
        }, {
            top: 50,
            width: 300
        }).render(true);

        // Send out the request
        return itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_REQUEST_PROMPT, userId, game.user.id, actor.uuid, privateTradeId, publicTradeId, isPrivate)
            .then(async (data) => {

                if (data === "cancelled") return;

                cancelDialog.close();

                // If they declined, show warning
                if (!data || !data.fullPrivateTradeId.includes(privateTradeId)) {
                    return lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Declined"), true);
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
                    return itemPileSocket.executeForUsers(SOCKET_HANDLERS.CALL_HOOK, [game.user.id, userId], HOOKS.TRADE.STARTED, {
                        user: game.user.id,
                        actor: actor.uuid
                    }, { user: userId, actor: data.actorUuid }, data.fullPublicTradeId, isPrivate);
                }

                return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.TRADE.STARTED, {
                    user: game.user.id,
                    actor: actor.uuid
                }, { user: userId, actor: data.actorUuid }, data.fullPublicTradeId, isPrivate);

            }).catch((err) => {
                // If the counterparty disconnected, show that and close dialog
                lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true);
                cancelDialog.close()
            });

    }

    static async _respondPrompt(tradingUserId, tradingActorUuid, privateTradeId, publicTradeId, isPrivate) {

        // If the user was previously muted, wait for a random amount of time and respond with false
        if (mutedUsers.find(u => u === tradingUserId)) {
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

        const actor = result?.actor ?? result;

        // Spawn trading app and new ongoing trade interface
        new TradingApp({ user: game.user, actor }, {
            user: tradingUser,
            actor: tradingActor
        }, fullPublicTradeId, fullPrivateTradeId, isPrivate).render(true, this.getAppOptions(actor).tradeApp);
        ongoingTrades[fullPrivateTradeId] = new OngoingTrade({ user: game.user, actor }, {
            user: tradingUser,
            actor: tradingActor
        }, fullPublicTradeId, fullPrivateTradeId, isPrivate);

        actor.sheet.render(true, this.getAppOptions(actor).actorSheet);

        return {
            fullPrivateTradeId,
            fullPublicTradeId,
            actorUuid: result.uuid
        };

    }

    static getAppOptions(actor) {
        const midPoint = (window.innerWidth / 2) - 200;
        return {
            actorSheet: { left: midPoint - actor.sheet.position.width - 25 },
            tradeApp: { left: midPoint + 25 }
        }
    }

    static async _tradeCancelled(userId, privateTradeId) {

        Dialog.prompt({
            title: game.i18n.localize("ITEM-PILES.Trade.Title"),
            content: lib.dialogLayout({
                message: game.i18n.format("ITEM-PILES.Trade.CancelledRequest.Content", { user_name: game.users.get(userId).name })
            }),
            callback: () => {
            },
            options: {
                width: 300
            }
        });

        return TradeRequestDialog.cancel(privateTradeId);

    }

    static async spectateTrade(data) {

        const { tradeId, tradeUser } = data;

        if (TradingApp.getAppByPublicTradeId(tradeId)) {
            return TradingApp.getAppByPublicTradeId(tradeId).render(false, { focus: true });
        }

        const user = game.users.get(tradeUser);

        if (!user.active) {
            itemPileSocket.executeAsGM(SOCKET_HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
            return lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Over"), true);
        }

        const ongoingTrade = await itemPileSocket.executeAsUser(SOCKET_HANDLERS.TRADE_SPECTATE, tradeUser, tradeId);

        if (!ongoingTrade) {
            itemPileSocket.executeAsGM(SOCKET_HANDLERS.DISABLE_CHAT_TRADE_BUTTON, tradeId);
            return lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Over"), true);
        }

        ongoingTrade[0].user = game.users.get(ongoingTrade[0].user);
        ongoingTrade[0].actor = await fromUuid(ongoingTrade[0].actor);

        ongoingTrade[1].user = game.users.get(ongoingTrade[1].user);
        ongoingTrade[1].actor = await fromUuid(ongoingTrade[1].actor);

        return new TradingApp(...ongoingTrade).render(true);

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

    static async _updateItems(privateTradeId, userId, items) {
        if (!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].updateItems(userId, items);
    }

    static async _updateCurrencies(privateTradeId, userId, items) {
        if (!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].updateCurrencies(userId, items);
    }

    static async _setAcceptedState(privateTradeId, userId, status) {
        if (!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].setAcceptedState(userId, status);
    }

    static async _tradeClosed(privateTradeId) {
        if (!ongoingTrades[privateTradeId]) return;
        return ongoingTrades[privateTradeId].tradeClosed();
    }

    static async _tradeCompleted(party_1, party_2, publicTradeId, isPrivate) {
        if (!lib.isResponsibleGM()) return;

        if (party_1.items.length) {
            const items = party_1.items.map(item => {
                return { _id: item.id, quantity: item.quantity, item: item.data }
            })
            await API._addItems(party_2.actor, items, party_1.user, { runHooks: false });
            await API._removeItems(party_1.actor, items, party_1.user, { runHooks: false });
        }

        if (party_2.items.length) {
            const items = party_2.items.map(item => {
                return { _id: item.id, quantity: item.quantity, item: item.data }
            })
            await API._addItems(party_1.actor, items, party_2.user, { runHooks: false });
            await API._removeItems(party_2.actor, items, party_2.user, { runHooks: false });
        }

        if (party_1.currencies.length) {
            const currencies = Object.fromEntries(party_1.currencies.map(currency => {
                return [currency.path, currency.quantity];
            }));
            await API._addAttributes(party_2.actor, currencies, party_1.user, { runHooks: false });
            await API._removeAttributes(party_1.actor, currencies, party_1.user, { runHooks: false });
        }

        if (party_2.currencies.length) {
            const currencies = Object.fromEntries(party_2.currencies.map(currency => {
                return [currency.path, currency.quantity];
            }));
            await API._addAttributes(party_1.actor, currencies, party_2.user, { runHooks: false });
            await API._removeAttributes(party_2.actor, currencies, party_2.user, { runHooks: false });
        }

        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.CALL_HOOK, HOOKS.TRADE.COMPLETE, party_1, party_2, publicTradeId, isPrivate);

    }

}

const mutedUsers = [];
const ongoingTrades = {};

export class OngoingTrade {

    constructor(self, rightTrader, publicTradeId, privateTradeId, isPrivate) {

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

        this.isPrivate = isPrivate;

        this.userHook = Hooks.on("renderPlayerList", this.userDisconnected.bind(this));

    }

    static getActiveTrade(publicId) {
        return Object.entries(ongoingTrades).find(trade => {
            return trade[1].publicTradeId === publicId;
        })
    }

    userDisconnected(app, html, data) {
        if (!data.users.find(u => u === this.traderUser)) {
            this.tradeClosed();
            if (!this.isPrivate) {
                itemPileSocket.executeAsGM(SOCKET_HANDLERS.DISABLE_CHAT_TRADE_BUTTON, this.publicTradeId);
                itemPileSocket.executeForEveryone(SOCKET_HANDLERS.TRADE_CLOSED, this.publicTradeId, this.traderUser.id);
            } else {
                TradingApp._tradeClosed(this.publicTradeId, this.traderUser.id);
            }
        }
    }

    tradeClosed() {
        Hooks.off("renderPlayerList", this.userHook);
        delete ongoingTrades[this.privateTradeId];
    }

    updateItems(userId, newItems) {
        this.accepted = false;
        this.traderAccepted = false;
        if (userId === this.user.id) {
            this.actorItems = newItems;
        } else if (userId === this.traderUser.id) {
            this.traderActorItems = newItems;
        }
    }

    updateCurrencies(userId, newItems) {
        this.accepted = false;
        this.traderAccepted = false;
        if (userId === this.user.id) {
            this.actorCurrencies = newItems;
        } else if (userId === this.traderUser.id) {
            this.traderActorCurrencies = newItems;
        }
    }

    setAcceptedState(userId, status) {
        if (userId === this.user.id) {
            this.accepted = status;
        } else if (userId === this.traderUser.id) {
            this.traderAccepted = status;
        }
        if (this.accepted && this.traderAccepted) {
            setTimeout(() => {
                if (this.accepted && this.traderAccepted) {
                    this.execute(userId);
                }
            }, 2000);
        }
    }

    async execute(userId) {

        this.tradeClosed();

        if (game.user.id !== userId) return;

        const args = [
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
            },
            this.publicTradeId,
            this.isPrivate
        ]

        if (this.isPrivate) {
            return itemPileSocket.executeForUsers(SOCKET_HANDLERS.TRADE_COMPLETED, [this.user.id, this.traderUser.id], ...args);
        }

        await itemPileSocket.executeAsGM(SOCKET_HANDLERS.DISABLE_CHAT_TRADE_BUTTON, this.publicTradeId);
        return itemPileSocket.executeForEveryone(SOCKET_HANDLERS.TRADE_COMPLETED, ...args);
    }
}