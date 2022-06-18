import * as helpers from "./helpers/helpers.js";
import { CONSTANTS } from "./constants.js";

const API = {

  /**
   * The actor class type used for the original item pile actor in this system
   *
   * @returns {String}
   */
  get ACTOR_CLASS_TYPE() {
    return helpers.getSetting(CONSTANTS.SETTINGS.ACTOR_CLASS_TYPE);
  },

  /**
   * The currencies used in this system
   *
   * @returns {Array<{name: String, currency: String, img: String}>}
   */
  get CURRENCIES() {
    return helpers.getSetting(CONSTANTS.SETTINGS.CURRENCIES);
  },

  /**
   * The attribute used to track the price of items in this system
   *
   * @returns {string}
   */
  get ITEM_PRICE_ATTRIBUTE() {
    return helpers.getSetting(CONSTANTS.SETTINGS.ITEM_PRICE_ATTRIBUTE);
  },

  /**
   * The attribute used to track the quantity of items in this system
   *
   * @returns {String}
   */
  get ITEM_QUANTITY_ATTRIBUTE() {
    return helpers.getSetting(CONSTANTS.SETTINGS.ITEM_QUANTITY_ATTRIBUTE);
  },

  /**
   * The filters for item types eligible for interaction within this system
   *
   * @returns {Array<{name: String, filters: String}>}
   */
  get ITEM_FILTERS() {
    return helpers.getSetting(CONSTANTS.SETTINGS.ITEM_FILTERS);
  },

  /**
   * The attributes for detecting item similarities
   *
   * @returns {Array<String>}
   */
  get ITEM_SIMILARITIES() {
    return helpers.getSetting(CONSTANTS.SETTINGS.ITEM_SIMILARITIES);
  },

  /**
   * Sets the actor class type used for the original item pile actor in this system
   *
   * @param {String} inClassType
   * @returns {Promise|Boolean}
   */
  setActorClassType(inClassType) {
    if (typeof inClassType !== "string") {
      throw helpers.custom_error("setActorTypeClass | inClassType must be of type string");
    }
    return helpers.setSetting(CONSTANTS.SETTINGS.ACTOR_CLASS_TYPE, inClassType);
  },

  /**
   * Sets the currencies used in this system
   *
   * @param {Array<{name: String, currency: String, img: String}>} inCurrencies
   * @returns {Promise}
   */
  async setCurrencies(inCurrencies) {
    if (!Array.isArray(inCurrencies)) {
      throw helpers.custom_error("setCurrencies | inCurrencies must be of type array");
    }
    inCurrencies.forEach(currency => {
      if (typeof currency !== "object") {
        throw helpers.custom_error("setCurrencies | each entry in the inCurrencies array must be of type object");
      }
      if (typeof currency.name !== "string") {
        throw helpers.custom_error("setCurrencies | currency.name must be of type string");
      }
      if (typeof currency.currency !== "string") {
        throw helpers.custom_error("setCurrencies | currency.path must be of type string");
      }
      if (currency.img && typeof currency.img !== "string") {
        throw helpers.custom_error("setCurrencies | currency.img must be of type string");
      }
    })
    return helpers.setSetting(CONSTANTS.SETTINGS.CURRENCIES, inCurrencies);
  },

  /**
   * Sets the attribute used to track the price of items in this system
   *
   * @param {string} inAttribute
   * @returns {Promise}
   */
  async setItemPriceAttribute(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw helpers.custom_error("setItemPriceAttribute | inAttribute must be of type string");
    }
    return helpers.setSetting(CONSTANTS.SETTINGS.ITEM_PRICE_ATTRIBUTE, inAttribute);
  },

  /**
   * Sets the attribute used to track the quantity of items in this system
   *
   * @param {String} inAttribute
   * @returns {Promise}
   */
  async setItemQuantityAttribute(inAttribute) {
    if (typeof inAttribute !== "string") {
      throw helpers.custom_error("setItemQuantityAttribute | inAttribute must be of type string");
    }
    return helpers.setSetting(CONSTANTS.SETTINGS.ITEM_QUANTITY_ATTRIBUTE, inAttribute);
  },

  /**
   * Sets the items filters for interaction within this system
   *
   * @param {Array<{path: String, filters: String}>} inFilters
   * @returns {Promise}
   */
  async setItemFilters(inFilters) {
    if (!Array.isArray(inFilters)) {
      throw helpers.custom_error("setItemFilters | inFilters must be of type array");
    }
    inFilters.forEach(filter => {
      if (typeof filter?.path !== "string") {
        throw helpers.custom_error("setItemFilters | each entry in inFilters must have a \"path\" property with a value that is of type string");
      }
      if (typeof filter?.filters !== "string") {
        throw helpers.custom_error("setItemFilters | each entry in inFilters must have a \"filters\" property with a value that is of type string");
      }
    });
    return helpers.setSetting(CONSTANTS.SETTINGS.ITEM_FILTERS, inFilters);
  },

  /**
   * Sets the attributes for detecting item similarities
   *
   * @param {Array<String>} inPaths
   * @returns {Promise}
   */
  async setItemSimilarities(inPaths) {
    if (!Array.isArray(inPaths)) {
      throw helpers.custom_error("setItemSimilarities | inPaths must be of type array");
    }
    inPaths.forEach(path => {
      if (typeof path !== "string") {
        throw helpers.custom_error("setItemSimilarities | each entry in inPaths must be of type string");
      }
    });
    return helpers.setSetting(CONSTANTS.SETTINGS.ITEM_SIMILARITIES, inPaths);
  }

}


export default API;