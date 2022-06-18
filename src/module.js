import registerSettings from "./settings.js";
import SettingsShim from "./applications/settings/settings-app.js";
import CurrenciesEditor from "./applications/editors/currencies/currencies-editor.js";
import ItemFiltersEditor from "./applications/editors/item-filters/item-filters-editor.js";
import ItemSimilaritiesEditor from "./applications/editors/item-similarities-editor/item-similarities-editor.js";

Hooks.once("init", async () => {
  registerSettings();
});

Hooks.once("ready", () => {
  new SettingsShim().render(true);
})


Hooks.on("reset-item-pile-settings", async () => {
  for (let setting of game.settings.storage.get("world").filter(setting => setting.data.key.includes('item-piles'))) {
    await setting.delete();
  }
})