import SimpleCalendarPlugin from "./simple-calendar.js";

const plugins = {
  "foundryvtt-simple-calendar": {
    data: null,
    class: SimpleCalendarPlugin,
    minVersion: "2.0.0",
    invalidVersion: "v1.3.75"
  }
}

export default function setupPlugins() {
  for (const [plugin, pluginData] of Object.entries(plugins)) {
    pluginData.data = new pluginData.class(plugin, pluginData.minVersion, pluginData?.invalidVersion);
  }
}
