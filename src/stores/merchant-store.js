import { get, writable } from "svelte/store";
import { localize } from "#runtime/svelte/helper";
import { PileItem } from "./pile-item.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as Helpers from "../helpers/helpers.js";
import { isResponsibleGM } from "../helpers/helpers.js";
import TradeMerchantItemDialog from "../applications/dialogs/trade-merchant-item-dialog/trade-merchant-item-dialog.js";
import * as Utilities from "../helpers/utilities.js";
import ItemPileStore from "./item-pile-store.js";
import CustomColumn from "../applications/merchant-app/components/CustomColumn.svelte";
import ItemEntry from "../applications/merchant-app/components/ItemEntry.svelte";
import QuantityColumn from "../applications/merchant-app/components/QuantityColumn.svelte";
import PriceSelector from "../applications/components/PriceSelector.svelte";
import EntryButtons from "../applications/merchant-app/components/EntryButtons.svelte";

export default class MerchantStore extends ItemPileStore {

	constructor(...args) {
		super(...args);
		this.services = writable({});
		this.editPrices = writable(false);
		this.typeFilter = writable("all");
		this.sortType = writable(0);
		this.priceModifiersPerType = writable({});
		this.priceModifiersForActor = writable({});
		this.priceSelector = writable("");
		this.closed = writable(false);
		this.itemColumns = writable([]);
		this.sortTypes = writable([]);
		this.inverseSort = writable(false);
		this.isMerchant = false;
		this.log = writable([]);
		this.visibleLogItems = writable(20);
		this.logSearch = writable("");
	}

	get ItemClass() {
		return PileMerchantItem;
	}

	setupStores() {
		super.setupStores();
		this.services.set({});
		this.editPrices.set(false);
		this.typeFilter.set("all");
		this.sortType.set(0);
		this.priceModifiersPerType.set({});
		this.priceModifiersForActor.set({});
		this.priceSelector.set("");
		this.closed.set(false);
		this.itemColumns.set([]);
		this.sortTypes.set([]);
		this.inverseSort.set(false);
		this.isMerchant = false;
		this.log.set([]);
		this.visibleLogItems.set(20);
		this.logSearch.set("");
	}

	getActorImage() {
		const pileData = get(this.pileData);
		return pileData?.merchantImage || this.actor.img;
	}

	setupSubscriptions() {

		let setup = false;
		super.setupSubscriptions();
		this.subscribeTo(this.document, () => {
			if (!setup) return;
			this.processLogEntries();
		});
		this.subscribeTo(this.pileData, (pileData) => {
			this.isMerchant = PileUtilities.isItemPileMerchant(this.actor, pileData);
			this.setupColumns(pileData);
			if (!setup) return;
			this.updatePriceModifiers();
			this.updateOpenCloseStatus();
		});
		if (this.recipientDocument) {
			this.subscribeTo(this.recipientPileData, (pileData) => {
				if (PileUtilities.isItemPileMerchant(this.recipient, pileData)) {
					this.setupColumns(pileData);
				}
				if (!setup) return;
				this.updatePriceModifiers();
			});
			this.subscribeTo(this.recipientDocument, () => {
				if (!setup) return;
				this.refreshItemPrices();
			})
		}
		this.subscribeTo(this.typeFilter, (val) => {
			if (!setup) return;
			this.refreshItems()
		});
		this.subscribeTo(this.sortType, (val) => {
			if (!setup) return;
			this.refreshItems();
		})
		this.subscribeTo(this.inverseSort, (val) => {
			if (!setup) return;
			this.refreshItems();
		})
		this.subscribeTo(this.logSearch, () => {
			if (!setup) return;
			this.filterLogEntries();
		})
		setup = true;
		this.updatePriceModifiers();
		this.updateOpenCloseStatus();
		this.refreshItems();
		this.processLogEntries();
	}

	setupColumns(pileData) {
		const merchantColumns = Array.isArray(pileData?.merchantColumns) ? pileData.merchantColumns : [];
		const customColumns = foundry.utils.deepClone(merchantColumns)
			.filter(column => {
				return this.isMerchant ? (column?.buying ?? true) : (column?.selling ?? true);
			})
			.map(column => ({
				label: localize(column.label), component: CustomColumn, data: column, sortMethod: (a, b, inverse) => {
					const path = column.path;
					const AProp = foundry.utils.getProperty(b.item, path);
					const BProp = foundry.utils.getProperty(a.item, path);
					if (!column?.mapping?.[AProp] || !column?.mapping?.[BProp]) {
						return (AProp > BProp ? 1 : -1) * (inverse ? -1 : 1);
					}
					const keys = Object.keys(column.mapping);
					return (keys.indexOf(AProp) - keys.indexOf(BProp)) * (inverse ? -1 : 1);
				}
			}));

		const columns = [];

		columns.push({
			label: "Type", component: ItemEntry
		});

		if (pileData.displayQuantity !== "alwaysno") {
			columns.push({
				label: "Quantity", component: QuantityColumn, sortMethod: (a, b, inverse) => {
					return (get(b.quantity) - get(a.quantity)) * (inverse ? -1 : 1);
				}
			})
		}

		columns.push(...customColumns)
		columns.push({
			label: "Price", component: PriceSelector, sortMethod: (a, b, inverse) => {
				const APrice = get(a.prices).find(price => price.primary);
				const BPrice = get(b.prices).find(price => price.primary);
				if (!APrice) return 1;
				if (!BPrice) return -1;
				return (BPrice.totalCost - APrice.totalCost) * (inverse ? -1 : 1);
			}
		})
		columns.push({
			label: false, component: EntryButtons
		});

		this.itemColumns.set(columns);

		const sortTypes = columns.filter(col => col.label);

		sortTypes.splice(1, 0, { label: "Name" });

		this.sortTypes.set(sortTypes)

	}

	refreshItemPrices() {
		const pileData = get(this.pileData);
		const recipientPileData = get(this.recipientPileData);
		get(this.allItems).forEach(item => {
			item.refreshPriceData(pileData, recipientPileData);
		});
	}

	visibleItemFilterFunction(entry, actorIsMerchant, pileData, recipientPileData) {
		const itemIsFree = !!get(entry.prices).find(price => price.free);
		const itemIsContained = get(entry.containerID);
		return super.visibleItemFilterFunction(entry, actorIsMerchant, pileData, recipientPileData)
			&& !itemIsContained
			&& (
				actorIsMerchant
					? !(pileData?.hideItemsWithZeroCost && itemIsFree)
					: !(recipientPileData?.hideItemsWithZeroCost && itemIsFree) && PileUtilities.isItemValidBasedOnProperties(this.recipient, entry.item)
			);
	}

	itemSortFunction(a, b) {
		const sortType = get(this.sortType);
		const inverse = get(this.inverseSort);
		if (sortType <= 1) {
			return super.itemSortFunction(a, b, inverse);
		}
		const selectedSortType = get(this.sortTypes)[sortType];
		return selectedSortType?.sortMethod(a, b, inverse, selectedSortType);
	}

	createItem(item) {
		if (PileUtilities.isItemInvalid(this.actor, item)) return;
		this.allItems.update(items => {
			const itemClass = new this.ItemClass(this, item);
			itemClass.refreshPriceData();
			items.push(itemClass);
			return items;
		})
		this.refreshItems();
	}

	deleteItem(item) {
		if (PileUtilities.isItemInvalid(this.actor, item)) return;
		let refresh = false;
		this.allItems.update(items => {
			const pileItem = items.find(pileItem => pileItem.id === item.id);
			if (!pileItem) return items;
			refresh = true;
			pileItem.unsubscribe();
			items.splice(items.indexOf(pileItem), 1);
			return items;
		});
		if (!refresh) return;
		this.refreshItems();
	}

	updatePriceModifiers() {
		let pileData = get(this.pileData);
		let change = false;
		if (pileData.itemTypePriceModifiers && typeof pileData.itemTypePriceModifiers === "object") {
			change = true;
			this.priceModifiersPerType.set((pileData.itemTypePriceModifiers ?? {}).reduce((acc, priceData) => {
				acc[priceData.category.toLowerCase() || priceData.type] = priceData;
				return acc;
			}, {}));
		}
		if (this.recipient && pileData.actorPriceModifiers && Array.isArray(pileData.actorPriceModifiers)) {
			change = true;
			const recipientUuid = Utilities.getUuid(this.recipient);
			const actorSpecificModifiers = pileData.actorPriceModifiers?.find(data => data.actorUuid === recipientUuid);
			if (actorSpecificModifiers) {
				this.priceModifiersForActor.set(actorSpecificModifiers);
			}
		}
		if (change) {
			this.refreshItemPrices();
		}
	}

	addOverrideTypePrice(type) {
		const pileData = get(this.pileData);
		const custom = Object.keys(CONFIG.Item.typeLabels).indexOf(type) === -1;
		pileData.itemTypePriceModifiers.push({
			category: custom ? type : "",
			type: custom ? "custom" : type,
			override: false,
			buyPriceModifier: 1,
			sellPriceModifier: 1
		})
		this.pileData.set(pileData);
	}

	removeOverrideTypePrice(type) {
		const pileData = get(this.pileData);
		const priceMods = pileData.itemTypePriceModifiers;
		const typeEntry = priceMods.find(entry => entry.type === type);
		priceMods.splice(priceMods.indexOf(typeEntry), 1);
		this.pileData.set(pileData);
	}

	async update() {
		const pileData = get(this.pileData);
		const priceModPerType = get(this.priceModifiersPerType);
		pileData.itemTypePriceModifiers = Object.values(priceModPerType);
		await PileUtilities.updateItemPileData(this.actor, pileData);
		Helpers.custom_notify(localize("ITEM-PILES.Notifications.UpdateMerchantSuccess"));
	}

	tradeItem(pileItem, selling) {
		if (get(pileItem.itemFlagData).notForSale && !game.user.isGM) return;
		TradeMerchantItemDialog.show(pileItem, this.actor, this.recipient, { selling });
	}

	async updateOpenCloseStatus() {
		const pileData = get(this.pileData);
		if (pileData.openTimes.status === "auto") {
			if (game.modules.get('foundryvtt-simple-calendar')?.active && pileData.openTimes.enabled) {
				const isClosed = PileUtilities.isMerchantClosed(this.actor, { pileData });
				this.closed.set(isClosed);
			} else if (isResponsibleGM()) {
				pileData.openTimes.status = "open";
				await PileUtilities.updateItemPileData(this.actor, pileData);
			}
		} else if (!pileData.openTimes.status.startsWith("auto")) {
			this.closed.set(pileData.openTimes.status === "closed");
		}
	}

	async setOpenStatus(status) {
		const pileData = get(this.pileData);
		pileData.openTimes.status = status;
		await PileUtilities.updateItemPileData(this.actor, pileData);
	}

	processLogEntries() {

		//const pileData = get(this.pileData);
		const logEntries = PileUtilities.getActorLog(this.actor);

		logEntries.sort((a, b) => b.date - a.date);

		logEntries.forEach(log => {

			let instigator;
			if (log.actor !== undefined) {
				instigator = game.i18n.format("ITEM-PILES.Merchant.LogUserActor", {
					actor_name: log.actor || "Unknown character", user_name: game.users.get(log.user)?.name ?? "unknown user",
				})
			} else {
				instigator = game.users.get(log.user)?.name ?? "unknown user";
			}

			if (log.property) {

				const properties = {
					"notForSale": ["ITEM-PILES.Merchant.LogSetNotForSale", "ITEM-PILES.Merchant.LogSetForSale"],
					"hidden": ["ITEM-PILES.Merchant.LogSetHidden", "ITEM-PILES.Merchant.LogSetVisible"]
				}

				log.text = localize(properties[log.property][Number(log.value)], { instigator, item: log.item });

				log.class = log.value ? "item-piles-log-positive" : "item-piles-log-negative";

			} else if (log.sold !== undefined) {

				const quantity = Math.abs(log.qty) > 1 ? game.i18n.format("ITEM-PILES.Merchant.LogQuantity", { quantity: Math.abs(log.qty) }) : "";

				const action = localize("ITEM-PILES.Merchant." + (log.sold ? "LogSold" : "LogBought"));

				log.text = localize("ITEM-PILES.Merchant.LogTransaction", {
					instigator, quantity, item: `<strong>${log.item}</strong>`, action: `<span>${action}</span>`, price: log.price
				});

				log.class = log.sold ? "item-piles-log-sold" : "item-piles-log-bought";

			} else {

				log.text = localize("ITEM-PILES.Merchant.LogSetQuantity", {
					instigator, quantity: Math.abs(log.qty), item: `<strong>${log.item}</strong>`
				});

				log.class = "item-piles-log-other";

			}

			log.visible = true;

		});

		this.log.set(logEntries);

		this.filterLogEntries()

	}

	filterLogEntries() {
		const search = get(this.logSearch).toLowerCase();
		const regex = new RegExp(search, "g");
		this.log.update((logs) => {
			for (let log of logs) {
				log.visible = log.text.toLowerCase().search(regex) !== -1;
			}
			return logs;
		})
	}

}

class PileMerchantItem extends PileItem {

	setupStores(...args) {
		super.setupStores(...args);
		this.prices = writable([]);
		this.displayQuantity = writable(false);
		this.selectedPriceGroup = writable(-1);
		this.quantityToBuy = writable(1);
		this.quantityForPrice = writable(1);
		this.infiniteQuantity = writable(false);
		this.isService = false;
	}

	setupSubscriptions() {
		let setup = false;
		super.setupSubscriptions();
		this.subscribeTo(this.store.pileData, () => {
			if (!setup) return;
			this.refreshPriceData();
			this.refreshDisplayQuantity();
		});
		if (this.store.recipient) {
			this.subscribeTo(this.store.recipientPileData, () => {
				if (!setup) return
				this.refreshPriceData();
				this.refreshDisplayQuantity();
			});
		}
		this.subscribeTo(this.quantityToBuy, () => {
			if (!setup) return;
			this.refreshPriceData();
		});
		this.subscribeTo(this.itemDocument, () => {
			if (!setup) return;
			this.refreshPriceData();
			this.store.refreshItems();
		});
		this.subscribeTo(this.store.typeFilter, () => {
			if (!setup) return;
			this.filter()
		});
		this.subscribeTo(this.itemFlagData, (flagData) => {
			this.isService = flagData.isService;
			if (!setup) return;
			this.refreshPriceData();
			this.refreshDisplayQuantity();
		});
		this.refreshDisplayQuantity();
		setup = true;
	}

	refreshDisplayQuantity() {

		const pileData = get(this.store.pileData);
		const itemFlagData = get(this.itemFlagData);
		const isMerchant = PileUtilities.isItemPileMerchant(this.store.actor, pileData)

		const merchantDisplayQuantity = pileData.displayQuantity;
		const itemFlagDataQuantity = itemFlagData.displayQuantity;

		const itemInfiniteQuantity = {
			"default": pileData.infiniteQuantity, "yes": true, "no": false
		}[isMerchant ? (itemFlagData.infiniteQuantity ?? "default") : "no"];

		this.infiniteQuantity.set(itemInfiniteQuantity)

		if (itemFlagDataQuantity === "always") {
			return this.displayQuantity.set(true);
		}

		const itemDisplayQuantity = {
			"default": merchantDisplayQuantity === "yes", "yes": true, "no": false
		}[itemFlagDataQuantity ?? "default"];

		if (merchantDisplayQuantity.startsWith("always")) {
			return this.displayQuantity.set(merchantDisplayQuantity.endsWith("yes"));
		}

		this.displayQuantity.set(itemDisplayQuantity);

	}

	refreshPriceData(sellerFlagData, buyerFlagData) {

		const quantityToBuy = get(this.quantityToBuy);
		const itemFlagData = get(this.itemFlagData);
		sellerFlagData = sellerFlagData ?? get(this.store.pileData);
		buyerFlagData = buyerFlagData ?? get(this.store.recipientPileData);
		const priceData = PileUtilities.getPriceData({
			item: this.item,
			seller: this.store.actor,
			buyer: this.store.recipient,
			sellerFlagData,
			buyerFlagData,
			itemFlagData,
			quantity: quantityToBuy
		});

		let selectedPriceGroup = get(this.selectedPriceGroup);
		if (selectedPriceGroup === -1) {
			selectedPriceGroup = Math.max(0, priceData.findIndex(price => price.maxQuantity));
			this.selectedPriceGroup.set(selectedPriceGroup)
		}

		this.prices.set(priceData);

		this.quantityForPrice.set(game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE ? foundry.utils.getProperty(this.item, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE) ?? 1 : 1);

	}

	filter() {
		const name = get(this.name).trim();
		const type = get(this.category).type;
		const search = get(this.store.search).trim();
		const typeFilter = get(this.store.typeFilter);
		const searchFiltered = !name.toLowerCase().includes(search.toLowerCase());
		const typeFiltered = typeFilter !== "all" && typeFilter.toLowerCase() !== type.toLowerCase();
		this.filtered.set(searchFiltered || typeFiltered);
	}

	async toggleProperty(property) {

		this.itemFlagData.update((data) => {
			data[property] = !data[property]
			return data;
		});

		const itemFlagData = get(this.itemFlagData);

		await PileUtilities.updateItemData(this.item, { flags: itemFlagData });

		const pileFlagData = get(this.store.pileData);
		if (pileFlagData.logMerchantActivity) {
			await PileUtilities.updateMerchantLog(this.store.actor, {
				type: "event", user: game.user.id, item: this.item.name, property, value: !itemFlagData[property]
			});
		}
	}

	async updateQuantity(quantity) {
		const pileFlagData = get(this.store.pileData);
		const itemFlagData = get(this.itemFlagData);
		const roll = await new Roll(quantity).evaluate({ allowInteractive: false });
		this.quantity.set(roll.total);
		const baseData = {};
		if (itemFlagData.isService || pileFlagData.keepZeroQuantity || itemFlagData.keepZeroQuantity) {
			baseData[CONSTANTS.FLAGS.ITEM + ".notForSale"] = roll.total <= 0;
		}
		if (pileFlagData.logMerchantActivity) {
			PileUtilities.updateMerchantLog(this.store.actor, {
				type: "event", user: game.user.id, item: this.item.name, qty: roll.total
			});
		}
		return await this.item.update(Utilities.setItemQuantity(baseData, roll.total));
	}

}
