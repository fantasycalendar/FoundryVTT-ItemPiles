import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import { getActiveApps } from "../../../helpers/helpers";
import TextEditorDialogShell from "./text-editor-dialog-shell.svelte";

export default class TextEditorDialog extends SvelteApplication {

	constructor(text, options) {
		super({
			title: game.i18n.localize("ITEM-PILES.Dialogs.TextEditor.Title"),
			id: `item-piles-text-editor${options?.id ? "-" + options.id : ""}-${foundry.utils.randomID()}`,
			svelte: {
				class: TextEditorDialogShell,
				target: document.body,
				props: {
					text
				}
			},
			close: () => this.options.resolve?.(null),
			...options
		});
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 550,
			height: 450,
			classes: ["item-piles-app"],
			resizable: true
		})
	}

	static getActiveApps(id) {
		return getActiveApps(`item-pile-text-editor-${id}`);
	}

	static async show(text, options = {}) {
		const apps = options.id ? this.getActiveApps(options.id) : [];
		if (apps.length) {
			for (let app of apps) {
				app.render(false, { focus: true });
			}
			return;
		}
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(text, options).render(true, { focus: true });
		})
	}

}
