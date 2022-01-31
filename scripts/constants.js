const CONSTANTS = {
    MODULE_NAME: "item-piles",
    PILE_DATA: "data",
    SHARING_DATA: "sharing",
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
        activePlayers: false
    }
}

CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_NAME}/`;

export default CONSTANTS;