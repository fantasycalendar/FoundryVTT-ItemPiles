import BasePlugin from "./base-plugin.js";
import ItemPileStore from "../stores/item-pile-store.js";

export default class SimpleCalendarPlugin extends BasePlugin {

  invalidVersionError = "Simple Calendar version 1.3.75 is installed, but Item Piles requires version 2.0.0 or above. The author made a mistake, and you will need to reinstall the Simple Calendar module.";
  minVersionError = "Simple Calendar is out of date to be compatible with Item Piles, please update as soon as possible.";

  registerHooks() {
    Hooks.on(window.SimpleCalendar.Hooks.DateTimeChange, () => {
      ItemPileStore.notifyAllOfChanges("updateOpenCloseStatus");
    });
  }

}
