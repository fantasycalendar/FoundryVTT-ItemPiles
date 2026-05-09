import assert from 'node:assert/strict';
import test from 'node:test';

function deepClone(value) {
	if (value === undefined || value === null || typeof value !== 'object') return value;
	if (Array.isArray(value)) return value.map(deepClone);
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, deepClone(entry)]));
}

function getProperty(source, path) {
	return path.split('.').reduce((value, key) => value?.[key], source);
}

function setProperty(source, path, value) {
	const parts = path.split('.');
	let target = source;
	for (const part of parts.slice(0, -1)) {
		target[part] ??= {};
		target = target[part];
	}
	target[parts.at(-1)] = value;
	return source;
}

function hasProperty(source, path) {
	return getProperty(source, path) !== undefined;
}

function mergeObject(original = {}, other = {}) {
	const result = deepClone(original) ?? {};
	for (const [key, value] of Object.entries(other ?? {})) {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			result[key] = mergeObject(result[key] ?? {}, value);
		} else {
			result[key] = deepClone(value);
		}
	}
	return result;
}

function installFoundryMocks() {
	globalThis.foundry = {
		utils: {
			deepClone,
			duplicate: deepClone,
			getProperty,
			setProperty,
			hasProperty,
			mergeObject,
			diffObject: () => ({}),
			isEmpty: object => !object || Object.keys(object).length === 0,
			debounce: fn => fn,
			fromUuidSync: () => undefined,
			randomID: () => 'test-id',
			isNewerVersion: () => false
		}
	};

	globalThis.game = {
		system: { id: 'test-system', version: '1.0.0' },
		user: { id: 'test-user', name: 'Test User', isGM: false },
		users: [],
		actors: [],
		scenes: [],
		items: new Map(),
		packs: new Map(),
		modules: new Map([['item-piles', { version: 'test' }]]),
		settings: {
			get: (_namespace, key) => key === 'itemPreviewPermissionLevel' ? 1 : undefined,
			set: () => undefined
		},
		i18n: {
			localize: value => value,
			format: value => value
		},
		itempiles: {
			API: {
				ITEM_PRICE_ATTRIBUTE: 'system.price.value',
				ITEM_QUANTITY_ATTRIBUTE: 'system.quantity.value',
				QUANTITY_FOR_PRICE_ATTRIBUTE: 'flags.item-piles.system.quantityForPrice',
				ITEM_SIMILARITIES: ['name', 'type'],
				ITEM_FILTERS: [],
				CURRENCIES: [{
					type: 'attribute',
					name: 'Gold',
					img: 'gold.png',
					abbreviation: '{#}gp',
					data: { path: 'system.currency' },
					primary: true,
					exchangeRate: 1
				}],
				SECONDARY_CURRENCIES: []
			}
		}
	};

	globalThis.Hooks = {
		call: () => true,
		callAll: () => true,
		on: () => undefined
	};

	globalThis.Actor = class Actor {};
	globalThis.TokenDocument = class TokenDocument {};
	globalThis.Item = class Item {};
	globalThis.FormApplication = class FormApplication {};
	globalThis.Application = class Application {};
	globalThis.CONST = {
		DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 },
		CHAT_MESSAGE_STYLES: { OTHER: 'OTHER' }
	};
}

installFoundryMocks();

const [{ getPriceData }, { PileItem }, { default: PrivateAPI }, { default: ItemPileSocket }, { default: ChatAPI }, { SYSTEMS }, { default: dnd5e }] = await Promise.all([
	import('../src/helpers/pile-utilities.js'),
	import('../src/stores/pile-item.js'),
	import('../src/API/private-api.js'),
	import('../src/socket.js'),
	import('../src/API/chat-api.js'),
	import('../src/systems.js'),
	import('../systems/dnd5e-4.0.0.js')
]);

test('selling an item uses the matching merchant inventory item sell price modifier', () => {
	const sellerItem = {
		_id: 'seller-sword',
		id: 'seller-sword',
		name: 'Sword',
		type: 'weapon',
		system: { price: { value: 100 } },
		flags: { 'item-piles': { item: { sellPriceModifier: 0.25 } } }
	};
	const merchantItem = {
		_id: 'merchant-sword',
		id: 'merchant-sword',
		name: 'Sword',
		type: 'weapon',
		system: { price: { value: 100 } },
		flags: { 'item-piles': { item: { sellPriceModifier: 0.5 } } }
	};
	const seller = {
		uuid: 'Actor.seller',
		items: [sellerItem],
		system: { currency: 0 },
		flags: { 'item-piles': { data: { enabled: false } } }
	};
	const merchant = {
		uuid: 'Actor.merchant',
		items: [merchantItem],
		system: { currency: 1000 },
		flags: {
			'item-piles': {
				data: {
					enabled: true,
					type: 'merchant',
					sellPriceModifier: 1,
					overrideCurrencies: game.itempiles.API.CURRENCIES,
					overrideSecondaryCurrencies: []
				}
			}
		}
	};

	const [price] = getPriceData({
		item: sellerItem,
		seller,
		buyer: merchant,
		quantity: 1
	});

	assert.equal(price.baseCost, 50);
	assert.equal(price.totalCost, 50);
	assert.equal(price.priceString, '50gp');
});

test('non-owner item previews instantiate a read-only sheet from the item sheet class', async () => {
	let constructedItem;
	let constructedSheet;
	let rendered = false;

	class TestItem {
		constructor(data, options) {
			this.data = data;
			this.options = options;
			this.parent = options.parent;
			constructedItem = this;
		}

		_getSheetClass() {
			return class TestSheet {
				constructor(item, options) {
					this.item = item;
					this.options = options;
					constructedSheet = this;
				}

				_render(force) {
					rendered = force;
					return 'rendered-preview';
				}
			};
		}
	}
	globalThis.Item = { implementation: TestItem };

	const originalItem = {
		isOwner: false,
		parent: { id: 'actor-parent' },
		toObject: () => ({
			_id: 'preview-item',
			name: 'Preview Item',
			type: 'loot'
		})
	};
	const context = {
		item: originalItem,
		store: {
			pileData: {
				subscribe(callback) {
					callback({ canInspectItems: true });
					return () => undefined;
				}
			}
		}
	};

	const result = await PileItem.prototype.preview.call(context);

	assert.equal(result, 'rendered-preview');
	assert.equal(rendered, true);
	assert.equal(constructedItem.options.parent, originalItem.parent);
	assert.equal(constructedItem.document, constructedItem);
	assert.equal(constructedItem.data.ownership['test-user'], 1);
	assert.equal(constructedSheet.item, constructedItem);
	assert.deepEqual(constructedSheet.options, {
		editable: false,
		submitOnClose: false,
		submitOnChange: false
	});
});


test('non-owner item preview sheets disable close-time submission', async () => {
	let constructedSheet;

	class TestItem {
		constructor(data, options) {
			this.data = data;
			this.options = options;
			this.parent = options.parent;
		}

		_getSheetClass() {
			return class TestSheet {
				constructor(item, options) {
					this.item = item;
					this.options = options;
					constructedSheet = this;
				}

				_render() {
					return this;
				}

				close() {
					// This mirrors systems like Custom System Builder whose sheets submit on
					// close by default. A read-only preview must opt out, otherwise the
					// synthetic non-owner item attempts a forbidden update and remains open.
					if (this.options.submitOnClose !== false) {
						throw new Error('read-only item preview attempted to submit on close');
					}
					return 'closed';
				}
			};
		}
	}
	globalThis.Item = { implementation: TestItem };

	const originalItem = {
		isOwner: false,
		parent: { id: 'csb-pile-parent' },
		toObject: () => ({
			_id: 'csb-preview-item',
			name: 'CSB Preview Item',
			type: 'equippableItem'
		})
	};
	const context = {
		item: originalItem,
		store: {
			pileData: {
				subscribe(callback) {
					callback({ canInspectItems: true });
					return () => undefined;
				}
			}
		}
	};

	await PileItem.prototype.preview.call(context);

	assert.equal(constructedSheet.close(), 'closed');
	assert.equal(constructedSheet.options.editable, false);
	assert.equal(constructedSheet.options.submitOnClose, false);
	assert.equal(constructedSheet.options.submitOnChange, false);
});


test('dropping a D&D5e container from Quick Insert creates a pile when serialized contents are not iterable', async () => {
	const originalSystemId = game.system.id;
	const originalSystemVersion = game.system.version;
	const originalCurrentSystem = SYSTEMS._currentSystem;
	const originalSupportedDnd5e = SYSTEMS.SUPPORTED_SYSTEMS.dnd5e;
	const originalFromUuidSync = foundry.utils.fromUuidSync;
	const originalCreateItemPile = PrivateAPI._createItemPile;
	const originalSocket = ItemPileSocket.socket;
	const originalItem = globalThis.Item;

	let createdPileArgs;
	let hookArgs;
	const containerFromQuickInsert = {
		_id: 'quick-insert-chest',
		uuid: 'Compendium.dnd5e.items.quick-insert-chest',
		name: 'Chest',
		type: 'container',
		system: {
			quantity: { value: 1 },
			// Quick Insert / compendium drops can expose the D&D5e container contents
			// as serialized source data instead of the iterable collection available on
			// live item documents. This used to throw before the pile was created.
			contents: {}
		}
	};

	try {
		globalThis.Item = class Item {};
		game.system.id = 'dnd5e';
		game.system.version = '5.2.5';
		SYSTEMS._currentSystem = false;
		SYSTEMS.SUPPORTED_SYSTEMS.dnd5e = { latest: dnd5e };
		foundry.utils.fromUuidSync = uuid => uuid === containerFromQuickInsert.uuid ? containerFromQuickInsert : undefined;
		PrivateAPI._createItemPile = async (args) => {
			createdPileArgs = args;
			return 'Scene.test.Token.created-pile';
		};
		ItemPileSocket.socket = {
			executeForEveryone(...args) {
				hookArgs = args;
			}
		};

		const result = await PrivateAPI._dropItems({
			userId: 'test-user',
			sceneId: 'test-scene',
			position: { x: 1200, y: 900 },
			itemData: {
				uuid: containerFromQuickInsert.uuid,
				quantity: 1,
				item: deepClone(containerFromQuickInsert)
			}
		});

		assert.equal(result.targetUuid, 'Scene.test.Token.created-pile');
		assert.deepEqual(result.position, { x: 1200, y: 900 });
		assert.equal(createdPileArgs.items.length, 1);
		assert.equal(createdPileArgs.items[0]._id, 'quick-insert-chest');
		assert.deepEqual(createdPileArgs.items[0].system.contents, {});
		assert.equal(hookArgs[0], ItemPileSocket.HANDLERS.CALL_HOOK);
	} finally {
		game.system.id = originalSystemId;
		game.system.version = originalSystemVersion;
		SYSTEMS._currentSystem = originalCurrentSystem;
		SYSTEMS.SUPPORTED_SYSTEMS.dnd5e = originalSupportedDnd5e;
		foundry.utils.fromUuidSync = originalFromUuidSync;
		PrivateAPI._createItemPile = originalCreateItemPile;
		ItemPileSocket.socket = originalSocket;
		globalThis.Item = originalItem;
	}
});


test('restricted pickup output does not update a previously public chat card', async () => {
	const originalSettingsGet = game.settings.get;
	const originalUsers = game.users;
	const originalMessages = game.messages;
	const originalFromUuidSync = foundry.utils.fromUuidSync;
	const originalRenderTemplate = globalThis.renderTemplate;
	const originalChatMessage = globalThis.ChatMessage;
	const originalItem = globalThis.Item;

	const sourceActor = { uuid: 'Actor.pile', name: 'Loot Pile' };
	const targetActor = { uuid: 'Actor.looter', name: 'Looter' };
	let outputMode = 2;
	let createdMessages = [];
	let publicMessageUpdate;

	const users = [
		{ id: 'gm-user', name: 'Gamemaster', isGM: true },
		{ id: 'looting-user', name: 'Looter User', isGM: false },
		{ id: 'bystander-user', name: 'Bystander User', isGM: false }
	];
	users.get = id => users.find(user => user.id === id);

	try {
		game.settings.get = (_namespace, key) => {
			if (key === 'outputToChat') return outputMode;
			if (key === 'itemPreviewPermissionLevel') return 1;
			return undefined;
		};
		game.users = users;
		game.user = { id: 'gm-user', name: 'Gamemaster', isGM: true };
		foundry.utils.fromUuidSync = uuid => ({
			[sourceActor.uuid]: sourceActor,
			[targetActor.uuid]: targetActor
		}[uuid]);
		globalThis.renderTemplate = async (_template, data) => JSON.stringify(data);
		globalThis.Item = class Item {};
		globalThis.ChatMessage = {
			getSpeaker: ({ alias }) => ({ alias }),
			create: async (chatData) => {
				createdMessages.push(chatData);
				return chatData;
			}
		};

		const existingPublicMessage = {
			id: 'public-message',
			timestamp: Date.now(),
			whisper: [],
			flags: {
				'item-piles': {
					data: {
						version: 'test',
						source: sourceActor.uuid,
						target: targetActor.uuid,
						interactionId: 'same-pickup',
						items: [{ name: 'Old Coin', img: 'coin.png', quantity: 1 }],
						currencies: []
					}
				}
			},
			update(update) {
				publicMessageUpdate = update;
				return update;
			}
		};
		game.messages = [existingPublicMessage];

		await ChatAPI._outputPickupToChat(
			sourceActor.uuid,
			targetActor.uuid,
			[{ name: 'Secret Gem', img: 'gem.png', quantity: 1 }],
			[],
			'looting-user',
			'same-pickup'
		);

		assert.equal(publicMessageUpdate, undefined);
		assert.equal(createdMessages.length, 1);
		assert.deepEqual(createdMessages[0].whisper, ['gm-user', 'looting-user']);
		assert.equal(createdMessages[0]['flags.item-piles.data'].interactionId, 'same-pickup');
		assert.deepEqual(createdMessages[0]['flags.item-piles.data'].items, [{
			name: 'Secret Gem',
			img: 'gem.png',
			quantity: 1
		}]);

		outputMode = 3;
		createdMessages = [];
		publicMessageUpdate = undefined;

		await ChatAPI._outputPickupToChat(
			sourceActor.uuid,
			targetActor.uuid,
			[{ name: 'Secret Gem', img: 'gem.png', quantity: 1 }],
			[],
			'looting-user',
			'same-pickup'
		);

		assert.equal(publicMessageUpdate, undefined);
		assert.equal(createdMessages.length, 1);
		assert.deepEqual(createdMessages[0].whisper, ['gm-user']);

		outputMode = 0;
		createdMessages = [];
		publicMessageUpdate = undefined;

		await ChatAPI._outputPickupToChat(
			sourceActor.uuid,
			targetActor.uuid,
			[{ name: 'Secret Gem', img: 'gem.png', quantity: 1 }],
			[],
			'looting-user',
			'same-pickup'
		);

		assert.equal(publicMessageUpdate, undefined);
		assert.equal(createdMessages.length, 0);
	} finally {
		game.settings.get = originalSettingsGet;
		game.users = originalUsers;
		game.messages = originalMessages;
		foundry.utils.fromUuidSync = originalFromUuidSync;
		globalThis.renderTemplate = originalRenderTemplate;
		globalThis.Item = originalItem;
		globalThis.ChatMessage = originalChatMessage;
	}
});
