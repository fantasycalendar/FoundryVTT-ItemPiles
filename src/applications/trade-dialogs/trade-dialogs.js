import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import TradeDialogPrompt from './trade-dialog-prompt.svelte';
import TradeDialogRequest from './trade-dialog-request.svelte';

export class TradePromptDialog extends SvelteApplication {

	constructor(tradeOptions, options = {}) {
		super({
			svelte: {
				class: TradeDialogPrompt,
				target: document.body,
				props: {
					...tradeOptions
				}
			},
			close: () => this.options.resolve?.(null),
			...options
		});
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Trade.Title"),
			width: 400,
			height: "auto",
			classes: ["dialog", "item-piles-app"],
		})
	}

	static show(tradeOptions, options = {}, dialogData = {}) {
		return new Promise(resolve => {
			options.resolve = resolve;
			new this(tradeOptions, options, dialogData).render(true);
		})
	}
}

export class TradeRequestDialog extends SvelteApplication {

	constructor(tradeOptions, options = {}) {

		super({
			svelte: {
				class: TradeDialogRequest,
				target: document.body,
				props: {
					...tradeOptions
				}
			},
			close: () => this.options.resolve?.(null),
			...options
		});
		this.tradeId = tradeOptions.tradeId;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Trade.Title"),
			width: 400,
			height: "auto",
			classes: ["dialog"],
		})
	}

	static show(tradeOptions, options = {}) {
		return new Promise(resolve => {
			options.resolve = resolve;
			new this(tradeOptions, options).render(true);
		})
	}

	static cancel(tradeId) {
		for (const app of Object.values(ui.windows)) {
			if (app instanceof this && app.tradeId === tradeId) {
				app.options.resolve({ type: "cancelled" });
				return app.close();
			}
		}
		return false;
	}

}
