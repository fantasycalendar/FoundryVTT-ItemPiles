import registerSettings from "./settings.js";
import SettingsShim from "./applications/settings/settings-app.js";

Hooks.once("init", async () => {
    registerSettings();
});

Hooks.once("ready", () => {
    new SettingsShim().render(true);
})
