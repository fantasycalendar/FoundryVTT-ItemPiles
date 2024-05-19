import SUPPORTED_SYSTEMS from "./systems/_index.js";

export const SYSTEMS = {

	SUPPORTED_SYSTEMS,

	DEFAULT_SETTINGS: {
		ACTOR_CLASS_TYPE: "",
		ITEM_CLASS_LOOT_TYPE: "",
		ITEM_CLASS_WEAPON_TYPE: "",
		ITEM_CLASS_EQUIPMENT_TYPE: "",
		ITEM_QUANTITY_ATTRIBUTE: "",
		ITEM_PRICE_ATTRIBUTE: "",
		QUANTITY_FOR_PRICE_ATTRIBUTE: "flags.item-piles.system.quantityForPrice",
		ITEM_FILTERS: [],
		ITEM_SIMILARITIES: [],
		VAULT_STYLES: [],
		CSS_VARIABLES: [],
		UNSTACKABLE_ITEM_TYPES: [],
		CURRENCIES: [],
		SECONDARY_CURRENCIES: [],
		PILE_DEFAULTS: {},
		TOKEN_FLAG_DEFAULTS: {},
		CURRENCY_DECIMAL_DIGITS: 0.00001,
		SOFT_MIGRATIONS: {}
	},

	get HAS_SYSTEM_SUPPORT() {
		return !!this.SUPPORTED_SYSTEMS?.[game.system.id.toLowerCase()];
	},

	_currentSystem: false,

	get DATA() {

		if (this._currentSystem) return this._currentSystem;

		const system = this.SUPPORTED_SYSTEMS?.[game.system.id.toLowerCase()];
		if (!system) return this.DEFAULT_SETTINGS;

		if (system[game.system.version]) {
			this._currentSystem = foundry.utils.mergeObject(this.DEFAULT_SETTINGS, system[game.system.version]);
			return this._currentSystem;
		}

		const versions = Object.keys(system);
		if (versions.length === 1) {
			this._currentSystem = foundry.utils.mergeObject(this.DEFAULT_SETTINGS, system[versions[0]]);
			return this._currentSystem;
		}

		versions.sort((a, b) => {
			return a === "latest" || b === "latest" ? -Infinity : (isNewerVersion(b, a) ? -1 : 1);
		});
		const version = versions.find(version => {
			return version === "latest" || !isNewerVersion(game.system.version, version);
		});

		this._currentSystem = foundry.utils.mergeObject(this.DEFAULT_SETTINGS, system[version]);

		return this._currentSystem;
	},

	addSystem(data) {
		this.SUPPORTED_SYSTEMS[game.system.id.toLowerCase()] = { latest: data };
	}
};
