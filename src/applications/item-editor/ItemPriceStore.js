import { TJSDocument } from "#runtime/svelte/store/fvtt/document";
import { get, writable } from "svelte/store";
import CONSTANTS from "../../constants/constants.js";
import * as PileUtilities from "../../helpers/pile-utilities.js";
import { getItemCost } from "../../helpers/utilities.js";

const existingStores = new Map();

export default class ItemPriceStore {

	constructor(item) {

		this.item = item;
		this.itemDoc = new TJSDocument(this.item);

		const quantityForPriceProp = game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE;

		this.price = writable(0);
		this.quantityForPrice = writable(foundry.utils.getProperty(item, quantityForPriceProp) ?? 1);

		const data = PileUtilities.getItemFlagData(this.item);

		data.prices.forEach(group => {
			group.forEach(price => {
				if (!price.id) {
					price.id = foundry.utils.randomID();
				}
			});
		});

		data.sellPrices.forEach(group => {
			group.forEach(price => {
				if (!price.id) {
					price.id = foundry.utils.randomID();
				}
			});
		});

		this.data = writable(data);

		this.itemDoc.subscribe((item, changes) => {
			const { data } = changes;
			if (foundry.utils.hasProperty(data, CONSTANTS.FLAGS.ITEM)) {
				const newData = foundry.utils.getProperty(data, CONSTANTS.FLAGS.ITEM);
				const oldData = get(this.data);
				this.data.set(foundry.utils.mergeObject(oldData, newData));
			}
			this.price.set(getItemCost(this.item));
			const quantityForPriceProp = game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE;
			if (quantityForPriceProp && foundry.utils.hasProperty(data, quantityForPriceProp)) {
				this.quantityForPrice.set(foundry.utils.getProperty(item, quantityForPriceProp))
			}
		});

	}

	static make(item) {
		if (existingStores.has(item.id)) {
			return existingStores.get(item.id);
		}
		return new this(item);
	}

	addPurchaseGroup() {
		this.data.update(data => {
			data.prices.push([]);
			return data;
		})
	}

	removePurchaseGroup(groupIndex) {
		this.data.update(data => {
			data.prices.splice(groupIndex, 1);
			return data;
		})
	}

	addSellGroup() {
		this.data.update(data => {
			data.sellPrices.push([]);
			return data;
		})
	}

	removeSellGroup(groupIndex) {
		this.data.update(data => {
			data.sellPrices.splice(groupIndex, 1);
			return data;
		})
	}

	addOverheadCostGroup() {
		this.data.update(data => {
			data.overheadCost.push([]);
			return data;
		})
	}

	removeOverheadCostGroup(groupIndex) {
		this.data.update(data => {
			data.overheadCost.splice(groupIndex, 1);
			return data;
		})
	}

	export() {
		const data = {
			data: {
				[game.itempiles.API.ITEM_PRICE_ATTRIBUTE]: get(this.price),
			},
			flags: get(this.data)
		};
		if (game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE) {
			data["data"][game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE] = get(this.quantityForPrice);
		}
		return data;
	}

}
