import dnd5e from "./systems/dnd5e.js";

// ↓ IMPORT SYSTEMS HERE ↓
import pf1 from "./systems/pf1.js";
import ds4 from "./systems/ds4.js";
import d35e from "./systems/ds4.js";
import swade from "./systems/swade.js";
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
            ds4,
            d35e,
            swade,
            // ↑ ADD SYSTEMS HERE ↑
        }?.[game.system.id];
    }
};