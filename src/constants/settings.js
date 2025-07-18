import { SYSTEMS } from "../systems.js";
import { refreshItemTypesThatCanStack } from "../helpers/utilities.js";
import { applySystemSpecificStyles } from "../settings.js";

const SETTINGS = {

	// Client settings
	OUTPUT_TO_CHAT: "outputToChat",
	INVERT_SHEET_OPEN: "invertSheetOpen",
	HIDE_ACTOR_HEADER_TEXT: "hideActorHeaderText",
	HIDE_ACTOR_HEADER_BUTTON: "hideActorHeaderButton",
	PRELOAD_FILES: "preloadFiles",
	DEBUG: "debug",
	DEBUG_HOOKS: "debugHooks",

	// Module Settings
	ENABLE_DROPPING_ITEMS: "enableDroppingItems",
	ENABLE_TRADING: "enableTrading",
	ENABLE_GIVING_ITEMS: "enableGivingItems",
	SHOW_TRADE_BUTTON: "showTradeButton",
	DELETE_EMPTY_PILES: "deleteEmptyPiles",
	INSPECT_ITEMS_IN_TRADE: "inspectItemsInTrade",
	POPULATION_TABLES_FOLDER: "populationTablesFolder",
	PRICE_PRESETS: "pricePresets",
	HIDE_TOKEN_BORDER: "hideTokenBorder",
	WELCOME_SHOWN: "welcome-shown",

	// Style settings
	CSS_VARIABLES: "cssVariables",
	VAULT_STYLES: "vaultStyles",

	// System Settings
	CURRENCIES: "currencies",
	SECONDARY_CURRENCIES: "secondaryCurrencies",
	CURRENCY_DECIMAL_DIGITS: "currencyDecimalDigits",
	ITEM_FILTERS: "itemFilters",
	ACTOR_CLASS_TYPE: "actorClassType",
	ITEM_CLASS_LOOT_TYPE: "itemClassLootType",
	ITEM_CLASS_WEAPON_TYPE: "itemClassWeaponType",
	ITEM_CLASS_EQUIPMENT_TYPE: "itemClassEquipmentType",
	ITEM_QUANTITY_ATTRIBUTE: "itemQuantityAttribute",
	ITEM_PRICE_ATTRIBUTE: "itemPriceAttribute",
	QUANTITY_FOR_PRICE_ATTRIBUTE: "quantityForPriceAttribute",
	ITEM_SIMILARITIES: "itemSimilarities",
	UNSTACKABLE_ITEM_TYPES: "unstackableItemTypes",
	PILE_DEFAULTS: "pileDefaults",
	TOKEN_FLAG_DEFAULTS: "tokenFlagDefaults",

	// Hidden settings
	DEFAULT_ITEM_PILE_ACTOR_ID: "defaultItemPileActorID",
	SYSTEM_FOUND: "systemFound",
	SYSTEM_NOT_FOUND_WARNING_SHOWN: "systemNotFoundWarningShown",
	SYSTEM_VERSION: "systemVersion",
	CUSTOM_ITEM_CATEGORIES: "customItemCategories",

	HIDE_TOKEN_BORDER_OPTIONS: {
		EVERYONE: "everyone",
		PLAYERS: "players",
		SHOW: "show"
	},

	DEFAULT_CSS_VARIABLES: {
		"inactive": "rgba(31,143,255,1)",
		"minor-inactive": "rgba(201,200,185,1)",
		"shadow-primary": "rgba(255,0,0,1)",
		"even-color": "rgba(240,240,223,1)",
		"odd-color": "rgba(0,0,0,0)",
		"border-dark-primary": "rgba(25,24,19,1)",
		"border-light-primary": "rgba(181,179,164,1)",
		"text-light-highlight": "rgba(240,240,224,1)",
		"text-important": "rgba(255,100,0,1)"
	},

	GET_DEFAULT() {
		return foundry.utils.deepClone(SETTINGS.DEFAULTS())
	},

	GET_SYSTEM_DEFAULTS() {
		return Object.fromEntries(Object.entries(SETTINGS.GET_DEFAULT()).filter(entry => {
			return entry[1].system;
		}));
	},

	DEFAULTS: () => ({

		[SETTINGS.WELCOME_SHOWN]: {
			scope: "world",
			config: false,
			default: false,
			type: Boolean,
		},

		[SETTINGS.CURRENCIES]: {
			name: "ITEM-PILES.Settings.Currencies.Title",
			label: "ITEM-PILES.Settings.Currencies.Label",
			hint: "ITEM-PILES.Settings.Currencies.Hint",
			icon: "fa fa-money-bill-alt",
			application: "currencies",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.CURRENCIES,
			type: Array
		},

		[SETTINGS.SECONDARY_CURRENCIES]: {
			name: "ITEM-PILES.Settings.SecondaryCurrencies.Title",
			label: "ITEM-PILES.Settings.SecondaryCurrencies.Label",
			hint: "ITEM-PILES.Settings.SecondaryCurrencies.Hint",
			icon: "fa fa-money-bill-alt",
			application: "secondary-currencies",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.SECONDARY_CURRENCIES,
			type: Array
		},

		[SETTINGS.CURRENCY_DECIMAL_DIGITS]: {
			name: "ITEM-PILES.Settings.CurrencyDecimalDigits.Title",
			hint: "ITEM-PILES.Settings.CurrencyDecimalDigits.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.CURRENCY_DECIMAL_DIGITS,
			step: 0.00001,
			min: 0,
			max: 1,
			type: Number
		},

		[SETTINGS.ITEM_FILTERS]: {
			name: "ITEM-PILES.Settings.ItemFilters.Title",
			label: "ITEM-PILES.Settings.ItemFilters.Label",
			hint: "ITEM-PILES.Settings.ItemFilters.Hint",
			icon: "fa fa-filter",
			application: "item-filters",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ITEM_FILTERS,
			type: Array
		},

		[SETTINGS.ITEM_SIMILARITIES]: {
			name: "ITEM-PILES.Settings.ItemSimilarities.Title",
			label: "ITEM-PILES.Settings.ItemSimilarities.Label",
			hint: "ITEM-PILES.Settings.ItemSimilarities.Hint",
			icon: "fa fa-equals",
			application: "item-similarities",
			applicationOptions: {
				title: "ITEM-PILES.Applications.SimilaritiesEditor.Title",
				content: "ITEM-PILES.Applications.SimilaritiesEditor.Explanation",
				column: "ITEM-PILES.Applications.SimilaritiesEditor.Path",
			},
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ITEM_SIMILARITIES,
			type: Array
		},

		[SETTINGS.UNSTACKABLE_ITEM_TYPES]: {
			name: "ITEM-PILES.Settings.UnstackableItemTypes.Title",
			label: "ITEM-PILES.Settings.UnstackableItemTypes.Label",
			hint: "ITEM-PILES.Settings.UnstackableItemTypes.Hint",
			icon: "fa fa-equals",
			application: "unstackable-item-types",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.UNSTACKABLE_ITEM_TYPES,
			onChange: () => {
				refreshItemTypesThatCanStack();
			},
			type: Array
		},

		[SETTINGS.CSS_VARIABLES]: {
			name: "ITEM-PILES.Settings.CssVariables.Title",
			label: "ITEM-PILES.Settings.CssVariables.Label",
			hint: "ITEM-PILES.Settings.CssVariables.Hint",
			icon: "fa-solid fa-wand-magic-sparkles",
			application: "styles",
			applicationOptions: {
				readOnly: true,
				variables: true
			},
			scope: "world",
			config: false,
			default: SYSTEMS.DATA.CSS_VARIABLES,
			mergedDefaults: SETTINGS.DEFAULT_CSS_VARIABLES,
			onchange: (data) => {
				applySystemSpecificStyles(data);
			},
			type: Object
		},

		[SETTINGS.VAULT_STYLES]: {
			name: "ITEM-PILES.Settings.VaultStyles.Title",
			label: "ITEM-PILES.Settings.VaultStyles.Label",
			hint: "ITEM-PILES.Settings.VaultStyles.Hint",
			icon: "fa-solid fa-wand-magic-sparkles",
			application: "vault-styles",
			scope: "world",
			config: false,
			default: SYSTEMS.DATA.VAULT_STYLES,
			type: Array
		},

		[SETTINGS.ACTOR_CLASS_TYPE]: {
			name: "ITEM-PILES.Settings.ActorClass.Title",
			hint: "ITEM-PILES.Settings.ActorClass.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ACTOR_CLASS_TYPE,
			type: String
		},

		[SETTINGS.ITEM_CLASS_LOOT_TYPE]: {
			name: "ITEM-PILES.Settings.ItemLootClass.Title",
			hint: "ITEM-PILES.Settings.ItemLootClass.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ITEM_CLASS_LOOT_TYPE,
			type: String
		},

		[SETTINGS.ITEM_CLASS_WEAPON_TYPE]: {
			name: "ITEM-PILES.Settings.ItemWeaponClass.Title",
			hint: "ITEM-PILES.Settings.ItemWeaponClass.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ITEM_CLASS_WEAPON_TYPE,
			type: String
		},

		[SETTINGS.ITEM_CLASS_EQUIPMENT_TYPE]: {
			name: "ITEM-PILES.Settings.ItemEquipmentClass.Title",
			hint: "ITEM-PILES.Settings.ItemEquipmentClass.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ITEM_CLASS_EQUIPMENT_TYPE,
			type: String
		},

		[SETTINGS.ITEM_QUANTITY_ATTRIBUTE]: {
			name: "ITEM-PILES.Settings.Quantity.Title",
			hint: "ITEM-PILES.Settings.Quantity.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ITEM_QUANTITY_ATTRIBUTE,
			type: String
		},

		[SETTINGS.ITEM_PRICE_ATTRIBUTE]: {
			name: "ITEM-PILES.Settings.Price.Title",
			hint: "ITEM-PILES.Settings.Price.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.ITEM_PRICE_ATTRIBUTE,
			type: String
		},

		[SETTINGS.QUANTITY_FOR_PRICE_ATTRIBUTE]: {
			name: "ITEM-PILES.Settings.QuantityForPrice.Title",
			hint: "ITEM-PILES.Settings.QuantityForPrice.Hint",
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.QUANTITY_FOR_PRICE_ATTRIBUTE,
			type: String
		},

		[SETTINGS.PILE_DEFAULTS]: {
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.PILE_DEFAULTS,
			type: Object
		},

		[SETTINGS.TOKEN_FLAG_DEFAULTS]: {
			scope: "world",
			config: false,
			system: true,
			default: SYSTEMS.DATA.TOKEN_FLAG_DEFAULTS,
			type: Object
		},

		[SETTINGS.CUSTOM_ITEM_CATEGORIES]: {
			name: "ITEM-PILES.Settings.CustomItemCategories.Title",
			label: "ITEM-PILES.Settings.CustomItemCategories.Label",
			hint: "ITEM-PILES.Settings.CustomItemCategories.Hint",
			application: "item-categories",
			applicationOptions: {
				title: "ITEM-PILES.Applications.CustomItemCategoriesEditor.Title",
				content: "ITEM-PILES.Applications.CustomItemCategoriesEditor.Explanation",
				column: "ITEM-PILES.Applications.CustomItemCategoriesEditor.Category",
			},
			scope: "world",
			config: false,
			default: [],
			type: Array
		},

		[SETTINGS.SYSTEM_VERSION]: {
			scope: "world",
			config: false,
			default: "0.0.0",
			type: String
		},

		[SETTINGS.DEFAULT_ITEM_PILE_ACTOR_ID]: {
			scope: "world",
			config: false,
			default: "",
			type: String
		},

		[SETTINGS.SYSTEM_FOUND]: {
			scope: "world",
			config: false,
			default: false,
			type: Boolean
		},

		[SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN]: {
			scope: "world",
			config: false,
			default: false,
			type: Boolean
		},

		[SETTINGS.OUTPUT_TO_CHAT]: {
			name: "ITEM-PILES.Settings.OutputToChat.Title",
			hint: "ITEM-PILES.Settings.OutputToChat.Hint",
			scope: "world",
			config: false,
			default: 1,
			choices: [
				"ITEM-PILES.Settings.OutputToChat.Off",
				"ITEM-PILES.Settings.OutputToChat.Public",
				"ITEM-PILES.Settings.OutputToChat.SelfGM",
				"ITEM-PILES.Settings.OutputToChat.Blind",
			],
			type: Number
		},

		[SETTINGS.INSPECT_ITEMS_IN_TRADE]: {
			name: "ITEM-PILES.Settings.InspectItemsTrade.Title",
			hint: "ITEM-PILES.Settings.InspectItemsTrade.Hint",
			scope: "world",
			config: false,
			default: true,
			type: Boolean
		},

		[SETTINGS.POPULATION_TABLES_FOLDER]: {
			name: "ITEM-PILES.Settings.PopulationTablesFolder.Title",
			hint: "ITEM-PILES.Settings.PopulationTablesFolder.Hint",
			scope: "world",
			config: false,
			default: "root",
			type: String
		},

		[SETTINGS.DELETE_EMPTY_PILES]: {
			name: "ITEM-PILES.Settings.DeleteEmptyPiles.Title",
			hint: "ITEM-PILES.Settings.DeleteEmptyPiles.Hint",
			scope: "world",
			config: false,
			default: false,
			type: Boolean
		},

		[SETTINGS.ENABLE_DROPPING_ITEMS]: {
			name: "ITEM-PILES.Settings.EnableDroppingItems.Title",
			hint: "ITEM-PILES.Settings.EnableDroppingItems.Hint",
			scope: "world",
			config: false,
			default: true,
			type: Boolean
		},

		[SETTINGS.ENABLE_TRADING]: {
			name: "ITEM-PILES.Settings.EnableTrading.Title",
			hint: "ITEM-PILES.Settings.EnableTrading.Hint",
			scope: "world",
			config: false,
			default: true,
			type: Boolean
		},

		[SETTINGS.ENABLE_GIVING_ITEMS]: {
			name: "ITEM-PILES.Settings.EnableGivingItems.Title",
			hint: "ITEM-PILES.Settings.EnableGivingItems.Hint",
			scope: "world",
			config: false,
			default: true,
			type: Boolean
		},

		[SETTINGS.SHOW_TRADE_BUTTON]: {
			name: "ITEM-PILES.Settings.ShowTradeButton.Title",
			hint: "ITEM-PILES.Settings.ShowTradeButton.Hint",
			scope: "world",
			config: false,
			default: true,
			type: Boolean
		},

		[SETTINGS.PRICE_PRESETS]: {
			name: "ITEM-PILES.Settings.PricePresets.Title",
			label: "ITEM-PILES.Settings.PricePresets.Label",
			hint: "ITEM-PILES.Settings.PricePresets.Hint",
			scope: "world",
			icon: "fa fa-tags",
			application: "price-presets",
			config: false,
			default: [],
			type: Array
		},

		[SETTINGS.HIDE_TOKEN_BORDER]: {
			name: "ITEM-PILES.Settings.HideTokenBorder.Title",
			label: "ITEM-PILES.Settings.HideTokenBorder.Label",
			hint: "ITEM-PILES.Settings.HideTokenBorder.Hint",
			scope: "world",
			config: false,
			default: SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.EVERYONE,
			choices: {
				[SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.EVERYONE]: "ITEM-PILES.Settings.HideTokenBorder.HideEveryone",
				[SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.PLAYERS]: "ITEM-PILES.Settings.HideTokenBorder.HidePlayers",
				[SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.SHOW]: "ITEM-PILES.Settings.HideTokenBorder.Show"
			},
			type: String
		},

		[SETTINGS.INVERT_SHEET_OPEN]: {
			name: "ITEM-PILES.Settings.InvertSheetOpen.Title",
			hint: "ITEM-PILES.Settings.InvertSheetOpen.Hint",
			scope: "client",
			config: false,
			default: false,
			type: Boolean
		},

		[SETTINGS.HIDE_ACTOR_HEADER_TEXT]: {
			name: "ITEM-PILES.Settings.HideHeaderButtonText.Title",
			hint: "ITEM-PILES.Settings.HideHeaderButtonText.Hint",
			scope: "client",
			config: false,
			default: false,
			type: Boolean
		},

		[SETTINGS.HIDE_ACTOR_HEADER_BUTTON]: {
			name: "ITEM-PILES.Settings.HideHeaderButton.Title",
			hint: "ITEM-PILES.Settings.HideHeaderButton.Hint",
			scope: "client",
			config: false,
			default: false,
			type: Boolean
		},

		[SETTINGS.PRELOAD_FILES]: {
			name: "ITEM-PILES.Settings.PreloadFiles.Title",
			hint: "ITEM-PILES.Settings.PreloadFiles.Hint",
			scope: "client",
			config: false,
			default: true,
			type: Boolean
		},

		[SETTINGS.DEBUG]: {
			name: "ITEM-PILES.Settings.Debug.Title",
			hint: "ITEM-PILES.Settings.Debug.Hint",
			scope: "client",
			config: false,
			default: false,
			type: Boolean
		},


		[SETTINGS.DEBUG_HOOKS]: {
			name: "ITEM-PILES.Settings.DebugHooks.Title",
			hint: "ITEM-PILES.Settings.DebugHooks.Hint",
			scope: "client",
			config: false,
			default: false,
			type: Boolean
		},

	})
}

export default SETTINGS;
