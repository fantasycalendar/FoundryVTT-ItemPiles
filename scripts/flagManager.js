import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";

const flagManager = {

    _latestFlagVersion: false,
    updateStack: new Map(),
    localStack: new Map(),

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

    async migrateDocuments() {

        if (!lib.isResponsibleGM()) return;

        const currentVersion = game.settings.get(CONSTANTS.MODULE_NAME, "migrationVersion");

        if (this.latestFlagVersion === currentVersion) return;

        const scenes = Array.from(game.scenes);

        for (const scene of scenes) {

            const tokens = Array.from(scene.tokens)

            const updates = tokens.map(token => {

                let pileData = token.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);

                if (!pileData) return false;

                const pileVersion = pileData?.flagVersion || "1.0.0";
                if (pileVersion === this.latestFlagVersion) return false;

                for (let [version, migration] of Object.entries(this.migrations)) {
                    if (!isNewerVersion(version, pileVersion)) continue;
                    pileData = migration(token, pileData);

                    lib.debug(`Migration token with UUID "${token.uuid}" to version ${version}`);
                }

                pileData.flagVersion = this.latestFlagVersion;

                return {
                    "_id": token.id,
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileData,
                    [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileData
                };

            }).filter(Boolean);

            await scene.updateEmbeddedDocuments("Token", updates);

        }

        await game.actors.updateAll((actor) => {

            let pileData = actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);

            const pileVersion = pileData?.flagVersion || "1.0.0";

            for (let [version, migration] of Object.entries(this.migrations)) {
                if (!isNewerVersion(version, pileVersion)) continue;
                pileData = migration(actor, pileData);

                lib.debug(`Migration actor with UUID "${actor.uuid}" to version ${version}`);
            }

            pileData.flagVersion = this.latestFlagVersion;

            return {
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileData,
                [`token.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_DATA}`]: pileData
            };

        }, (actor) => {
            let pileData = actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_DATA);
            if (!pileData) return false;
            const pileVersion = pileData?.flagVersion || "1.0.0";
            return pileVersion !== this.latestFlagVersion;
        });

        await game.settings.set(CONSTANTS.MODULE_NAME, "migrationVersion", this.latestFlagVersion);


    },

    migrations: {

        "1.2.6": (inDocument, pileData) => {
            pileData.overrideItemFilters = pileData?.itemTypeFilters?.length
                ? [{ path: "type", filters: pileData.itemTypeFilters }]
                : false;
            delete pileData.itemTypeFilters;

            return foundry.utils.duplicate(pileData);
        },

        "1.3.0": (inDocument, pileData) => {

            const newPileData = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

            for (const key of Object.keys(newPileData)) {
                newPileData[key] = pileData[key] ?? newPileData[key];
            }

            newPileData.overrideCurrencies = pileData?.overrideDynamicAttributes?.length
                ? [{ path: "type", filters: pileData.overrideDynamicAttributes }]
                : false;

            return foundry.utils.duplicate(newPileData);

        },
    },

}


export default flagManager;