import BasePlugin from "./base-plugin.js";
import PrivateAPI from "../API/private-api.js";

export default class Levels3dPreview extends BasePlugin {

	registerHooks() {

		Hooks.on("3DCanvasConfig", (config) => {
			config.INTERACTIONS.dropFunctions.Item = async function (event, data) {
				canvas.tokens.activate();
				return PrivateAPI._dropData(canvas, data);
			}
		});

	}

}
