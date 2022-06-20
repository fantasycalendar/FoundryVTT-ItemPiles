import "./styles/styles.scss";

import registerSettings from "./settings.js";
import { registerHotkeysPost, registerHotkeysPre } from "./hotkeys.js";
import * as Utilities from "./helpers/utilities.js";
import Socket from "./socket.js";
import API from "./API/api.js";
import TradeAPI from "./API/trade-api.js";

Hooks.once("init", async () => {
  registerHotkeysPre();
  registerSettings();
  TradeAPI.initialize();
  game.itempiles = API;
  window.ItemPiles = {
    API: API
  };
});

Hooks.once("ready", () => {
  Socket.initialize();
  registerHotkeysPost();
})

Hooks.on("reset-item-pile-settings", async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.data.key.includes('item-piles'))) {
    await setting.delete();
  }
})

Hooks.on("createItem", (doc) => Utilities.refreshAppsWithDocument(doc.parent, "refreshItems"));
Hooks.on("updateItem", (doc) => Utilities.refreshAppsWithDocument(doc.parent, "refreshItems"));
Hooks.on("deleteItem", (doc) => Utilities.refreshAppsWithDocument(doc.parent, "refreshItems"));
Hooks.on("updateActor", (doc) => Utilities.refreshAppsWithDocument(doc, "refreshAttributes"));
Hooks.on("deleteToken", (doc) => Utilities.refreshAppsWithDocument(doc, "refreshDeletedPile"));
Hooks.on("deleteActor", (doc) => Utilities.refreshAppsWithDocument(doc, "refreshDeletedPile"));