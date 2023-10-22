import BasePlugin from "./base-plugin.js";

export default class RarityColors extends BasePlugin {

  minVersionError = "Rarity Colors is out of date to be compatible with Item Piles, please update to 0.3.6 soon as possible.";

  getItemColor(item) {

    if (game.system.id !== "dnd5e") return false;

    if (!game.modules.get(this.pluginName)?.api?.getColorFromItem) return false;

    try {
      return game.modules.get(this.pluginName)?.api?.getColorFromItem(item);
    } catch (err) {
      return false;
    }

  }

}
