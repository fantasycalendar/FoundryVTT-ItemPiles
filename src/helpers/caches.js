import CONSTANTS from "../constants/constants.js";
import * as Utilities from "./utilities.js";

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

	#debounceClear = {};
	#timeout = {};

	constructor(timeout = 50) {
		super();
		this.#timeout = timeout;
	}

	set(key, value) {
		this.#setDebounce(key)
		return super.set(key, value);
	}

	#setDebounce(key) {
		if (!this.#debounceClear[key]) {
			const self = this;
			this.#debounceClear[key] = foundry.utils.debounce(() => {
				delete self.#debounceClear[key];
				self.delete(key);
			}, this.#timeout);
		}
		this.#debounceClear[key]();
	}
}


export const deletedActorCache = new DebouncedCache(5000);
export const cachedActorCurrencies = new DebouncedCache();
export const cachedFilterList = new DebouncedCache();
export const cachedRequiredPropertiesList = new DebouncedCache();
export const cachedCurrencyList = new DebouncedCache();

