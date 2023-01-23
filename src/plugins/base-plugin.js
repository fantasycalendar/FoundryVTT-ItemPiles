import * as Helpers from "../helpers/helpers.js";

export default class BasePlugin {

  constructor(pluginName, minVersion, invalidVersion) {
    this.pluginName = pluginName;
    this.minVersion = minVersion;
    this.invalidVersion = invalidVersion;
    this.initialized = false;
    this.initialize();
  }

  invalidVersionError = "Simple Calendar version 1.3.75 is installed, but Item Piles requires version 2.0.0 or above. The author made a mistake, and you will need to reinstall the Simple Calendar module.";
  minVersionError = "Simple Calendar is out of date to be compatible with Item Piles, please update as soon as possible.";

  initialize() {
    
    if (!game.modules.get(this.pluginName)?.active) {
      return;
    }

    if (game.modules.get(this.pluginName).version === this.invalidVersion) {
      throw Helpers.custom_error(this.invalidVersionError);
    }

    if (isNewerVersion(this.minVersion, game.modules.get(this.pluginName).version)) {
      throw Helpers.custom_error(this.minVersionError);
    }

    this.registerHooks();

    this.initialized = true;

  }

  registerHooks() {

  }

}
