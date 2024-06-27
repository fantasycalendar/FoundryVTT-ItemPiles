import { SvelteApplication } from '#runtime/svelte/application';
import VaultShell from "./vault-shell.svelte";
import * as Utilities from "../../helpers/utilities.js";
import ItemPileConfig from "../item-pile-config/item-pile-config.js";
import * as Helpers from "../../helpers/helpers.js";
import UserSelectDialog from "../dialogs/user-select-dialog/user-select-dialog.js";
import SETTINGS from "../../constants/settings.js";
import CONSTANTS from "../../constants/constants.js";
import { getVaultAccess } from "../../helpers/pile-utilities.js";

export default class VaultApp extends SvelteApplication {

	/**
	 *
	 * @param actor
	 * @param recipient
	 * @param options
	 * @param dialogData
	 */
	constructor(actor, recipient, options = {}, dialogData = {}) {
		super({
			id: `item-pile-vault-${actor?.token?.id ?? actor.id}-${foundry.utils.randomID()}`,
			title: actor.name,
			svelte: {
				class: VaultShell,
				target: document.body,
				props: {
					actor,
					recipient
				}
			},
			zIndex: 100,
			...options
		}, dialogData);

		this.actor = actor;
		this.recipient = recipient;

		Helpers.hooks.callAll(CONSTANTS.HOOKS.OPEN_INTERFACE, this, actor, recipient, options, dialogData);

	}

	onDropData(data) {
		return this.store.onDropData(data);
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			closeOnSubmit: false,
			classes: ["app", "window-app", "sheet", "item-pile-vault", "item-piles", "item-piles-app"],
			minWidth: 300,
			minHeight: 300,
			resizable: false
		});
	}

	get store() {
		return this.svelte.applicationShell.store;
	}

	static getActiveApps(id = "") {
		return Helpers.getActiveApps(`item-pile-vault-${id}`);
	}

	static async show(source, recipient = false, options = {}, dialogData = {}) {
		source = Utilities.getActor(source);
		recipient = Utilities.getActor(recipient);
		const result = Helpers.hooks.call(CONSTANTS.HOOKS.PRE_OPEN_INTERFACE, source, recipient, options, dialogData);
		if (result === false) return;
		const access = getVaultAccess(source, { hasRecipient: !!recipient });
		if (!access.canView) {
			ui.notifications.error(game.i18n.format(recipient
				? "ITEM-PILES.Errors.NoVaultAccessActor"
				: "ITEM-PILES.Errors.NoVaultAccess", {
				actor_name: recipient?.name ?? ""
			}));
			return;
		}
		const apps = this.getActiveApps(source?.token?.uuid ?? source.uuid);
		if (apps.length) {
			for (let app of apps) {
				app.render(false, { focus: true });
			}
			return;
		}
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(source, recipient, options, dialogData).render(true, { focus: true });
		})
	}

	async close(options) {
		const result = Helpers.hooks.call(CONSTANTS.HOOKS.PRE_CLOSE_INTERFACE, this, this.actor, this.recipient, options);
		if (result === false) return;
		Helpers.hooks.callAll(CONSTANTS.HOOKS.CLOSE_INTERFACE, this, this.actor, this.recipient, options);
		return super.close(options);
	}

	/* -------------------------------------------- */

	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		const canConfigure = game.user.isGM;
		if (canConfigure) {
			buttons = [
				{
					label: !Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT) ? "ITEM-PILES.Inspect.OpenSheet" : "",
					class: "item-piles-open-actor-sheet",
					icon: "fas fa-user",
					onclick: () => {
						this.actor.sheet.render(true, { focus: true, bypassItemPiles: true });
					}
				},
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
						Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ShownToPlayers", { actor_name: this.actor.name }))
						return game.itempiles.API.renderItemPileInterface(this.actor, {
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
						ItemPileConfig.show(this.actor);
					}
				},
			].concat(buttons);
		}
		return buttons
	}

}
