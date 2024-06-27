import { SvelteApplication } from '#runtime/svelte/application';
import TradingAppShell from "./trading-app-shell.svelte";
import ItemPileSocket from "../../socket.js";

export default class TradingApp extends SvelteApplication {
	constructor(store, options = {}, dialogData = {}) {
		super({
			title: game.i18n.format("ITEM-PILES.Trade.Between", {
				actor_1: store.leftTraderActor.name,
				actor_2: store.rightTraderActor.name
			}),
			svelte: {
				class: TradingAppShell,
				target: document.body,
				props: {
					store
				}
			},
			...options
		}, dialogData);
		this.store = store;
		this.publicTradeId = store.publicTradeId;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			zIndex: 100,
			classes: ["dialog", "item-piles-trading-sheet", "item-piles", "item-piles-app"],
			width: 800,
			height: "auto",
			closeOnSubmit: false
		});
	}

	static getActiveApp(publicTradeId) {
		for (const app of Object.values(ui.windows)) {
			if (app instanceof this && app?.publicTradeId === publicTradeId) {
				return app;
			}
		}
		return false;
	}

	async close(options = {}) {
		if (!options?.callback && this.store.isUserParticipant) {
			await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.TRADE_CLOSED, this.publicTradeId, game.user.id);
		}
		return super.close(options)
	}
}
