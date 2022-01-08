const CONSTANTS = {
    MODULE_NAME: "item-piles",
    FLAG_NAME: "data",
    PILE_DEFAULTS: {
        enabled: true,
        distance: 1,
        itemTypeFilters: "",
        overrideAttributes: false,
        canInspectItems: true,
        macro: "",
        deleteWhenEmpty: "default",
        displayOne: true,
        overrideSingleItemScale: true,
        singleItemScale: 0.75,
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
    }
}

CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_NAME}/`;

export default CONSTANTS;