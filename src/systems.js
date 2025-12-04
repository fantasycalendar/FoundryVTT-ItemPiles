export const SYSTEMS = {

	SUPPORTED_SYSTEMS: {},

	DEFAULT_SETTINGS: {
		VERSION: "",
		ACTOR_CLASS_TYPE: "",
		ITEM_CLASS_LOOT_TYPE: "",
		ITEM_CLASS_WEAPON_TYPE: "",
		ITEM_CLASS_EQUIPMENT_TYPE: "",
		ITEM_QUANTITY_ATTRIBUTE: "",
		ITEM_PRICE_ATTRIBUTE: "",
		QUANTITY_FOR_PRICE_ATTRIBUTE: "flags.item-piles.system.quantityForPrice",
		ITEM_FILTERS: [],
		ITEM_SIMILARITIES: ["name", "type"],
		UNSTACKABLE_ITEM_TYPES: [],
		PILE_DEFAULTS: {},
		TOKEN_FLAG_DEFAULTS: {},
		ITEM_TRANSFORMER: null,
		PREVIEW_ITEM_TRANSFORMER: null,
		PRICE_MODIFIER_TRANSFORMER: null,
		ITEM_COST_TRANSFORMER: null,
		SYSTEM_HOOKS: null,
		SHEET_OVERRIDES: null,
		CURRENCIES: [],
		SECONDARY_CURRENCIES: [],
		CURRENCY_DECIMAL_DIGITS: 0.00001,
		VAULT_STYLES: [],
		CSS_VARIABLES: [],
		SOFT_MIGRATIONS: {},
		ITEM_TYPE_HANDLERS: {},
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
			return a === "latest" || b === "latest" ? -Infinity : (foundry.utils.isNewerVersion(b, a) ? -1 : 1);
		});
		const version = versions.find(version => {
			return version === "latest" || !foundry.utils.isNewerVersion(game.system.version, version);
		});

		this._currentSystem = foundry.utils.mergeObject(this.DEFAULT_SETTINGS, system[version]);

		return this._currentSystem;
	},

	addSystem(data, version = "latest") {
		this.SUPPORTED_SYSTEMS[game.system.id.toLowerCase()] = { [version]: data };
	}
};
