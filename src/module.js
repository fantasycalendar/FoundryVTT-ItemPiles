import "./styles/styles.scss";

import CONSTANTS from "./constants/constants.js";
import registerUIOverrides from "./foundry-ui-overrides.js";
import registerLibwrappers from "./libwrapper.js";
import { applySystemSpecificStyles, checkSystem, patchCurrencySettings, registerSettings } from "./settings.js";
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

import { SvelteApplication } from "#runtime/svelte/application";
import { TJSPosition } from "#runtime/svelte/store/position";

Hooks.once("init", async () => {

	CONSTANTS.IS_V13 = foundry.utils.isNewerVersion(game.version, 13);
	Object.freeze(CONSTANTS);

	//CONFIG.debug.hooks = true;
	registerSettings();
	registerHotkeysPre();
	registerUIOverrides();
	setupCaches();
	setupPlugins("init");

	game.itempiles = {
		API,
		CONSTANTS: CONSTANTS,
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

	window.ItemPiles = Helpers.deprecate({ API }, "API", "window.ItemPiles.API has been deprecated, please use game.itempiles.API instead")

	if (CONSTANTS.IS_V13) {
		Object.defineProperty(SvelteApplication, 'defaultOptions', {
			get: () => {
				return foundry.utils.mergeObject(Application.defaultOptions, {
					// Copied directly from TRL except for minWidth and minHeight
					defaultCloseAnimation: true,
					draggable: true,
					focusAuto: true,
					focusKeep: false,
					focusSource: void 0,
					focusTrap: true,
					headerButtonNoClose: false,
					headerButtonNoLabel: false,
					headerIcon: void 0,
					headerNoTitleMinimized: false,
					minHeight: 50, // MIN_WINDOW_HEIGHT
					minWidth: 200, // MIN_WINDOW_WIDTH
					positionable: true,
					positionInitial: TJSPosition.Initial.browserCentered,
					positionOrtho: true,
					positionValidator: TJSPosition.Validators.transformWindow,
					sessionStorage: void 0,
					svelte: void 0,
					transformOrigin: "top left"
				}, { inPlace: false });
			}
		});
	}
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

		const socketSuccessful = Socket.initialize();
		if (!socketSuccessful) {
			throw Helpers.custom_error(`Item Piles could not initialize the 'socketlib' module, which it depends on - please reinstall it to ensure you are on a functioning version.`)
		}

		PrivateAPI.initialize();
		TradeAPI.initialize();
		ChatAPI.initialize();

		registerHotkeysPost();
		initializeCompendiumCache();
		setupPlugins("ready");

		ChatAPI.disablePastTradingButtons();

		Hooks.callAll(CONSTANTS.HOOKS.READY);

		registerLibwrappers();

		displayChatMessage();

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


async function displayChatMessage() {

	const shown = game.settings.get(CONSTANTS.MODULE_NAME, "welcome-shown")

	if (!game.user.isGM || shown) return;
	await game.settings.set(CONSTANTS.MODULE_NAME, "welcome-shown", true);

	ChatMessage.create({
		content: `
<div class="item-piles-welcome">

  <p style="margin:0 0 8px;color:#f0b90b; font-size: 1.3rem; font-weight: bold;">System Support Update</p>

  <p style="margin:6px 0;">
    To keep Item Piles light and easier to maintain for a single dev on their free time, the core module is now strictly <strong>system-agnostic</strong>.
  </p>
  <p>
    Instead of bundling 30+ system configurations, each game system or community add-on for that system will have to provide its own Item Piles system-specific settings.
  </p>

  <p style="margin:6px 0;">
    <em>What does this mean for you?</em>
  </p>
  <ul style="margin:4px 0 8px 22px;padding:0;">
    <li><strong>D&D 5e</strong>: install
      <a href="https://foundryvtt.com/packages/itempilesdnd5e" target="_blank" style="color:#4fc3f7;">Item Piles: D&D 5e</a>.
    </li>
    <li><strong>Other systems</strong>: watch that system’s page or Discord for an “Item Piles” companion. The game will still load; some features may be limited until a profile appears.</li>
  </ul>

  <p style="margin:6px 0;">
    Your existing <strong>item piles</strong> will continue to work exactly as before, but without a system-specific module, Item Piles may stop working for your specific system in the long term.
  </p>

  <p style="margin:6px 0;">Thank you for helping keep the loot flowing! 🎒</p>
</div>
`
	})

}
