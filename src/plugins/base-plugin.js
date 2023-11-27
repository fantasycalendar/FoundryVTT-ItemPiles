import * as Helpers from "../helpers/helpers.js";

export default class BasePlugin {

	invalidVersionError = ""
	minVersionError = ""

	constructor(pluginName, minVersion, invalidVersion) {
		this.pluginName = pluginName;
		this.minVersion = minVersion;
		this.invalidVersion = invalidVersion;
		this.initialized = false;
		this.initialize();
	}

	initialize() {

		if (!game.modules.get(this.pluginName)?.active) {
			return;
		}

		if (game.modules.get(this.pluginName).version === this.invalidVersion) {
			if (this.invalidVersionError) {
				throw Helpers.custom_error(this.invalidVersionError);
			}
			return;
		}

		if (isNewerVersion(this.minVersion, game.modules.get(this.pluginName).version)) {
			if (this.minVersionError) {
				throw Helpers.custom_error(this.minVersionError);
			}
			return;
		}

		this.registerHooks();

		this.initialized = true;

	}

	registerHooks() {

	}

}
