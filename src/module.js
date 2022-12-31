import "./styles/styles.scss";

import CONSTANTS from "./constants/constants.js";
import registerUIOverrides from "./foundry-ui-overrides.js";
import registerLibwrappers from "./libwrapper.js";
import { registerSettings, checkSystem, patchCurrencySettings, applySystemSpecificStyles } from "./settings.js";
import { registerHotkeysPost, registerHotkeysPre } from "./hotkeys.js";
import Socket from "./socket.js";
import API from "./API/api.js";
import TradeAPI from "./API/trade-api.js";
import ChatAPI from "./API/chat-api.js";
import PrivateAPI from "./API/private-api.js";
import * as Helpers from "./helpers/helpers.js";
import runMigrations from "./migrations.js"
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";

Hooks.once("init", async () => {
  registerHotkeysPre();
  registerLibwrappers();
  registerSettings();
  registerUIOverrides();
});

Hooks.once("ready", () => {

  setTimeout(() => {

    game.itempiles = {
      API,
      hooks: CONSTANTS.HOOKS
    };
    window.ItemPiles = {
      API: API
    };

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

      if (game.modules.get('foundryvtt-simple-calendar')?.active && game.modules.get("foundryvtt-simple-calendar").version === "v1.3.75") {
        throw Helpers.custom_error("Simple Calendar version 1.3.75 is installed, but Item Piles requires version 2.0.0 or above. The author made a mistake, and you will need to reinstall the Simple Calendar module.")
      }
    }

    if (!Helpers.isGMConnected()) {
      Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.NoGMsConnected"), true)
    }

    Socket.initialize();
    PrivateAPI.initialize();
    TradeAPI.initialize();
    ChatAPI.initialize();

    registerHotkeysPost();

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
    applySystemSpecificStyles();
  }, 500);

  // game.itempiles.API.renderItemPileInterface(game.actors.getName("Item Pile"));

  // ItemPileConfig.show(game.actors.getName("Item Pile"))

});

Hooks.on(CONSTANTS.HOOKS.RESET_SETTINGS, async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.key.includes('item-piles'))) {
    await setting.delete();
  }
  checkSystem();
});
