import "./styles/styles.scss";

import registerUIOverrides from "./foundry-ui-overrides.js";
import registerLibwrappers from "./libwrapper.js";
import { registerSettings, checkSystem, patchCurrencySettings, applySystemSpecificStyles } from "./settings.js";
import { registerHotkeysPost, registerHotkeysPre } from "./hotkeys.js";
import Socket from "./socket.js";
import API from "./API/api.js";
import TradeAPI from "./API/trade-api.js";
import ChatAPI from "./API/chat-api.js";
import PrivateAPI from "./API/private-api.js";
import HOOKS from "./constants/hooks.js";
import * as Helpers from "./helpers/helpers.js";
import SettingsShim from "./applications/settings-app/settings-app.js";
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";

Hooks.once("init", async () => {
  registerHotkeysPre();
  registerLibwrappers();
  registerSettings();
  registerUIOverrides();
});

Hooks.once("ready", () => {

  setTimeout(() => {

    Socket.initialize();
    PrivateAPI.initialize();
    TradeAPI.initialize();
    ChatAPI.initialize();

    game.itempiles = {
      API,
      hooks: HOOKS
    };
    window.ItemPiles = {
      API: API
    };

    if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
      let word = "install and activate";
      if (game.modules.get('lib-wrapper')) word = "activate";
      throw Helpers.custom_error(`Item Piles requires the 'libWrapper' module. Please ${word} it.`)
    }
    if (!game.modules.get('socketlib')?.active && game.user.isGM) {
      let word = "install and activate";
      if (game.modules.get('socketlib')) word = "activate";
      throw Helpers.custom_error(`Item Piles requires the 'socketlib' module. Please ${word} it.`)
    }

    if (!Helpers.isGMConnected()) {
      Helpers.custom_warning(`Item Piles requires a GM to be connected for players to be able to loot item piles.`, true)
    }

    registerHotkeysPost();

    ChatAPI.disablePastTradingButtons();

    setTimeout(() => {
      Hooks.callAll(HOOKS.READY);
    }, 100);

  }, 100);

  // new SettingsShim().render(true)

});

Hooks.once(HOOKS.READY, async () => {
  if (game.user.isGM) {
    await checkSystem();
    await patchCurrencySettings();
  }
  applySystemSpecificStyles();
})

Hooks.on(HOOKS.RESET_SETTINGS, async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.key.includes('item-piles'))) {
    await setting.delete();
  }
  checkSystem();
});
