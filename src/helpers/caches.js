import CONSTANTS from "../constants/constants.js";
import * as Utilities from "./utilities.js";
import { getCurrencyList } from "./pile-utilities.js";

export function setupCaches() {

  Hooks.on(CONSTANTS.HOOKS.PILE.DELETE, (doc) => {
    const uuid = Utilities.getUuid(doc);
    let actor = Utilities.getActor(doc);
    if (actor instanceof Actor) {
      actor = actor.toObject();
    }
    deletedActorCache.set(uuid, actor);
  });

}

class DebouncedCache extends Map {

  #debounceClear;

  constructor(timeout) {
    super();
    this.#debounceClear = foundry.utils.debounce((key) => {
      this.delete(key);
    }, timeout)
  }

  set(key, value) {
    this.#debounceClear(key)
    return super.set(key, value);
  }
}


export const deletedActorCache = new DebouncedCache(1000);
export const cachedActorCurrencies = new DebouncedCache(200);
export const cachedFilterList = new DebouncedCache(1000);
export const cachedCurrencyList = new DebouncedCache(1000);

