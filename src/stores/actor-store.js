import { writable } from "svelte/store";
import * as Utilities from "../helpers/utilities.js";
import { TJSDocument } from "#runtime/svelte/store/fvtt/document";
import * as PileUtilities from "../helpers/pile-utilities.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";
import { SYSTEMS } from "../systems.js";

const existingStores = new Map();

function getActorItems(actor) {
	return PileUtilities.getActorItems(actor).map(item => {
		return {
			id: item.id,
			name: item.name,
			img: item.img,
			type: item.type,
			flags: PileUtilities.getItemFlagData(item),
			quantity: Utilities.getItemQuantity(item),
			stackable: Utilities.isItemStackable(item)
		}
	});
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
		pileData: PileUtilities.getActorFlagData(actor),
		shareData: SharingUtilities.getItemPileSharingData(actor),
		deleted: false,
		search: "",
		items: [],
		visibleItems: [],
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
			data.pileData = PileUtilities.getActorFlagData(data.actor);
			data.items = getActorItems(data.actor);
			console.log(data.items)
			console.log("Updating store", uuid, "because document changed");
			return data;
		})
	}));

	existingStores.set(uuid, store);

	return store;

}