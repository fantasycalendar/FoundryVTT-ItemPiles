import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import { itemPileSocket, SOCKET_HANDLERS } from "./socket.js";

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
    getFlags(inDocument) {

        let pileData = inDocument.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);

        if (!pileData) return false;

        const pileVersion = pileData?.flagVersion || "1.0.0";

        if (pileVersion === this.latestFlagVersion) return pileData;

        for (let [version, migration] of Object.entries(this.migrations)) {

            if (!isNewerVersion(version, pileVersion)) continue;

            pileData = migration(inDocument, pileData);

        }

        pileData.flagVersion = this.latestFlagVersion;

        itemPileSocket.executeAsGM(SOCKET_HANDLERS.MIGRATE_PILE, lib.getUuid(inDocument), pileData);

        return pileData;

    },

    migrations: {
        "1.2.6": (inDocument, pileData) => {
            pileData.overrideItemFilters = pileData?.itemTypeFilters?.length
                ? pileData.overrideItemFilters = [{
                    path: "type",
                    filters: pileData.itemTypeFilters
                }] : false;
            delete pileData.itemTypeFilters;

            return pileData;
        }
    },

    addDocumentToMigrate(inUuid, pileData){
        this.updateStack.set(inUuid, pileData);
        this.runUpdates();
    },

    runUpdates: foundry.utils.debounce(() => flagManager._runUpdates(), 100),

    async _runUpdates(){
        const stack = Array.from(this.updateStack);
        this.updateStack = new Map();
        for(const [uuid, pileData] of stack){
            const pileDocument = await fromUuid(uuid);
            if(!pileDocument) continue;
            lib.debug(`Updated pile with UUID "${uuid}"`)
            await lib.updateItemPileData(pileDocument, pileData);
        }
    }

}



export default flagManager;