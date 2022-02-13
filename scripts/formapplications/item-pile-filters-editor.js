import CONSTANTS from "../constants.js";

export class ItemPileFiltersEditor extends FormApplication {

    constructor(pileFilters = false, resolve = false) {
        super();
        this.resolve = resolve;
        this.filters = pileFilters || game.settings.get(CONSTANTS.MODULE_NAME, "itemFilters");
    }

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ITEM-PILES.FilterEditor.Title"),
            classes: ["sheet", "item-pile-filters-editor"],
            template: `${CONSTANTS.PATH}templates/filter-editor.html`,
            width: 630,
            height: "auto",
            resizable: false
        });
    }

    static showForPile(pileFilters) {
        let resolve;
        const promise = new Promise(_resolve => {
            resolve = _resolve;
        });
        return [promise, new ItemPileFiltersEditor(foundry.utils.duplicate(pileFilters), resolve).render(true)]
    }

    async getData(options) {
        const data = super.getData(options);
        data.filters = this.filters;
        return data;
    }

    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);
        const self = this;
        html.find('.item-pile-filters-remove').click(function () {
            const index = Number($(this).closest('.item-pile-filters-row').attr("data-filter-index"));
            self.filters.splice(index, 1);
            $(this).closest('.item-pile-filters-row').remove();
            self.rerender();
        });
        html.find('button[name="newFilter"]').click(function () {
            self.filters.push({
                path: "",
                filters: ""
            })
            self.render(true);
        });
    }

    rerender() {
        const self = this;
        this.element.find('.item-pile-filters-row').each(function (index) {
            if (index === 0) return;
            self.filters[index - 1] = {
                path: $(this).find('.item-pile-filters-path-input').val(),
                filters: $(this).find('.item-pile-filters-input').val()
            }
        });
        return this.render(true);
    }

    async _updateObject(event, formData) {

        const newSettings = [];
        for (let [path, value] of Object.entries(formData)) {
            setProperty(newSettings, path, value)
        }

        if (!this.resolve) {
            game.settings.set(CONSTANTS.MODULE_NAME, "itemFilters", newSettings);
        } else {
            this.resolve(newSettings);
        }

    }

    async close(...args) {
        if (this.resolve) {
            this.resolve()
        }
        return super.close(...args)
    }

}