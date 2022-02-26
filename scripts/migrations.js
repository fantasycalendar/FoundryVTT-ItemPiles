import * as lib from "./lib/lib.js";
import CONSTANTS from "./constants.js";
import { SYSTEMS } from "./systems.js";

const migrations = {

    _latestFlagVersion: false,
    _latestSettingVersion: false,
    updateStack: new Map(),
    localStack: new Map(),

    get latestFlagVersion() {
        if (!this._latestFlagVersion) {
            const versions = Object.keys(this.document_migrations);
            versions.sort((a, b) => {
                return isNewerVersion(a, b) ? -1 : 1;
            })
            this._latestFlagVersion = versions[0];
        }
        return this._latestFlagVersion;
    },

    get latestSettingVersion() {
        if (!this._latestSettingVersion) {
            const versions = Object.keys(this.setting_migrations);
            versions.sort((a, b) => {
                return isNewerVersion(a, b) ? -1 : 1;
            })
            this._latestSettingVersion = versions[0];
        }
        return this._latestSettingVersion;
    },

    async migrate(){
        if(!lib.isResponsibleGM()) return;

        const currentFlagVersion = game.settings.get(CONSTANTS.MODULE_NAME, "flagMigrationVersion");
        if(this.latestFlagVersion !== currentFlagVersion){
            await this.migrateDocuments();
            await game.settings.set(CONSTANTS.MODULE_NAME, "migrationVersion", this.latestFlagVersion);
        }

        const currentSettingVersion = game.settings.get(CONSTANTS.MODULE_NAME, "settingMigrationVersion");
        if(this.latestSettingVersion !== currentSettingVersion){
            await this.migrateSettings();
            await game.settings.set(CONSTANTS.MODULE_NAME, "settingMigrationVersion", this.latestSettingVersion);
        }
    },

    async migrateSettings() {

        const currentSettingVersion = game.settings.get(CONSTANTS.MODULE_NAME, "settingMigrationVersion");
        for (let [version, migration] of Object.entries(this.setting_migrations)) {
            if (!isNewerVersion(version, currentSettingVersion)) continue;
            await migration();
            lib.debug(`Successfully migrated settings to version ${version}`);
        }

    },

    async migrateDocuments(){

        const scenes = Array.from(game.scenes);

        for(const scene of scenes){

            const tokens = Array.from(scene.tokens)

            const updates = tokens.map(token => {

                let pileData = token.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_FLAGS);

                if(!pileData) return false;

                const pileVersion = pileData?.flagVersion || "1.0.0";
                if (pileVersion === this.latestFlagVersion) return false;

                for (let [version, migration] of Object.entries(this.document_migrations)) {
                    if (!isNewerVersion(version, pileVersion)) continue;
                    pileData = migration(token, pileData);

                    lib.debug(`Migration token with UUID "${token.uuid}" to version ${version}`);
                }

                pileData.flagVersion = this.latestFlagVersion;

                return {
                    "_id": token.id,
                    [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_FLAGS}`]: pileData,
                    [`actorData.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_FLAGS}`]: pileData
                };

            }).filter(Boolean);

            await scene.updateEmbeddedDocuments("Token", updates);

        }

        await game.actors.updateAll((actor) => {

            let pileData = actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_FLAGS);

            const pileVersion = pileData?.flagVersion || "1.0.0";

            for (let [version, migration] of Object.entries(this.document_migrations)) {
                if (!isNewerVersion(version, pileVersion)) continue;
                pileData = migration(actor, pileData);

                lib.debug(`Migration actor with UUID "${actor.uuid}" to version ${version}`);
            }

            pileData.flagVersion = this.latestFlagVersion;

            return {
                [`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_FLAGS}`]: pileData,
                [`token.flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.PILE_FLAGS}`]: pileData
            };

        }, (actor) => {
            let pileData = actor.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.PILE_FLAGS);
            if(!pileData) return false;
            const pileVersion = pileData?.flagVersion || "1.0.0";
            return pileVersion !== this.latestFlagVersion;
        });

    },

    document_migrations: {

        "1.2.6": (inDocument, pileData) => {
            pileData.overrideItemFilters = pileData?.itemTypeFilters?.length
                ? [{ path: "type", filters: pileData.itemTypeFilters }]
                : false;
            delete pileData.itemTypeFilters;

            return foundry.utils.duplicate(pileData);
        },

        "1.3.0": (inDocument, pileData) => {

            const newPileData = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

            for(const key of Object.keys(newPileData)){
                newPileData[key] = pileData[key] ?? newPileData[key];
            }

            newPileData.overrideCurrencies = pileData?.overrideDynamicAttributes?.length
                ? [{ path: "type", filters: pileData.overrideDynamicAttributes }]
                : false;

            return foundry.utils.duplicate(newPileData);

        },
    },

    setting_migrations: {

        "1.3.0": async () => {

            const itemTypeAttribute = game.settings.storage.get("world").getSetting(`${CONSTANTS.MODULE_NAME}.itemTypeAttribute`);
            const itemTypeFilters = game.settings.storage.get("world").getSetting(`${CONSTANTS.MODULE_NAME}.itemTypeFilters`);

            if(itemTypeAttribute && itemTypeFilters){

                const itemTypeAttributeValue = JSON.parse(itemTypeAttribute.data.value)
                const itemTypeFiltersValue = JSON.parse(itemTypeFilters.data.value)

                game.settings.set(CONSTANTS.MODULE_NAME, "itemFilters", [
                    {
                        "path": itemTypeAttributeValue,
                        "filters": itemTypeFiltersValue
                    }
                ])

                await itemTypeAttribute.delete();
                await itemTypeFilters.delete();

            }

            const dynamicAttributesSetting = game.settings.storage.get("world").getSetting(`${CONSTANTS.MODULE_NAME}.dynamicAttributes`);

            if(dynamicAttributesSetting){

                const dynamicAttributesValue = JSON.parse(dynamicAttributesSetting.data.value)

                game.settings.set(CONSTANTS.MODULE_NAME, "currencies", dynamicAttributesValue)

                await dynamicAttributesSetting.delete();

            }

        }

    }

}



export default migrations;