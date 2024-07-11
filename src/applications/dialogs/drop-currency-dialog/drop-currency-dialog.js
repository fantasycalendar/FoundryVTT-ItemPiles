import DropCurrencyDialogShell from "./drop-currency-dialog-shell.svelte";
import { SvelteApplication } from '#runtime/svelte/application';
import { getActiveApps } from "../../../helpers/helpers";

export default class DropCurrencyDialog extends SvelteApplication {

	/**
	 *
	 * @param sourceActor
	 * @param targetActor
	 * @param settings
	 * @param options
	 */
	constructor(sourceActor, targetActor, settings = {}, options = {}) {
		const localization = settings.localization || "DropCurrencies";
		const id = sourceActor ? (sourceActor.id + (targetActor ? "-" + targetActor.id : "")) : "";
		super({
			id: `item-pile-drop-currency-${id}-${foundry.utils.randomID()}`,
			title: settings.title ?? game.i18n.localize(`ITEM-PILES.Applications.${localization}.Title`),
			svelte: {
				class: DropCurrencyDialogShell,
				target: document.body,
				props: {
					sourceActor,
					targetActor,
					localization,
					settings
				}
			},
			close: () => this.options.resolve?.(null),
			...options
		})
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 430,
			height: "auto",
			classes: ["item-piles-app"]
		})
	}

	static getActiveApps(sourceActor, targetActor) {
		const id = sourceActor ? (sourceActor.id + (targetActor ? "-" + targetActor.id : "")) : "";
		return getActiveApps(`item-pile-drop-currency-${id}`);
	}

	static async show(sourceActor, targetActor, settings = {}, options = {}) {
		if (sourceActor) {
			const apps = this.getActiveApps(sourceActor, targetActor);
			if (apps.length) {
				for (let app of apps) {
					app.render(false, { focus: true });
				}
				return;
			}
		}
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(sourceActor, targetActor, settings, options).render(true, { focus: true });
		})
	}

}
