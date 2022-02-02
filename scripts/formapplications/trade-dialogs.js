import CONSTANTS from "../constants.js";
import * as lib from "../lib/lib.js";

export class TradePromptDialog extends FormApplication {

    constructor(resolve, users = false) {
        super();
        this.resolve = resolve;
        this.users = users;
        this.user = users?.[0] ?? "";
        this.actor = false;
        this.isGM = game.user.isGM;

        this.actors = game.actors.filter(actor => actor.isOwner);
        this.preselectedActor = false;
        if(this.actors.length === 1){
            this.actor = this.actors[0];
            this.preselectedActor = true;
        }else if(game.user.character){
            this.actor = game.user.character;
        }else if(game.user.isGM && canvas.tokens.controlled.length){
            this.actor = canvas.tokens.controlled[0].actor;
        }
    }

    static show(users){
        return new Promise(resolve => {
            new TradePromptDialog(resolve, users).render(true);
        })
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.Trade.Title"),
            classes: ["dialog"],
            template: `${CONSTANTS.PATH}templates/trade-request-dialog.html`,
            width: 400,
            height: "auto",
            dragDrop: [{ dragSelector: null, dropSelector: ".item-piles-actor-container" }],
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;

        if(!this.preselectedActor) {
            html.find(".item-piles-actor-container").on("dragenter", function () {
                $(this).addClass("item-piles-box-highlight");
            })

            html.find(".item-piles-actor-container").on("dragleave", function () {
                $(this).removeClass("item-piles-box-highlight");
            })

            html.find(".item-piles-pick-selected-token").click(() => {
                if(canvas.tokens.controlled.length === 0) return;
                this.setActor(canvas.tokens.controlled[0].actor);
            });
        }

        html.find(".item-piles-actor-select").change(function(){
            console.log($(this).val())
            console.log(game.actors.get($(this).val()));
            self.setActor(game.actors.get($(this).val()));
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

        if(data.type !== "Actor") return;

        this.setActor(game.actors.get(data.id));

    }

    setActor(actor){
        if(!actor.isOwner){
            return lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.ActorOwnerWarning"), true);
        }
        this.actor = actor;
        this.render(true);
    }

    async getData(options) {
        const data = await super.getData(options);
        data.users = this.users;
        data.actor = this.actor;
        data.actors = this.actors;
        data.preselectedActor = this.preselectedActor;
        data.multipleActors = this.actors.length > 1 && !game.user.isGM;
        data.buttons = [{
            value: "accept",
            icon: "fas fa-check",
            text: game.i18n.localize("ITEM-PILES.Trade.Request.Label"),
            disabled: !data.actor
        }]
        return data;
    }

    async _updateObject(event, formData) {
        return this.resolve({
            userId: formData.user,
            actorUuid: formData?.actor || this.actor.uuid
        });
    }

    async close(...args) {
        super.close(...args);
    }

}

export class TradeRequestDialog extends TradePromptDialog {

    constructor(resolve, traderUser, traderActor) {
        super(resolve);
        this.traderUser = traderUser;
        this.traderActor = traderActor;
        this.progressbarTimeout = false
        this.timeout = false;
    }

    static show(traderUser, traderActor){
        return new Promise(resolve => {
            new TradeRequestDialog(resolve, traderUser, traderActor).render(true);
        })
    }

    activateListeners(html) {
        super.activateListeners(html);

        const progressBarContainer = html.find(".item-piles-progress");
        const progressBar = html.find(".progress-bar");
        progressBarContainer.hide();
        this.progressbarTimeout = setTimeout(() => {
            progressBarContainer.fadeIn(1000)
            progressBar.css("transition", 'width 20s linear')
            progressBar.css("width", "100%")
            this.setPosition();
        }, 14000);

        this.timeout = setTimeout(() => {
            lib.custom_warning(game.i18n.localize("ITEM-PILES.Trade.AutoDecline"), true)
            html.find('button[name="decline"]').click();
        }, 35000)

    }

    async getData(options) {
        let data = await super.getData(options);
        data.isPrompt = true;
        data.traderUser = this.traderUser;
        data.traderActor = this.traderActor;
        data.buttons = [{
            value: "accept",
            icon: "fas fa-check",
            text: game.i18n.localize("ITEM-PILES.Trade.Accept")
        },{
            value: "decline",
            icon: "fas fa-times",
            text: game.i18n.localize("ITEM-PILES.Trade.Decline")
        },{
            value: "mute",
            icon: "fas fa-comment-slash",
            text: game.i18n.localize("ITEM-PILES.Trade.Mute")
        }];
        return data;
    }

    async _updateObject(event, formData) {

        if(this.progressbarTimeout) clearTimeout(this.progressbarTimeout);
        if(this.timeout) clearTimeout(this.timeout);

        if(event.submitter.value === "accept"){
            return this.resolve({
                actorUuid: formData?.actor || this.actor.uuid
            })
        }

        if(event.submitter.value === "mute"){
            return this.resolve(false);
        }

        return this.resolve(false);
    }

}