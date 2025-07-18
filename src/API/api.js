import * as Helpers from "../helpers/helpers.js";
import * as Utilities from "../helpers/utilities.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import * as CompendiumUtilities from "../helpers/compendium-utilities.js";
import CONSTANTS from "../constants/constants.js";
import SETTINGS from "../constants/settings.js";
import ItemPileSocket from "../socket.js";
import TradeAPI from "./trade-api.js";
import PrivateAPI from "./private-api.js";
import { SYSTEMS } from "../systems.js";
import ItemPileConfig from "../applications/item-pile-config/item-pile-config.js";
import GiveItems from "../applications/dialogs/give-items-dialog/give-items-dialog.js";

class API {
	/**
	 * @class API
	 */

	/**
	 * The actor class type used for the original item pile actor in this system
	 *
	 * @returns {string}
	 */
	static get ACTOR_CLASS_TYPE() {
		return Helpers.getSetting(SETTINGS.ACTOR_CLASS_TYPE);
	}

	/**
	 * The item class type is the type of item that will be used for the default loot item
	 *
	 * @returns {string}
	 */
	static get ITEM_CLASS_LOOT_TYPE() {
		return Helpers.getSetting(SETTINGS.ITEM_CLASS_LOOT_TYPE);
	}

	/**
	 * The item class type is the type of item that will be used for the default weapon item
	 *
	 * @returns {string}
	 */
	static get ITEM_CLASS_WEAPON_TYPE() {
		return Helpers.getSetting(SETTINGS.ITEM_CLASS_WEAPON_TYPE);
	}

	/**
	 * The item class type is the type of item that will be used for the default equipment item
	 *
	 * @returns {string}
	 */
	static get ITEM_CLASS_EQUIPMENT_TYPE() {
		return Helpers.getSetting(SETTINGS.ITEM_CLASS_EQUIPMENT_TYPE);
	}

	/**
	 * The currencies used in this system
	 *
	 * @returns {Array<{primary: boolean, name: string, data: Object, img: string, abbreviation: string, exchange: number}>}
	 */
	static get CURRENCIES() {
		return foundry.utils.deepClone(Helpers.getSetting(SETTINGS.CURRENCIES).map(currency => {
			if (currency.type === "item" && currency.data.uuid) {
				const compendiumItem = CompendiumUtilities.getItemFromCache(currency.data.uuid);
				if (compendiumItem) {
					currency.data.item = compendiumItem;
				}
			}
			delete currency["quantity"];
			currency.secondary = false;
			return currency;
		}));
	}

	/**
	 * The secondary currencies used in this system
	 *
	 * @returns {Array<{name: string, data: Object, img: string, abbreviation: string}>}
	 */
	static get SECONDARY_CURRENCIES() {
		return foundry.utils.deepClone(Helpers.getSetting(SETTINGS.SECONDARY_CURRENCIES).map(currency => {
			if (currency.type === "item" && currency.data.uuid) {
				const compendiumItem = CompendiumUtilities.getItemFromCache(currency.data.uuid);
				if (compendiumItem) {
					currency.data.item = compendiumItem;
				}
			}
			delete currency["quantity"];
			currency.secondary = true;
			return currency;
		}));
	}

	/**
	 * The smallest decimal digits shown for any fractional currency amounts. Only used when there is only one currency.
	 *
	 * @returns {Number}
	 */
	static get CURRENCY_DECIMAL_DIGITS() {
		return Helpers.getSetting(SETTINGS.CURRENCY_DECIMAL_DIGITS);
	}

	/**
	 * The attribute used to track the price of items in this system
	 *
	 * @returns {string}
	 */
	static get ITEM_PRICE_ATTRIBUTE() {
		return Helpers.getSetting(SETTINGS.ITEM_PRICE_ATTRIBUTE);
	}

	/**
	 * The attribute used to track the quantity of items you would get for the price of an item
	 *
	 * @returns {string}
	 */
	static get QUANTITY_FOR_PRICE_ATTRIBUTE() {
		return Helpers.getSetting(SETTINGS.QUANTITY_FOR_PRICE_ATTRIBUTE);
	}

	/**
	 * The attribute used to track the quantity of items in this system
	 *
	 * @returns {string}
	 */
	static get ITEM_QUANTITY_ATTRIBUTE() {
		return Helpers.getSetting(SETTINGS.ITEM_QUANTITY_ATTRIBUTE);
	}

	/**
	 * The filters for item types eligible for interaction within this system
	 *
	 * @returns {Array<{name: string, filters: string}>}
	 */
	static get ITEM_FILTERS() {
		return Helpers.getSetting(SETTINGS.ITEM_FILTERS);
	}

	/**
	 * The attributes for detecting item similarities
	 *
	 * @returns {Array<string>}
	 */
	static get ITEM_SIMILARITIES() {
		return Helpers.getSetting(SETTINGS.ITEM_SIMILARITIES);
	}

	/**
	 * The types of items that will always be considered unique when transferring between actors
	 *
	 * @returns {Array<string>}
	 */
	static get UNSTACKABLE_ITEM_TYPES() {
		return Helpers.getSetting(SETTINGS.UNSTACKABLE_ITEM_TYPES);
	}

	/**
	 * The system specific default values for item pile actors created in this system
	 *
	 * @returns {Object}
	 */
	static get PILE_DEFAULTS() {
		return Helpers.getSetting(SETTINGS.PILE_DEFAULTS);
	}

	/**
	 * The system specific default values for item pile tokens created in this system
	 *
	 * @returns {Object}
	 */
	static get TOKEN_FLAG_DEFAULTS() {
		return Helpers.getSetting(SETTINGS.TOKEN_FLAG_DEFAULTS);
	}

	/**
	 * Sets the actor class type used for the original item pile actor in this system
	 *
	 * @param {string} inClassType
	 * @returns {Promise}
	 */
	static async setActorClassType(inClassType) {
		if (typeof inClassType !== "string") {
			throw Helpers.custom_error("setActorTypeClass | inClassType must be of type string");
		}
		return Helpers.setSetting(SETTINGS.ACTOR_CLASS_TYPE, inClassType);
	}

	/**
	 * Sets the currencies used in this system
	 *
	 * @param {Array<Object>} inCurrencies
	 * @returns {Promise}
	 */
	static async setCurrencies(inCurrencies) {
		if (!Array.isArray(inCurrencies)) {
			throw Helpers.custom_error("setCurrencies | inCurrencies must be an array");
		}
		inCurrencies.forEach(currency => {
			if (typeof currency !== "object") {
				throw Helpers.custom_error("setCurrencies | each entry in inCurrencies must be of type object");
			}
			if (typeof currency.primary !== "boolean") {
				throw Helpers.custom_error("setCurrencies | currency.primary must be of type boolean");
			}
			if (typeof currency.name !== "string") {
				throw Helpers.custom_error("setCurrencies | currency.name must be of type string");
			}
			if (typeof currency.abbreviation !== "string") {
				throw Helpers.custom_error("setCurrencies | currency.abbreviation must be of type string");
			}
			if (typeof currency.exchangeRate !== "number") {
				throw Helpers.custom_error("setCurrencies | currency.exchangeRate must be of type number");
			}
			if (typeof currency.data !== "object") {
				throw Helpers.custom_error("setCurrencies | currency.data must be of type object");
			}
			if (typeof currency.data.path !== "string" && typeof currency.data.uuid !== "string" && typeof currency.data.item !== "object") {
				throw Helpers.custom_error("setCurrencies | currency.data must contain either \"path\" (string), \"uuid\" (string), or \"item\" (object)");
			}
			if (currency.img && typeof currency.img !== "string") {
				throw Helpers.custom_error("setCurrencies | currency.img must be of type string");
			}
		});
		return Helpers.setSetting(SETTINGS.CURRENCIES, inCurrencies);
	}

	/**
	 * Sets the secondary currencies used in this system
	 *
	 * @param {Array<Object>} inSecondaryCurrencies
	 * @returns {Promise}
	 */
	static async setSecondaryCurrencies(inSecondaryCurrencies) {
		if (!Array.isArray(inSecondaryCurrencies)) {
			throw Helpers.custom_error("setSecondaryCurrencies | inSecondaryCurrencies must be an array");
		}
		inSecondaryCurrencies.forEach(currency => {
			if (typeof currency !== "object") {
				throw Helpers.custom_error("setSecondaryCurrencies | each entry in inSecondaryCurrencies must be of type object");
			}
			if (typeof currency.name !== "string") {
				throw Helpers.custom_error("setSecondaryCurrencies | currency.name must be of type string");
			}
			if (typeof currency.abbreviation !== "string") {
				throw Helpers.custom_error("setSecondaryCurrencies | currency.abbreviation must be of type string");
			}
			if (typeof currency.data !== "object") {
				throw Helpers.custom_error("setSecondaryCurrencies | currency.data must be of type object");
			}
			if (typeof currency.data.path !== "string" && typeof currency.data.uuid !== "string" && typeof currency.data.item !== "object") {
				throw Helpers.custom_error("setSecondaryCurrencies | currency.data must contain either \"path\" (string), \"uuid\" (string), or \"item\" (object)");
			}
			if (currency.img && typeof currency.img !== "string") {
				throw Helpers.custom_error("setSecondaryCurrencies | currency.img must be of type string");
			}
		});
		return Helpers.setSetting(SETTINGS.SECONDARY_CURRENCIES, inSecondaryCurrencies);
	}

	/**
	 * Set the smallest decimal digits shown for any fractional currency amounts. Only used when there is only one currency.
	 *
	 * @param {Number} inDecimalDigits
	 * @returns {Promise}
	 */
	static setCurrencyDecimalDigits(inDecimalDigits) {
		if (typeof inDecimalDigits !== "number") {
			throw Helpers.custom_error("setCurrencyDecimalDigits | inDecimalDigits must be of type string");
		}
		return Helpers.setSetting(SETTINGS.CURRENCY_DECIMAL_DIGITS, inDecimalDigits);
	}

	/**
	 * Sets the attribute used to track the quantity of items in this system
	 *
	 * @param {string} inAttribute
	 * @returns {Promise}
	 */
	static async setItemQuantityAttribute(inAttribute) {
		if (typeof inAttribute !== "string") {
			throw Helpers.custom_error("setItemQuantityAttribute | inAttribute must be of type string");
		}
		return Helpers.setSetting(SETTINGS.ITEM_QUANTITY_ATTRIBUTE, inAttribute);
	}

	/**
	 * Sets the attribute used to track the price of items in this system
	 *
	 * @param {string} inAttribute
	 * @returns {Promise}
	 */
	static async setItemPriceAttribute(inAttribute) {
		if (typeof inAttribute !== "string") {
			throw Helpers.custom_error("setItemPriceAttribute | inAttribute must be of type string");
		}
		return Helpers.setSetting(SETTINGS.ITEM_PRICE_ATTRIBUTE, inAttribute);
	}

	/**
	 * Sets the attribute used to track the price of items in this system
	 *
	 * @param {string} inAttribute
	 * @returns {Promise}
	 */
	static async setQuantityForPriceAttribute(inAttribute) {
		if (typeof inAttribute !== "string") {
			throw Helpers.custom_error("setQuantityForPriceAttribute | inAttribute must be of type string");
		}
		return Helpers.setSetting(SETTINGS.QUANTITY_FOR_PRICE_ATTRIBUTE, inAttribute);
	}

	/**
	 * Sets the items filters for interaction within this system
	 *
	 * @param {Array<{path: string, filters: string}>} inFilters
	 * @returns {Promise}
	 */
	static async setItemFilters(inFilters) {
		if (!Array.isArray(inFilters)) {
			throw Helpers.custom_error("setItemFilters | inFilters must be of type array");
		}
		inFilters.forEach(filter => {
			if (typeof filter?.path !== "string") {
				throw Helpers.custom_error("setItemFilters | each entry in inFilters must have a \"path\" property with a value that is of type string");
			}
			if (typeof filter?.filters !== "string") {
				throw Helpers.custom_error("setItemFilters | each entry in inFilters must have a \"filters\" property with a value that is of type string");
			}
		});
		return Helpers.setSetting(SETTINGS.ITEM_FILTERS, inFilters);
	}

	/**
	 * Sets the attributes for detecting item similarities
	 *
	 * @param {Array<string>} inPaths
	 * @returns {Promise}
	 */
	static async setItemSimilarities(inPaths) {
		if (!Array.isArray(inPaths)) {
			throw Helpers.custom_error("setItemSimilarities | inPaths must be of type array");
		}
		inPaths.forEach(path => {
			if (typeof path !== "string") {
				throw Helpers.custom_error("setItemSimilarities | each entry in inPaths must be of type string");
			}
		});
		return Helpers.setSetting(SETTINGS.ITEM_SIMILARITIES, inPaths);
	}

	/**
	 * Sets the types of items that will always be considered unique when transferring between actors
	 *
	 * @param {Array<string>} inTypes
	 * @returns {Promise}
	 */
	static async setUnstackableItemTypes(inTypes) {
		if (!Array.isArray(inTypes)) {
			throw Helpers.custom_error("setUnstackableItemTypes | inTypes must be of type array");
		}
		inTypes.forEach(path => {
			if (typeof path !== "string") {
				throw Helpers.custom_error("setUnstackableItemTypes | each entry in inTypes must be of type string");
			}
		});
		return Helpers.setSetting(SETTINGS.UNSTACKABLE_ITEM_TYPES, inTypes);
	}

	/**
	 * Sets the types of items that will always be considered unique when transferring between actors
	 *
	 * @param {Object} inDefaults
	 * @returns {Promise}
	 */
	static async setPileDefaults(inDefaults) {
		if (typeof inDefaults !== "object") {
			throw Helpers.custom_error("setPileDefaults | inDefaults must be of type object");
		}
		const validKeys = new Set(Object.keys(CONSTANTS.PILE_DEFAULTS));
		for (const key of Object.keys(inDefaults)) {
			if (!validKeys.has(key)) {
				throw Helpers.custom_error(`setPileDefaults | ${key} is not a valid pile setting`);
			}
		}
		return Helpers.setSetting(SETTINGS.PILE_DEFAULTS, inDefaults);
	}

	/**
	 * Set the flags that will be applied to any tokens created through item piles
	 *
	 * @param {Object} inDefaults
	 * @returns {Promise}
	 */
	static async setTokenFlagDefaults(inDefaults) {
		if (typeof inDefaults !== "object") {
			throw Helpers.custom_error("setTokenFlagDefaults | inDefaults must be of type object");
		}
		return Helpers.setSetting(SETTINGS.TOKEN_FLAG_DEFAULTS, inDefaults);
	}

	/**
	 * A combination of all the methods above, but this integrates a system's specific
	 * settings more readily into item piles, allowing users to also change the settings
	 * afterward.
	 *
	 * @param {Object<{
	 *   VERSION: string,
	 *   ACTOR_CLASS_TYPE: string,
	 *   ITEM_CLASS_LOOT_TYPE: string,
	 *   ITEM_CLASS_WEAPON_TYPE: string,
	 *   ITEM_CLASS_EQUIPMENT_TYPE: string,
	 *   ITEM_QUANTITY_ATTRIBUTE: string,
	 *   ITEM_PRICE_ATTRIBUTE: string,
	 *   QUANTITY_FOR_PRICE_ATTRIBUTE: string,
	 *   ITEM_FILTERS: Array<{path: string, filters: string}>,
	 *   ITEM_SIMILARITIES: Array<string>,
	 *   UNSTACKABLE_ITEM_TYPES: Array<string>,
	 *   PILE_DEFAULTS: Object,
	 *   TOKEN_FLAG_DEFAULTS: Object,
	 *   ITEM_TRANSFORMER: undefined/Function,
	 *   ITEM_COST_TRANSFORMER: undefined/Function,
	 *   PRICE_MODIFIER_TRANSFORMER: undefined/Function,
	 *   SYSTEM_HOOKS: undefined/Function,
	 *   SHEET_OVERRIDES: undefined/Function,
	 *   VAULT_STYLES: undefined/Array<{ path: string, value: string, styling: Object }>,
	 *   CURRENCIES: Array<{
	 *     primary: boolean,
	 *     type: string ["attribute"/"item"],
	 *     img: string,
	 *     abbreviation: string,
	 *     data: Object<{ path: string }|{ uuid: string }|{ item: object }>,
	 *     exchangeRate: number
	 *   }>,
	 *   SECONDARY_CURRENCIES: Array<{
	 *     type: string ["attribute"/"item"],
	 *     img: string,
	 *     abbreviation: string,
	 *     data: Object<{ path: string }|{ uuid: string }|{ item: object }>
	 *   }>,
	 *   CURRENCY_DECIMAL_DIGITS: undefined/number
	 * }>} inData
	 * @param version {string} The game system version this configuration should be applied to
	 */
	static addSystemIntegration(inData, version = "latest") {

		const defaultSettings = foundry.utils.deepClone(SYSTEMS.DEFAULT_SETTINGS);
		const data = foundry.utils.mergeObject(defaultSettings, inData, { insertKeys: false })

		if (typeof data["VERSION"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.VERSION must be of type string");
		}

		if (typeof data["ACTOR_CLASS_TYPE"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.ACTOR_CLASS_TYPE must be of type string");
		}

		if (data["ITEM_CLASS_LOOT_TYPE"] && typeof data["ITEM_CLASS_LOOT_TYPE"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.ITEM_CLASS_LOOT_TYPE must be of type string");
		}

		if (data["ITEM_CLASS_WEAPON_TYPE"] && typeof data["ITEM_CLASS_WEAPON_TYPE"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.ITEM_CLASS_WEAPON_TYPE must be of type string");
		}

		if (data["ITEM_CLASS_EQUIPMENT_TYPE"] && typeof data["ITEM_CLASS_EQUIPMENT_TYPE"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.ITEM_CLASS_EQUIPMENT_TYPE must be of type string");
		}

		if (typeof data["ITEM_QUANTITY_ATTRIBUTE"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.ITEM_QUANTITY_ATTRIBUTE must be of type string");
		}

		if (typeof data["ITEM_PRICE_ATTRIBUTE"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.ITEM_PRICE_ATTRIBUTE must be of type string");
		}

		if (data["QUANTITY_FOR_PRICE_ATTRIBUTE"] && typeof data["QUANTITY_FOR_PRICE_ATTRIBUTE"] !== "string") {
			throw Helpers.custom_error("addSystemIntegration | data.QUANTITY_FOR_PRICE_ATTRIBUTE must be of type string");
		}

		if (!Array.isArray(data["ITEM_FILTERS"])) {
			throw Helpers.custom_error("addSystemIntegration | data.ITEM_FILTERS must be of type array");
		}

		data["ITEM_FILTERS"].forEach(filter => {
			if (typeof filter?.path !== "string") {
				throw Helpers.custom_error("addSystemIntegration | each entry in data.ITEM_FILTERS must have a \"path\" property with a value that is of type string");
			}
			if (typeof filter?.filters !== "string") {
				throw Helpers.custom_error("addSystemIntegration | each entry in data.ITEM_FILTERS must have a \"filters\" property with a value that is of type string");
			}
		});

		if (data['ITEM_TRANSFORMER']) {
			if (!Helpers.isFunction(data['ITEM_TRANSFORMER'])) {
				throw Helpers.custom_error("addSystemIntegration | data.ITEM_TRANSFORMER must be of type function");
			}
			if (typeof data['ITEM_TRANSFORMER']({}) !== "object") {
				throw Helpers.custom_error("addSystemIntegration | data.ITEM_TRANSFORMER's return value must be of type object");
			}
		}

		if (data['ITEM_COST_TRANSFORMER']) {
			if (!Helpers.isFunction(data['ITEM_COST_TRANSFORMER'])) {
				throw Helpers.custom_error("addSystemIntegration | data.ITEM_COST_TRANSFORMER must be of type function");
			}
		}

		if (data['PRICE_MODIFIER_TRANSFORMER']) {
			if (!Helpers.isFunction(data['PRICE_MODIFIER_TRANSFORMER'])) {
				throw Helpers.custom_error("addSystemIntegration | data.PRICE_MODIFIER_TRANSFORMER must be of type function");
			}
			if (typeof data['PRICE_MODIFIER_TRANSFORMER']({}) !== "object") {
				throw Helpers.custom_error("addSystemIntegration | data.PRICE_MODIFIER_TRANSFORMER's return value must be of type object");
			}
		}

		if (data['SYSTEM_HOOKS']) {
			if (!Helpers.isFunction(data['SYSTEM_HOOKS'])) {
				throw Helpers.custom_error("addSystemIntegration | data.SYSTEM_HOOKS must be of type function");
			}
		}

		if (data['SHEET_OVERRIDES']) {
			if (!Helpers.isFunction(data['SHEET_OVERRIDES'])) {
				throw Helpers.custom_error("addSystemIntegration | data.SHEET_OVERRIDES must be of type function");
			}
		}

		if (typeof data['PILE_DEFAULTS'] !== "object") {
			throw Helpers.custom_error("addSystemIntegration | data.PILE_DEFAULTS must be of type object");
		}
		const validKeys = new Set(Object.keys(CONSTANTS.PILE_DEFAULTS));
		for (const key of Object.keys(data['PILE_DEFAULTS'])) {
			if (!validKeys.has(key)) {
				throw Helpers.custom_error(`addSystemIntegration | data.PILE_DEFAULTS contains illegal key "${key}" that is not a valid pile default`);
			}
		}

		if (data['VAULT_STYLES']) {
			if (!Array.isArray(data['VAULT_STYLES'])) {
				throw Helpers.custom_error("addSystemIntegration | data.VAULT_STYLES must be of type object");
			}
			const requiredKeys = new Set(["path", "value", "styling"]);
			for (const [index, entry] of data['VAULT_STYLES'].entries()) {
				for (const key of requiredKeys) {
					if (!entry.hasOwnProperty(key)) {
						throw Helpers.custom_error(`addSystemIntegration | data.VAULT_STYLES.${index} is missing required key "${key}"`);
					}
				}
				if (typeof entry["styling"] !== "object") {
					throw Helpers.custom_error(`addSystemIntegration | data.VAULT_STYLES.${index}.styling must be of type object!`);
				}
				for (const stylingValue of Object.values(entry["styling"])) {
					if (typeof stylingValue !== "string") {
						throw Helpers.custom_error(`addSystemIntegration | each entry in data.VAULT_STYLES.${index}.styling must have a value of type string!`);
					}
				}
			}
		}

		if (data['TOKEN_FLAG_DEFAULTS'] && typeof data['TOKEN_FLAG_DEFAULTS'] !== "object") {
			throw Helpers.custom_error("addSystemIntegration | data.TOKEN_FLAG_DEFAULTS must be of type object");
		}

		if (!Array.isArray(data['ITEM_SIMILARITIES'])) {
			throw Helpers.custom_error("addSystemIntegration | data.ITEM_SIMILARITIES must be of type array");
		}
		data['ITEM_SIMILARITIES'].forEach(path => {
			if (typeof path !== "string") {
				throw Helpers.custom_error("addSystemIntegration | each entry in data.ITEM_SIMILARITIES must be of type string");
			}
		});

		if (data['UNSTACKABLE_ITEM_TYPES']) {
			if (!Array.isArray(data['UNSTACKABLE_ITEM_TYPES'])) {
				throw Helpers.custom_error("addSystemIntegration | data.UNSTACKABLE_ITEM_TYPES must be of type array");
			}
			data['UNSTACKABLE_ITEM_TYPES'].forEach(path => {
				if (typeof path !== "string") {
					throw Helpers.custom_error("addSystemIntegration | each entry in data.UNSTACKABLE_ITEM_TYPES must be of type string");
				}
			});
		}

		if (!Array.isArray(data['CURRENCIES'])) {
			throw Helpers.custom_error("addSystemIntegration | data.CURRENCIES must be an array");
		}
		data['CURRENCIES'].forEach(currency => {
			if (typeof currency !== "object") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | each entry in data.CURRENCIES must be of type object");
			}
			if (typeof currency.primary !== "boolean") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | currency.primary must be of type boolean");
			}
			if (typeof currency.name !== "string") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | currency.name must be of type string");
			}
			if (typeof currency.abbreviation !== "string") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | currency.abbreviation must be of type string");
			}
			if (typeof currency.exchangeRate !== "number") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | currency.exchangeRate must be of type number");
			}
			if (typeof currency.data !== "object") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | currency.data must be of type object");
			}
			if (typeof currency.data.path !== "string" && typeof currency.data.uuid !== "string" && typeof currency.data.item !== "object") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | currency.data must contain either \"path\" (string), \"uuid\" (string), or \"item\" (object)");
			}
			if (currency.img && typeof currency.img !== "string") {
				throw Helpers.custom_error("addSystemIntegration | CURRENCIES | currency.img must be of type string");
			}
		});

		if (data['SECONDARY_CURRENCIES']) {
			if (!Array.isArray(data['SECONDARY_CURRENCIES'])) {
				throw Helpers.custom_error("addSystemIntegration | data.SECONDARY_CURRENCIES must be an array");
			}
			data['SECONDARY_CURRENCIES'].forEach(currency => {
				if (typeof currency !== "object") {
					throw Helpers.custom_error("addSystemIntegration | SECONDARY_CURRENCIES | each entry in data.SECONDARY_CURRENCIES must be of type object");
				}
				if (typeof currency.name !== "string") {
					throw Helpers.custom_error("addSystemIntegration | SECONDARY_CURRENCIES | currency.name must be of type string");
				}
				if (typeof currency.abbreviation !== "string") {
					throw Helpers.custom_error("addSystemIntegration | SECONDARY_CURRENCIES | currency.abbreviation must be of type string");
				}
				if (typeof currency.data !== "object") {
					throw Helpers.custom_error("addSystemIntegration | SECONDARY_CURRENCIES | currency.data must be of type object");
				}
				if (typeof currency.data.path !== "string" && typeof currency.data.uuid !== "string" && typeof currency.data.item !== "object") {
					throw Helpers.custom_error("addSystemIntegration | SECONDARY_CURRENCIES | currency.data must contain either \"path\" (string), \"uuid\" (string), or \"item\" (object)");
				}
				if (currency.img && typeof currency.img !== "string") {
					throw Helpers.custom_error("addSystemIntegration | SECONDARY_CURRENCIES | currency.img must be of type string");
				}
			});
		}

		if (data["CURRENCY_DECIMAL_DIGITS"] && typeof data['CURRENCY_DECIMAL_DIGITS'] !== "number") {
			throw Helpers.custom_error("addSystemIntegration | data.CURRENCY_DECIMAL_DIGITS must be of type number");
		}

		data['INTEGRATION'] = true;

		SYSTEMS.addSystem(data, version);

		Helpers.debug(`Registered system settings for ${game.system.id}`, data)

	}

	/**
	 * Gets all the system item types, including custom item piles item categories
	 *
	 * @returns {Array<{primary: boolean, name: string, data: Object, img: string, abbreviation: string, exchange: number}>}
	 */
	static getPrimaryCurrency(actor = false) {
		if (actor && actor instanceof Actor) {
			return PileUtilities.getActorPrimaryCurrency(actor);
		}
		return this.CURRENCIES.find(currency => currency.primary);
	}

	/**
	 * Retrieves all the system item types, including custom item piles item categories
	 *
	 * @returns {Object}
	 */
	static getItemCategories() {
		let systemTypes = Object.entries(CONFIG.Item.typeLabels).map(([key, value]) => {
			return [key, game.i18n.localize(value)];
		});
		systemTypes.shift();
		let customItemPilesCategories = Array.from(new Set(Helpers.getSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES))).map(cat => {
			return [cat, cat];
		});
		return Object.fromEntries(systemTypes.concat(customItemPilesCategories)
			.sort((a, b) => a[1] > b[1] ? 1 : -1));
	}

	/* ================= ITEM PILE METHODS ================= */

	/**
	 * Creates an item pile token at a location, or an item pile actor, or both at the same time.
	 *
	 * @param {object} options                                          Options to pass to the function
	 * @param {object/boolean} [options.position=false]                 Where to create the item pile, with x and y coordinates
	 * @param {string/boolean} [options.sceneId=game.user.viewedScene]  Which scene to create the item pile on
	 * @param {object} [options.tokenOverrides={}]                      Token data to apply to the newly created token
	 * @param {object} [options.actorOverrides={}]                      Actor data to apply to the newly created actor (if unlinked)
	 * @param {object} [options.itemPileFlags={}]                       Item pile specific flags to apply to the token and actor
	 * @param {Array/boolean} [options.items=false]                     Any items to create on the item pile
	 * @param {boolean} [options.createActor=false]                     Whether to create a new item pile actor
	 * @param {string/boolean} [options.actor=false]                    The UUID, ID, or name of the actor to use when creating this item pile
	 * @param {Array<string>/>string/boolean} [options.folders=false]   The folder to create the actor in, this can be an array of folder names, which will be traversed and created
	 *
	 * @returns {Promise<string>}
	 */
	static async createItemPile({
		position = false,
		sceneId = game.user.viewedScene,
		tokenOverrides = {},
		actorOverrides = {},
		itemPileFlags = {},
		items = false,
		createActor = false,
		actor = false,
		folders = false
	} = {}) {

		if (position) {
			if (typeof position !== "object") {
				throw Helpers.custom_error(`createItemPile | position must be of type object`);
			} else if (!Helpers.isRealNumber(position.x) || !Helpers.isRealNumber(position.y)) {
				throw Helpers.custom_error(`createItemPile | position.x and position.y must be of type numbers`);
			}
		}

		if (folders) {
			if (!Array.isArray(folders)) {
				folders = [folders];
			}
			folders.forEach(f => {
				if (typeof f !== 'string') {
					throw Helpers.custom_error(`createItemPile | folder must be of type string or array of strings`);
				}
			});
		}

		if (actor && !createActor) {
			if (typeof actor !== "string") {
				throw Helpers.custom_error(`createItemPile | actor must be of type string`);
			}
			let pileActor = await fromUuid(actor);
			if (!pileActor) {
				pileActor = game.actors.getName(actor);
			}
			if (!pileActor) {
				pileActor = game.actors.get(actor);
			}
			if (!pileActor) {
				throw Helpers.custom_error(`createItemPile | Could not find actor with the identifier of "${actor}"`);
			}
			actor = pileActor.uuid;
		}

		if (typeof sceneId !== "string") {
			throw Helpers.custom_error(`createItemPile | sceneId must be of type string`);
		}

		if (typeof tokenOverrides !== "object") {
			throw Helpers.custom_error(`createItemPile | tokenOverrides must be of type object`);
		}

		if (typeof actorOverrides !== "object") {
			throw Helpers.custom_error(`createItemPile | tokenOverrides must be of type object`);
		}

		if (typeof itemPileFlags !== "object") {
			throw Helpers.custom_error(`createItemPile | tokenOverrides must be of type object`);
		}

		if (items) {
			if (!Array.isArray(items)) items = [items]
			items = items.map(item => {
				return item instanceof Item ? item.toObject() : item;
			})
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.CREATE_PILE, {
			sceneId, position, actor, createActor, items, tokenOverrides, actorOverrides, itemPileFlags, folders
		});
	}

	/**
	 * Turns tokens and its actors into item piles
	 *
	 * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be turned into item piles
	 * @param {object} options                                          Options to pass to the function
	 * @param {object} options.pileSettings                             Overriding settings to be put on the item piles' settings
	 * @param {object/Function} options.tokenSettings                   Overriding settings that will update the tokens' settings
	 *
	 * @return {Promise<Array>}                                         The uuids of the targets after they were turned into item piles
	 */
	static turnTokensIntoItemPiles(targets, { pileSettings = {}, tokenSettings = {} } = {}) {

		if (!Array.isArray(targets)) targets = [targets];

		const targetUuids = targets.map(target => {
			if (!(target instanceof Token || target instanceof TokenDocument)) {
				throw Helpers.custom_error(`turnTokensIntoItemPiles | Target must be of type Token or TokenDocument`)
			}
			const targetUuid = Utilities.getUuid(target);
			if (!targetUuid) throw Helpers.custom_error(`turnTokensIntoItemPiles | Could not determine the UUID, please provide a valid target`)
			return targetUuid;
		})

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TURN_INTO_PILE, targetUuids, pileSettings, tokenSettings);
	}

	/**
	 * Reverts tokens from an item pile into a normal token and actor
	 *
	 * @param {Token/TokenDocument/Array<Token/TokenDocument>} targets  The targets to be reverted from item piles
	 * @param {object} options                                          Options to pass to the function
	 * @param {object/Function} options.tokenSettings                   Overriding settings that will update the tokens
	 *
	 * @return {Promise<Array>}                                         The uuids of the targets after they were reverted from being item piles
	 */
	static revertTokensFromItemPiles(targets, { tokenSettings = {} } = {}) {

		if (!Array.isArray(targets)) targets = [targets];

		const targetUuids = targets.map(target => {
			if (!(target instanceof Token || target instanceof TokenDocument)) {
				throw Helpers.custom_error(`revertTokensFromItemPiles | Target must be of type Token or TokenDocument`)
			}
			const targetUuid = Utilities.getUuid(target);
			if (!targetUuid) throw Helpers.custom_error(`revertTokensFromItemPiles | Could not determine the UUID, please provide a valid target`)
			return targetUuid;
		})

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REVERT_FROM_PILE, targetUuids, tokenSettings);
	}

	/**
	 * Opens a pile if it is enabled and a container
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Token/TokenDocument/boolean} [interactingToken=false]
	 *
	 * @return {Promise/boolean}
	 */
	static openItemPile(target, interactingToken = false) {
		const targetActor = Utilities.getActor(target);
		if (!PileUtilities.isItemPileContainer(target)) return false;
		const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
		const pileData = PileUtilities.getActorFlagData(targetActor);
		const wasLocked = pileData.locked;
		const wasClosed = pileData.closed;
		pileData.closed = false;
		pileData.locked = false;
		if (wasLocked) {
			const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_UNLOCK, targetActor, pileData, interactingTokenDocument);
			if (hookResult === false) return false;
		}
		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_OPEN, targetActor, pileData, interactingTokenDocument);
		if (hookResult === false) return false;
		if (wasClosed && pileData.openSound) {
			let sound = pileData.openSound;
			if (pileData.openSound.includes("*")) {
				sound = Helpers.random_array_element(pileData.openSounds)
			}
			AudioHelper.play({ src: sound }, true)
		}
		return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
	}

	/**
	 * Closes a pile if it is enabled and a container
	 *
	 * @param {Token/TokenDocument} target          Target pile to close
	 * @param {Token/TokenDocument/boolean} [interactingToken=false]
	 *
	 * @return {Promise/boolean}
	 */
	static closeItemPile(target, interactingToken = false) {
		const targetActor = Utilities.getActor(target);
		if (!PileUtilities.isItemPileContainer(target)) return false;
		const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
		const pileData = PileUtilities.getActorFlagData(targetActor);

		const wasOpen = !pileData.closed;
		pileData.closed = true;

		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_CLOSE, targetActor, pileData, interactingTokenDocument);
		if (hookResult === false) return false;

		if (wasOpen && pileData.closeSound) {
			let sound = pileData.closeSound;
			if (pileData.closeSound.includes("*")) {
				sound = Helpers.random_array_element(pileData.closeSounds)
			}
			AudioHelper.play({ src: sound }, true)
		}

		return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
	}

	/**
	 * Toggles a pile's closed state if it is enabled and a container
	 *
	 * @param {Token/TokenDocument} target          Target pile to open or close
	 * @param {Token/TokenDocument/boolean} [interactingToken=false]
	 *
	 * @return {Promise/boolean}
	 */
	static async toggleItemPileClosed(target, interactingToken = false) {
		const targetActor = Utilities.getActor(target);
		if (!PileUtilities.isItemPileContainer(target)) return false;
		const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
		const pileData = PileUtilities.getActorFlagData(targetActor);
		if (pileData.closed) {
			await this.openItemPile(targetActor, interactingTokenDocument);
		} else {
			await this.closeItemPile(targetActor, interactingTokenDocument);
		}
		return !pileData.closed;
	}

	/**
	 * Locks a pile if it is enabled and a container
	 *
	 * @param {Token/TokenDocument} target          Target pile to lock
	 * @param {Token/TokenDocument/boolean} [interactingToken=false]
	 *
	 * @return {Promise/boolean}
	 */
	static lockItemPile(target, interactingToken = false) {
		const targetActor = Utilities.getActor(target);
		if (!PileUtilities.isItemPileContainer(target)) return false;
		const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
		const pileData = PileUtilities.getActorFlagData(targetActor);
		const wasClosed = pileData.closed;
		pileData.closed = true;
		pileData.locked = true;
		if (!wasClosed) {
			const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_CLOSE, targetActor, pileData, interactingTokenDocument);
			if (hookResult === false) return false;
		}
		const hookResult = Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_LOCK, targetActor, pileData, interactingTokenDocument);
		if (hookResult === false) return false;
		if (!wasClosed && pileData.closeSound) {
			let sound = pileData.closeSound;
			if (pileData.closeSound.includes("*")) {
				sound = Helpers.random_array_element(pileData.closeSounds)
			}
			AudioHelper.play({ src: sound }, true)
		}
		return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
	}

	/**
	 * Unlocks a pile if it is enabled and a container
	 *
	 * @param {Token/TokenDocument} target          Target pile to unlock
	 * @param {Token/TokenDocument/boolean} [interactingToken=false]
	 *
	 * @return {Promise/boolean}
	 */
	static unlockItemPile(target, interactingToken = false) {
		const targetActor = Utilities.getActor(target);
		if (!PileUtilities.isItemPileContainer(target)) return false;
		const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
		const pileData = PileUtilities.getActorFlagData(targetActor);
		pileData.locked = false;
		Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_UNLOCK, targetActor, pileData, interactingTokenDocument);
		return this.updateItemPile(targetActor, pileData, { interactingToken: interactingTokenDocument });
	}

	/**
	 * Toggles a pile's locked state if it is enabled and a container
	 *
	 * @param {Token/TokenDocument} target          Target pile to lock or unlock
	 * @param {Token/TokenDocument/boolean} [interactingToken=false]
	 *
	 * @return {Promise/boolean}
	 */
	static toggleItemPileLocked(target, interactingToken = false) {
		const targetActor = Utilities.getActor(target);
		if (!PileUtilities.isItemPileContainer(target)) return false;
		const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
		const pileData = PileUtilities.getActorFlagData(targetActor);
		if (pileData.locked) {
			return this.unlockItemPile(targetActor, interactingTokenDocument);
		}
		return this.lockItemPile(targetActor, interactingTokenDocument);
	}

	/**
	 * Causes the item pile to play a sound as it was attempted to be opened, but was locked
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Token/TokenDocument/boolean} [interactingToken=false]
	 *
	 * @return {Promise<boolean>}
	 */
	static rattleItemPile(target, interactingToken = false) {
		const targetActor = Utilities.getActor(target);
		if (!PileUtilities.isItemPileContainer(target)) return false;
		const interactingTokenDocument = interactingToken ? Utilities.getActor(interactingToken) : false;
		const pileData = PileUtilities.getActorFlagData(targetActor);

		Helpers.hooks.call(CONSTANTS.HOOKS.PILE.PRE_RATTLE, targetActor, pileData, interactingTokenDocument);

		if (pileData.lockedSound) {
			let sound = pileData.lockedSound;
			if (pileData.lockedSound.includes("*")) {
				sound = Helpers.random_array_element(pileData.lockedSounds)
			}
			AudioHelper.play({ src: sound }, true);
		}

		return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.CALL_HOOK, CONSTANTS.HOOKS.PILE.RATTLE, Utilities.getUuid(targetActor), pileData, Utilities.getUuid(interactingTokenDocument));
	}

	/**
	 * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileLocked(target, data = false) {
		return PileUtilities.isItemPileLocked(target, data);
	}

	/**
	 * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileClosed(target, data = false) {
		return PileUtilities.isItemPileClosed(target, data);
	}

	/**
	 * Whether an item pile is a valid item pile. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isValidItemPile(target, data = false) {
		return PileUtilities.isValidItemPile(target, data);
	}

	/**
	 * Whether an item pile is a regular item pile. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isRegularItemPile(target, data = false) {
		return PileUtilities.isRegularItemPile(target, data);
	}

	/**
	 * Whether an item pile is a container. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileContainer(target, data = false) {
		return PileUtilities.isItemPileContainer(target, data);
	}

	/**
	 * Whether an item pile is a lootable. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileLootable(target, data = false) {
		return PileUtilities.isItemPileLootable(target, data);
	}

	/**
	 * Whether an item pile is a vault. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileVault(target, data = false) {
		return PileUtilities.isItemPileVault(target, data);
	}

	/**
	 * Whether an item pile is a merchant. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileMerchant(target, data = false) {
		return PileUtilities.isItemPileMerchant(target, data);
	}

	/**
	 * Whether an item pile is a banker. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileBanker(target, data = false) {
		if (!game.modules.get("item_piles_bankers")?.active) {
			let word = "install and activate";
			if (game.modules.get('item_piles_bankers')) word = "activate";
			Helpers.custom_warning(`This api method from Item Piles requires the 'item_piles_bankers' module. Please ${word} it.`, true);
			return false;
		}
		return PileUtilities.isItemPileBanker(target, data);
	}

	/**
	 * Whether an item pile is a merchant. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @param {Object/boolean} [data=false] data existing flags data to use
	 * @return {boolean}
	 */
	static isItemPileAuctioneer(target, data = false) {
		if (!game.modules.get("item_piles_auctioneer")?.active) {
			let word = "install and activate";
			if (game.modules.get('item_piles_auctioneer')) word = "activate";
			Helpers.custom_warning(`This api method from Item Piles requires the 'item_piles_auctioneer' module. Please ${word} it.`, true);
			return false;
		}
		return PileUtilities.isItemPileAuctioneer(target, data);
	}

	/**
	 * Whether an item pile is empty pile. If it is not enabled, it is always false.
	 *
	 * @param {Token/TokenDocument} target
	 * @return {boolean}
	 */
	static isItemPileEmpty(target) {
		return PileUtilities.isItemPileEmpty(target);
	}

	/**
	 * Updates a pile with new data.
	 *
	 * @param {Actor/TokenDocument} target                                      Target token or actor to update
	 * @param {object} newData                                                  New data to update the actor with
	 * @param {object} options                                                  Options to pass to the function
	 * @param {Token/TokenDocument/boolean} [options.interactingToken=false]    If an actor caused this update, you can pass one here to pass it along to macros that the item pile may run
	 * @param {Object/boolean} [options.tokenSettings=false]                    Updates to make to the target token
	 *
	 * @return {Promise}
	 */
	static updateItemPile(target, newData, { interactingToken = false, tokenSettings = false } = {}) {

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`);

		const interactingTokenUuid = interactingToken ? Utilities.getUuid(interactingToken) : false;
		if (interactingToken && !interactingTokenUuid) throw Helpers.custom_error(`updateItemPile | Could not determine the UUID, please provide a valid target`);

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.UPDATE_PILE, targetUuid, newData, {
			interactingTokenUuid, tokenSettings
		});
	}

	/**
	 * Deletes a pile, calling the relevant hooks.
	 *
	 * @param {Token/TokenDocument} target
	 *
	 * @return {Promise}
	 */
	static deleteItemPile(target) {
		if (!PileUtilities.isValidItemPile(target)) {
			throw Helpers.custom_error(`deleteItemPile | This is not an item pile, please provide a valid target`);
		}
		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`deleteItemPile | Could not determine the UUID, please provide a valid target`);
		if (!targetUuid.includes("Token")) {
			throw Helpers.custom_error(`deleteItemPile | Please provide a Token or TokenDocument`);
		}
		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.DELETE_PILE, targetUuid);
	}

	/**
	 * Splits an item pile's content between all players (or a specified set of target actors).
	 *
	 * @param target {Token/TokenDocument/Actor}                                                  The item pile to split
	 * @param {object} options                                                                    Options to pass to the function
	 * @param {boolean/TokenDocument/Actor/Array<TokenDocument/Actor>} [options.targets=false]    The targets to receive the split contents
	 * @param {boolean/TokenDocument/Actor} [options.instigator=false]                            Whether this was triggered by a specific actor
	 *
	 * @returns {Promise<object/boolean>}
	 */
	static async splitItemPileContents(target, { targets = false, instigator = false } = {}) {

		if (!PileUtilities.isItemPileLootable(target)) return false;

		const itemPileUuid = Utilities.getUuid(target);
		if (!itemPileUuid) throw Helpers.custom_error(`SplitItemPileContents | Could not determine the UUID, please provide a valid item pile`)

		const itemPileActor = Utilities.getActor(target);

		if (targets) {
			if (!Array.isArray(targets)) {
				targets = [targets]
			}
			targets.forEach(actor => {
				if (!(actor instanceof TokenDocument || actor instanceof Actor)) {
					throw Helpers.custom_error("SplitItemPileContents | Each of the entries in targets must be of type TokenDocument or Actor")
				}
			})
			targets = targets.map(target => Utilities.getActor(target));
		}

		if (instigator && !(instigator instanceof TokenDocument || instigator instanceof Actor)) {
			throw Helpers.custom_error("SplitItemPileContents | instigator must be of type TokenDocument or Actor")
		}

		const actorUuids = (targets || SharingUtilities.getPlayersForItemPile(itemPileActor)
			.map(u => u.character))
			.map(actor => Utilities.getUuid(actor));

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.SPLIT_PILE, itemPileUuid, actorUuids, game.user.id, instigator);

	}

	/**
	 * Retrieves the price modifiers for a given item piles merchant
	 *
	 * @param {Actor/TokenDocument} target                                      Target token or actor to retrieve the modifiers from
	 * @param {object} options                                                  Options to pass to the function
	 * @param {Token/TokenDocument/Actor/string/boolean} [options.actor=false]  The actor whose price modifiers to consider
	 * @param {boolean} [options.absolute=false]                                Whether to only consider the actor's modifiers (true means not considering the merchant's base modifiers)
	 *
	 * @return {Object}
	 */
	static getMerchantPriceModifiers(target, { actor = false, absolute = false } = {}) {

		const merchantActor = Utilities.getActor(target);

		if (!(merchantActor instanceof Actor)) {
			throw Helpers.custom_error(`getMerchantPriceModifiers | target must be of type Actor`);
		}

		if (!PileUtilities.isItemPileMerchant(merchantActor)) {
			throw Helpers.custom_error(`getMerchantPriceModifiers | target is not an item pile merchant`);
		}

		if (actor) {
			if (!(actor instanceof Actor) && typeof actor !== "string") {
				throw Helpers.custom_error(`getMerchantPriceModifiers | actor must be of type Actor or string (UUID)`);
			}
			if (typeof actor === "string") {
				actor = fromUuidSync(actor) || false;
			}
		}

		if (typeof absolute !== "boolean") {
			throw Helpers.custom_error(`getMerchantPriceModifiers | absolute must be of type boolean`);
		}

		return PileUtilities.getMerchantModifiersForActor(target, { actor, absolute });

	}

	/**
	 * Updates the price modifiers for a given item piles merchant
	 *
	 * @param {Actor/TokenDocument} target                                      Target token or actor to update modifiers on
	 * @param {Array<{
	 *   actor?: Actor,
	 *   actorUuid?: string,
	 *   relative?: boolean,
	 *   override?: boolean,
	 *   buyPriceModifier?: number,
	 *   sellPriceModifier?: number
	 * }>} priceModifierData                                                    The price modifier data to update on the merchant
	 *
	 * @return {Promise}
	 */
	static updateMerchantPriceModifiers(target, priceModifierData = []) {

		const merchantActor = Utilities.getActor(target);

		const targetUuid = Utilities.getUuid(merchantActor);
		if (!targetUuid) throw Helpers.custom_error(`updateMerchantPriceModifiers | Could not determine the UUID, please provide a valid target`);

		if (!PileUtilities.isItemPileMerchant(merchantActor)) {
			throw Helpers.custom_error(`updateMerchantPriceModifiers | Target is not an item pile merchant`);
		}

		const flagData = PileUtilities.getActorFlagData(merchantActor);

		const actorPriceModifiers = flagData?.actorPriceModifiers ?? [];

		for (const priceModifier of priceModifierData) {
			if (priceModifier.actor && !(priceModifier.actor instanceof Actor)) {
				throw Helpers.custom_error(`updateMerchantPriceModifiers | priceModifierData.actor must be of type Actor`);
			}
			if (priceModifier.actor) {
				priceModifier.actorUuid = priceModifier.actor.uuid;
			}
			if (priceModifier.actorUuid && typeof priceModifier.actorUuid !== "string") {
				throw Helpers.custom_error(`updateMerchantPriceModifiers | if priceModifierData.actor if not provided, priceModifierData.actorUuid must be of type string `);
			}
			if (!priceModifier.actorUuid) {
				throw Helpers.custom_error(`updateMerchantPriceModifiers | Could not find the UUID for the given actor`);
			}
			if (priceModifier.relative !== undefined && typeof priceModifier.relative !== "boolean") {
				throw Helpers.custom_error(`updateMerchantPriceModifiers | priceModifierData.relative must be of type boolean`);
			}
			if (priceModifier.override !== undefined && typeof priceModifier.override !== "boolean") {
				throw Helpers.custom_error(`updateMerchantPriceModifiers | priceModifierData.override must be of type boolean`);
			}
			if (priceModifier.buyPriceModifier !== undefined && typeof priceModifier.buyPriceModifier !== "number") {
				throw Helpers.custom_error(`updateMerchantPriceModifiers | priceModifierData.buyPriceModifier must be of type number`);
			}
			if (priceModifier.sellPriceModifier !== undefined && typeof priceModifier.sellPriceModifier !== "number") {
				throw Helpers.custom_error(`updateMerchantPriceModifiers | priceModifierData.sellPriceModifier must be of type number`);
			}

			let actorPriceModifierIndex = actorPriceModifiers.findIndex(existingPriceModifier => existingPriceModifier.actorUuid === priceModifier.actorUuid);
			if (actorPriceModifierIndex === -1) {
				actorPriceModifierIndex = actorPriceModifiers.push({}) - 1;
			}

			const oldBuyPriceModifier = actorPriceModifiers[actorPriceModifierIndex]?.buyPriceModifier ?? flagData?.buyPriceModifier ?? 1;
			const newBuyPriceModifier = Math.max(0, priceModifier.relative ? oldBuyPriceModifier + priceModifier.buyPriceModifier : priceModifier.buyPriceModifier ?? oldBuyPriceModifier);

			const oldSellPriceModifier = actorPriceModifiers[actorPriceModifierIndex]?.sellPriceModifier ?? flagData?.sellPriceModifier ?? 0.5;
			const newSellPriceModifier = Math.max(0, priceModifier.relative ? oldSellPriceModifier + priceModifier.sellPriceModifier : priceModifier.sellPriceModifier ?? oldSellPriceModifier);

			actorPriceModifiers[actorPriceModifierIndex] = foundry.utils.mergeObject(actorPriceModifiers[actorPriceModifierIndex], {
				actorUuid: priceModifier.actorUuid,
				buyPriceModifier: newBuyPriceModifier,
				sellPriceModifier: newSellPriceModifier,
				override: priceModifier.override ?? false,
			});

		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.UPDATE_PILE, targetUuid, { actorPriceModifiers });

	}

	/* ================= ITEM AND ATTRIBUTE METHODS ================= */

	/**
	 * Adds item to an actor, increasing item quantities if matches were found
	 *
	 * @param {Actor/TokenDocument/Token} target                  The target to add an item to
	 * @param {Array} items                                       An array of objects, with the key "item" being an item object or an Item class (the foundry class), with an optional key of "quantity" being the amount of the item to add
	 * @param {object} options                                    Options to pass to the function
	 * @param {boolean} [options.removeExistingActorItems=false]  Whether to remove the actor's existing items before adding the new ones
	 * @param {boolean} [options.skipVaultLogging=false]          Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]      The interaction ID of this action
	 *
	 * @returns {Promise<array>}                                  An array of objects, each containing the item that was added or updated, and the quantity that was added
	 */
	static addItems(target, items, {
		removeExistingActorItems = false, skipVaultLogging = false, interactionId = false
	} = {}) {
		const targetActor = Utilities.getActor(target);
		if (!targetActor) throw Helpers.custom_error(`addItems | Could not determine the target actor, please provide a valid target`)
		const targetUuid = Utilities.getUuid(targetActor);

		const itemsToAdd = []
		items.forEach(itemData => {

			let item = itemData;
			if (itemData instanceof Item) {
				item = itemData.toObject();
			} else if (itemData.item) {
				item = itemData.item instanceof Item ? itemData.item.toObject() : itemData.item;
				if (itemData.flags) {
					foundry.utils.setProperty(item, CONSTANTS.FLAGS.ITEM, foundry.utils.mergeObject(
						foundry.utils.getProperty(item, CONSTANTS.FLAGS.ITEM) ?? {},
						foundry.utils.getProperty(itemData, CONSTANTS.FLAGS.ITEM))
					);
				}
			} else if (itemData.id) {
				item = target.items.get(itemData.id);
				if (item) {
					item = item.toObject();
				} else {
					throw Helpers.custom_error(`addItems | Could not find item with id ${itemData.id} on actor with UUID ${targetUuid}!`)
				}
			}

			if (itemData?.quantity !== undefined) {
				Utilities.setItemQuantity(item, itemData.quantity, true);
			}

			itemsToAdd.push(item);

		});

		if (PileUtilities.isItemPileVault(targetActor)) {
			const canItemsFit = PileUtilities.fitItemsIntoVault(itemsToAdd, targetActor);
			if (!canItemsFit) throw Helpers.custom_error(`addItems | The vault actor ${targetActor.name} cannot fit these items`, true);
		}

		if (interactionId && typeof interactionId !== "string") throw Helpers.custom_error(`addItems | interactionId must be of type string`);

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.ADD_ITEMS, targetUuid, itemsToAdd, game.user.id, {
			removeExistingActorItems, interactionId, skipVaultLogging
		});
	}

	/**
	 * Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.
	 *
	 * @param {Actor/Token/TokenDocument} target                  The target to remove items from
	 * @param {Array} items                                       An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity"), or Items (the foundry class) or strings of IDs to remove all quantities of
	 * @param {object} options                                    Options to pass to the function
	 * @param {boolean} [options.skipVaultLogging=false]          Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]      The interaction ID of this action
	 *
	 * @returns {Promise<array>}                                  An array of objects, each containing the item that was removed or updated, the quantity that was removed, and whether the item was deleted
	 */
	static removeItems(target, items, { skipVaultLogging = false, interactionId = false } = {}) {

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`removeItems | Could not determine the UUID, please provide a valid target`);

		const targetActorItems = PileUtilities.getActorItems(target, { getItemCurrencies: true });

		items = items.map(itemData => {

			let item;
			if (typeof itemData === "string" || itemData._id) {
				const itemId = typeof itemData === "string" ? itemData : itemData._id;
				item = targetActorItems.find(actorItem => actorItem.id === itemId);
				if (!item) {
					throw Helpers.custom_error(`removeItems | Could not find item with id "${itemId}" on target "${targetUuid}"`)
				}
				item = item.toObject();
			} else {
				if (itemData.item instanceof Item) {
					item = itemData.item.toObject();
				} else if (itemData instanceof Item) {
					item = itemData.toObject();
				} else {
					item = itemData.item;
				}
				let foundActorItem = targetActorItems.find(actorItem => actorItem.id === item._id);
				if (!foundActorItem) {
					throw Helpers.custom_error(`removeItems | Could not find item with id "${item._id}" on target "${targetUuid}"`)
				}
			}

			return {
				_id: item._id, quantity: itemData?.quantity ?? Utilities.getItemQuantity(item)
			}
		});

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`removeItems | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REMOVE_ITEMS, targetUuid, items, game.user.id, {
			interactionId,
			skipVaultLogging
		});
	}

	/**
	 * Transfers items from the source to the target, subtracting a number of quantity from the source's item and adding it to the target's item, deleting items from the source if their quantity reaches 0
	 *
	 * @param {Actor/Token/TokenDocument} source              The source to transfer the items from
	 * @param {Actor/Token/TokenDocument} target              The target to transfer the items to
	 * @param {Array} items                                   An array of objects each containing the item id (key "_id") and the quantity to transfer (key "quantity"), or Items (the foundry class) or strings of IDs to transfer all quantities of
	 * @param {object} options                                Options to pass to the function
	 * @param {boolean} [options.skipVaultLogging=false]      Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]  The interaction ID of this action
	 *
	 * @returns {Promise<object>}                             An array of objects, each containing the item that was added or updated, and the quantity that was transferred
	 */
	static transferItems(source, target, items, { skipVaultLogging = false, interactionId = false } = {}) {

		const sourceActor = Utilities.getActor(source);
		if (!sourceActor) throw Helpers.custom_error(`transferItems | Could not determine the source actor, please provide a valid source`);
		const sourceUuid = Utilities.getUuid(sourceActor);

		const sourceActorItems = PileUtilities.getActorItems(source, { getItemCurrencies: true });

		items = items.map(itemData => {

			let item;
			if (typeof itemData === "string" || itemData._id) {
				const itemId = typeof itemData === "string" ? itemData : itemData._id;
				item = sourceActorItems.find(actorItem => actorItem.id === itemId);
				if (!item) {
					throw Helpers.custom_error(`transferItems | Could not find item with id "${itemId}" on target "${sourceUuid}"`)
				}
				item = item.toObject();
			} else if (itemData instanceof Item) {
				item = itemData.toObject();
			} else if (itemData.item instanceof Item) {
				item = itemData.item.toObject();
			} else {
				item = itemData.item;
			}

			let foundActorItem = sourceActorItems.find(actorItem => actorItem.id === item._id);
			if (!foundActorItem) {
				throw Helpers.custom_error(`transferItems | Could not find item with id "${item._id}" on target "${sourceUuid}"`)
			}

			return {
				id: item._id,
				quantity: Math.max(itemData?.quantity ?? Utilities.getItemQuantity(itemData), 0),
				flags: foundry.utils.getProperty(itemData, CONSTANTS.FLAGS.ITEM)
			}
		});

		const targetActor = Utilities.getActor(target);
		if (!targetActor) throw Helpers.custom_error(`transferItems | Could not determine the target, please provide a valid target`);
		const targetUuid = Utilities.getUuid(targetActor);

		if (PileUtilities.isItemPileVault(targetActor)) {
			const itemsToFit = items.reduce((acc, data) => {
				const item = sourceActor.items.get(data.id);
				if (PileUtilities.canItemStack(item, targetActor)) {
					acc.push(item);
				} else {
					for (let i = 0; i < data.quantity; i++) {
						acc.push(item);
					}
				}
				return acc;
			}, [])
			const canItemsFit = PileUtilities.fitItemsIntoVault(itemsToFit, targetActor);
			if (!canItemsFit) throw Helpers.custom_error(`transferItems | The target vault actor ${targetActor.name} cannot fit these items`, true);
		}

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`transferItems | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ITEMS, sourceUuid, targetUuid, items, game.user.id, {
			interactionId, skipVaultLogging
		});

	}

	/**
	 * Transfers all items between the source and the target.
	 *
	 * @param {Actor/Token/TokenDocument} source                The actor to transfer all items from
	 * @param {Actor/Token/TokenDocument} target                The actor to receive all the items
	 * @param {object} options                                  Options to pass to the function
	 * @param {Array/boolean} [options.itemFilters=false]       Array of item types disallowed - will default to module settings if none provided
	 * @param {boolean} [options.skipVaultLogging=false]        Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]    The interaction ID of this action
	 *
	 * @returns {Promise<array>}                                An array containing all the items that were transferred to the target
	 */
	static transferAllItems(source, target, {
		itemFilters = false,
		skipVaultLogging = false,
		interactionId = false
	} = {}) {

		const sourceActor = Utilities.getActor(source);
		if (!sourceActor) throw Helpers.custom_error(`transferAllItems | Could not determine the source actor, please provide a valid source`)
		const sourceUuid = Utilities.getUuid(sourceActor);

		const targetActor = Utilities.getActor(target);
		if (!targetActor) throw Helpers.custom_error(`transferAllItems | Could not determine the target actor, please provide a valid target`)
		const targetUuid = Utilities.getUuid(targetActor);

		if (itemFilters) {
			if (!Array.isArray(itemFilters)) throw Helpers.custom_error(`transferAllItems | itemFilters must be of type array`);
			itemFilters.forEach(entry => {
				if (typeof entry?.path !== "string") throw Helpers.custom_error(`transferAllItems | each entry in the itemFilters must have a "path" property that is of type string`);
				if (typeof entry?.filter !== "string") throw Helpers.custom_error(`transferAllItems | each entry in the itemFilters must have a "filter" property that is of type string`);
			})
		}

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`transferAllItems | interactionId must be of type string`);
		}

		if (PileUtilities.isItemPileVault(targetActor)) {
			const sourceActorItems = PileUtilities.getActorItems(sourceActor, { getItemCurrencies: true });
			const canItemsFit = PileUtilities.fitItemsIntoVault(sourceActorItems, targetActor, { itemFilters });
			if (!canItemsFit) throw Helpers.custom_error(`transferAllItems | The target vault actor ${targetActor.name} cannot fit these items`, true);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ALL_ITEMS, sourceUuid, targetUuid, game.user.id, {
			itemFilters, skipVaultLogging, interactionId
		});
	}

	/**
	 * Sets attributes on an actor
	 *
	 * @param {Actor/Token/TokenDocument} target                  The target whose attribute will have their quantity set
	 * @param {object} attributes                                 An object with each key being an attribute path, and its value being the quantity to set
	 * @param {object} options                                    Options to pass to the function
	 * @param {string/boolean} [options.interactionId=false]      The interaction ID of this action
	 *
	 * @returns {Promise<object>}                                 An array containing a key value pair of the attribute path and the quantity of that attribute that was set
	 *
	 */
	static setAttributes(target, attributes, { interactionId = false } = {}) {

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`setAttributes | Could not determine the UUID, please provide a valid target`);

		Object.entries(attributes).forEach(entry => {
			const [attribute, quantity] = entry;
			if (!Helpers.isRealNumber(quantity)) {
				throw Helpers.custom_error(`setAttributes | Attribute "${attribute}" must be of type number`);
			}
		});

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`setAttributes | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.SET_ATTRIBUTES, targetUuid, attributes, game.user.id, {
			interactionId
		});

	}

	/**
	 * Adds attributes on an actor
	 *
	 * @param {Actor/Token/TokenDocument} target                  The target whose attribute will have a set quantity added to it
	 * @param {object} attributes                                 An object with each key being an attribute path, and its value being the quantity to add
	 * @param {object} options                                    Options to pass to the function
	 * @param {boolean} [options.skipVaultLogging=false]          Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]      The interaction ID of this action
	 *
	 * @returns {Promise<object>}                                 An array containing a key value pair of the attribute path and the quantity of that attribute that was added
	 *
	 */
	static addAttributes(target, attributes, { skipVaultLogging = false, interactionId = false } = {}) {

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`addAttributes | Could not determine the UUID, please provide a valid target`);

		Object.entries(attributes).forEach(entry => {
			const [attribute, quantity] = entry;
			if (!Helpers.isRealNumber(quantity) && quantity > 0) {
				throw Helpers.custom_error(`addAttributes | Attribute "${attribute}" must be of type number and greater than 0`);
			}
		});

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`addAttributes | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.ADD_ATTRIBUTES, targetUuid, attributes, game.user.id, {
			skipVaultLogging,
			interactionId
		});

	}

	/**
	 * Subtracts attributes on the target
	 *
	 * @param {Token/TokenDocument} target                      The target whose attributes will be subtracted from
	 * @param {Array/object} attributes                         This can be either an array of attributes to subtract (to zero out a given attribute), or an object with each key being an attribute path, and its value being the quantity to subtract
	 * @param {object} options                                  Options to pass to the function
	 * @param {boolean} [options.skipVaultLogging=false]        Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]    The interaction ID of this action
	 *
	 * @returns {Promise<object>}                               An array containing a key value pair of the attribute path and the quantity of that attribute that was removed
	 */
	static removeAttributes(target, attributes, { skipVaultLogging = false, interactionId = false } = {}) {

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`removeAttributes | Could not determine the UUID, please provide a valid target`);

		const targetActor = Utilities.getActor(target);

		let attributesToSend = {};
		if (Array.isArray(attributes)) {
			attributes.forEach(attribute => {
				if (typeof attribute !== "string") {
					throw Helpers.custom_error(`removeAttributes | Each attribute in the array must be of type string`);
				}
				attributesToSend[attribute] = Number(foundry.utils.getProperty(targetActor, attribute));
			});
		} else {
			Object.entries(attributes).forEach(entry => {
				const [attribute, quantity] = entry;
				if (!foundry.utils.hasProperty(targetActor, attribute)) {
					throw Helpers.custom_error(`removeAttributes | Could not find attribute ${attribute} on target's actor with UUID "${targetUuid}"`);
				}
				if (!Helpers.isRealNumber(quantity) && quantity > 0) {
					throw Helpers.custom_error(`removeAttributes | Attribute "${attribute}" must be of type number and greater than 0`);
				}
			});
			attributesToSend = attributes;
		}

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`removeAttributes | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REMOVE_ATTRIBUTES, targetUuid, attributesToSend, game.user.id, {
			skipVaultLogging,
			interactionId
		});

	}

	/**
	 * Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target
	 *
	 * @param {Actor/Token/TokenDocument} source                The source to transfer the attribute from
	 * @param {Actor/Token/TokenDocument} target                The target to transfer the attribute to
	 * @param {Array/object} attributes                         This can be either an array of attributes to transfer (to transfer all of a given attribute), or an object with each key being an attribute path, and its value being the quantity to transfer
	 * @param {object} options                                  Options to pass to the function
	 * @param {boolean} [options.skipVaultLogging=false]        Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]    The interaction ID of this action
	 *
	 * @returns {Promise<object>}                               An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
	 */
	static transferAttributes(source, target, attributes, { skipVaultLogging = false, interactionId = false } = {}) {

		const sourceUuid = Utilities.getUuid(source);
		if (!sourceUuid) throw Helpers.custom_error(`transferAttributes | Could not determine the UUID, please provide a valid source`);
		const sourceActor = Utilities.getActor(source);

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`transferAttributes | Could not determine the UUID, please provide a valid target`);
		const targetActor = Utilities.getActor(target);

		if (Array.isArray(attributes)) {
			attributes.forEach(attribute => {
				if (typeof attribute !== "string") {
					throw Helpers.custom_error(`transferAttributes | Each attribute in the array must be of type string`);
				}
				if (!foundry.utils.hasProperty(sourceActor, attribute)) {
					throw Helpers.custom_error(`transferAttributes | Could not find attribute ${attribute} on source's actor with UUID "${targetUuid}"`);
				}
			});
		} else {
			Object.entries(attributes).forEach(entry => {
				const [attribute, quantity] = entry;
				if (!foundry.utils.hasProperty(sourceActor, attribute)) {
					throw Helpers.custom_error(`transferAttributes | Could not find attribute ${attribute} on source's actor with UUID "${targetUuid}"`);
				}
				if (!Helpers.isRealNumber(quantity) && quantity > 0) {
					throw Helpers.custom_error(`transferAttributes | Attribute "${attribute}" must be of type number and greater than 0`);
				}
			});
		}

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`transferAttributes | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ATTRIBUTES, sourceUuid, targetUuid, attributes, game.user.id, {
			skipVaultLogging,
			interactionId
		});

	}

	/**
	 * Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target
	 *
	 * @param {Actor/Token/TokenDocument} source                The source to transfer the attributes from
	 * @param {Actor/Token/TokenDocument} target                The target to transfer the attributes to
	 * @param {object} options                                  Options to pass to the function
	 * @param {boolean} [options.skipVaultLogging=false]        Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]    The interaction ID of this action
	 *
	 * @returns {Promise<object>}                               An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred
	 */
	static transferAllAttributes(source, target, { skipVaultLogging = false, interactionId = false } = {}) {

		const sourceUuid = Utilities.getUuid(source);
		if (!sourceUuid) throw Helpers.custom_error(`transferAllAttributes | Could not determine the UUID, please provide a valid source`);

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`transferAllAttributes | Could not determine the UUID, please provide a valid target`);

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`transferAllAttributes | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ALL_ATTRIBUTES, sourceUuid, targetUuid, game.user.id, {
			skipVaultLogging,
			interactionId
		});

	}

	/**
	 * Transfers all items and attributes between the source and the target.
	 *
	 * @param {Actor/Token/TokenDocument} source                The actor to transfer all items and attributes from
	 * @param {Actor/Token/TokenDocument} target                The actor to receive all the items and attributes
	 * @param {object} options                                  Options to pass to the function
	 * @param {Array/boolean} [options.itemFilters=false]       Array of item types disallowed - will default to module settings if none provided
	 * @param {boolean} [options.skipVaultLogging=false]        Whether to skip logging this action to the target actor if it is a vault
	 * @param {string/boolean} [options.interactionId=false]    The ID of this interaction
	 *
	 * @returns {Promise<object>}                               An object containing all items and attributes transferred to the target
	 */
	static transferEverything(source, target, {
		itemFilters = false,
		skipVaultLogging = false,
		interactionId = false
	} = {}) {

		const sourceActor = Utilities.getActor(source);
		if (!sourceActor) throw Helpers.custom_error(`transferEverything | Could not determine the source actor, please provide a valid source`);
		const sourceUuid = Utilities.getUuid(sourceActor);

		const targetActor = Utilities.getActor(target);
		if (!targetActor) throw Helpers.custom_error(`transferEverything | Could not determine the target actor, please provide a valid target`);
		const targetUuid = Utilities.getUuid(targetActor);

		if (itemFilters) {
			if (!Array.isArray(itemFilters)) throw Helpers.custom_error(`transferEverything | itemFilters must be of type array`);
			itemFilters.forEach(entry => {
				if (typeof entry?.path !== "string") throw Helpers.custom_error(`transferEverything | each entry in the itemFilters must have a "path" property that is of type string`);
				if (typeof entry?.filter !== "string") throw Helpers.custom_error(`transferEverything | each entry in the itemFilters must have a "filter" property that is of type string`);
			})
		}

		if (PileUtilities.isItemPileVault(targetActor)) {
			const sourceActorItems = PileUtilities.getActorItems(sourceActor, { getItemCurrencies: true });
			const canItemsFit = PileUtilities.fitItemsIntoVault(sourceActorItems, targetActor, { itemFilters });
			if (!canItemsFit) throw Helpers.custom_error(`transferEverything | The target vault actor ${targetActor.name} cannot fit these items`, true);
		}

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`transferEverything | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_EVERYTHING, sourceUuid, targetUuid, game.user.id, {
			itemFilters, skipVaultLogging, interactionId
		});

	}

	/**
	 * Combines several item piles into a single item pile by transferring
	 *
	 * @param {Actor/Token/TokenDocument} target                    The actor to transfer items and currencies to
	 * @param {Array<Actor/Token/TokenDocument>} sources            The actors to transfer items and currencies from
	 * @param {object} options                                      Options to pass to the function
	 * @param {Array/boolean} [options.itemFilters=false]           Array of item types disallowed - will default to module settings if none provided
	 * @param {object/boolean} [options.targetItemPileFlags=false]  Item pile flags to set on the target as a part of this transfer
	 * @param {string/boolean} [options.interactionId=false]        The ID of this interaction
	 *
	 * @returns {Promise<object>}                                   An object containing all items and attributes transferred to the target
	 */
	static combineItemPiles(target, sources, {
		itemFilters = false,
		targetItemPileFlags = false,
		interactionId = false
	} = {}) {

		const targetActor = Utilities.getActor(target);
		if (!targetActor) throw Helpers.custom_error(`combineItemPiles | Could not determine the target actor, please provide a valid target`);
		const targetUuid = Utilities.getUuid(targetActor);

		if (!Array.isArray(sources)) {
			try {
				sources = Array.from(sources);
			} catch (err) {
				throw Helpers.custom_error(`combineItemPiles | sources must be of type array or set`);
			}
		}

		const sourceActors = sources.map(Utilities.getActor);
		if (!sourceActors.every(Boolean) || !sourceActors.length) throw Helpers.custom_error(`combineItemPiles | Could not determine one of the source actors, please provide valid sources`);
		if (!sourceActors.every(actor => PileUtilities.isValidItemPile(actor))) throw Helpers.custom_error(`combineItemPiles | One or more of the source actors are not item piles`);
		const sourceUuids = sourceActors.map(Utilities.getUuid);

		if (sourceActors.find(actor => actor === targetActor)) {
			throw Helpers.custom_error(`combineItemPiles | Sources may not contain the target`);
		}

		if (itemFilters) {
			if (!Array.isArray(itemFilters)) throw Helpers.custom_error(`combineItemPiles | itemFilters must be of type array`);
			itemFilters.forEach(entry => {
				if (typeof entry?.path !== "string") throw Helpers.custom_error(`combineItemPiles | each entry in the itemFilters must have a "path" property that is of type string`);
				if (typeof entry?.filter !== "string") throw Helpers.custom_error(`combineItemPiles | each entry in the itemFilters must have a "filter" property that is of type string`);
			})
		}

		if (targetItemPileFlags && typeof targetItemPileFlags !== "object") throw Helpers.custom_error(`combineItemPiles | options.targetItemPileFlags must be of type object`);

		if (PileUtilities.isItemPileVault(targetActor)) {
			const sourceActorItems = sourceActors.map(sourceActor => PileUtilities.getActorItems(sourceActor, { getItemCurrencies: true }));
			const canItemsFit = PileUtilities.fitItemsIntoVault(sourceActorItems, targetActor, { itemFilters });
			if (!canItemsFit) throw Helpers.custom_error(`combineItemPiles | The target vault actor ${targetActor.name} cannot fit these items`);
		}

		if (interactionId) {
			if (typeof interactionId !== "string") throw Helpers.custom_error(`combineItemPiles | interactionId must be of type string`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMBINE_ITEM_PILES, targetUuid, sourceUuids, game.user.id, {
			itemFilters, interactionId
		});

	}

	/**
	 * Return all th registered currencies abbreviations
	 * @returns {Array<string>}                                 An array of string containing the abbreviation for each currency registered
	 */
	static getCurrenciesAbbreviations() {
		return PileUtilities.getCurrenciesAbbreviations();
	}

	/**
	 * Turns an array containing the data and quantities for each currency into a string of currencies
	 *
	 * @param {Array<object>} currencies                      An array of object containing the data and quantity for each currency
|    * @param {number} currencies[].cost                      The cost of the currency
|    * @param {string} currencies[].denom                     The abbreviation of the currency, which are usually {#}GP, which when {#} is replaced with the number it becomes 5GP.
	 * @param {string} currencies[].percent                   The cost of  the currency is in percentage (for work the 'abbreviation' property must includes '%' substring)
	 * @returns {string}                                      An array of object containing the data and quantity for each currency
	 */
	static getStringFromCurrencies(currencies) {
		if (!currencies) {
			throw Helpers.custom_error(`getStringFromCurrencies | currencies must be defined`, true);
		}
		if (typeof currencies === "string") {
			throw Helpers.custom_error(`getStringFromCurrencies | currencies can't be of type string`, true);
		}
		if (!Array.isArray(currencies)) {
			throw Helpers.custom_error(`getStringFromCurrencies | currencies must be of type array`, true);
		}
		if (currencies.length === 0) {
			throw Helpers.custom_error(`getStringFromCurrencies | currencies must be a not empty array`, true);
		}
		currencies.forEach(currency => {
			if (typeof currency !== "object") {
				throw Helpers.custom_error("setCurrencies | each entry in inCurrencies must be of type object");
			}
			if (typeof currency.cost !== "number") {
				throw Helpers.custom_error("getStringFromCurrencies | currency.cost must be of type number");
			}
			if (currency.cost < 0) {
				throw Helpers.custom_error("getStringFromCurrencies | currency.cost cannot be a negative number");
			}
			// Is optional
			// if (typeof currency.percent !== "boolean") {
			// 	throw Helpers.custom_error("getStringFromCurrencies | currency.percent must be of type boolean");
			// }
			if (typeof currency.abbreviation !== "string") {
				throw Helpers.custom_error("getStringFromCurrencies | currency.abbreviation must be of type string");
			}
		});
		return PileUtilities.getStringFromCurrencies(currencies);
	}

	/**
	 * Turns a string of currencies into an array containing the data and quantities for each currency
	 *
	 * @param {string} currencies                               A string of currencies to convert (eg, "5gp 25sp")
	 *
	 * @returns {Array<object>}                                 An array of object containing the data and quantity for each currency
	 */
	static getCurrenciesFromString(currencies) {
		if (typeof currencies !== "string") {
			throw Helpers.custom_error(`getCurrenciesFromString | currencies must be of type string`)
		}
		return PileUtilities.getPriceFromString(currencies).currencies;
	}

	/**
	 * This method takes a string, and another string or number, an alternatively a boolean, to modify the first string's currencies.Whether to subtract the second currencies from the first; not needed if the second argument is a number
	 *
	 * @param firstCurrencies {string}                          The starting sum of money as strings
	 * @param secondCurrencies {string/number}                  A string of currencies to alter the first with, or a number to multiply it
	 * @param subtract {boolean}                                Whether to subtract the second currencies from the first; not needed if the second argument is a number
	 *
	 * @returns {string}                                        The resulting currency string
	 */
	static calculateCurrencies(firstCurrencies, secondCurrencies, subtract = true) {
		if (typeof firstCurrencies !== "string") {
			throw Helpers.custom_error(`getCurrencyDifference | firstCurrencies must be of type string`)
		}
		if (!(typeof secondCurrencies === "string" || typeof secondCurrencies === "number")) {
			throw Helpers.custom_error(`getCurrencyDifference | secondCurrencies must be of type string or number`)
		}

		const firstCurrenciesData = PileUtilities.getPriceFromString(firstCurrencies);
		const secondCurrenciesData = typeof secondCurrencies === "string"
			? PileUtilities.getPriceFromString(secondCurrencies)
			: secondCurrencies;

		const totalCost = typeof secondCurrencies === "string"
			? firstCurrenciesData.overallCost + (secondCurrenciesData.overallCost * (subtract ? -1 : 1))
			: firstCurrenciesData.overallCost * secondCurrencies;

		const differenceCost = PileUtilities.getPriceArray(totalCost);
		const newBaseCurrencies = differenceCost
			.filter(currency => !currency.secondary && currency.cost)
			.reduce((acc, currency) => {
				return acc + currency.abbreviation.replace("{#}", currency.cost) + " ";
			}, "");

		const newSecondaryCurrencies = firstCurrenciesData.currencies
			.reduce((acc, currency, index) => {
				if (!currency.secondary) return acc;
				const quantity = typeof secondCurrencies === "string"
					? currency.quantity + (secondCurrenciesData.currencies[index].quantity * (subtract ? -1 : 1))
					: Math.round(currency.quantity * secondCurrencies);
				if (quantity <= 0) return acc;
				return acc + currency.abbreviation.replace("{#}", quantity) + " ";
			}, "");

		return (newBaseCurrencies + newSecondaryCurrencies).trim();
	}

	/**
	 * Turns a string of currencies or a number into an object containing payment data, and the change an optional target would receive back
	 *
	 * @param {string/number} price                             A string of currencies to convert (eg, "5gp 25sp") or a number
	 * @param {object} options                                  Options to pass to the function
	 * @param {number/boolean} [options.quantity=1]             The number of this to buy
	 * @param {string/boolean} [options.target=false]           The target whose currencies to check against
	 *
	 * @returns {object}                                        An object containing the price data
	 */
	static getPaymentData(price, { quantity = 1, target = false } = {}) {

		let targetActor = false;
		if (target) {
			targetActor = Utilities.getActor(target);
			if (!targetActor) throw Helpers.custom_error(`getPaymentData | Could not determine target actor`);
		}

		let overallCost;
		let secondaryPrices = false;
		if (typeof price === "string") {
			const priceData = PileUtilities.getPriceFromString(price)
			const currenciesToRemove = priceData.currencies.filter(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity > 0);
			if (!currenciesToRemove.length) {
				throw Helpers.custom_error(`getPaymentData | Could not determine currencies to remove with string "${price}"`);
			}
			overallCost = priceData.overallCost;
			secondaryPrices = currenciesToRemove.filter(currency => currency.secondary);
		} else if (typeof price === "number") {
			overallCost = price;
		} else {
			if (!targetActor) throw Helpers.custom_error(`getPaymentData | price must be of type string or number`);
		}

		return PileUtilities.getPaymentData({
			purchaseData: [{ cost: overallCost, quantity, secondaryPrices }],
			buyer: targetActor
		});

	}

	/**
	 * TODO: Remove in future update
	 * @deprecated
	 */
	static getPaymentDataFromString(...args) {
		Helpers.custom_warning(`game.itempiles.API.getPaymentDataFromString has been deprecated in favor of game.itempiles.API.getPaymentData`, false);
		return this.getPaymentData(...args);
	}

	/**
	 * Update currencies to the target
	 *
	 * @param {Actor/Token/TokenDocument} target                The actor to update the currencies to
	 * @param {string} currencies                               A string of currencies to update (eg, "5gp 25sp")
	 * @param {object} options                                  Options to pass to the function
	 * @param {string/boolean} [options.interactionId=false]    The ID of this interaction
	 *
	 * @returns {Promise<object>}                               An object containing the items and attributes update to the target
	 */
	static updateCurrencies(target, currencies, { interactionId = false } = {}) {

		const targetActor = Utilities.getActor(target);
		const targetUuid = Utilities.getUuid(targetActor);
		if (!targetUuid) throw Helpers.custom_error(`updateCurrency | Could not determine the UUID, please provide a valid target`);

		if (typeof currencies !== "string") {
			throw Helpers.custom_error(`updateCurrency | currencies must be of type string`)
		}

		const currenciesToUpdate = PileUtilities.getPriceFromString(currencies).currencies
			.filter(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity >= 0);

		if (!currenciesToUpdate.length) {
			throw Helpers.custom_error(`updateCurrency | Could not determine currencies to update with string "${currencies}"`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.UPDATE_CURRENCIES, targetUuid, currencies, game.user.id, { interactionId });

	}

	/**
	 * Adds currencies to the target
	 *
	 * @param {Actor/Token/TokenDocument} target                The actor to add the currencies to
	 * @param {string} currencies                               A string of currencies to add (eg, "5gp 25sp")
	 * @param {object} options                                  Options to pass to the function
	 * @param {string/boolean} [options.interactionId=false]    The ID of this interaction
	 *
	 * @returns {Promise<object>}                               An object containing the items and attributes added to the target
	 */
	static addCurrencies(target, currencies, { interactionId = false } = {}) {

		const targetActor = Utilities.getActor(target);
		const targetUuid = Utilities.getUuid(targetActor);
		if (!targetUuid) throw Helpers.custom_error(`addCurrency | Could not determine the UUID, please provide a valid target`);

		if (typeof currencies !== "string") {
			throw Helpers.custom_error(`addCurrency | currencies must be of type string`)
		}

		const currenciesToAdd = PileUtilities.getPriceFromString(currencies).currencies
			.filter(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity > 0);

		if (!currenciesToAdd.length) {
			throw Helpers.custom_error(`addCurrency | Could not determine currencies to add with string "${currencies}"`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.ADD_CURRENCIES, targetUuid, currencies, game.user.id, { interactionId });

	}

	/**
	 * Removes currencies from the target
	 *
	 * @param {Actor/Token/TokenDocument} target                The actor to remove currencies from
	 * @param {string} currencies                               A string of currencies to remove (eg, "5gp 25sp")
	 * @param {object} options                                  Options to pass to the function
	 * @param {boolean} [options.change=true]                   Whether the actor can get change back
	 * @param {string/boolean} [options.interactionId=false]    The ID of this interaction
	 *
	 * @returns {Promise<object>}                               An object containing the items and attributes removed from the target
	 */
	static removeCurrencies(target, currencies, { change = true, interactionId = false } = {}) {

		const targetActor = Utilities.getActor(target);
		const targetUuid = Utilities.getUuid(targetActor);
		if (!targetUuid) throw Helpers.custom_error(`removeCurrencies | Could not determine the UUID, please provide a valid target`);

		let overallCost;
		let secondaryPrices = false;
		if (typeof currencies === "string") {
			const priceData = PileUtilities.getPriceFromString(currencies)
			const currenciesToRemove = priceData.currencies.filter(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity > 0);
			if (!currenciesToRemove.length) {
				throw Helpers.custom_error(`removeCurrencies | Could not determine currencies to remove with string "${currencies}"`);
			}
			overallCost = priceData.overallCost;
			secondaryPrices = currenciesToRemove.filter(currency => currency.secondary);
		} else {
			throw Helpers.custom_error(`removeCurrencies | price must be of type string`);
		}

		const paymentData = PileUtilities.getPaymentData({
			purchaseData: [{ cost: overallCost, quantity: 1, secondaryPrices }], buyer: targetActor
		});

		if (!paymentData.canBuy) {
			throw Helpers.custom_error(`removeCurrencies | ${targetActor.name} cannot afford "${currencies}"`);
		}

		if (!change && paymentData.buyerChange.length) {
			throw Helpers.custom_error(`removeCurrencies | ${targetActor.name} cannot afford "${currencies}" without receiving change!`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REMOVE_CURRENCIES, targetUuid, currencies, game.user.id, { interactionId });

	}

	/**
	 * Transfers currencies between the source and the target.
	 *
	 * @param {Actor/Token/TokenDocument} source                The actor to transfer currencies from
	 * @param {Actor/Token/TokenDocument} target                The actor to receive the currencies
	 * @param {string} currencies                               A string of currencies to transfer (eg, "5gp 25sp")
	 * @param {object} options                                  Options to pass to the function
	 * @param {boolean} [options.change=true]                   Whether the source actor can get change back
	 * @param {string/boolean} [options.interactionId=false]    The ID of this interaction
	 *
	 * @returns {Promise<object>}                               An object containing the items and attributes transferred to the target
	 */
	static transferCurrencies(source, target, currencies, { change = true, interactionId = false } = {}) {

		const sourceActor = Utilities.getActor(source);
		const sourceUuid = Utilities.getUuid(sourceActor);
		if (!sourceUuid) throw Helpers.custom_error(`transferCurrencies | Could not determine the UUID, please provide a valid source`);

		const targetActor = Utilities.getActor(target);
		const targetUuid = Utilities.getUuid(targetActor);
		if (!targetUuid) throw Helpers.custom_error(`transferCurrencies | Could not determine the UUID, please provide a valid target`);

		let overallCost;
		let secondaryPrices = false;
		if (typeof currencies === "string") {
			const priceData = PileUtilities.getPriceFromString(currencies)
			const currenciesToRemove = priceData.currencies.filter(currency => Helpers.isRealNumber(currency.quantity) && currency.quantity > 0);
			if (!currenciesToRemove.length) {
				throw Helpers.custom_error(`transferCurrencies | Could not determine currencies to remove with string "${currencies}"`);
			}
			overallCost = priceData.overallCost;
			secondaryPrices = currenciesToRemove.filter(currency => currency.secondary);
		} else {
			throw Helpers.custom_error(`transferCurrencies | price must be of type string`);
		}

		const paymentData = PileUtilities.getPaymentData({
			purchaseData: [{ cost: overallCost, quantity: 1, secondaryPrices }], buyer: sourceActor
		});

		if (!paymentData.canBuy) {
			throw Helpers.custom_error(`transferCurrencies | ${sourceActor.name} cannot afford to transfer "${currencies}"`);
		}

		if (!change && paymentData.buyerChange.length) {
			throw Helpers.custom_error(`transferCurrencies | ${sourceActor.name} cannot afford to transfer "${currencies}" without receiving change!`);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_CURRENCIES, sourceUuid, targetUuid, currencies, game.user.id, { interactionId });

	}

	/**
	 * Transfers all currencies between the source and the target.
	 *
	 * @param {Actor/Token/TokenDocument} source                The actor to transfer all currencies from
	 * @param {Actor/Token/TokenDocument} target                The actor to receive all the currencies
	 * @param {object} options                                  Options to pass to the function
	 * @param {string/boolean} [options.interactionId=false]    The ID of this interaction
	 *
	 * @returns {Promise<object>}                               An object containing all items and attributes transferred to the target
	 */
	static transferAllCurrencies(source, target, { interactionId = false } = {}) {

		const sourceUuid = Utilities.getUuid(source);
		if (!sourceUuid) throw Helpers.custom_error(`transferCurrencies | Could not determine the UUID, please provide a valid source`);

		const targetUuid = Utilities.getUuid(target);
		if (!targetUuid) throw Helpers.custom_error(`transferCurrencies | Could not determine the UUID, please provide a valid target`);

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRANSFER_ALL_CURRENCIES, sourceUuid, targetUuid, game.user.id, { interactionId });

	}

	/**
	 * Rolls on a table of items and collates them to be able to be added to actors and such
	 *
	 * @param {string/RollTable} table                              The name, ID, UUID, or the table itself, or an array of such
	 * @param {object} options                                      Options to pass to the function
	 * @param {string/number} [options.timesToRoll="1"]             The number of times to roll on the tables, which can be a roll formula
	 * @param {boolean} [options.resetTable=true]                   Whether to reset the table before rolling it
	 * @param {boolean} [options.normalizeTable=true]               Whether to normalize the table before rolling it
	 * @param {boolean} [options.displayChat=false]                 Whether to display the rolls to the chat
	 * @param {object} [options.rollData={}]                        Data to inject into the roll formula
	 * @param {Actor/string/boolean} [options.targetActor=false]    The target actor to add the items to, or the UUID of an actor
	 * @param {boolean} [options.removeExistingActorItems=false]    Whether to clear the target actor's items before adding the ones rolled
	 * @param {boolean/string} [options.customCategory=false]       Whether to apply a custom category to the items rolled
	 *
	 * @returns {Promise<Array<Item>>}                              An array of object containing the item data and their quantity
	 */
	static async rollItemTable(table, {
		timesToRoll = "1",
		resetTable = true,
		normalizeTable = false,
		displayChat = false,
		rollData = {},
		targetActor = false,
		removeExistingActorItems = false,
		customCategory = false
	} = {}) {

		let rollTable = table;
		if (typeof table === "string") {
			let potentialTable = await fromUuid(table);
			if (!potentialTable) {
				potentialTable = game.tables.get(table)
			}
			if (!potentialTable) {
				potentialTable = game.tables.getName(table)
			}
			if (!potentialTable) {
				throw Helpers.custom_error(`rollItemTable | could not find table with string "${table}"`);
			}
			if (resetTable && table.startsWith("Compendium")) {
				resetTable = false;
			}
			rollTable = potentialTable;
		}

		if (!(rollTable instanceof RollTable)) {
			throw Helpers.custom_error(`rollItemTable | table must be of type RollTable`);
		}

		table = rollTable.uuid;

		if (!(typeof timesToRoll === "string" || typeof timesToRoll === "number")) {
			throw Helpers.custom_error(`rollItemTable | timesToRoll must be of type string or number`);
		}

		if (typeof rollData !== "object") {
			throw Helpers.custom_error(`rollItemTable | rollData must be of type object`);
		}

		if (typeof removeExistingActorItems !== "boolean") {
			throw Helpers.custom_error(`rollItemTable | removeExistingActorItems of type boolean`);
		}

		if (targetActor) {
			targetActor = Utilities.getActor(targetActor);
			if (!(targetActor instanceof Actor)) {
				throw Helpers.custom_error(`rollItemTable | could not find the actor of the target actor`);
			}
		}

		const items = await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.ROLL_ITEM_TABLE, {
			table,
			timesToRoll,
			resetTable,
			normalizeTable,
			displayChat,
			rollData,
			customCategory,
			targetActor: Utilities.getUuid(targetActor),
			removeExistingActorItems,
			userId: game.user.id
		});

		if (items) {
			for (const entry of items) {
				entry.item = targetActor
					? targetActor.items.get(entry.item._id)
					: new Item.implementation(entry.item);
			}
		}

		return items;

	}

	/**
	 * Refreshes the merchant's inventory, potentially removing existing items and populating it based on its item tables
	 *
	 * @param {Actor/Token/TokenDocument} target                  The merchant actor to refresh the inventory of
	 * @param {object} options                                    Options to pass to the function
	 * @param {boolean} [options.removeExistingActorItems=true]   Whether to clear the merchant's existing inventory before adding the new items
	 * @returns {Promise<boolean|*>}
	 */
	static async refreshMerchantInventory(target, { removeExistingActorItems = true } = {}) {

		if (target) {
			target = Utilities.getActor(target);
			if (!(target instanceof Actor)) {
				throw Helpers.custom_error(`refreshMerchantInventory | could not find the actor of the target actor`);
			}
		}

		const targetUuid = Utilities.getUuid(target);

		if (!PileUtilities.isItemPileMerchant(target)) {
			throw Helpers.custom_error(`refreshMerchantInventory | target of uuid ${targetUuid} is not a merchant`);
		}

		if (typeof removeExistingActorItems !== "boolean") {
			throw Helpers.custom_error(`refreshMerchantInventory | removeExistingActorItems of type boolean`);
		}

		const items = await ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.REFRESH_MERCHANT_INVENTORY, targetUuid, {
			removeExistingActorItems,
			userId: game.user.id
		});

		if (items) {
			for (const entry of items) {
				entry.item = target.items.get(entry.item._id);
			}
		}

		return items;

	}


	/**
	 * Gets all the valid items from a given actor or token, excluding items based on its item type filters
	 *
	 * @param {Actor/TokenDocument/Token} target      The target to get the items from
	 *
	 * @returns {Array<Item>}                         Array containing the target's valid items
	 */
	static getActorItems(target) {
		return PileUtilities.getActorItems(target);
	}

	static findSimilarItem(itemsToSearch, itemToFind, options = {}) {
		return Utilities.findSimilarItem(itemsToSearch, itemToFind, options);
	}

	/**
	 * Gets the valid currencies from a given actor or token
	 *
	 * @param {Actor/TokenDocument/Token} target      The target to get the currencies from
	 * @param {object} [options]                      Object containing optional parameters
	 * @param {Boolean} [options.getAll]              Whether to get all the currencies, regardless of quantity
	 *
	 * @returns {Array<object>}                       An array of objects containing the data about each currency
	 */
	static getActorCurrencies(target, { getAll = false, secondary = true } = {}) {
		return PileUtilities.getActorCurrencies(target, { getAll, secondary });
	}

	static updateTokenHud() {
		return ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.RERENDER_TOKEN_HUD);
	}

	static requestTrade(user) {
		return TradeAPI._requestTrade(user);
	}

	static spectateTrade(tradeId) {
		return TradeAPI._spectateTrade(tradeId);
	}

	/**
	 * Renders the appropriate interface for a given actor
	 *
	 * @param {Actor/TokenDocument} target                      The actor whose interface to render
	 * @param {object} options                                  An object containing the options for this method
	 * @param {Array<string/User>} [options.userIds]            An array of users or user ids for each user to render the interface for (defaults to only self)
	 * @param {Actor/TokenDocument} [options.inspectingTarget]  Sets what actor should be viewing the interface
	 * @param {boolean} [options.useDefaultCharacter]           Whether other users should use their assigned character when rendering the interface
	 *
	 * @returns {Promise}
	 */
	static renderItemPileInterface(target, {
		userIds = null, inspectingTarget = null, useDefaultCharacter = false
	} = {}) {

		const targetDocument = Utilities.getDocument(target);
		const targetUuid = Utilities.getUuid(targetDocument);
		if (!targetUuid) throw Helpers.custom_error(`renderItemPileInterface | Could not determine the UUID, please provide a valid target item pile`);

		if (!PileUtilities.isValidItemPile(targetDocument)) {
			throw Helpers.custom_error("renderItemPileInterface | This target is not a valid item pile")
		}

		if (!inspectingTarget && !useDefaultCharacter) {
			useDefaultCharacter = true;
		}

		if (inspectingTarget && useDefaultCharacter) {
			throw Helpers.custom_error("renderItemPileInterface | You cannot force users to use both their default character and a specific character to inspect the pile")
		}

		const inspectingTargetUuid = inspectingTarget ? Utilities.getUuid(inspectingTarget) : false;
		if (inspectingTarget && !inspectingTargetUuid) throw Helpers.custom_error(`renderItemPileInterface | Could not determine the UUID, please provide a valid inspecting target`);

		if (!Array.isArray(userIds)) {
			if (userIds === null) {
				userIds = [game.user.id];
			} else {
				userIds = [userIds]
			}
		} else {
			userIds = userIds.map(user => {
				return user instanceof User ? user.id : user;
			})
		}

		if (!game.user.isGM) {
			if (userIds.length > 1 || !userIds.includes(game.user.id)) {
				throw Helpers.custom_error(`renderItemPileInterface | You are not a GM, so you cannot force others to render an item pile's interface`);
			}
			userIds = [game.user.id];
		}

		if (userIds.length === 1 && userIds[0] === game.user.id) {
			return PrivateAPI._renderItemPileInterface(targetUuid, {
				inspectingTargetUuid, useDefaultCharacter, remote: true
			})
		}

		for (const userId of userIds) {
			const user = game.users.get(userId);
			if (!user) throw Helpers.custom_error(`renderItemPileInterface | No user with ID "${userId}" exists`);
			if (user.isGM) continue;
			if (useDefaultCharacter) {
				if (!user.character) {
					Helpers.custom_warning(`renderItemPileInterface | User "${user.name}" has no default character`, true);
					return;
				}
			}
		}

		return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.RENDER_INTERFACE, userIds, targetUuid, {
			inspectingTargetUuid, useDefaultCharacter, remote: true
		});

	}

	/**
	 * Closes any open interfaces from a given item pile actor
	 *
	 * @param {Actor/TokenDocument} target                      The actor whose interface to potentially close
	 * @param {object} options                                  An object containing the options for this method
	 * @param {Array<string/User>} [options.userIds]            An array of users or user ids for each user to close the interface for (defaults to only self)
	 *
	 * @returns {Promise}
	 */
	static unrenderItemPileInterface(target, { userIds = null } = {}) {

		const targetDocument = Utilities.getDocument(target);
		const targetUuid = Utilities.getUuid(targetDocument);
		if (!targetUuid) throw Helpers.custom_error(`unrenderItemPileInterface | Could not determine the UUID, please provide a valid target item pile`);

		if (!PileUtilities.isValidItemPile(targetDocument)) {
			throw Helpers.custom_error("unrenderItemPileInterface | This target is not a valid item pile")
		}

		if (!Array.isArray(userIds)) {
			if (userIds === null) {
				userIds = [game.user.id];
			} else {
				userIds = [userIds]
			}
		} else {
			userIds = userIds.map(user => {
				return user instanceof User ? user.id : user;
			})
		}

		if (!game.user.isGM) {
			if (userIds.length > 1 || !userIds.includes(game.user.id)) {
				throw Helpers.custom_error(`unrenderItemPileInterface | You are not a GM, so you cannot force others to close an item pile's interface`);
			}
			userIds = [game.user.id];
		}

		if (userIds.length === 1 && userIds[0] === game.user.id) {
			return PrivateAPI._unrenderItemPileInterface(targetUuid, { remote: true });
		}

		for (const userId of userIds) {
			const user = game.users.get(userId);
			if (!user) throw Helpers.custom_error(`unrenderItemPileInterface | No user with ID "${userId}" exists`);
		}

		return ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.UNRENDER_INTERFACE, userIds, targetUuid, { remote: true });

	}

	/**
	 * Retrieves the total numerical cost of an item
	 *
	 * @param item
	 * @returns {number}
	 */
	static getCostOfItem(item) {
		return PileUtilities.getCostOfItem(item);
	}

	/**
	 *  Get the prices array for a given item
	 *
	 * @param {Item} item                             Item to get the price for
	 * @param {object} options                        Options to pass to the function
	 * @param {Actor/boolean} [options.seller=false]  Actor that is selling the item
	 * @param {Actor/boolean} [options.buyer=false]   Actor that is buying the item
	 * @param {number} [options.quantity=1]           Quantity of item to buy
	 *
	 * @returns {Array}                               Array containing all the different purchase options for this item
	 */
	static getPricesForItem(item, { seller = false, buyer = false, quantity = 1 } = {}) {

		if (!(item instanceof Item)) {
			throw Helpers.custom_error("getPricesForItem | The given item must be of type Item");
		}

		if (seller) {
			seller = Utilities.getActor(seller);
			if (!seller) {
				throw Helpers.custom_error("getPricesForItem | Could not determine actor for the seller");
			}
		} else {
			if (!item.parent) {
				throw Helpers.custom_error("getPricesForItem | If no seller was given, the item must belong to an actor");
			}
			seller = Utilities.getActor(item.parent);
		}

		if (buyer) {
			buyer = Utilities.getActor(buyer);
			if (!buyer) {
				throw Helpers.custom_error(`getPricesForItem | Could not determine the actor for the buyer`);
			}
		}

		return PileUtilities.getPriceData({ item, seller, buyer, quantity });

	}

	/**
	 * Trades multiple items between one actor to another, and currencies and/or change is exchanged between them
	 *
	 * @param {Actor/Token/TokenDocument} seller                                                    The actor that is selling the item
	 * @param {Actor/Token/TokenDocument} buyer                                                     The actor that is buying the item
	 * @param {Array<Object<{ item: Item/string, quantity: number, paymentIndex: number }>>} items  An array of objects containing the item or the id of the
	 *                                                                                              item to be sold, the quantity to be sold, and the payment
	 *                                                                                              index to be used
	 * @param {string/boolean} [interactionId=false]                                                The ID of this interaction
	 *
	 * @returns {Promise<Object>}                       The items that were created and the attributes that were changed
	 */
	static tradeItems(seller, buyer, items, { interactionId = false } = {}) {

		const sellerActor = Utilities.getActor(seller);
		const sellerUuid = Utilities.getUuid(sellerActor);
		if (!sellerUuid) {
			throw Helpers.custom_error(`tradeItems | Could not determine the UUID of the seller, please provide a valid actor or token`, true);
		}

		const buyerActor = Utilities.getActor(buyer);
		const buyerUuid = Utilities.getUuid(buyer);
		if (!buyerUuid) {
			throw Helpers.custom_error(`tradeItems | Could not determine the UUID of the buyer, please provide a valid actor or token`, true);
		}

		let itemsToSell = items.map(data => {

			data = foundry.utils.mergeObject({
				item: "", quantity: 1, paymentIndex: 0
			}, data);

			if (!data.item) {
				throw Helpers.custom_error(`tradeItems | You must provide an item!`, true);
			}

			let actorItem;
			if (typeof data.item === "string") {
				actorItem = sellerActor.items.get(data.item) || sellerActor.items.getName(data.item);
				if (!actorItem) {
					throw Helpers.custom_error(`tradeItems | Could not find item on seller with identifier "${data.item}"`);
				}
			} else {
				actorItem = sellerActor.items.get(data.item instanceof Item ? data.item.id : data.item._id) || sellerActor.items.getName(data.item.name);
				if (!actorItem) {
					throw Helpers.custom_error(`tradeItems | Could not find provided item on seller`);
				}
			}

			const itemPrices = PileUtilities.getPriceData({
				item: actorItem, seller: sellerActor, buyer: buyerActor, quantity: data.quantity
			});
			if (itemPrices.length) {
				if (data.paymentIndex >= itemPrices.length || data.paymentIndex < 0) {
					throw Helpers.custom_error(`tradeItems | That payment index does not exist on ${actorItem.name}`, true);
				}

				const selectedPrice = itemPrices[data.paymentIndex];
				if (data.quantity > selectedPrice.maxQuantity) {
					throw Helpers.custom_error(`tradeItems | The buyer actor cannot afford ${data.quantity} of ${actorItem.name} (max ${selectedPrice.maxQuantity})`, true);
				}
			}

			return {
				id: actorItem.id, quantity: data.quantity, paymentIndex: data.paymentIndex
			};

		});

		if (PileUtilities.isItemPileVault(buyerActor)) {
			const items = itemsToSell.reduce((acc, data) => {
				const item = sellerActor.items.get(data.id);
				if (PileUtilities.canItemStack(item, buyerActor)) {
					acc.push(item);
				} else {
					for (let i = 0; i < data.quantity; i++) {
						acc.push(item);
					}
				}
				return acc;
			}, []);
			const canItemsFit = PileUtilities.fitItemsIntoVault(items, buyerActor);
			if (!canItemsFit) throw Helpers.custom_error(`tradeItems | The vault buyer actor ${buyerActor.name} cannot fit these items`, true);
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.TRADE_ITEMS, sellerUuid, buyerUuid, itemsToSell, game.user.id, { interactionId });

	}

	static async giveItem(item) {
		const result = await GiveItems.show(item);
		if (!result) return;
		return PrivateAPI._giveItem({
			itemData: {
				item: item.toObject(),
				quantity: result.quantity
			},
			source: item.parent.uuid,
			target: result.target,
			secret: result.secret,
		}, { skipQuantityDialog: true })
	}

	static canItemFitInVault(item, vaultActor) {
		return PileUtilities.canItemFitInVault(item, vaultActor);
	}

	static fitItemsIntoVault(items, vaultActor) {
		return PileUtilities.fitItemsIntoVault(items, vaultActor);
	}

	static async registerItemPileType(type, label, flags = []) {
		game.i18n.translations['ITEM-PILES'].Types[type] = "Custom: " + label;
		CONSTANTS.CUSTOM_PILE_TYPES[type] = flags;
	}

	static isItemInvalid(item) {
		return PileUtilities.isItemInvalid(item.parent, item);
	}

	static canItemStack(item, actor = false) {
		return PileUtilities.canItemStack(item, actor);
	}

	static getVaultGridData(vaultActor) {
		return PileUtilities.getVaultGridData(vaultActor);
	}

	static getActorFlagData(actor) {
		return PileUtilities.getActorFlagData(actor);
	}

	static getItemQuantity(item) {
		return Utilities.getItemQuantity(item);
	}

	static showItemPileConfig(actor) {
		if (!PileUtilities.isValidItemPile(actor)) return;
		return ItemPileConfig.show(actor);
	}

}

export default API;
