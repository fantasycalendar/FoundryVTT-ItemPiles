import "./styles/styles.scss";

import registerUIOverrides from "./foundry-ui-overrides.js";
import registerLibwrappers from "./libwrapper.js";
import registerSettings from "./settings.js";
import { registerHotkeysPost, registerHotkeysPre } from "./hotkeys.js";
import Socket from "./socket.js";
import API from "./API/api.js";
import TradeAPI from "./API/trade-api.js";
import ChatAPI from "./API/chat-api.js";
import PrivateAPI from "./API/private-api.js";
import HOOKS from "./constants/hooks.js";
import * as Helpers from "./helpers/helpers.js";

Hooks.once("init", async () => {
  registerSettings();
  registerHotkeysPre();
  registerUIOverrides();
  registerLibwrappers();
  
  PrivateAPI.initialize();
  TradeAPI.initialize();
  ChatAPI.initialize();
  
  game.itempiles = API;
  window.ItemPiles = {
    API: API
  };
});

Hooks.once("ready", () => {
  
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
  Hooks.callAll(HOOKS.READY);
});

Hooks.once("socketlib.ready", () => {
  Socket.initialize();
});

Hooks.on("reset-item-pile-settings", async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.data.key.includes('item-piles'))) {
    await setting.delete();
  }
})