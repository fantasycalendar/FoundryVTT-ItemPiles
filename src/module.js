import "./styles/styles.scss";

import registerUIOverrides from "./foundry-ui-overrides.js";
import registerLibwrappers from "./libwrapper.js";
import { registerSettings, checkSystem, patchCurrencySettings } from "./settings.js";
import { registerHotkeysPost, registerHotkeysPre } from "./hotkeys.js";
import Socket from "./socket.js";
import API from "./API/api.js";
import TradeAPI from "./API/trade-api.js";
import ChatAPI from "./API/chat-api.js";
import PrivateAPI from "./API/private-api.js";
import HOOKS from "./constants/hooks.js";
import * as Helpers from "./helpers/helpers.js";
import { TJSDialog } from "@typhonjs-fvtt/runtime/_dist/svelte/application/index.js";

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

Hooks.once("ready", async () => {
  
  if (isNewerVersion(game.version, "9.999") && !Helpers.getSetting("v10WarningShown")) {
    await Helpers.setSetting("v10WarningShown", true);
    TJSDialog.prompt({
      title: "Foundry v10 not Supported",
      content: {
        class: CustomDialog,
        props: {
          title: "Item Piles: Foundry v10 not Supported",
          content: "Item Piles is not yet v10 supported, and will not be for at least a month or two. Please do not use Item Piles in v10, and do not report bugs relating to v10 issues.",
          icon: "fas fa-exclamation-triangle",
        }
      },
      modal: true
    });
  }
  
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
  
  if (game.user.isGM) {
    patchCurrencySettings();
    checkSystem();
  }
  registerHotkeysPost();
  Hooks.callAll(HOOKS.READY);
  
  ChatAPI.disablePastTradingButtons();
  
});

Hooks.once("socketlib.ready", () => {
  Socket.initialize();
});

Hooks.on("reset-item-pile-settings", async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.data.key.includes('item-piles'))) {
    await setting.delete();
  }
})