import CONSTANTS from "../constants.js";
import { managedPiles } from "../module.js";
import { itemPileSocket, SOCKET_HANDLERS } from "../socket.js";

export class ItemPileConfig extends FormApplication {

    constructor(actor) {
        super();
        this.document = actor?.token ?? actor;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "token-sheet"],
            template: `${CONSTANTS.PATH}templates/item-pile-config.html`,
            width: 430,
            height: "auto"
        });
    }

    get title() {
        return `${game.i18n.localize("ITEM-PILES.Defaults.Title")}: ${this.document.data.name}`
    }

    async getData(options) {
        let data = super.getData(options);

        const pileData = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, this.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME))

        data = foundry.utils.mergeObject(data, pileData);

        return data;
    }

    activateListeners(html){
        super.activateListeners(html);
        const scaleCheckbox = html.find('input[name="overrideSingleItemScale"]');
        const slider = html.find("#scaleRange");
        const input = html.find("#scaleInput");
        scaleCheckbox.change(function(){
            let isDisabled = !$(this).is(":checked");
            slider.prop('disabled', isDisabled);
            input.prop('disabled', isDisabled);
            slider.parent().toggleClass("item-pile-disabled", isDisabled);
        }).change();
        slider.on("input", function(){
            input.val($(this).val());
        })
        input.change(function(){
            slider.slider('value', $(this).val());
        })

        const containerCheckbox = html.find('input[name="isContainer"]');
        containerCheckbox.change(function(){
            let isDisabled = !$(this).is(":checked");
            html.find('.container-input').each(function(){
                $(this).prop('disabled', isDisabled);
                if($(this).prev().length) {
                    $(this).prev().prop('disabled', isDisabled);
                }
                $(this).closest('.form-group').toggleClass("item-pile-disabled", isDisabled);
            });
        }).change();
    }

    async _updateObject(event, formData) {

        const data = foundry.utils.mergeObject(CONSTANTS.PILE_DEFAULTS, formData);

        if (this.document instanceof TokenDocument) {
            const pile = managedPiles.get(this.document.uuid);
            return pile.update(data);
        }

        return itemPileSocket.executeAsGM(SOCKET_HANDLERS.UPDATE_DOCUMENT, this.document.uuid, {
            [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data,
            [`token.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`]: data
        });

    }

}