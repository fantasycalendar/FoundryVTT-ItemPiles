import * as Utilities from "../../helpers/utilities.js";
import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileConfigShell from './item-pile-config.svelte';
import { getActiveApps } from "../../helpers/helpers.js";

export default class ItemPileConfig extends SvelteApplication {

	constructor(pileActor, options = {}) {

		super({
			id: `item-pile-config-${pileActor.id}-${foundry.utils.randomID()}`,
			title: game.i18n.format("ITEM-PILES.Applications.ItemPileConfig.Title", { actor_name: pileActor.name }),
			svelte: {
				class: ItemPileConfigShell,
				target: document.body,
				props: {
					pileActor
				}
			},
			close: () => this.options.resolve?.(null),
			...options
		});
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 430,
			height: 627,
			classes: ["item-piles-config", "item-piles-app"],
			resizable: true
		})
	}

	static getActiveApp(id) {
		return getActiveApps(`item-pile-config-${id}`, true)
	}

	static async show(target, options = {}, dialogData = {}) {
		const targetActor = Utilities.getActor(target);
		const app = this.getActiveApp(targetActor.uuid);
		if (app) return app.render(false, { focus: true });
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(targetActor, options, dialogData).render(true);
		})
	}

	async close(options) {
		Object.values(ui.windows).forEach(app => {
			if (app !== this && app.rendered && app.options?.parentApp === this) {
				app.close();
			}
		})
		return super.close(options);
	}
}
