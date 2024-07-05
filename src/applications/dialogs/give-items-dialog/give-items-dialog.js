import GiveItemsShell from "./give-items-shell.svelte";
import { TJSDialog } from '#runtime/svelte/application';
import { getActiveApps } from "../../../helpers/helpers";

export default class GiveItems extends TJSDialog {

	/**
	 *
	 * @param item
	 * @param options
	 */
	constructor(item, options = {}) {
		super({
			title: game.i18n.localize(`ITEM-PILES.Dialogs.GiveItems.Title`),
			id: `item-pile-give-items-${item.id}-${foundry.utils.randomID()}`,
			content: {
				class: GiveItemsShell,
				props: {
					item
				}
			},
			modal: true,
			draggable: false,
		}, {
			...options,
			focusAuto: false,
			close: () => this.options.resolve?.(null)
		});
		this.item = item;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 430,
			height: "auto",
			classes: ["item-piles-app visible-overflow"]
		})
	}

	static getActiveApps(item) {
		return getActiveApps(`item-pile-give-items-${item.id}`);
	}

	static async show(item, options = {}) {
		const apps = this.getActiveApps(item);
		if (apps.length) {
			for (let app of apps) {
				app.render(false, { focus: true });
			}
			return;
		}
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(item, options).render(true, { focus: true });
		})
	}

}
