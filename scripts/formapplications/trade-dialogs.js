import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";

export class TradePromptDialog extends FormApplication {

    constructor(resolve, { actors = false, actor = false, users = false, user = false } = {}) {
        super();
        this.resolve = resolve;
        this.users = users || game.users.filter(user => user.active && user !== game.user);
        this.user = user || users?.[0] || false;
        this.actors = actors || game.actors.filter(actor => actor.isOwner);
        this.actor = actor || game.user.character || (!game.user.isGM ? this.actors?.[0] : false);
        this.isGM = game.user.isGM;

    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.Trade.Title"),
            classes: ["dialog"],
            template: `${CONSTANTS.PATH}templates/trade-dialog.html`,
            width: 400,
            height: "auto",
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-actor-container" }],
        });
    }

    static show({ actors = false, actor = false, users = false, user = false }) {
        return new Promise(resolve => {
            new TradePromptDialog(resolve, { actors, actor, users, user }).render(true);
        })
    }

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;

        html.find(".item-piles-actor-container").on("dragenter", function (event) {
            event = event.originalEvent || event;
            let newElement = document.elementFromPoint(event.pageX, event.pageY);
            if (!$.contains(this, newElement)) {
                $(this).addClass("item-piles-box-highlight");
            }
        })

        html.find(".item-piles-actor-container").on("dragleave", function (event) {
            event = event.originalEvent || event;
            let newElement = document.elementFromPoint(event.pageX, event.pageY);
            if (!$.contains(this, newElement)) {
                $(this).removeClass("item-piles-box-highlight");
            }
        })

        html.find(".item-piles-pick-selected-token").click(() => {
            if (canvas.tokens.controlled.length === 0) return;
            this.setActor(canvas.tokens.controlled[0].actor);
        });

        html.find('select[name="user"]').change(function () {
            const userId = $(this).val();
            self.user = game.users.get(userId);
        });

        html.find('input[name="private"]').change(function () {
            self.private = $(this).is(":checked");
        });

        html.find('.item-piles-change-actor').click(function () {
            $(this).hide();
            let select = $(this).parent().find('.item-piles-change-actor-select');
            select.insertAfter($(this));
            select.css('display', 'inline-block');
        });

        html.find(".item-piles-change-actor-select").change(async function () {
            $(this).css('display', 'none');
            html.find('.item-piles-change-actor').show();
            const actor = await fromUuid($(this).val());
            self.setActor(actor);
        });
    }

    async _onDrop(event) {

        super._onDrop(event);

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        if (data.type !== "Actor") return;

        this.setActor(game.actors.get(data.id));

    }

    setActor(actor) {
        if (!actor.isOwner) {
            return lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.ActorOwnerWarning"), true);
        }
        this.actor = actor;
        this.render(true);
    }

    async getData(options) {
        const data = await super.getData(options);
        data.user = this.user;
        data.users = this.users;
        data.actor = this.actor;
        data.actors = this.actors;
        data.private = this.private;
        data.multipleActors = this.actors.length > 1 && !game.user.isGM;
        data.hasUnlinkedTokenOwnership = this.actors.filter(a => !a.data.token.actorLink).length > 0;
        data.buttons = [{
            value: "accept",
            icon: "fas fa-check",
            text: game.i18n.localize("ITEM-PILES.Trade.Request.Label"),
            disabled: !data.actor
        }]
        return data;
    }

    async _updateObject(event, formData) {
        const actor = await fromUuid(formData?.actor || this.actor.uuid);
        return this.resolve({
            userId: formData.user,
            actor: actor,
            private: formData.private
        });
    }

    async close(...args) {
        super.close(...args);
        this.resolve(false);
    }

}

export class TradeRequestDialog extends TradePromptDialog {

    constructor(resolve, { tradeId, tradingUser, tradingActor, isPrivate } = {}) {
        super(resolve);
        this.tradeId = tradeId;
        this.tradingUser = tradingUser;
        this.tradingActor = tradingActor;
        this.isPrivate = isPrivate;
        this.progressbarTimeout = false
        this.timeout = false;
        this._hasClosed = false;
        this.interval = setInterval(() => {
            const user = game.users.get(this.tradingUser.id)
            if (!user.active) {
                lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true)
                this.close();
            }
        }, 100)
    }

    static show({ tradeId, tradingUser, tradingActor, isPrivate } = {}) {
        return new Promise(resolve => {
            new TradeRequestDialog(resolve, { tradeId, tradingUser, tradingActor, isPrivate }).render(true);
        })
    }

    static cancel(tradeId) {
        for (const app of Object.values(ui.windows)) {
            if (app instanceof TradeRequestDialog && app.tradeId === tradeId) {
                return app.close({ type: "cancelled" });
            }
        }
        return false;
    }

    activateListeners(html) {
        super.activateListeners(html);

        const progressBarContainer = html.find(".item-piles-progress");
        const progressBar = html.find(".progress-bar");
        progressBarContainer.hide();
        this.progressbarTimeout = setTimeout(() => {
            if (this._hasClosed) return;
            progressBarContainer.fadeIn(1000)
            progressBar.css("transition", 'width 20s linear')
            progressBar.css("width", "100%")
            this.setPosition();
        }, 14000);

        this.timeout = setTimeout(() => {
            if (this._hasClosed) return;
            lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.AutoDecline"), true)
            html.find('button[name="decline"]').click();
        }, 35000)

    }

    async getData(options) {
        let data = await super.getData(options);
        data.isPrompt = true;
        data.tradingUser = this.tradingUser;
        data.tradingActor = this.tradingActor;
        data.isPrivate = this.isPrivate;
        data.buttons = [{
            value: "accept",
            icon: "fas fa-check",
            text: game.i18n.localize("ITEM-PILES.Trade.Accept")
        }, {
            value: "decline",
            icon: "fas fa-times",
            text: game.i18n.localize("ITEM-PILES.Trade.Decline")
        }, {
            value: "mute",
            icon: "fas fa-comment-slash",
            text: game.i18n.localize("ITEM-PILES.Trade.Mute")
        }];
        return data;
    }

    async _updateObject(event, formData) {
        this._hasClosed = true;
        clearInterval(this.interval);
        clearTimeout(this.progressbarTimeout);
        clearTimeout(this.timeout);

        if (event.submitter.value === "accept") {
            const actor = await fromUuid(formData?.actor || this.actor.uuid);
            return this.resolve(actor)
        }

        if (event.submitter.value === "mute") {
            return this.resolve("mute");
        }

        return this.resolve(false);
    }

    async close(options) {
        this._hasClosed = true;
        clearInterval(this.interval);
        clearTimeout(this.progressbarTimeout);
        clearTimeout(this.timeout);
        this.resolve(options?.type);
        return super.close(options);
    }

}