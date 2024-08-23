import CONSTANTS from "./constants/constants.js";
import * as Helpers from "./helpers/helpers.js";
import { debug } from "./helpers/helpers.js";
import { stringIsUuid } from "./helpers/utilities.js";
import PrivateAPI from "./API/private-api.js";
import TradeAPI from "./API/trade-api.js";
import ChatAPI from "./API/chat-api.js";

export default class ItemPileSocket {

	static ready = false;

	static HANDLERS = {
		/**
		 * Generic sockets
		 */
		CALL_HOOK: "callHook",
		TOGGLE_HOOKS: "toggleHooks",

		/**
		 * Chat messages
		 */
		PICKUP_CHAT_MESSAGE: "pickupChatMessage",
		SPLIT_CHAT_MESSAGE: "splitChatMessage",
		MERCHANT_TRADE_CHAT_MESSAGE: "merchantTradeChatMessage",
		DISABLE_CHAT_TRADE_BUTTON: "disableChatTradeButton",

		/**
		 * Item pile sockets
		 */
		CREATE_PILE: "createItemPile",
		UPDATE_PILE: "updateItemPile",
		UPDATED_PILE: "updatedPile",
		DELETE_PILE: "deleteItemPile",
		TURN_INTO_PILE: "turnIntoPiles",
		REVERT_FROM_PILE: "revertFromPiles",
		REFRESH_PILE: "refreshItemPile",
		SPLIT_PILE: "splitItemPileContent",

		/**
		 * UI sockets
		 */
		RENDER_INTERFACE: "renderItemPileApplication",
		UNRENDER_INTERFACE: "unrenderItemPileApplication",
		RERENDER_TOKEN_HUD: "rerenderTokenHud",
		USER_OPENED_INTERFACE: "userOpenedInterface",
		USER_CLOSED_INTERFACE: "userClosedInterface",

		/**
		 * Item & attribute sockets
		 */
		GIVE_ITEMS: "giveItems",
		GIVE_ITEMS_RESPONSE: "giveItemsResponse",
		DROP_ITEMS: "dropItems",
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
		COMMIT_DOCUMENT_CHANGES: "commitActorChanges",
		ROLL_ITEM_TABLE: "rollItemTable",
		REFRESH_MERCHANT_INVENTORY: "refreshMerchantInventory",

		/**
		 * Trading sockets
		 */
		TRADE_REQUEST_PROMPT: "tradePrompt",
		TRADE_REQUEST_CANCELLED: "tradeCancelled",
		REQUEST_TRADE_DATA: "requestTradeData",
		TRADE_CLOSED: "publicTradeClosed",
		PUBLIC_TRADE_UPDATE_ITEMS: "publicTradeUpdateItems",
		PUBLIC_TRADE_UPDATE_ITEM_CURRENCIES: "publicTradeUpdateItemCurrencies",
		PUBLIC_TRADE_UPDATE_CURRENCIES: "publicTradeUpdateCurrencies",
		PUBLIC_TRADE_STATE: "publicTradeAcceptedState",
		PRIVATE_TRADE_UPDATE_ITEMS: "privateTradeUpdateItems",
		PRIVATE_TRADE_UPDATE_ITEM_CURRENCIES: "privateTradeUpdateItemCurrencies",
		PRIVATE_TRADE_UPDATE_CURRENCIES: "privateTradeUpdateCurrencies",
		PRIVATE_TRADE_STATE: "privateTradeAcceptedState",
		EXECUTE_TRADE: "executeTrade",
		TRADE_COMPLETED: "tradeCompleted",

		/**
		 * Merchant sockets
		 */
		TRADE_ITEMS: "tradeItems"
	}

	static BINDINGS = {
		[this.HANDLERS.CALL_HOOK]: (hook, response, ...args) => callHook(hook, response, ...args),

		[this.HANDLERS.TOGGLE_HOOKS]: (toggle) => {
			Helpers.hooks.run = toggle;
		},

		[this.HANDLERS.DROP_ITEMS]: (args) => PrivateAPI._dropItems(args),
		[this.HANDLERS.GIVE_ITEMS]: (...args) => PrivateAPI._giveItems(...args),
		[this.HANDLERS.GIVE_ITEMS_RESPONSE]: (...args) => PrivateAPI._giveItemsResponse(...args),
		[this.HANDLERS.ADD_ITEMS]: (...args) => PrivateAPI._addItems(...args),
		[this.HANDLERS.REMOVE_ITEMS]: (...args) => PrivateAPI._removeItems(...args),
		[this.HANDLERS.TRANSFER_ITEMS]: (...args) => PrivateAPI._transferItems(...args),
		[this.HANDLERS.TRANSFER_ALL_ITEMS]: (...args) => PrivateAPI._transferAllItems(...args),
		[this.HANDLERS.UPDATE_CURRENCIES]: (...args) => PrivateAPI._updateCurrencies(...args),
		[this.HANDLERS.ADD_CURRENCIES]: (...args) => PrivateAPI._addCurrencies(...args),
		[this.HANDLERS.REMOVE_CURRENCIES]: (...args) => PrivateAPI._removeCurrencies(...args),
		[this.HANDLERS.TRANSFER_CURRENCIES]: (...args) => PrivateAPI._transferCurrencies(...args),
		[this.HANDLERS.TRANSFER_ALL_CURRENCIES]: (...args) => PrivateAPI._transferAllCurrencies(...args),
		[this.HANDLERS.SET_ATTRIBUTES]: (...args) => PrivateAPI._setAttributes(...args),
		[this.HANDLERS.ADD_ATTRIBUTES]: (...args) => PrivateAPI._addAttributes(...args),
		[this.HANDLERS.REMOVE_ATTRIBUTES]: (...args) => PrivateAPI._removeAttributes(...args),
		[this.HANDLERS.TRANSFER_ATTRIBUTES]: (...args) => PrivateAPI._transferAttributes(...args),
		[this.HANDLERS.TRANSFER_ALL_ATTRIBUTES]: (...args) => PrivateAPI._transferAllAttributes(...args),
		[this.HANDLERS.TRANSFER_EVERYTHING]: (...args) => PrivateAPI._transferEverything(...args),
		[this.HANDLERS.COMMIT_DOCUMENT_CHANGES]: (...args) => PrivateAPI._commitDocumentChanges(...args),
		[this.HANDLERS.ROLL_ITEM_TABLE]: (...args) => PrivateAPI._rollItemTable(...args),
		[this.HANDLERS.REFRESH_MERCHANT_INVENTORY]: (...args) => PrivateAPI._refreshMerchantInventory(...args),

		[this.HANDLERS.CREATE_PILE]: (...args) => PrivateAPI._createItemPile(...args),
		[this.HANDLERS.UPDATE_PILE]: (...args) => PrivateAPI._updateItemPile(...args),
		[this.HANDLERS.UPDATED_PILE]: (...args) => PrivateAPI._updatedItemPile(...args),
		[this.HANDLERS.DELETE_PILE]: (...args) => PrivateAPI._deleteItemPile(...args),
		[this.HANDLERS.TURN_INTO_PILE]: (...args) => PrivateAPI._turnTokensIntoItemPiles(...args),
		[this.HANDLERS.REVERT_FROM_PILE]: (...args) => PrivateAPI._revertTokensFromItemPiles(...args),
		[this.HANDLERS.SPLIT_PILE]: (...args) => PrivateAPI._splitItemPileContents(...args),

		[this.HANDLERS.TRADE_REQUEST_PROMPT]: (...args) => TradeAPI._respondPrompt(...args),
		[this.HANDLERS.TRADE_REQUEST_CANCELLED]: (...args) => TradeAPI._tradeCancelled(...args),
		[this.HANDLERS.EXECUTE_TRADE]: (...args) => TradeAPI._executeTrade(...args),
		[this.HANDLERS.TRADE_COMPLETED]: (...args) => TradeAPI._tradeCompleted(...args),
		[this.HANDLERS.REQUEST_TRADE_DATA]: (...args) => TradeAPI._respondActiveTradeData(...args),
		[this.HANDLERS.TRADE_CLOSED]: (...args) => TradeAPI._tradeClosed(...args),

		[this.HANDLERS.PUBLIC_TRADE_UPDATE_ITEMS]: (...args) => TradeAPI._updateItems(...args),
		[this.HANDLERS.PUBLIC_TRADE_UPDATE_ITEM_CURRENCIES]: (...args) => TradeAPI._updateItemCurrencies(...args),
		[this.HANDLERS.PUBLIC_TRADE_UPDATE_CURRENCIES]: (...args) => TradeAPI._updateCurrencies(...args),
		[this.HANDLERS.PUBLIC_TRADE_STATE]: (...args) => TradeAPI._updateAcceptedState(...args),

		[this.HANDLERS.PRIVATE_TRADE_UPDATE_ITEMS]: (...args) => TradeAPI._updateItems(...args),
		[this.HANDLERS.PRIVATE_TRADE_UPDATE_ITEM_CURRENCIES]: (...args) => TradeAPI._updateItemCurrencies(...args),
		[this.HANDLERS.PRIVATE_TRADE_UPDATE_CURRENCIES]: (...args) => TradeAPI._updateCurrencies(...args),
		[this.HANDLERS.PRIVATE_TRADE_STATE]: (...args) => TradeAPI._updateAcceptedState(...args),

		[this.HANDLERS.PICKUP_CHAT_MESSAGE]: (...args) => ChatAPI._outputPickupToChat(...args),
		[this.HANDLERS.SPLIT_CHAT_MESSAGE]: (...args) => ChatAPI._outputSplitToChat(...args),
		[this.HANDLERS.MERCHANT_TRADE_CHAT_MESSAGE]: (...args) => ChatAPI._outputMerchantTradeToChat(...args),
		[this.HANDLERS.DISABLE_CHAT_TRADE_BUTTON]: (...args) => ChatAPI._disableTradingButton(...args),

		[this.HANDLERS.RENDER_INTERFACE]: (...args) => PrivateAPI._renderItemPileInterface(...args),
		[this.HANDLERS.UNRENDER_INTERFACE]: (...args) => PrivateAPI._unrenderItemPileInterface(...args),
		[this.HANDLERS.RERENDER_TOKEN_HUD]: (...args) => PrivateAPI._updateTokenHud(...args),
		[this.HANDLERS.USER_OPENED_INTERFACE]: (...args) => InterfaceTracker.userOpened(...args),
		[this.HANDLERS.USER_CLOSED_INTERFACE]: (...args) => InterfaceTracker.userClosed(...args),

		[this.HANDLERS.TRADE_ITEMS]: (...args) => PrivateAPI._tradeItems(...args),

	}

	static socket;

	static initialize() {
		InterfaceTracker.initialize();
		this.socket = socketlib.registerModule(CONSTANTS.MODULE_NAME);
		for (let [key, callback] of Object.entries(this.BINDINGS)) {
			this.socket.register(key, callback);
			debug(`Registered itemPileSocket: ${key}`);
		}
		debug("Registered all Item Piles sockets")
		this.ready = true;
	}

	static executeAsGM(handler, ...args) {
		if (!Helpers.isGMConnected()) {
			Helpers.custom_warning(game.i18n.format("ITEM-PILES.Warnings.NoGMsConnectedAction", { action: handler }), true);
			return false;
		}
		return Requests.timedSocketRequest(handler, async () => this.socket.executeAsGM(handler, ...args));
	}

	static executeAsUser(handler, userId, ...args) {
		return this.socket.executeAsUser(handler, userId, ...args);
	}

	static executeForAllGMs(handler, ...args) {
		return this.socket.executeForAllGMs(handler, ...args);
	}

	static executeForOtherGMs(handler, ...args) {
		return this.socket.executeForOtherGMs(handler, ...args);
	}

	static executeForEveryone(handler, ...args) {
		return this.socket.executeForEveryone(handler, ...args);
	}

	static executeForOthers(handler, ...args) {
		return this.socket.executeForOthers(handler, ...args);
	}

	static executeForUsers(handler, userIds, ...args) {
		return this.socket.executeForUsers(handler, userIds, ...args);
	}

	static callHook(hook, ...args) {
		if (!Helpers.hooks.run) return;
		return this.socket.executeForEveryone(this.HANDLERS.CALL_HOOK, hook, ...args);
	}

	static callHookForUsers(hook, users, ...args) {
		if (!Helpers.hooks.run) return;
		return this.socket.executeForUsers(this.HANDLERS.CALL_HOOK, users, hook, ...args);
	}

}

const Requests = {
	_unresponsiveGM: false,
	_lastGmUnresponsiveTimestamp: false,
	_timers: {},
	_defaultTimeout: 2000,
	_unresponsiveTimeout: 10000,
	async timedSocketRequest(handler, method) {
		if (Requests._unresponsiveGM && Number(Date.now()) < Requests._lastGmUnresponsiveTimestamp) {
			Helpers.custom_warning(game.i18n.format("ITEM-PILES.Warnings.NoResponseFromGMTimeout", {
				user_name: Requests._unresponsiveGM,
				time: Math.ceil((Requests._lastGmUnresponsiveTimestamp - Number(Date.now())) / 1000)
			}), true);
			return false;
		}
		Requests._addTimeout(handler);
		let result;
		try {
			result = await method();
		} catch (err) {
			Requests._clearPendingTimeout(handler);
			return false;
		}
		Requests._clearPendingTimeout(handler);
		Requests._unresponsiveGM = false;
		Requests._lastGmUnresponsiveTimestamp = false;
		return result;
	},
	_addTimeout(handler) {
		Requests._timers[handler] = setTimeout(() => {
			const activeGM = Helpers.getResponsibleGM();
			Helpers.custom_warning(game.i18n.format("ITEM-PILES.Warnings.NoResponseFromGM", {
				user_name: activeGM.name
			}), true, true);
			Requests._unresponsiveGM = activeGM.name;
			Requests._lastGmUnresponsiveTimestamp = Number(Date.now()) + Requests._unresponsiveTimeout;
			Requests._clearPendingTimeout(handler);
		}, Requests._defaultTimeout);
	},
	_clearPendingTimeout(handler) {
		clearTimeout(Requests._timers[handler]);
		delete Requests._timers[handler];
	}
};

async function callHook(hook, ...args) {
	const newArgs = [];
	for (let arg of args) {
		if (stringIsUuid(arg)) {
			const testArg = fromUuidSync(arg);
			if (testArg) {
				arg = testArg;
			}
		}
		newArgs.push(arg);
	}
	return Hooks.callAll(hook, ...newArgs);
}

export const InterfaceTracker = {

	users: {},

	initialize() {
		this.users = {};
		Array.from(game.users).forEach(user => {
			this.users[user.id] = new Set();
		});
		Hooks.on(CONSTANTS.HOOKS.OPEN_INTERFACE, (app) => {
			ItemPileSocket.executeForOthers(ItemPileSocket.HANDLERS.USER_OPENED_INTERFACE, game.user.id, app.id);
		});
		Hooks.on(CONSTANTS.HOOKS.CLOSE_INTERFACE, (app) => {
			ItemPileSocket.executeForOthers(ItemPileSocket.HANDLERS.USER_CLOSED_INTERFACE, game.user.id, app.id);
		});
	},

	userOpened(userId, id) {
		if (!this.users[userId]) return;
		this.users[userId].add(id);
	},

	userClosed(userId, id) {
		if (!this.users[userId]) return;
		this.users[userId].delete(id);
	},

	isOpened(id) {
		return Object.values(this.users).some(interfaceList => interfaceList.has(id))
	}

}
