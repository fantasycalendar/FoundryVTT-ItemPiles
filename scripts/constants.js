const CONSTANTS = {
    MODULE_NAME: "item-piles",
    PILE_DATA: "data",
    SHARING_DATA: "sharing",
    ITEM_DATA: "item",
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

        // Sharing settings
        shareItemsEnabled: false,
        shareCurrenciesEnabled: true,
        takeAllEnabled: false,
        splitAllEnabled: true,
        activePlayers: false,

        // Merchant settings
        isMerchant: false,
        priceModifier: 100,
        sellModifier: 50,
        overridePriceModifiers: [],
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
        },
    }
}

CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_NAME}/`;

export default CONSTANTS;