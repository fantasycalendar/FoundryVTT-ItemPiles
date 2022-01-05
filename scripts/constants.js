const CONSTANTS = {
    MODULE_NAME: "item-piles",
    FLAG_NAME: "data",
    PATH: `modules/${this.MODULE_NAME}/`,
    PILE_DEFAULTS: {
        enabled: true,
        distance: 1,
        itemTypeFilters: "",
        overrideAttributes: false,
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

Object.freeze(CONSTANTS);

export default CONSTANTS;