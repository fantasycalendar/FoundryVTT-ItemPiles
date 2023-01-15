import BasePlugin from "./base-plugin.js";
import ItemPileStore from "../stores/item-pile-store.js";

export default class SimpleCalendarPlugin extends BasePlugin {

  registerHooks() {
    Hooks.on(window.SimpleCalendar.Hooks.DateTimeChange, () => {
      ItemPileStore.notifyAllOfChanges("updateOpenCloseStatus");
    });
  }

}
