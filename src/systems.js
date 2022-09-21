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
import forbiddenLands from "./systems/forbidden-lands.js";
import icrpg from "./systems/icrpg.js";
import swse from "./systems/swse.js";
import fallout from "./systems/fallout.js";
import cyberpunkRedCore from "./systems/cyberpunk-red-core.js";
// ↑ IMPORT SYSTEMS HERE ↑

/**
 * NOTE: YOUR PULL REQUEST WILL NOT BE ACCEPTED IF YOU DO NOT
 * FOLLOW THE CONVENTION IN THE D&D 5E SYSTEM FILE
 */
export const SYSTEMS = {
  
  SUPPORTED_SYSTEMS: {
    // ↓ ADD SYSTEMS HERE ↓
    "dnd5e": dnd5e,
    "pf1": pf1,
    "pf2e": pf2e,
    "ds4": ds4,
    "d35e": d35e,
    "sfrpg": sfrpg,
    "swade": swade,
    "tormenta20": tormenta20,
    "wfrp4e": wfrp4e,
    "splittermond": splittermond,
    "twodsix": twodsix,
    "forbidden-lands": forbiddenLands,
    "icrpg": icrpg,
    "swse": swse,
    "fallout": fallout,
    "cyberpunk-red-core": cyberpunkRedCore
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