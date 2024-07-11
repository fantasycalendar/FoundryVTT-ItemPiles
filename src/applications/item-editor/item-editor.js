import ItemEditorShell from './item-editor-shell.svelte';
import { SvelteApplication } from '#runtime/svelte/application';
import { getActiveApps } from '../../helpers/helpers';

export default class ItemEditor extends SvelteApplication {

	constructor(item = false, options) {
		let title = game.i18n.format("ITEM-PILES.Applications.ItemEditor.Title", { item_name: item.name })
		if (options.extraTitle) title += options.extraTitle;
		super({
			id: `item-pile-item-editor-${item.id}${item.parent ? "-" + item.parent.id : ""}-${foundry.utils.randomID()}`,
			title,
			svelte: {
				class: ItemEditorShell,
				target: document.body,
				props: {
					item
				}
			},
			close: () => this.options.resolve(null),
			...options
		});
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 500,
			height: "auto",
			classes: ["item-piles-app"]
		})
	}

	static getActiveApp(item) {
		return getActiveApps(`item-pile-item-editor-${item.id}${item.parent ? "-" + item.parent.id : ""}`, true);
	}

	static async show(item = false, options = {}, dialogData = {}) {
		const app = this.getActiveApp(item);
		if (app) return app.render(false, { focus: true });
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(item, options, dialogData).render(true, { focus: true });
		})
	}
}
