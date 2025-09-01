import { get, writable } from "svelte/store";
import * as Utilities from "../helpers/utilities.js";
import { TJSDocument } from "#runtime/svelte/store/fvtt/document";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import CONSTANTS from "../constants/constants.js";
import { getItemTypeHandler } from "../helpers/utilities.js";

const existingStores = new Map();

function getActorItems(actor, actorFlags) {
	return new Map(PileUtilities.getActorItems(actor).map(item => {
		let itemFlag = PileUtilities.getItemFlagData(item);

		let category = {
			label: "",
			type: "",
			service: false
		}
		category.service = itemFlag?.isService;
		if (itemFlag.customCategory) {
			category.type = itemFlag.customCategory.toLowerCase();
			category.label = itemFlag.customCategory;
		} else if (category.service && actorFlags.enabled && actorFlags.type === CONSTANTS.PILE_TYPES.MERCHANT) {
			category.type = "item-piles-service";
			category.label = "ITEM-PILES.Merchant.Service";
		} else {
			category.type = this.type;
			category.label = CONFIG.Item.typeLabels[this.type];
		}

		let parentId = false;
		let containerHandler = Utilities.getItemTypeHandler(CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED);
		if (containerHandler) {
			parentId = containerHandler({ item });
		}

		return [item.id, {
			id: item.id,
			name: item.name,
			img: item.img,
			type: item.type,
			flags: itemFlag,
			quantity: Utilities.getItemQuantity(item),
			stackable: Utilities.isItemStackable(item),
			cost: Utilities.getItemCost(item),
			visible: true,
			parentId,
			category
		}]
	}));
}

export default (doc) => {

	const actor = Utilities.getActor(doc);
	const uuid = Utilities.getUuid(actor);

	if (existingStores.has(uuid)) {
		return existingStores.get(uuid);
	}

	const document = new TJSDocument(actor);

	const subscriptions = [];

	const store = writable({
		interactionId: foundry.utils.randomID(),
		uuid,
		actor,
		document,
		flags: PileUtilities.getActorFlagData(actor),
		shareFlags: SharingUtilities.getItemPileSharingData(actor),
		deleted: false,
		search: "",
		items: new Map(),
		appIds: []
	});

	const { subscribe, update, set } = store;

	store.addApplication = (appId) => {
		console.log("Adding application", appId);
		update(data => {
			data.appIds.push(appId);
			return data;
		})
	}

	store.removeApplication = (appId) => {
		console.log("Removing application", appId);
		update(data => {
			data.appIds = data.appIds.filter(id => id !== appId);
			if (data.appIds.length === 0) {
				console.log("Removing store", uuid, "because no more applications are using it")
				subscriptions.forEach(subscription => subscription());
				existingStores.delete(uuid);
			}
			return data;
		})
	}

	subscriptions.push(document.subscribe(() => {
		update(data => {
			data.flags = PileUtilities.getActorFlagData(data.actor);
			data.shareFlags = SharingUtilities.getItemPileSharingData(actor);
			data.items = getActorItems(data.actor, data.flags);
			console.log(data.items)
			console.log("Updating store", uuid, "because document changed");
			return data;
		})
	}));

	subscriptions.push(subscribe((newData) => {
		update(data => {
			let cleanSearch = newData.search.trim().toLowerCase();
			if (newData.search) {
				data.items.forEach(item => {
					let cleanName = item.name.trim().toLowerCase();
					item.visible = cleanName.includes(cleanSearch);
				})
			}
		})
	}));

	existingStores.set(uuid, store);

	return store;

}