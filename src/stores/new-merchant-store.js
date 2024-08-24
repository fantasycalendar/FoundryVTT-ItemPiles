import { writable, derived } from "svelte/store";
import * as PileUtilities from "../helpers/pile-utilities.js";
import { TJSDocument } from "#runtime/svelte/store/fvtt/document";
import * as Utilities from "../helpers/utilities.js";
import CONSTANTS from "../constants/constants.js";
import * as SharingUtilities from "../helpers/sharing-utilities.js";


export function MerchantStore(application, source, recipient = false) {

	const listeners = { subscriptions: [] };
	listeners.subscribe = (store, method) => listeners.subscriptions.push(store.subscribe(method));
	listeners.unsubscribe = () => listeners.subscriptions.forEach(subscription => subscription());

	const sourceActor = Utilities.getActor(source);
	const recipientActor = recipient ? Utilities.getActor(recipient) : false;

	const sourceDocument = new TJSDocument(sourceActor);
	const recipientDocument = recipient ? new TJSDocument(recipientActor) : false;

	const pileFlags = PileUtilities.getActorFlagData(sourceActor);
	const currencyList = PileUtilities.getCurrencyList(sourceActor);
	const pileCurrencies = PileUtilities.getActorCurrencies(sourceActor, { currencyList, getAll: true });
	const recipientCurrencies = recipient ? PileUtilities.getActorCurrencies(sourceActor, {
		currencyList,
		getAll: true
	}) : false;

	const store = writable({
		interactionId: foundry.utils.randomID(),
		uuid: Utilities.getUuid(sourceActor),
		pileFlags,
		application,
		sourceActor,
		sourceDocument,
		recipientActor,
		recipientDocument,
		deleted: false,
		search: "",
		editQuantities: !recipientDocument,
		allItems: [],
		attributes: [],
		items: [],
		visibleItems: [],
		currencyList,
		pileCurrencies,
		recipientCurrencies,
		currencies: [],
		allCurrencies: [],
		itemsPerCategory: {},
		categories: [],
		itemCategories: [],
		numItems: 0,
		numCurrencies: 0,
		name: "",
		img: "",
	});

	const { subscribe, update, set } = store;

	const filterDebounce = foundry.utils.debounce(() => {
		// TODO: refresh items!
		//refreshItems();
	}, 300);

	const searchStore = derived(store, ($store) => $store.search);

	listeners.subscribe(searchStore, data => {
		filterDebounce();
	});

	listeners.subscribe(sourceDocument, () => {
		const updateData = sourceDocument.updateOptions;
		const renderData = updateData?.renderData ?? updateData?.data ?? {};
		update(data => {
			data.shareData = foundry.utils.mergeObject(data.shareData, foundry.utils.getProperty(renderData, CONSTANTS.FLAGS.SHARING) ?? {});
			if (foundry.utils.hasProperty(renderData, CONSTANTS.FLAGS.PILE)) {
				data.pileData = PileUtilities.getActorFlagData(data.sourceActor);
				data.currencyList = PileUtilities.getCurrencyList(data.sourceActor);
				data.pileCurrencies = PileUtilities.getActorCurrencies(data.sourceActor, { currencyList, getAll: true });
				data.recipientCurrencies = data.recipientActor
					? PileUtilities.getActorCurrencies(data.recipientActor, { currencyList, getAll: true })
					: data.recipientCurrencies;
			}
			// TODO: refresh items!
			//refreshItems();
			data.name = data.sourceActor.name;
			data.img = data.pileFlags?.merchantImage || data.sourceActor.img;
			return data;
		})
	});

	if (recipientDocument) {
		listeners.subscribe(recipientDocument, () => {
			const updateData = this.document.updateOptions;
			const renderData = updateData?.renderData ?? updateData?.data ?? {};
			if (!foundry.utils.hasProperty(renderData, CONSTANTS.FLAGS.SHARING) && !foundry.utils.hasProperty(renderData, CONSTANTS.FLAGS.PILE))
				update(data => {
					data.recipientShareData = SharingUtilities.getItemPileSharingData(data.recipientActor);
					data.recipientPileData = PileUtilities.getActorFlagData(data.recipientActor);
					data.recipientCurrencies = PileUtilities.getActorCurrencies(data.recipientActor, {
						currencyList: data.currencyList,
						getAll: true
					});
					// TODO: refresh items!
					//refreshItems();
					return data;
				})
		})
	}

	return {
		subscribe,
		update,
		set,
		destroy: listeners.unsubscribe
	}

}
