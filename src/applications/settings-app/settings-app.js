import { SvelteApplication } from '#runtime/svelte/application';
import { getActiveApps, uploadJSON } from '../../helpers/helpers';
import SettingsShell from './settings-shell.svelte';
import SETTINGS from "../../constants/settings.js";
import * as Helpers from "../../helpers/helpers.js";

export class SettingsApp extends SvelteApplication {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: `item-piles-application-system-settings-${foundry.utils.randomID()}`,
			title: "Item Piles Module Configuration",
			width: 600,
			svelte: {
				class: SettingsShell,
				target: document.body
			},
			zIndex: 100,
			classes: ["item-piles-app"],
		});
	}

	static getActiveApp() {
		return getActiveApps("item-piles-application-system-settings", true);
	}

	static async show(options = {}, dialogData = {}) {
		const app = this.getActiveApp()
		if (app) return app.render(false, { focus: true });
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(options, dialogData).render(true, { focus: true });
		})
	}


	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		if (game.user.isGM) {
			buttons = [
				{
					label: "ITEM-PILES.Applications.Settings.Export",
					class: "item-piles-export-settings",
					icon: "fas fa-file-export",
					onclick: () => {
						const settingKeys = Object.fromEntries(Object.entries(SETTINGS)
							.filter(([_, value]) => typeof value === "string")
							.map(([key, value]) => [value, key]));
						const settings = Object.entries(this.svelte.applicationShell.settings)
							.filter(([_, setting]) => {
								return setting.system && setting.name;
							}).map(([key, setting]) => {
								return [settingKeys[key], setting.value];
							});
						const text = JSON.stringify(Object.fromEntries(settings), null, 4);
						Helpers.downloadText(text, `item-piles-${game.system.id}.json`);
					}
				},
				{
					label: "ITEM-PILES.Applications.Settings.Import",
					class: "item-piles-import-settings",
					icon: "fas fa-file-import",
					onclick: async () => {
						const incomingSettings = await Helpers.uploadJSON();
						this.svelte.applicationShell.importSettings(incomingSettings);
					}
				},
			].concat(buttons);
		}
		return buttons
	}
}

export class SettingsShim extends FormApplication {

	/**
	 * @inheritDoc
	 */
	constructor() {
		super({});
		SettingsApp.show();
	}

	async _updateObject(event, formData) {
	}

	render() {
		this.close();
	}

}
