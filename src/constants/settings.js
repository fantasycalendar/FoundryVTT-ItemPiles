import { SYSTEMS } from "../systems.js";

const SETTINGS = {

  // Client settings
  OUTPUT_TO_CHAT: "outputToChat",
  INVERT_SHEET_OPEN: "invertSheetOpen",
  HIDE_ACTOR_HEADER_TEXT: "hideActorHeaderText",
  HIDE_ACTOR_HEADER_BUTTON: "hideActorHeaderButton",
  PRELOAD_FILES: "preloadFiles",
  DEBUG: "debug",
  DEBUG_HOOKS: "debugHooks",

  // Module Settings
  ENABLE_DROPPING_ITEMS: "enableDroppingItems",
  ENABLE_TRADING: "enableTrading",
  ENABLE_GIVING_ITEMS: "enableGivingItems",
  SHOW_TRADE_BUTTON: "showTradeButton",
  DELETE_EMPTY_PILES: "deleteEmptyPiles",
  INSPECT_ITEMS_IN_TRADE: "inspectItemsInTrade",
  POPULATION_TABLES_FOLDER: "populationTablesFolder",

  // System Settings
  CURRENCIES: "currencies",
  CURRENCY_DECIMAL_DIGITS: "currencyDecimalDigits",
  ITEM_FILTERS: "itemFilters",
  ACTOR_CLASS_TYPE: "actorClassType",
  ITEM_QUANTITY_ATTRIBUTE: "itemQuantityAttribute",
  ITEM_PRICE_ATTRIBUTE: "itemPriceAttribute",
  ITEM_SIMILARITIES: "itemSimilarities",
  VAULT_STYLES: "vaultStyles",
  PRICE_PRESETS: "pricePresets",

  // Hidden settings
  DEFAULT_ITEM_PILE_JOURNAL_ID: "defaultItemPileJournalID",
  DEFAULT_ITEM_PILE_ACTOR_ID: "defaultItemPileActorID",
  SYSTEM_FOUND: "systemFound",
  SYSTEM_NOT_FOUND_WARNING_SHOWN: "systemNotFoundWarningShown",
  PRECONFIGURED_SYSTEM: "preconfiguredSystem",
  SYSTEM_VERSION: "systemVersion",
  VAULT_LOG_JOURNAL_ID: "vaultLogJournalId",

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
      default: SYSTEMS.DATA.CURRENCIES ?? SYSTEMS.DEFAULT_SETTINGS.CURRENCIES,
      type: Object
    },

    [SETTINGS.CURRENCY_DECIMAL_DIGITS]: {
      name: "ITEM-PILES.Settings.CurrencyDecimalDigits.Title",
      hint: "ITEM-PILES.Settings.CurrencyDecimalDigits.Hint",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.CURRENCY_DECIMAL_DIGITS ?? SYSTEMS.DEFAULT_SETTINGS.CURRENCY_DECIMAL_DIGITS,
      step: 0.00001,
      min: 0,
      max: 1,
      type: Number
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
      default: SYSTEMS.DATA.ITEM_FILTERS ?? SYSTEMS.DEFAULT_SETTINGS.ITEM_FILTERS,
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
      default: SYSTEMS.DATA.ITEM_SIMILARITIES ?? SYSTEMS.DEFAULT_SETTINGS.ITEM_SIMILARITIES,
      type: Array
    },

    [SETTINGS.VAULT_STYLES]: {
      name: "ITEM-PILES.Settings.VaultStyles.Title",
      label: "ITEM-PILES.Settings.VaultStyles.Label",
      hint: "ITEM-PILES.Settings.VaultStyles.Hint",
      icon: "fa-solid fa-wand-magic-sparkles",
      application: "vault-styles",
      scope: "world",
      config: false,
      system: true,
      default: SYSTEMS.DATA.VAULT_STYLES ?? SYSTEMS.DEFAULT_SETTINGS.VAULT_STYLES,
      type: Array
    },

    [SETTINGS.PRICE_PRESETS]: {
      name: "ITEM-PILES.Settings.PricePresets.Title",
      label: "ITEM-PILES.Settings.PricePresets.Label",
      hint: "ITEM-PILES.Settings.PricePresets.Hint",
      scope: "world",
      icon: "fa fa-tags",
      application: "price-presets",
      config: false,
      system: true,
      default: [],
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

    [SETTINGS.SYSTEM_VERSION]: {
      scope: "world",
      config: false,
      default: "0.0.0",
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

    [SETTINGS.VAULT_LOG_JOURNAL_ID]: {
      scope: "world",
      config: false,
      default: "",
      type: String
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

    [SETTINGS.INSPECT_ITEMS_IN_TRADE]: {
      name: "ITEM-PILES.Settings.InspectItemsTrade.Title",
      hint: "ITEM-PILES.Settings.InspectItemsTrade.Hint",
      scope: "world",
      config: false,
      default: true,
      type: Boolean
    },

    [SETTINGS.POPULATION_TABLES_FOLDER]: {
      name: "ITEM-PILES.Settings.PopulationTablesFolder.Title",
      hint: "ITEM-PILES.Settings.PopulationTablesFolder.Hint",
      scope: "world",
      config: false,
      default: "root",
      type: String
    },

    [SETTINGS.DELETE_EMPTY_PILES]: {
      name: "ITEM-PILES.Settings.DeleteEmptyPiles.Title",
      hint: "ITEM-PILES.Settings.DeleteEmptyPiles.Hint",
      scope: "world",
      config: false,
      default: false,
      type: Boolean
    },

    [SETTINGS.ENABLE_DROPPING_ITEMS]: {
      name: "ITEM-PILES.Settings.EnableDroppingItems.Title",
      hint: "ITEM-PILES.Settings.EnableDroppingItems.Hint",
      scope: "world",
      config: false,
      default: true,
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

    [SETTINGS.ENABLE_GIVING_ITEMS]: {
      name: "ITEM-PILES.Settings.EnableGivingItems.Title",
      hint: "ITEM-PILES.Settings.EnableGivingItems.Hint",
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
      name: "ITEM-PILES.Settings.HideHeaderButtonText.Title",
      hint: "ITEM-PILES.Settings.HideHeaderButtonText.Hint",
      scope: "client",
      config: false,
      default: false,
      type: Boolean
    },

    [SETTINGS.HIDE_ACTOR_HEADER_BUTTON]: {
      name: "ITEM-PILES.Settings.HideHeaderButton.Title",
      hint: "ITEM-PILES.Settings.HideHeaderButton.Hint",
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
