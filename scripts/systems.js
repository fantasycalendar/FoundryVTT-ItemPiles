import dnd5e from "./systems/dnd5e.js";

// ↓ IMPORT SYSTEMS HERE ↓
import pf1 from "./systems/pf1.js";
import pf2e from "./systems/pf2e.js";
import ds4 from "./systems/ds4.js";
import d35e from "./systems/d35e.js";
import swade from "./systems/swade.js";
import tormenta20 from "./systems/tormenta20.js";
import wfrp4e from "./systems/wfrp4e.js"
import splittermond from "./systems/splittermond.js"
import sfrpg from "./systems/sfrpg.js"
// ↑ IMPORT SYSTEMS HERE ↑

/**
 * NOTE: YOUR PULL REQUEST WILL NOT BE ACCEPTED IF YOU DO NOT
 * FOLLOW THE CONVENTION IN THE D&D 5E SYSTEM FILE
 */
export const SYSTEMS = {
    get DATA() {
        return {
            dnd5e,
            // ↓ ADD SYSTEMS HERE ↓
            pf1,
            pf2e,
            ds4,
            d35e,
            swade,
            tormenta20,
            wfrp4e,
            splittermond,
            sfrpg,
            // ↑ ADD SYSTEMS HERE ↑
        }?.[game.system.id];
    }
};