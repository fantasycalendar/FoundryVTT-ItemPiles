import ItemPileStore from "../stores/item-pile-store.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import Transaction from "../helpers/transaction.js";
import { debug, isResponsibleGM } from "../helpers/helpers.js";
import { calendarAvailable, getCalendarState, getHolidaysInRange, getSecondsPerDay, getWeekdayCount } from "../helpers/calendar.js";

let plugin = null;
let previousState;

export function setupCalendar() {
	if (!calendarAvailable()) return;
	plugin = new CalendarPlugin();
	plugin.registerHooks();
}

class CalendarPlugin {

	constructor() {
		this.actors = [];
		this.validTokensOnScenes = [];
	}

	registerHooks() {
		previousState = getCalendarState();

		Hooks.on("updateWorldTime", async () => {
			ItemPileStore.notifyAllOfChanges("updateOpenCloseStatus");
			if (!isResponsibleGM()) return;
			this.handleTimePassed();
		});

		const debounceCollectAllMerchants = foundry.utils.debounce(() => {
			this.collectAllMerchants();
		}, 1000);

		Hooks.on("updateActor", () => {
			debounceCollectAllMerchants();
		});

		Hooks.on("updateToken", () => {
			debounceCollectAllMerchants();
		});

		this.collectAllMerchants();
	}

	collectAllMerchants() {
		this.actors = PileUtilities.getItemPileActors((actor) => {
			return PileUtilities.isItemPileMerchant(actor);
		});

		const { validTokensOnScenes } = PileUtilities.getItemPileTokens((token) => {
			return PileUtilities.isItemPileMerchant(token);
		});
		this.validTokensOnScenes = validTokensOnScenes;
	}

	handleTimePassed() {

		const newState = getCalendarState();

		const prevMinute = Math.floor(previousState.timestamp / 60);
		const newMinute = Math.floor(newState.timestamp / 60);
		if (prevMinute === newMinute) {
			previousState = newState;
			return;
		}

		debug("Running handleTimePassed");

		const holidays = getHolidaysInRange(previousState, newState);

		this.hideMerchantTokens();
		this.refreshMerchantInventories(newState, previousState, holidays);

		previousState = newState;

	}

	async hideMerchantTokens() {

		const actors = this.actors.filter((actor) => {
			const pileData = PileUtilities.getActorFlagData(actor);
			return pileData.hideTokenWhenClosed;
		});

		const validTokensOnScenes = actors.map(actor => actor.getActiveTokens())
			.deepFlatten()
			.reduce((acc, token) => {
				const tokenDocument = token.document;
				const sceneId = tokenDocument.parent.id;
				if (!acc[sceneId]) acc[sceneId] = [];
				acc[sceneId].push(tokenDocument);
				return acc;
			}, {});

		for (const [sceneId, tokens] of this.validTokensOnScenes) {
			for (const token of tokens) {
				const pileData = PileUtilities.getActorFlagData(token);
				if (!pileData.hideTokenWhenClosed) continue;
				if (!validTokensOnScenes[sceneId]) {
					validTokensOnScenes[sceneId] = [token];
					continue;
				}
				if (validTokensOnScenes[sceneId].includes(token)) continue;
				validTokensOnScenes[sceneId].push(token);
			}
		}

		for (const [sceneId, tokens] of Object.entries(validTokensOnScenes)) {
			const scene = game.scenes.get(sceneId);
			const updates = Object.values(tokens.reduce((acc, token) => {
				if (!acc[token.id]) {
					acc[token.id] = {
						_id: token.id,
						hidden: PileUtilities.isMerchantClosed(token)
					}
				}
				return acc;
			}, {}));
			if (updates.length) {
				debug(`Hid ${updates.length} merchant tokens on ${scene.name}`);
				await scene.updateEmbeddedDocuments("Token", updates, { animate: false });
			}
		}
	}

	async refreshMerchantInventories(newState, previousState, holidays) {

		const actors = this.actors.filter((actor) => {
			const flags = PileUtilities.getActorFlagData(actor);
			return merchantRefreshFilter(flags, newState, previousState, holidays);
		});

		const validTokensOnScenes = this.validTokensOnScenes.map(([scene, tokens]) => {
			return [scene, tokens.filter(token => {
				const flags = PileUtilities.getActorFlagData(token);
				return merchantRefreshFilter(flags, newState, previousState, holidays);
			})]
		}).filter(([_, tokens]) => tokens.length);

		if (actors.length) debug(`Refreshing ${actors.length} merchant inventories`);
		for (const actor of actors) {
			await this.refreshActorItems(actor, holidays);
		}

		for (const [sceneId, tokens] of validTokensOnScenes) {
			const scene = game.scenes.get(sceneId);
			if (tokens.length) debug(`Refreshing ${tokens.length} merchant inventories on scene ${scene.name}`);
			for (const token of tokens) {
				await this.refreshActorItems(token.actor, holidays);
			}
		}
	}

	async refreshActorItems(actor, holidays) {

		const actorTransaction = new Transaction(actor);

		const actorItems = game.itempiles.API.getActorItems(actor);
		const newActorItems = await PileUtilities.rollMerchantTables({ actor });

		await actorTransaction.appendItemChanges(actorItems.filter(item => {
			const itemFlags = PileUtilities.getItemFlagData(item);
			return !itemFlags.keepOnMerchant && !itemFlags.keepIfZero;
		}), { remove: true });

		await actorTransaction.appendItemChanges(actorItems.filter(item => {
			const itemFlags = PileUtilities.getItemFlagData(item);
			return !itemFlags.keepOnMerchant && itemFlags.keepIfZero;
		}), { remove: true, keepIfZero: true });

		await actorTransaction.appendItemChanges(newActorItems.map(entry => ({
			item: entry.item, quantity: entry.quantity, flags: entry.flags
		})));

		const commit = actorTransaction.prepare();

		const result = Hooks.call(CONSTANTS.HOOKS.PILE.PRE_REFRESH_INVENTORY, actor, commit, Array.from(holidays ?? []))
		if (result === false) return;

		await actorTransaction.commit();

	}
}

function merchantRefreshFilter(flags, newState, previousState, holidays) {

	const openTimesEnabled = flags.openTimes.enabled;
	const openTimes = flags.openTimes.open;
	const closeTimes = flags.openTimes.close;

	const openHour = openTimesEnabled ? openTimes.hour : 0;
	const openMinute = openTimesEnabled ? openTimes.minute : 0;
	const closeHour = openTimesEnabled ? closeTimes.hour : 0;
	const closeMinute = openTimesEnabled ? closeTimes.minute : 0;

	const openingTime = openHour * 60 + openMinute;
	const closingTime = closeHour * 60 + closeMinute;

	const wasOpen = openingTime > closingTime
		? (previousState.time >= openingTime || previousState.time <= closingTime)
		: (previousState.time >= openingTime && previousState.time <= closingTime);

	const isOpen = openingTime > closingTime
		? (newState.time >= openingTime || newState.time <= closingTime)
		: (newState.time >= openingTime && newState.time <= closingTime);

	const dayLength = getSecondsPerDay();
	const daysPassed = Math.floor((newState.timestamp - previousState.timestamp) / dayLength);

	const shouldRefreshOnCurrentWeekday = flags.refreshItemsDays.includes(newState.weekday);
	const shouldRefreshPastWeekday = flags.refreshItemsDays.length > 0 && daysPassed >= getWeekdayCount();

	return (flags.refreshItemsOnOpen && !wasOpen && isOpen && openTimesEnabled)
		|| shouldRefreshPastWeekday
		|| shouldRefreshOnCurrentWeekday
		|| holidays.intersection(new Set(flags.refreshItemsHolidays)).size > 0;

}
