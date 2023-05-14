// ↓ IMPORT SYSTEMS HERE ↓
import dnd4e from "./systems/dnd4e.js";
import dnd5e from "./systems/dnd5e.js";
import dnd5e203 from "./systems/dnd5e-2.0.3.js";
import pf1 from "./systems/pf1.js";
import pf2e from "./systems/pf2e.js";
import ds4 from "./systems/ds4.js";
import d35e from "./systems/d35e.js";
import sfrpg from "./systems/sfrpg.js";
import swade from "./systems/swade.js";
import tormenta20 from "./systems/tormenta20.js";
import wfrp4e from "./systems/wfrp4e.js";
import splittermond from "./systems/splittermond.js";
import forbiddenLands from "./systems/forbidden-lands.js";
import icrpg from "./systems/icrpg.js";
import swse from "./systems/swse.js";
import sw5e from "./systems/sw5e.js";
import sw5e203 from "./systems/sw5e-2.0.3.2.3.8.js";
import fallout from "./systems/fallout.js";
import cyberpunkRedCore from "./systems/cyberpunk-red-core.js";
import knave from "./systems/knave.js";
import t2k4e from "./systems/t2k4e.js";
import yzecoriolis from "./systems/yzecoriolis.js";
import kamigakari from "./systems/kamigakari.js";
import symbaroum from "./systems/symbaroum.js";
import wwn from "./systems/wwn.js";
import cyphersystem from "./systems/cyphersystem.js";
import ptu from "./systems/ptu.js";
import dcc from "./systems/dcc.js";
import a5e from "./systems/a5e.js";
import darkHeresy2e from "./systems/dark-heresy.js";
import naheulbeuk from "./systems/naheulbeuk.js";
import icrpgme from "./systems/icrpgme.js";
// ↑ IMPORT SYSTEMS HERE ↑

/**
 * NOTE: YOUR PULL REQUEST WILL NOT BE ACCEPTED IF YOU DO NOT
 * FOLLOW THE CONVENTION IN THE D&D 5E SYSTEM FILE
 */
export const SYSTEMS = {

  SUPPORTED_SYSTEMS: {
    // ↓ ADD SYSTEMS HERE ↓
    "dnd4e": {
      "latest": dnd4e
    },
    "dnd5e": {
      "latest": dnd5e,
      "2.0.3": dnd5e203,
    },
    "pf1": {
      "latest": pf1
    },
    "pf2e": {
      "latest": pf2e
    },
    "ds4": {
      "latest": ds4
    },
    "d35e": {
      "latest": d35e
    },
    "sfrpg": {
      "latest": sfrpg
    },
    "swade": {
      "latest": swade
    },
    "tormenta20": {
      "latest": tormenta20
    },
    "wfrp4e": {
      "latest": wfrp4e
    },
    "splittermond": {
      "latest": splittermond
    },
    "forbidden-lands": {
      "latest": forbiddenLands
    },
    "icrpg": {
      "latest": icrpg
    },
    "icrpgme": {
      "latest": icrpgme
    },
    "swse": {
      "latest": swse
    },
    "sw5e": {
      "latest": sw5e,
      "2.0.3.2.3.8": sw5e203
    },
    "fallout": {
      "latest": fallout
    },
    "cyberpunk-red-core": {
      "latest": cyberpunkRedCore
    },
    "knave": {
      "latest": knave
    },
    "t2k4e": {
      "latest": t2k4e
    },
    "yzecoriolis": {
      "latest": yzecoriolis
    },
    "kamigakari": {
      "latest": kamigakari
    },
    "wwn": {
      "latest": wwn
    },
    "symbaroum": {
      "latest": symbaroum
    },
    "cyphersystem": {
      "latest": cyphersystem
    },
    "ptu": {
      "latest": ptu
    },
    "dcc": {
      "latest": dcc
    },
    "a5e": {
      "latest": a5e
    },
    "dark-heresy": {
      "latest": darkHeresy2e
    },
    "naheulbeuk": {
      "latest": naheulbeuk
    }
    // ↑ ADD SYSTEMS HERE ↑
  },

  DEFAULT_SETTINGS: {
    ACTOR_CLASS_TYPE: "",
    ITEM_QUANTITY_ATTRIBUTE: "",
    ITEM_PRICE_ATTRIBUTE: "",
    QUANTITY_FOR_PRICE_ATTRIBUTE: "flags.item-piles.system.quantityForPrice",
    ITEM_FILTERS: [],
    ITEM_SIMILARITIES: [],
    VAULT_STYLES: [],
    CSS_VARIABLES: [],
    UNSTACKABLE_ITEM_TYPES: [],
    CURRENCIES: [],
    SECONDARY_CURRENCIES: [],
    PILE_DEFAULTS: {},
    TOKEN_FLAG_DEFAULTS: {},
    CURRENCY_DECIMAL_DIGITS: 0.00001
  },

  get HAS_SYSTEM_SUPPORT() {
    return !!this.SUPPORTED_SYSTEMS?.[game.system.id.toLowerCase()];
  },

  _currentSystem: false,

  get DATA() {

    if (this._currentSystem) return this._currentSystem;

    const system = this.SUPPORTED_SYSTEMS?.[game.system.id.toLowerCase()];
    if (!system) return this.DEFAULT_SETTINGS;

    if (system[game.system.version]) {
      this._currentSystem = foundry.utils.mergeObject(this.DEFAULT_SETTINGS, system[game.system.version]);
      return this._currentSystem;
    }

    const versions = Object.keys(system);
    if (versions.length === 1) {
      this._currentSystem = foundry.utils.mergeObject(this.DEFAULT_SETTINGS, system[versions[0]]);
      return this._currentSystem;
    }

    versions.sort((a, b) => {
      return a === "latest" || b === "latest" ? -Infinity : (isNewerVersion(b, a) ? -1 : 1);
    });
    const version = versions.find(version => {
      return version === "latest" || !isNewerVersion(game.system.version, version);
    });

    this._currentSystem = foundry.utils.mergeObject(this.DEFAULT_SETTINGS, system[version]);

    return this._currentSystem;
  },

  addSystem(data) {
    this.SUPPORTED_SYSTEMS[game.system.id.toLowerCase()] = { latest: data };
  }
};
