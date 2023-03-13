import BasePlugin from "./base-plugin.js";

export default class RarityColors extends BasePlugin {

  getItemColor(item) {

    if (game.system.id !== "dnd5e") return false;

    const itemType = item.type;
    const rarity = item.system.rarity ? item.system.rarity.replaceAll(/\s/g, "").toLowerCase().trim() : itemType;

    const isSpell = itemType === "spell";
    const spellFlag = game.settings.get(this.pluginName, "spellFlag");

    const isFeat = itemType === "feat";
    const featFlag = game.settings.get(this.pluginName, "featFlag");

    let doColor = false;
    if (item.system.rarity && item.system.rarity !== "common") {
      doColor = true;
    } else if (isSpell && spellFlag) {
      doColor = true;
    } else if (isFeat && featFlag) {
      doColor = true;
    }

    if (!doColor) return false;

    try {
      return game.settings.get(this.pluginName, rarity);
    } catch (err) {
      return false;
    }

  }

}
