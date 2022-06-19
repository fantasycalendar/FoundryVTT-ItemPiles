import "./styles/styles.scss";

import API from "./api.js";
import registerSettings from "./settings.js";
import Socket from "./socket.js";
import SettingsShim from "./applications/settings/settings-app.js";
import CurrenciesEditor from "./applications/editors/currencies/currencies-editor.js";
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";

Hooks.once("init", async () => {
  registerSettings();
  game.itempiles = API;
  window.ItemPiles = {
    API: API
  };
});

Hooks.once("ready", () => {
  Socket.initialize();
  
  setTimeout(() => {
    ItemPileConfig.show(game.actors.getName("Almighty Spark"))
  })
})

Hooks.on("reset-item-pile-settings", async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.data.key.includes('item-piles'))) {
    await setting.delete();
  }
})