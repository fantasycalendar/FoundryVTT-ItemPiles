import dnd5e from "./systems/dnd5e.js";

// ↓ IMPORT SYSTEMS HERE ↓
import pf1 from "./systems/pf1.js";
import pf2e from "./systems/pf2e.js";
import ds4 from "./systems/ds4.js";
import d35e from "./systems/d35e.js";
import sfrpg from "./systems/sfrpg.js";
import swade from "./systems/swade.js";
import tormenta20 from "./systems/tormenta20.js";
import wfrp4e from "./systems/wfrp4e.js"
import splittermond from "./systems/splittermond.js"
import twodsix from "./systems/twodsix.js";
// ↑ IMPORT SYSTEMS HERE ↑

/**
 * NOTE: YOUR PULL REQUEST WILL NOT BE ACCEPTED IF YOU DO NOT
 * FOLLOW THE CONVENTION IN THE D&D 5E SYSTEM FILE
 */
export const SYSTEMS = {
  
  SUPPORTED_SYSTEMS: {
    dnd5e,
    // ↓ ADD SYSTEMS HERE ↓
    pf1,
    pf2e,
    ds4,
    d35e,
    sfrpg,
    swade,
    tormenta20,
    wfrp4e,
    splittermond,
    twodsix
    // ↑ ADD SYSTEMS HERE ↑
  },
  
  DEFAULT_SETTINGS: {
    ACTOR_CLASS_TYPE: "",
    ITEM_QUANTITY_ATTRIBUTE: "",
    ITEM_PRICE_ATTRIBUTE: "",
    ITEM_FILTERS: [],
    ITEM_SIMILARITIES: [],
    CURRENCIES: []
  },
  
  get HAS_SYSTEM_SUPPORT() {
    return !!this.SUPPORTED_SYSTEMS?.[game.system.id];
  },
  
  get DATA() {
    return this.SUPPORTED_SYSTEMS?.[game.system.id] ?? this.DEFAULT_SETTINGS;
  }
};