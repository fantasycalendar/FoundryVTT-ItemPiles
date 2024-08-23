/** @module item_piles_constants */
const module_name = "item-piles";
const module_path = `modules/${module_name}/`;
const baseFlag = `flags.${module_name}`

const CONSTANTS = {

	MODULE_NAME: module_name,
	PATH: module_path,
	IS_V12: false,

	ACTOR_DELTA_PROPERTY: "delta",

	FLAGS: {
		VERSION: `${baseFlag}.version`,
		PILE: `${baseFlag}.data`,
		ITEM: `${baseFlag}.item`,
		NO_VERSION: `${baseFlag}.-=version`,
		NO_PILE: `${baseFlag}.-=data`,
		NO_ITEM: `${baseFlag}.-=item`,
		LOG: `${baseFlag}.log`,
		SHARING: `${baseFlag}.sharing`,
		PUBLIC_TRADE_ID: `${baseFlag}.publicTradeId`,
		TRADE_USERS: `${baseFlag}.tradeUsers`,
		TEMPORARY_ITEM: `${baseFlag}.temporary_item`,
		CUSTOM_CATEGORY: `${baseFlag}.item.customCategory`
	},

	SIMPLE_FLAGS: {
		VERSION: `${module_name}.version`,
		PILE: `${module_name}.data`,
		ITEM: `${module_name}.item`,
		NO_VERSION: `${module_name}.-=version`,
		NO_PILE: `${module_name}.-=data`,
		NO_ITEM: `${module_name}.-=item`,
		LOG: `${module_name}.log`,
		SHARING: `${module_name}.sharing`,
		PUBLIC_TRADE_ID: `${module_name}.publicTradeId`,
		TRADE_USERS: `${module_name}.tradeUsers`,
		TEMPORARY_ITEM: `${module_name}.temporary_item`,
		CUSTOM_CATEGORY: `${module_name}.item.customCategory`
	},

	ITEM_TYPE_METHODS: {
		HAS_CURRENCY: "hasCurrency",
		CONTENTS: "contents",
		TRANSFER: "transfer",
		IS_CONTAINED: "isContained",
	},

	ITEM_DEFAULTS: {
		// Merchants
		hidden: false,
		notForSale: false,
		infiniteQuantity: "default",
		displayQuantity: "default",
		free: false,
		keepZeroQuantity: false,
		disableNormalCost: false,
		cantBeSoldToMerchants: false,
		isService: false,
		keepOnMerchant: false,
		macro: "",
		customCategory: "",
		prices: [],
		buyPriceModifier: 1,
		sellPriceModifier: 1,

		// Vaults
		vaultExpander: false,
		vaultSlot: null,
		addsCols: 0,
		addsRows: 0,
		x: null,
		y: null,
		width: 1,
		height: 1,
		flipped: false,
		vaultImage: "",
		vaultImageFlipped: "",
		canStack: "default"
	},

	PILE_TYPES: {
		PILE: "pile",
		CONTAINER: "container",
		MERCHANT: "merchant",
		VAULT: "vault",
		AUCTIONEER: "auctioneer",
		BANKER: "banker"
	},

	VAULT_LOGGING_TYPES: {
		USER_ACTOR: "user_actor",
		USER: "user",
		ACTOR: "actor",
	},

	MACRO_EXECUTION_TYPES: {
		TRADE_ITEMS: "tradeItems",
		ADD_ITEMS: "addItems",
		REMOVE_ITEMS: "removeItems",
		TRANSFER_ITEMS: "transferItems",
		TRANSFER_ALL_ITEMS: "transferAllItems",
		UPDATE_CURRENCIES: "updateCurrencies",
		ADD_CURRENCIES: "addCurrencies",
		REMOVE_CURRENCIES: "removeCurrencies",
		TRANSFER_CURRENCIES: "transferCurrencies",
		TRANSFER_ALL_CURRENCIES: "transferAllCurrencies",
		SET_ATTRIBUTES: "setAttributes",
		ADD_ATTRIBUTES: "addAttributes",
		REMOVE_ATTRIBUTES: "removeAttributes",
		TRANSFER_ATTRIBUTES: "transferAttributes",
		TRANSFER_ALL_ATTRIBUTES: "transferAllAttributes",
		TRANSFER_EVERYTHING: "transferEverything",
		CLOSE_ITEM_PILE: "closeItemPile",
		LOCK_ITEM_PILE: "lockItemPile",
		UNLOCK_ITEM_PILE: "unlockItemPile",
		OPEN_ITEM_PILE: "openItemPile",
		SPLIT_INVENTORY: "splitInventory",
		RENDER_INTERFACE: "renderInterface"
	},

	CUSTOM_PILE_TYPES: {},

	PILE_DEFAULTS: {
		// Core settings
		enabled: false,
		type: "pile",
		distance: 1,
		macro: "",
		deleteWhenEmpty: "default",
		canStackItems: "yes",
		canInspectItems: true,
		displayItemTypes: false,
		description: "",

		// Overrides
		overrideItemFilters: false,
		overrideCurrencies: false,
		overrideSecondaryCurrencies: false,
		requiredItemProperties: [],

		// Token settings
		displayOne: false,
		showItemName: false,
		overrideSingleItemScale: false,
		singleItemScale: 1.0,

		// Sharing settings
		shareItemsEnabled: false,
		shareCurrenciesEnabled: true,
		takeAllEnabled: false,
		splitAllEnabled: true,
		activePlayers: false,

		// Container settings
		closed: false,
		locked: false,
		closedImage: "",
		closedImages: [],
		emptyImage: "",
		emptyImages: [],
		openedImage: "",
		openedImages: [],
		lockedImage: "",
		lockedImages: [],
		closeSound: "",
		closeSounds: [],
		openSound: "",
		openSounds: [],
		lockedSound: "",
		lockedSounds: [],
		unlockedSound: "",
		unlockedSounds: [],

		// Merchant settings
		merchantImage: "",
		infiniteQuantity: false,
		infiniteCurrencies: true,
		purchaseOnly: false,
		hideNewItems: false,
		hideItemsWithZeroCost: false,
		keepZeroQuantity: false,
		onlyAcceptBasePrice: true,
		displayQuantity: "yes",
		buyPriceModifier: 1,
		sellPriceModifier: 0.5,
		itemTypePriceModifiers: [],
		actorPriceModifiers: [],
		tablesForPopulate: [],
		merchantColumns: [],
		hideTokenWhenClosed: false,
		openTimes: {
			enabled: false,
			status: "open",
			/*
			auto = rely on simple calendar
			open = always open
			closed = always closed
			 */
			open: {
				hour: 9,
				minute: 0
			},
			close: {
				hour: 18,
				minute: 0
			},
		},
		closedDays: [],
		closedHolidays: [],
		refreshItemsOnOpen: false,
		refreshItemsDays: [],
		refreshItemsHolidays: [],
		logMerchantActivity: false,

		// Vault settings
		cols: 10,
		rows: 5,
		restrictVaultAccess: false,
		vaultExpansion: false,
		baseExpansionCols: 0,
		baseExpansionRows: 0,
		vaultAccess: [],
		logVaultActions: false,
		vaultLogType: "user_actor"
	}
}

CONSTANTS.DEFAULT_PILE_TYPES = [
	CONSTANTS.PILE_TYPES.PILE,
	CONSTANTS.PILE_TYPES.CONTAINER,
	CONSTANTS.PILE_TYPES.MERCHANT,
	CONSTANTS.PILE_TYPES.VAULT
]

CONSTANTS.ITEM_FORCED_UNIQUE_KEYS = ["vaultExpander"]
	.map(val => CONSTANTS.FLAGS.ITEM + "." + val);

const prefix = (string) => (strings, ...expressions) => `${string}-${strings.reduce((a, c, i) => a + expressions[i - 1] + c)}`
const module = prefix(CONSTANTS.MODULE_NAME);

CONSTANTS.HOOKS = {
	READY: module`ready`,
	RESET_SETTINGS: module`resetSettings`,
	DRAG_DOCUMENT: module`onDragDocument`,
	DROP_DOCUMENT: module`onDropDocument`,
	PRE_TRANSFER_EVERYTHING: module`preTransferEverything`,
	TRANSFER_EVERYTHING: module`transferEverything`,
	PRE_RENDER_SHEET: module`preRenderActorSheet`,
	PRE_RENDER_INTERFACE: module`preRenderInterface`,
	PRE_OPEN_INTERFACE: module`preOpenInterface`,
	OPEN_INTERFACE: module`openInterface`,
	PRE_CLOSE_INTERFACE: module`preCloseInterface`,
	CLOSE_INTERFACE: module`closeInterface`,
	RENDER_VAULT_GRID_ITEM: module`renderVaultGridItem`,
	PILE: {
		PRE_CREATE: module`preCreateItemPile`,
		CREATE: module`createItemPile`,
		PRE_UPDATE: module`preUpdateItemPile`,
		UPDATE: module`updateItemPile`,
		PRE_DELETE: module`preDeleteItemPile`,
		DELETE: module`deleteItemPile`,
		PRE_CLOSE: module`preCloseItemPile`,
		CLOSE: module`closeItemPile`,
		PRE_OPEN: module`preOpenItemPile`,
		OPEN: module`openItemPile`,
		PRE_LOCK: module`preLockItemPile`,
		LOCK: module`lockItemPile`,
		PRE_UNLOCK: module`preUnlockItemPile`,
		UNLOCK: module`unlockItemPile`,
		PRE_RATTLE: module`preRattleItemPile`,
		RATTLE: module`rattleItemPile`,
		PRE_TURN_INTO: module`preTurnIntoItemPiles`,
		TURN_INTO: module`turnIntoItemPiles`,
		PRE_REVERT_FROM: module`preRevertFromItemPiles`,
		REVERT_FROM: module`revertFromItemPiles`,
		PRE_SPLIT_INVENTORY: module`preSplitItemPileContent`,
		SPLIT_INVENTORY: module`splitItemPileContent`,
		PRE_CLICK: module`preClickItemPile`,
		PRE_DIRECTORY_CLICK: module`preClickDirectoryItemPile`,
		PRE_RIGHT_CLICK_ITEM: module`preRightClickItem`,
		PRE_REFRESH_INVENTORY: module`preRefreshInventory`
	},
	ITEM: {
		PRE_DROP_DETERMINED: module`preDropItemDetermined`,
		PRE_DROP: module`preDropItem`,
		DROP: module`dropItem`,
		PRE_TRANSFER: module`preTransferItems`,
		TRANSFER: module`transferItems`,
		PRE_ADD: module`preAddItems`,
		ADD: module`addItems`,
		PRE_REMOVE: module`preRemoveItems`,
		REMOVE: module`removeItems`,
		PRE_TRANSFER_ALL: module`preTransferAllItems`,
		TRANSFER_ALL: module`transferAllItems`,
		PRE_CALC_TRADE: module`preCalculateTradeItems`,
		PRE_TRADE: module`preTradeItems`,
		TRADE: module`tradeItems`,
		PRE_GIVE: module`preGiveItem`,
		GIVE: module`giveItem`,
	},
	CURRENCY: {
		PRE_TRANSFER: module`preTransferCurrencies`,
		TRANSFER: module`transferCurrencies`,
		PRE_UPDATE: module`preUpdateCurrencies`,
		UPDATE: module`updateCurrencies`,
		PRE_ADD: module`preAddCurrencies`,
		ADD: module`addCurrencies`,
		PRE_REMOVE: module`preRemoveCurrencies`,
		REMOVE: module`removeCurrencies`,
		PRE_TRANSFER_ALL: module`preTransferAllCurrencies`,
		TRANSFER_ALL: module`transferAllCurrencies`,
	},
	ATTRIBUTE: {
		PRE_TRANSFER: module`preTransferAttributes`,
		TRANSFER: module`transferAttributes`,
		PRE_SET: module`preSetAttributes`,
		SET: module`setAttributes`,
		PRE_ADD: module`preAddAttributes`,
		ADD: module`addAttributes`,
		PRE_REMOVE: module`preRemoveAttributes`,
		REMOVE: module`removeAttributes`,
		PRE_TRANSFER_ALL: module`preTransferAllAttributes`,
		TRANSFER_ALL: module`transferAllAttributes`,
	},
	TRADE: {
		STARTED: module`tradeStarted`,
		COMPLETE: module`tradeComplete`
	}
}

export default CONSTANTS;
