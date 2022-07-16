const module_name = "item-piles";
const module_path = `modules/${module_name}/`;
const baseFlag = `flags.${module_name}.`

const CONSTANTS = {
  
  MODULE_NAME: module_name,
  PATH: module_path,
  
  FLAGS: {
    PILE: baseFlag + "data",
    SHARING: baseFlag + "sharing",
    ITEM: baseFlag + "item",
    PUBLIC_TRADE_ID: baseFlag + "publicTradeId",
    TRADE_USERS: baseFlag + "tradeUsers",
    TEMPORARY_ITEM: baseFlag + "temporary_item"
  },
  
  ITEM_DEFAULTS: {
    hidden: false,
    notForSale: false,
    infiniteQuantity: false,
    displayQuantity: "default",
    free: false,
    disableNormalCost: false,
    prices: []
  },
  
  PILE_DEFAULTS: {
    // Core settings
    enabled: false,
    distance: 1,
    macro: "",
    deleteWhenEmpty: "default",
    canInspectItems: true,
    
    // Overrides
    overrideItemFilters: false,
    overrideCurrencies: false,
    
    // Token settings
    displayOne: false,
    showItemName: false,
    overrideSingleItemScale: false,
    singleItemScale: 1.0,
    
    // Sharing settings
    shareItemsEnabled: false,
    shareCurrenciesEnabled: true,
    takeAllEnabled: false,
    splitAllEnabled: true,
    activePlayers: false,
    
    // Container settings
    isContainer: false,
    closed: false,
    locked: false,
    closedImage: "",
    emptyImage: "",
    openedImage: "",
    lockedImage: "",
    closeSound: "",
    openSound: "",
    lockedSound: "",
    unlockedSound: "",
    
    // Merchant settings
    isMerchant: false,
    isClosed: false,
    infiniteQuantity: false,
    infiniteCurrencies: true,
    purchaseOnly: false,
    hideNewItems: false,
    displayQuantity: "yes",
    buyPriceModifier: 1,
    sellPriceModifier: 0.5,
    itemTypePriceModifiers: [],
    actorPriceModifiers: [],
    openTimes: {
      enabled: false,
      open: {
        hour: 9,
        minute: 0
      },
      close: {
        hour: 18,
        minute: 0
      }
    }
  }
}

export default CONSTANTS;