import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import BasicItemDialog from "../applications/components/BasicItemDialog.svelte";

export default {

  "VERSION": "1.0.4",

  // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
  "ACTOR_CLASS_TYPE": "loot",

  // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
  "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

  // The item price attribute is the path to the attribute on each item that determine how much it costs
  "ITEM_PRICE_ATTRIBUTE": "system.price",

  // The quantity for price attribute is the path to the attribute on each item that determine how many you get for its price
  "QUANTITY_FOR_PRICE_ATTRIBUTE": "system.price.per",

  // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
  "ITEM_FILTERS": [{
    "path": "type",
    "filters": 'action,ancestry,background,class,condition,deity,effect,feat,heritage,lore,melee,spell,spellcastingEntry'
  }],

  // Item similarities determines how item piles detect similarities and differences in the system
  "ITEM_SIMILARITIES": ["name", "type", "system.temporary.value"],

  // This function is an optional system handler that specifically transforms an item's price into a more unified numeric format
  "ITEM_COST_TRANSFORMER": (item) => {
    const itemCost = getProperty(item, "system.price");
    const { copperValue } = new game.pf2e.Coins(itemCost?.value ?? {});
    return copperValue / 100;
  },

  "PREVIEW_ITEM_TRANSFORMER": (item) => {
    if (game.user.isGM || item?.identificationStatus !== "unidentified") return item;
    new TJSDialog({
      title: item.name,
      content: {
        class: BasicItemDialog,
        props: {
          item
        }
      }
    }, {
      classes: ["pf2e item sheet dorako-ui"],
      resizable: false,
      height: "auto",
      width: "auto"
    }).render(true);
    return false;
  },

  "PILE_DEFAULTS": {
    merchantColumns: [{
      "label": "Rarity",
      "path": "system.traits.rarity",
      "formatting": "{#}",
      "mapping": {
        "common": "PF2E.TraitCommon",
        "uncommon": "PF2E.TraitUncommon",
        "rare": "PF2E.TraitRare",
        "unique": "PF2E.TraitUnique"
      }
    }, {
      "label": "Bulk",
      "path": "system.bulk.value",
      "formatting": "{#}",
      "mapping": { "0": "" }
    }]
  },

  "TOKEN_FLAG_DEFAULTS": {
    flags: {
      pf2e: {
        linkToActorSize: false,
        autoscale: false
      }
    }
  },

  // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
  // In the case of attributes, the path is relative to the "actor.system"
  // In the case of items, it is recommended you export the item with `.toObject()`, put it into `data.item`, and strip out any module data
  "CURRENCIES": [{
    type: "item",
    name: "Platinum Pieces",
    img: "systems/pf2e/icons/equipment/treasure/currency/platinum-pieces.webp",
    abbreviation: "{#}PP",
    data: {
      uuid: "Compendium.pf2e.equipment-srd.JuNPeK5Qm1w6wpb4"
    },
    primary: false,
    exchangeRate: 10
  }, {
    type: "item",
    name: "Gold Pieces",
    img: "systems/pf2e/icons/equipment/treasure/currency/gold-pieces.webp",
    abbreviation: "{#}GP",
    data: {
      uuid: "Compendium.pf2e.equipment-srd.B6B7tBWJSqOBz5zz"
    },
    primary: true,
    exchangeRate: 1
  }, {
    type: "item",
    name: "Silver Pieces",
    img: "systems/pf2e/icons/equipment/treasure/currency/silver-pieces.webp",
    abbreviation: "{#}SP",
    data: {
      uuid: "Compendium.pf2e.equipment-srd.5Ew82vBF9YfaiY9f"
    },
    primary: false,
    exchangeRate: 0.1
  }, {
    type: "item",
    name: "Copper Pieces",
    img: "systems/pf2e/icons/equipment/treasure/currency/copper-pieces.webp",
    abbreviation: "{#}CP",
    data: {
      uuid: "Compendium.pf2e.equipment-srd.lzJ8AVhRcbFul5fh"
    },
    primary: false,
    exchangeRate: 0.01
  }]
}
