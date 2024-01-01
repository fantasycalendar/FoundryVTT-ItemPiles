import ItemPileStore from "./item-pile-store.js";
import { get, writable } from "svelte/store";
import CONSTANTS from "../constants/constants.js";
import { PileItem } from "./pile-item.js";
import * as Utilities from "../helpers/utilities.js";
import PrivateAPI from "../API/private-api.js";
import ItemPileSocket from "../socket.js";
import DropItemDialog from "../applications/dialogs/drop-item-dialog/drop-item-dialog.js";
import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
import CustomDialog from "../applications/components/CustomDialog.svelte";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as helpers from "../helpers/helpers.js";
import * as Helpers from "../helpers/helpers.js";
import { SYSTEMS } from "../systems.js";

export class VaultStore extends ItemPileStore {

	constructor(...args) {
		super(...args);
		this.gridData = writable({});
		this.gridItems = writable([]);
		this.validGridItems = writable([]);
		this.canDepositCurrency = writable(false);
		this.canWithdrawCurrency = writable(false);
		this.logSearch = writable("");
		this.vaultLog = writable([]);
		this.visibleLogItems = writable(18);
		this.highlightedGridItems = writable([]);
		this.vaultExpanderItems = writable([]);
		this.dragPosition = writable({ x: 0, y: 0, w: 1, h: 1, active: false, flipped: false });
		this.mainContainer = false;
	}

	get searchDelay() {
		return 50;
	}

	get ItemClass() {
		return VaultItem;
	}

	setupStores(reset = false) {
		super.setupStores(reset);
		this.gridData.set({});
		this.gridItems.set([]);
		this.validGridItems.set([]);
		this.logSearch.set("");
		this.vaultLog.set([]);
		this.visibleLogItems.set(18);
		this.highlightedGridItems.set([]);
		this.vaultExpanderItems.set([]);
		this.dragPosition.set({ x: 0, y: 0, w: 1, h: 1, active: false, flipped: false });

		this.refreshGridDebounce = foundry.utils.debounce(() => {
			this.refreshGrid();
		}, this.searchDelay);
	}

	setupSubscriptions() {
		super.setupSubscriptions();
		this.subscribeTo(this.pileData, () => {
			this.refreshAppSize();
			this.refreshGridDebounce();
			this.processLogEntries();
		});

		this.subscribeTo(this.document, () => {
			const { data } = this.document.updateOptions;
			if (hasProperty(data, CONSTANTS.FLAGS.LOG)) {
				this.processLogEntries();
			}
		});

		this.subscribeTo(this.logSearch, this.filterLogEntries.bind(this));

		this.refreshGrid();
		this.processLogEntries();
	}

	processLogEntries() {

		const pileData = get(this.pileData);
		const logEntries = PileUtilities.getActorLog(this.actor);

		logEntries.map(log => {

			let instigator = log.actor || "Unknown character";
			if (pileData.vaultLogType === "user_actor") {
				instigator = game.i18n.format("ITEM-PILES.Vault.LogUserActor", {
					actor_name: log.actor || "Unknown character", user_name: game.users.get(log.user)?.name ?? "unknown user",
				})
			} else if (pileData.vaultLogType === "user") {
				instigator = game.users.get(log.user)?.name ?? "unknown user";
			}

			const quantity = Math.abs(log.qty) > 1 ? game.i18n.format("ITEM-PILES.Vault.LogQuantity", { quantity: Math.abs(log.qty) }) : "";

			if (!log.action) {
				log.action = log.qty > 0 ? "deposited" : "withdrew";
			}

			const action = log.action === "withdrew" || log.action === "deposited" ? game.i18n.localize("ITEM-PILES.Vault." + (log.action.slice(0, 1).toUpperCase() + log.action.slice(1))) : log.action;

			log.text = game.i18n.format("ITEM-PILES.Vault.LogEntry", {
				instigator, action: `<span>${action}</span>`, quantity: quantity, item_name: `<strong>${log.name}</strong>`,
			})
			log.visible = true;

		});

		this.vaultLog.set(logEntries);

		this.filterLogEntries()

	}

	filterLogEntries() {
		const search = get(this.logSearch).toLowerCase();
		const regex = new RegExp(search, "g");
		this.vaultLog.update((logs) => {
			for (let log of logs) {
				log.visible = log.text.toLowerCase().search(regex) !== -1;
			}
			return logs;
		})
	}

	refreshFreeSpaces() {
		const pileData = get(this.pileData);
		this.gridData.update(() => {

			const access = PileUtilities.getVaultAccess(this.actor, {
				flagData: pileData, hasRecipient: !!this.recipient
			});

			return {
				...PileUtilities.getVaultGridData(this.actor, { flagData: pileData }), ...access,
				canEditCurrencies: game.user.isGM,
				fullAccess: game.user.isGM || Object.values(access).every(Boolean),
				gridSize: 40,
				gap: 4
			}
		})
	}

	canItemsFitWithout(itemToCompare) {

		const pileData = get(this.pileData);
		const items = get(this.validGridItems);
		const vaultExpanders = get(this.vaultExpanderItems);

		const expansions = vaultExpanders.reduce((acc, item) => {
			if (item === itemToCompare) return acc;
			acc.cols += get(item.itemFlagData).addsCols * get(item.quantity);
			acc.rows += get(item.itemFlagData).addsRows * get(item.quantity);
			return acc;
		}, {
			cols: pileData.baseExpansionCols ?? 0, rows: pileData.baseExpansionRows ?? 0
		});

		const enabledCols = Math.min(pileData.cols, expansions.cols);
		const enabledRows = Math.min(pileData.rows, expansions.rows);

		const enabledSpaces = enabledCols * enabledRows;

		return enabledSpaces - items.length;

	}

	updateGrid(items) {

		if (!items.length) return;

		const itemsToUpdate = items.map(item => {
			const transform = get(item.transform);
			return {
				_id: item.id,
				[CONSTANTS.FLAGS.ITEM + ".x"]: transform.x,
				[CONSTANTS.FLAGS.ITEM + ".y"]: transform.y,
				[CONSTANTS.FLAGS.ITEM + ".flipped"]: transform.flipped,
			}
		});

		helpers.debug("itemsToUpdate", itemsToUpdate);

		const actorUuid = Utilities.getUuid(this.actor);
		if (this.actor.isOwner) {
			return PrivateAPI._commitActorChanges(actorUuid, {
				itemsToUpdate,
			});
		}

		return ItemPileSocket.executeAsGM(ItemPileSocket.HANDLERS.COMMIT_ACTOR_CHANGES, actorUuid, {
			itemsToUpdate,
		});
	}

	refreshItems() {
		super.refreshItems();
		const pileData = get(this.pileData);
		this.validGridItems.set(get(this.allItems).filter(entry => {
			const itemFlagData = get(entry.itemFlagData);
			return (!pileData.vaultExpansion || !itemFlagData.vaultExpander) && !entry.isCurrency;
		}));
		this.highlightedGridItems.set(get(this.items).filter(entry => {
			const itemFlagData = get(entry.itemFlagData);
			return !pileData.vaultExpansion || !itemFlagData.vaultExpander;
		}).map(item => item.id));
		this.vaultExpanderItems.set(get(this.allItems).filter(entry => {
			const itemFlagData = get(entry.itemFlagData);
			return !pileData.vaultExpansion || itemFlagData.vaultExpander;
		}));
		this.refreshGridDebounce();
	}

	createItem(...args) {
		super.createItem(...args);
		this.refreshGrid();
	}

	deleteItem(...args) {
		super.deleteItem(...args);
		this.refreshGrid();
	}

	refreshGrid() {
		this.refreshFreeSpaces();
		this.gridItems.set(this.placeItemsOnGrid());
	}

	placeItemsOnGrid() {
		const search = get(this.search)
		const highlightedItems = get(this.highlightedGridItems);
		const gridData = get(this.gridData);
		const allItems = [...get(this.validGridItems)];
		const existingItems = [];

		const grid = Array.from(Array(gridData.enabledCols).keys()).map((_, x) => {
			return Array.from(Array(gridData.enabledRows).keys()).map((_, y) => {
				const item = allItems.find(item => {
					return item.x === x && item.y === y
				});
				if (item) {
					allItems.splice(allItems.indexOf(item), 1);
					existingItems.push({
						id: item.id,
						active: item.active,
						transform: item.transform,
						ghostTransform: item.ghostTransform,
						highlight: search && highlightedItems.includes(item.id),
						item,
					});
				}
				return item?.id ?? null;
			});
		});

		helpers.debug("grid", grid);

		helpers.debug("existingItems", existingItems);

		helpers.debug("allItems", allItems);

		const itemsToUpdate = allItems
			.map(item => {

				let freeCells = [];
				for (let x = 0; x < gridData.enabledCols; x++) {
					for (let y = 0; y < gridData.enabledRows; y++) {
						if (grid[x][y]) continue;
						freeCells.push({ x, y });
					}
				}

				const position = PileUtilities.getNewItemsVaultPosition(item.item, { ...gridData, grid, freeCells });
				if (!position) return false;
				const itemFlagData = get(item.itemFlagData);
				let { width, height } = PileUtilities.getVaultItemDimensions(item.item, itemFlagData);
				for (let w = 0; w < width; w++) {
					const x = Math.max(0, Math.min(position.x + w, gridData.enabledCols - 1));
					for (let h = 0; h < height; h++) {
						const y = Math.max(0, Math.min(position.y + h, gridData.enabledRows - 1));
						grid[x][y] = item.id;
					}
				}
				item.transform.update(trans => {
					trans.x = position.x;
					trans.y = position.y;
					trans.flipped = position.flipped;
					return trans;
				});
				return {
					id: item.id,
					active: item.active,
					transform: item.transform,
					ghostTransform: item.ghostTransform,
					highlight: search && highlightedItems.includes(item.id),
					item
				};
			})
			.filter(Boolean)

		this.updateGrid(itemsToUpdate)

		return itemsToUpdate.concat(existingItems);

	}

	refreshAppSize() {
		if (!this.mainContainer) return;
		const oldHeight = this.mainContainer.getBoundingClientRect().height;
		setTimeout(() => {
			const newHeight = this.mainContainer.getBoundingClientRect().height - oldHeight;
			this.application.position.stores.height.update((height) => {
				return height + newHeight;
			});
		}, 10);
	}

	async onDropData(data, event, isExpander) {

		let validPosition = get(this.dragPosition);
		this.dragPosition.set({ x: 0, y: 0, w: 1, h: 1, flipped: false, active: false });

		if (data.type === "Actor" && game.user.isGM) {
			const newRecipient = data.uuid ? (await fromUuid(data.uuid)) : game.actors.get(data.id);
			this.refreshAppSize();
			this.updateRecipient(newRecipient);
			this.refreshFreeSpaces();
			return;
		}

		if (data.type !== "Item") {
			Helpers.custom_warning(`You can't drop documents of type "${data.type}" into this Item Piles vault!`, true)
			return false;
		}

		const item = await Item.implementation.fromDropData(data);

		const itemData = item.toObject();

		if (!itemData) {
			console.error(data);
			throw Helpers.custom_error("Something went wrong when dropping this item!")
		}

		const source = (data.uuid ? fromUuidSync(data.uuid) : false)?.parent ?? false;
		const target = this.actor;

		if (source === target) {
			Helpers.custom_warning(`You can't drop items into the vault that originate from the vault!`, true)
			return false;
		}

		if (!source && !game.user.isGM) {
			Helpers.custom_warning(`Only GMs can drop items from the sidebar!`, true)
			return false;
		}

		const vaultExpander = getProperty(itemData, CONSTANTS.FLAGS.ITEM + ".vaultExpander");

		if (isExpander && !vaultExpander) {
			Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.VaultItemNotExpander"), true)
			return false;
		}

		const similarItem = this.getSimilarItem(itemData);
		if (!vaultExpander) {
			if (!similarItem || !PileUtilities.canItemStack(item, this.actor)) {
				validPosition = PileUtilities.canItemFitInVault(itemData, this.actor, validPosition);
				if (!validPosition) {
					Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.VaultFull"), true)
					return false;
				}
			}
		}

		foundry.utils.setProperty(itemData, CONSTANTS.FLAGS.ITEM + ".x", validPosition.x);
		foundry.utils.setProperty(itemData, CONSTANTS.FLAGS.ITEM + ".y", validPosition.y);
		foundry.utils.setProperty(itemData, CONSTANTS.FLAGS.ITEM + ".flipped", validPosition.flipped);

		return PrivateAPI._depositWithdrawItem({
			source, target, itemData: {
				item: itemData, quantity: 1
			}, gridPosition: validPosition
		});

	}

	async sortItemsOnGrid(event) {

		const mergeItems = event.ctrlKey;

		if (mergeItems) {
			const doMerge = await TJSDialog.confirm({
				title: "Item Piles",
				content: {
					class: CustomDialog,
					props: {
						header: game.i18n.localize("ITEM-PILES.Dialogs.SortMergeVaultItems.Title"),
						content: game.i18n.localize("ITEM-PILES.Dialogs.SortMergeVaultItems.Content")
					}
				},
				modal: true
			});
			if (!doMerge) return;
		}

		const gridItems = get(this.gridItems).map(item => item.item).sort((a, b) => {
			return b.size - a.size;
		}).map(item => item.item);

		const result = PileUtilities.fitItemsIntoVault(gridItems, this.actor, { existingItems: [], mergeItems });

		if (!result) return Helpers.custom_warning("ITEM-PILES.Warnings.CantSortVault", true);

		const { updates, deletions } = result;

		const itemUpdates = updates.map(item => ({
			_id: item._id,
			[game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE]: Utilities.getItemQuantity(item),
			[CONSTANTS.FLAGS.ITEM]: PileUtilities.cleanItemFlagData(PileUtilities.getItemFlagData(item))
		}))

		await this.actor.updateEmbeddedDocuments("Item", itemUpdates);
		await this.actor.deleteEmbeddedDocuments("Item", deletions);

	}

}

export class VaultItem extends PileItem {

	setupStores(...args) {
		super.setupStores(...args);
		this.transform = writable({
			x: 0, y: 0, w: 1, h: 1, flipped: false
		});
		this.ghostTransform = writable({
			x: 0, y: 0, w: 1, h: 1, flipped: false
		});
		this.active = writable(false);
		this.x = 0;
		this.y = 0;
		this.w = 1;
		this.h = 1;
		this.flipped = false;
		this.size = 1;
		this.style = writable({});
	}

	setupSubscriptions() {
		super.setupSubscriptions();
		let setup = false;
		this.subscribeTo(this.itemDocument, () => {
			let rarityColor = get(this.rarityColor);
			if (rarityColor) {
				this.style.set({ "box-shadow": `inset 0px 0px 7px 0px ${rarityColor}` });
			} else {
				this.style.set(SYSTEMS.DATA?.VAULT_STYLES ? SYSTEMS.DATA?.VAULT_STYLES.filter(style => {
					return getProperty(this.item, style.path) === style.value;
				}).reduce((acc, style) => {
					return foundry.utils.mergeObject(acc, style.styling);
				}, {}) : {});
			}
		});
		this.subscribeTo(this.itemFlagData, (data) => {
			if (setup) {
				helpers.debug("itemFlagData", data);
			}
			const { width, height } = PileUtilities.getVaultItemDimensions(this.item, data);
			this.transform.set({
				x: data.x, y: data.y, w: width, h: height, flipped: data.flipped ?? false
			});
			this.size = Math.max(width, height);
		});
		this.subscribeTo(this.transform, (transform) => {
			if (setup) {
				helpers.debug("transform", transform);
			}
			this.x = transform.x;
			this.y = transform.y;
			this.w = transform.w;
			this.h = transform.h;
			this.flipped = transform.flipped;
		});
		this.subscribeTo(this.quantity, () => {
			const itemFlagData = get(this.itemFlagData);
			if (!itemFlagData.vaultExpander) return;
			this.store.refreshFreeSpaces();
			this.store.refreshGridDebounce();
		})
		setup = true;
	}

	async take() {

		const pileData = get(this.store.pileData);
		const itemFlagData = get(this.itemFlagData);

		if (pileData.vaultExpansion && itemFlagData.vaultExpander) {
			const slotsLeft = this.store.canItemsFitWithout(this);
			if (slotsLeft < 0) {
				return TJSDialog.prompt({
					title: "Item Piles", content: {
						class: CustomDialog, props: {
							header: game.i18n.localize("ITEM-PILES.Dialogs.CantRemoveVaultExpander.Title"),
							content: game.i18n.format("ITEM-PILES.Dialogs.CantRemoveVaultExpander.Content", {
								num_items: Math.abs(slotsLeft)
							})
						}
					}, modal: true
				});
			}
		}

		let quantity = get(this.quantity);
		if (quantity > 1) {
			quantity = await DropItemDialog.show(this.item, this.store.actor, {
				localizationTitle: "WithdrawItem"
			});
		}
		return game.itempiles.API.transferItems(this.store.actor, this.store.recipient, [{
			_id: this.id, quantity
		}], { interactionId: this.store.interactionId });
	}

	async split(x, y, flipped) {

		let quantity = await DropItemDialog.show(this.item, this.store.actor, {
			localizationTitle: "SplitItem", quantityAdjustment: -1
		});

		await game.itempiles.API.removeItems(this.store.actor, [{
			_id: this.id, quantity
		}], { interactionId: this.store.interactionId });

		const itemData = this.item.toObject();

		const flags = PileUtilities.getItemFlagData(this.item);
		itemData._id = randomID();
		setProperty(flags, "x", x);
		setProperty(flags, "y", y);
		setProperty(flags, "flipped", flipped);
		setProperty(itemData, CONSTANTS.FLAGS.ITEM, flags);

		await game.itempiles.API.addItems(this.store.actor, [{
			item: itemData, quantity
		}], { interactionId: this.store.interactionId, skipVaultLogging: true });

	}

	async merge(itemToMerge) {

		const itemDelta = await game.itempiles.API.removeItems(this.store.actor, [{
			_id: itemToMerge.id
		}], {
			interactionId: this.store.interactionId, skipVaultLogging: true
		});

		return game.itempiles.API.addItems(this.store.actor, [{
			id: this.id, quantity: Math.abs(itemDelta[0].quantity)
		}], {
			interactionId: this.store.interactionId, skipVaultLogging: true
		})

	}

	areItemsSimilar(itemToCompare) {
		return !Utilities.areItemsDifferent(this.item, itemToCompare.item) && PileUtilities.canItemStack(itemToCompare.item, this.store.actor);
	}

}
