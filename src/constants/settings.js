import { SYSTEMS } from "../systems.js";

const SETTINGS = {
  
  // Public settings
  OUTPUT_TO_CHAT: "outputToChat",
  DELETE_EMPTY_PILES: "deleteEmptyPiles",
  ENABLE_TRADING: "enableTrading",
  SHOW_TRADE_BUTTON: "showTradeButton",
  INVERT_SHEET_OPEN: "invertSheetOpen",
  HIDE_ACTOR_HEADER_TEXT: "hideActorHeaderText",
  PRELOAD_FILES: "preloadFiles",
  
  // Private Settings
  CURRENCIES: "currencies",
  ITEM_FILTERS: "itemFilters",
  ACTOR_CLASS_TYPE: "actorClassType",
  ITEM_QUANTITY_ATTRIBUTE: "itemQuantityAttribute",
  ITEM_PRICE_ATTRIBUTE: "itemPriceAttribute",
  ITEM_SIMILARITIES: "itemSimilarities",
  
  DEFAULT_ITEM_PILE_JOURNAL_ID: "defaultItemPileJournalID",
  DEFAULT_ITEM_PILE_ACTOR_ID: "defaultItemPileActorID",
  DEBUG: "debug",
  DEBUG_HOOKS: "debugHooks",
  SYSTEM_FOUND: "systemFound",
  SYSTEM_NOT_FOUND_WARNING_SHOWN: "systemNotFoundWarningShown",
  PRECONFIGURED_SYSTEM: "preconfiguredSystem",
  
  GET_DEFAULT() {
    return foundry.utils.deepClone(SETTINGS.DEFAULTS())
  },
  
  GET_SYSTEM_DEFAULTS() {
    return Object.fromEntries(Object.entries(SETTINGS.GET_DEFAULT()).filter(entry => {
      return entry[1].system;
    }));
  },
  
  DEFAULTS: () => ({
    
    [SETTINGS.CURRENCIES]: {
      name: "ITEM-PILES.Settings.Currencies.Title",
      label: "ITEM-PILES.Settings.Currencies.Label",
      hint: "ITEM-PILES.Settings.Currencies.Hint",
      icon: "fa fa-money-bill-alt",
      application: "currencies",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.CURRENCIES,
      type: Object
    },
    
    [SETTINGS.ITEM_FILTERS]: {
      name: "ITEM-PILES.Settings.ItemFilters.Title",
      label: "ITEM-PILES.Settings.ItemFilters.Label",
      hint: "ITEM-PILES.Settings.ItemFilters.Hint",
      icon: "fa fa-filter",
      application: "item-filters",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.ITEM_FILTERS,
      type: Array
    },
    
    [SETTINGS.ITEM_SIMILARITIES]: {
      name: "ITEM-PILES.Settings.ItemSimilarities.Title",
      label: "ITEM-PILES.Settings.ItemSimilarities.Label",
      hint: "ITEM-PILES.Settings.ItemSimilarities.Hint",
      icon: "fa fa-equals",
      application: "item-similarities",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.ITEM_SIMILARITIES,
      type: Array
    },
    
    [SETTINGS.ACTOR_CLASS_TYPE]: {
      name: "ITEM-PILES.Settings.ActorClass.Title",
      hint: "ITEM-PILES.Settings.ActorClass.Hint",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.ACTOR_CLASS_TYPE,
      type: String
    },
    
    [SETTINGS.ITEM_QUANTITY_ATTRIBUTE]: {
      name: "ITEM-PILES.Settings.Quantity.Title",
      hint: "ITEM-PILES.Settings.Quantity.Hint",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.ITEM_QUANTITY_ATTRIBUTE,
      type: String
    },
    
    [SETTINGS.ITEM_PRICE_ATTRIBUTE]: {
      name: "ITEM-PILES.Settings.Price.Title",
      hint: "ITEM-PILES.Settings.Price.Hint",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.ITEM_PRICE_ATTRIBUTE,
      type: String
    },
    
    [SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID]: {
      scope: "world",
      config: false,
      default: "",
      type: String
    },
    
    [SETTINGS.DEFAULT_ITEM_PILE_JOURNAL_ID]: {
      scope: "world",
      config: false,
      default: "",
      type: String
    },
    
    [SETTINGS.SYSTEM_FOUND]: {
      scope: "world",
      config: false,
      default: false,
      type: Boolean
    },
    
    [SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN]: {
      scope: "world",
      config: false,
      default: false,
      type: Boolean
    },
    
    [SETTINGS.PRECONFIGURED_SYSTEM]: {
      scope: "world",
      config: false,
      default: false,
      type: Boolean
    },
    
    [SETTINGS.OUTPUT_TO_CHAT]: {
      name: "ITEM-PILES.Settings.OutputToChat.Title",
      hint: "ITEM-PILES.Settings.OutputToChat.Hint",
      scope: "world",
      config: false,
      default: 1,
      choices: [
        "ITEM-PILES.Settings.OutputToChat.Off",
        "ITEM-PILES.Settings.OutputToChat.Public",
        "ITEM-PILES.Settings.OutputToChat.SelfGM",
        "ITEM-PILES.Settings.OutputToChat.Blind",
      ],
      type: Number
    },
    
    [SETTINGS.DELETE_EMPTY_PILES]: {
      name: "ITEM-PILES.Settings.DeleteEmptyPiles.Title",
      hint: "ITEM-PILES.Settings.DeleteEmptyPiles.Hint",
      scope: "world",
      config: false,
      default: false,
      type: Boolean
    },
    
    [SETTINGS.ENABLE_TRADING]: {
      name: "ITEM-PILES.Settings.EnableTrading.Title",
      hint: "ITEM-PILES.Settings.EnableTrading.Hint",
      scope: "world",
      config: false,
      default: true,
      type: Boolean
    },
    
    [SETTINGS.SHOW_TRADE_BUTTON]: {
      name: "ITEM-PILES.Settings.ShowTradeButton.Title",
      hint: "ITEM-PILES.Settings.ShowTradeButton.Hint",
      scope: "world",
      config: false,
      default: true,
      type: Boolean
    },
    
    [SETTINGS.INVERT_SHEET_OPEN]: {
      name: "ITEM-PILES.Settings.InvertSheetOpen.Title",
      hint: "ITEM-PILES.Settings.InvertSheetOpen.Hint",
      scope: "client",
      config: false,
      default: false,
      type: Boolean
    },
    
    [SETTINGS.HIDE_ACTOR_HEADER_TEXT]: {
      name: "ITEM-PILES.Settings.HideActorHeaderText.Title",
      hint: "ITEM-PILES.Settings.HideActorHeaderText.Hint",
      scope: "client",
      config: false,
      default: false,
      type: Boolean
    },
    
    [SETTINGS.PRELOAD_FILES]: {
      name: "ITEM-PILES.Settings.PreloadFiles.Title",
      hint: "ITEM-PILES.Settings.PreloadFiles.Hint",
      scope: "client",
      config: false,
      default: true,
      type: Boolean
    },
    
    [SETTINGS.DEBUG]: {
      name: "ITEM-PILES.Settings.Debug.Title",
      hint: "ITEM-PILES.Settings.Debug.Hint",
      scope: "client",
      config: false,
      default: false,
      type: Boolean
    },
    
    
    [SETTINGS.DEBUG_HOOKS]: {
      name: "ITEM-PILES.Settings.DebugHooks.Title",
      hint: "ITEM-PILES.Settings.DebugHooks.Hint",
      scope: "client",
      config: false,
      default: false,
      type: Boolean
    },
    
  })
}

export default SETTINGS;