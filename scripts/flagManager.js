import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";

const flagManager = {

    _latestFlagVersion: false,
    updateStack: new Map(),

    get latestFlagVersion() {
        if (!this._latestFlagVersion) {
            const versions = Object.keys(this.migrations);
            versions.sort((a, b) => {
                return isNewerVersion(a, b) ? -1 : 1;
            })
            this._latestFlagVersion = versions[0];
        }
        return this._latestFlagVersion;
    },

    /**
     * Sanitizes the effect data, accounting for changes to the structure in previous versions
     *
     * @param inDocument
     * @returns {array/boolean}
     */
    async getFlags(inDocument) {

        debugger;

        let pileData = inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.FLAG_NAME);

        if (!pileData) return false;

        let pileVersion = pileData.flagVersion || "1.0.0";

        if (pileData.flagVersion === this.latestFlagVersion) return pileData;

        for (let [version, migration] of Object.entries(this.migrations)) {

            if (!isNewerVersion(version, pileVersion)) continue;

            pileData = migration(inDocument, pileData);

        }

        pileData.flagVersion = this.latestFlagVersion;

        if(lib.isResponsibleGM()){
            this.addDocumentToMigrate(inDocument, pileData);
        }

        return pileData;

    },

    migrations: {
        "1.3.0": (inDocument, pileData) => {

            pileData.overrideItemFilters = pileData.itemTypeFilters.length
                ? pileData.overrideItemFilters = [{
                    path: "type",
                    filters: pileData.itemTypeFilters
                }] : false;

            delete pileData.itemTypeFilters;

            return pileData;
        }
    },

    addDocumentToMigrate(inDocument, pileData){
        const uuid = lib.getUuid(inDocument);
        this.updateStack.set(uuid, pileData);
        this.runUpdates();
    },

    runUpdates: foundry.utils.debounce(this._runUpdates.bind(this), 50),

    async _runUpdates(){
        const stack = Array.from(this.updateStack);
        this.updateStack = new Map();
        for(const [uuid, pileData] of stack){
            const pileDocument = await fromUuid(uuid);
            if(!pileDocument) continue;
            await lib.updateItemPile(pileDocument, pileData);
        }
    }

}



export default flagManager;