import "./styles/styles.scss";

import API from "./api.js";
import registerSettings from "./settings.js";
import Socket from "./socket.js";
import SettingsShim from "./applications/settings/settings-app.js";
import CurrenciesEditor from "./applications/editors/currencies/currencies-editor.js";
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";
import { ItemPileInventory } from "./applications/item-pile-inventory/item-pile-inventory.js";

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
    ItemPileInventory.show('Scene.Kf2SPAzQ0mTN4VCJ.Token.n4s3wgi8yfs9cjnn', 'Scene.Kf2SPAzQ0mTN4VCJ.Token.SHzadZJZY0NeKpzo')
  })
})

Hooks.on("reset-item-pile-settings", async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.data.key.includes('item-piles'))) {
    await setting.delete();
  }
})

Hooks.on("createItem", (doc, data) => {
  const actor = doc.parent;
  if (actor === this.pileActor) {
  }
});

Hooks.on("createItem", (doc) => {
  ItemPileInventory.refreshItems(doc.parent);
});
Hooks.on("updateItem", (doc) => {
  ItemPileInventory.refreshItems(doc.parent);
});
Hooks.on("deleteItem", (doc) => {
  ItemPileInventory.refreshItems(doc.parent);
});
Hooks.on("updateActor", (doc) => {
  ItemPileInventory.refreshAttributes(doc);
});
Hooks.on("deleteToken", (doc) => {
  ItemPileInventory.refreshDeletedPile(doc);
});
Hooks.on("deleteActor", (doc) => {
  ItemPileInventory.refreshDeletedPile(doc);
});