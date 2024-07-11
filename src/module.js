import "./styles/styles.scss";

import CONSTANTS from "./constants/constants.js";
import registerUIOverrides from "./foundry-ui-overrides.js";
import registerLibwrappers from "./libwrapper.js";
import {
	applySystemSpecificStyles,
	checkSystem,
	patchCurrencySettings,
	registerSettings
} from "./settings.js";
import { registerHotkeysPost, registerHotkeysPre } from "./hotkeys.js";
import Socket from "./socket.js";
import API from "./API/api.js";
import TradeAPI from "./API/trade-api.js";
import ChatAPI from "./API/chat-api.js";
import PrivateAPI from "./API/private-api.js";
import * as Helpers from "./helpers/helpers.js";
import runMigrations from "./migrations.js"

import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";
import ItemEditor from "./applications/item-editor/item-editor.js";
import { setupPlugins } from "./plugins/main.js";
import { setupCaches } from "./helpers/caches.js";
import { initializeCompendiumCache } from "./helpers/compendium-utilities.js";
import { SYSTEMS } from "./systems.js";
import Transaction from "./helpers/transaction.js";

Hooks.once("init", async () => {
	registerSettings();
	registerHotkeysPre();
	registerLibwrappers();
	registerUIOverrides();
	setupCaches();
	setupPlugins("init");

	game.itempiles = {
		API,
		hooks: CONSTANTS.HOOKS,
		flags: CONSTANTS.FLAGS,
		pile_types: CONSTANTS.PILE_TYPES,
		pile_flag_defaults: CONSTANTS.PILE_DEFAULTS,
		item_flag_defaults: CONSTANTS.ITEM_DEFAULTS,
		macro_execution_types: CONSTANTS.MACRO_EXECUTION_TYPES,
		Transaction,
		apps: {
			ItemPileConfig,
			ItemEditor
		}
	};
	window.ItemPiles = {
		API: API
	};
	CONSTANTS.IS_V12 = game.release.generation >= 12;
	Object.freeze(CONSTANTS);

});

Hooks.once("ready", () => {

	setTimeout(() => {

		if (game.user.isGM) {
			if (!game.modules.get('lib-wrapper')?.active) {
				let word = "install and activate";
				if (game.modules.get('lib-wrapper')) word = "activate";
				throw Helpers.custom_error(`Item Piles requires the 'libWrapper' module. Please ${word} it.`)
			}

			if (!game.modules.get('socketlib')?.active) {
				let word = "install and activate";
				if (game.modules.get('socketlib')) word = "activate";
				throw Helpers.custom_error(`Item Piles requires the 'socketlib' module. Please ${word} it.`)
			}
		}

		Socket.initialize();
		PrivateAPI.initialize();
		TradeAPI.initialize();
		ChatAPI.initialize();

		registerHotkeysPost();
		initializeCompendiumCache();
		setupPlugins("ready");

		ChatAPI.disablePastTradingButtons();

		Hooks.callAll(CONSTANTS.HOOKS.READY);

	}, 100);

});

Hooks.once(CONSTANTS.HOOKS.READY, async () => {
	setTimeout(async () => {
		if (game.user.isGM) {
			await checkSystem();
			await patchCurrencySettings();
			await runMigrations();
		}

		if (SYSTEMS.DATA.SYSTEM_HOOKS) {
			SYSTEMS.DATA.SYSTEM_HOOKS();
		}
		//game.itempiles.API.renderItemPileInterface(game.actors.getName("Gamemaster's Vault"));
		// new SettingsShim().render(true);
		applySystemSpecificStyles();
	}, 500);
});

Hooks.on(CONSTANTS.HOOKS.RESET_SETTINGS, async () => {
	for (let setting of game.settings.storage.get("world").filter(setting => setting.key.includes('item-piles'))) {
		await setting.delete();
	}
	checkSystem();
})
