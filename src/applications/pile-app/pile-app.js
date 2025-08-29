import { SvelteApp } from '#runtime/svelte/application';
import { deepMerge } from '#runtime/util/object';

import PileAppShell from './pile-app-shell.svelte';
import * as Helpers from "../../helpers/helpers.js";
import * as Utilities from "../../helpers/utilities.js";
import CONSTANTS from "../../constants/constants.js";

export class PileApp extends SvelteApp {


	constructor(actor, recipient, options = {}, dialogData = {}) {
		super({
			...PileApp.defaultOptions,
			id: `item-pile-inventory-${actor?.token?.id ?? actor.id}-${foundry.utils.randomID()}`,
			title: actor.name,
			svelte: {
				props: {
					actor,
					recipient
				}
			},
			zIndex: 100,
			...options,
		});
	}

	/**
	 * Default Application options
	 *
	 * @returns {SvelteApp.Options} options - SvelteApp options.
	 */
	static get defaultOptions() {
		return deepMerge(super.defaultOptions, {
			width: 300,
			svelte: {
				class: PileAppShell,
				target: document.body
			}
		});
	}

	static getActiveApps(source) {
		const id = typeof source === "string" ? source : source?.token?.id ?? source?.id;
		return Helpers.getActiveApps(`item-pile-inventory-${id}`);
	}

	static async show(source, recipient = false, options = {}, dialogData = {}) {
		source = Utilities.getActor(source);
		recipient = Utilities.getActor(recipient);
		const result = Helpers.hooks.call(CONSTANTS.HOOKS.PRE_OPEN_INTERFACE, source, recipient, options, dialogData);
		if (result === false) return;
		const apps = this.getActiveApps(source);
		if (apps.length) {
			for (let app of apps) {
				app.render(false, { focus: true });
			}
			return;
		}
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(source, recipient, options, dialogData).render(true, { focus: true, bypassItemPiles: true });
		})
	}
}