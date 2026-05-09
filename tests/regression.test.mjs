import assert from 'node:assert/strict';
import test from 'node:test';

function deepClone(value) {
	return value === undefined ? undefined : structuredClone(value);
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
			randomID: () => 'test-id'
		}
	};

	globalThis.game = {
		system: { id: 'test-system', version: '1.0.0' },
		user: { id: 'test-user', isGM: false },
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
	globalThis.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } };
}

installFoundryMocks();

const [{ getPriceData }, { PileItem }] = await Promise.all([
	import('../src/helpers/pile-utilities.js'),
	import('../src/stores/pile-item.js')
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
