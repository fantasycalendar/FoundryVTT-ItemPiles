import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import ItemPileConfig from "../item-pile-config/item-pile-config";
import MerchantAppShell from "./merchant-app-shell.svelte";
import * as Helpers from "../../helpers/helpers.js";
import UserSelectDialog from "../dialogs/user-select-dialog/user-select-dialog.js";
import SETTINGS from "../../constants/settings.js";
import CONSTANTS from "../../constants/constants.js";
import * as Utilities from "../../helpers/utilities.js";

export default class MerchantApp extends SvelteApplication {

	constructor(merchant, recipient = false, options = {}, dialogData = {}) {
		super({
			title: `Merchant: ${merchant.name}`,
			id: `item-pile-merchant-${merchant.id}-${randomID()}`,
			svelte: {
				class: MerchantAppShell,
				target: document.body,
				props: {
					merchant,
					recipient
				}
			},
			zIndex: 100,
			...options
		}, dialogData);
		this.merchant = merchant;
		this.recipient = recipient;
		Helpers.hooks.callAll(CONSTANTS.HOOKS.OPEN_INTERFACE, this, merchant, recipient, options, dialogData);
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["app window-app sheet", "item-piles-merchant-sheet", "item-piles", "item-piles-app"],
			width: 800,
			height: 700,
			closeOnSubmit: false,
			resizable: true
		});
	}

	static getActiveApp(id) {
		return Helpers.getActiveApps(`item-pile-merchant-${id}`, true);
	}

	static async show(merchant, recipient = false, options = {}, dialogData = {}) {
		const merchantActor = Utilities.getActor(merchant);
		const recipientActor = Utilities.getActor(recipient);
		const result = Helpers.hooks.call(CONSTANTS.HOOKS.PRE_OPEN_INTERFACE, merchantActor, recipientActor, options, dialogData);
		if (result === false) return;
		const app = this.getActiveApp(merchant.uuid);
		if (app) return app.render(false, { focus: true });
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(merchant, recipientActor, options, dialogData).render(true, { focus: true, bypassItemPiles: true });
		})
	}

	refreshItems() {
		this.svelte.applicationShell.store.refreshItems();
	}

	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		const newButtons = [];

		if (this.merchant.isOwner) {
			newButtons.push(
				{
					label: !Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT) ? "ITEM-PILES.Inspect.OpenSheet" : "",
					class: "item-piles-open-actor-sheet",
					icon: "fas fa-user",
					onclick: () => {
						this.merchant.sheet.render(true, { focus: true, bypassItemPiles: true });
					}
				}
			)
		}

		if (game.user.isGM) {
			newButtons.push(
				{
					label: !Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT) ? "ITEM-PILES.ContextMenu.ShowToPlayers" : "",
					class: "item-piles-show-to-players",
					icon: "fas fa-eye",
					onclick: async (event) => {
						const activeUsers = Array.from(game.users).filter(u => u.active && u !== game.user).map(u => u.id);
						if (!activeUsers.length) {
							return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.NoPlayersActive"), true);
						}
						const users = event.altKey ? activeUsers : await UserSelectDialog.show({ excludeSelf: true });
						if (!users || !users.length) return;
						Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ShownToPlayers", { actor_name: this.merchant.name }))
						return game.itempiles.API.renderItemPileInterface(this.merchant, {
							userIds: users,
							useDefaultCharacter: true
						});
					}
				},
				{
					label: !Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT) ? "ITEM-PILES.HUD.Configure" : "",
					class: "item-piles-configure-pile",
					icon: "fas fa-box-open",
					onclick: () => {
						ItemPileConfig.show(this.merchant);
					}
				}
			);
		}
		return newButtons.concat(buttons);
	}

	async close(options) {
		const result = Helpers.hooks.call(CONSTANTS.HOOKS.PRE_CLOSE_INTERFACE, this, this.merchant, this.recipient);
		if (result === false) return;
		for (const app of Object.values(ui.windows)) {
			if (app !== this && this.svelte.applicationShell.store === app?.svelte?.applicationShell?.store) {
				app.close();
			}
		}
		Helpers.hooks.callAll(CONSTANTS.HOOKS.CLOSE_INTERFACE, this, this.merchant, this.recipient);
		return super.close(options);
	}

}
