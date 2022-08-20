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
import MerchantApp from "./applications/merchant-app/merchant-app.js";
import ItemEditor from "./applications/editors/item-editor/item-editor.js";
import { getItemPrices, getPricesForItems } from "./helpers/pile-utilities.js";
import { SYSTEMS } from "./systems.js";

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
  
  // const merchant = game.actors.get("4jh4e6K5TobGeoni");
  // const actor = game.actors.getName("Player Token");
  
  // game.itempiles.tradeItems(actor, merchant, [{
  //   item: actor.items.getName("Scimitar")
  // }]);
  
  // console.log(getPricesForItems([{
  //   item: actor.items.getName("Alms Box"),
  //   quantity: 1,
  //   paymentIndex: 0
  // }], {
  //   seller: actor,
  //   buyer: merchant
  // }))
  
  // game.itempiles.renderItemPileInterface(merchant, { inspectingTarget: actor });
  
  // ItemEditor.show(source.items.getName("Antitoxin"));
  
});

Hooks.once("socketlib.ready", () => {
  Socket.initialize();
});

Hooks.on("reset-item-pile-settings", async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.data.key.includes('item-piles'))) {
    await setting.delete();
  }
})