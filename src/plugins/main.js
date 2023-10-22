import SimpleCalendarPlugin from "./simple-calendar.js";
import Levels3dPreview from "./levels-3d-preview.js";
import RarityColors from "./rarity-colors.js";

export const Plugins = {
  "foundryvtt-simple-calendar": {
    on: "ready",
    data: null,
    class: SimpleCalendarPlugin,
    minVersion: "2.0.0",
    invalidVersion: "v1.3.75"
  },
  "levels-3d-preview": {
    on: "init",
    data: null,
    class: Levels3dPreview,
    minVersion: "4.9.6"
  },
  "rarity-colors": {
    on: "init",
    data: null,
    class: RarityColors,
    minVersion: "0.3.6"
  }
}

export function setupPlugins(hook) {
  for (const [plugin, pluginData] of Object.entries(Plugins).filter(e => e[1].on === hook)) {
    if (!game.modules.get(plugin)?.active) {
      continue;
    }
    pluginData.data = new pluginData.class(plugin, pluginData.minVersion, pluginData?.invalidVersion);
  }
}
