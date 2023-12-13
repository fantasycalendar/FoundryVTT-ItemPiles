import BasePlugin from "./base-plugin.js";
import ItemPileStore from "../stores/item-pile-store.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import Transaction from "../helpers/transaction.js";
import { debug, isResponsibleGM } from "../helpers/helpers.js";

let previousState;

export default class SimpleCalendarPlugin extends BasePlugin {

	invalidVersionError = "Simple Calendar version 1.3.75 is installed, but Item Piles requires version 2.0.0 or above. The author made a mistake, and you will need to reinstall the Simple Calendar module.";
	minVersionError = "Simple Calendar is out of date to be compatible with Item Piles, please update as soon as possible.";

	registerHooks() {
		previousState = {
			dateTime: window.SimpleCalendar.api.currentDateTime(),
			weekday: window.SimpleCalendar.api.getCurrentWeekday(),
			timestamp: window.SimpleCalendar.api.dateToTimestamp({})
		}
		previousState.time = Number(previousState.dateTime.hour.toString() + "." + previousState.dateTime.minute.toString());

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
		})

		Hooks.on("updateToken", () => {
			debounceCollectAllMerchants();
		})

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

		const newState = {
			dateTime: window.SimpleCalendar.api.currentDateTime(),
			weekday: window.SimpleCalendar.api.getCurrentWeekday(),
			timestamp: window.SimpleCalendar.api.dateToTimestamp({})
		}
		newState.time = Number(newState.dateTime.hour.toString() + "." + newState.dateTime.minute.toString());

		const prevMinute = Math.floor(previousState.timestamp / 60);
		const newMinute = Math.floor(newState.timestamp / 60);
		if (prevMinute === newMinute) {
			previousState = newState;
			return;
		}

		debug("Running handleTimePassed");

		const currentCalendar = window.SimpleCalendar.api.getCurrentCalendar();
		const numWeekdays = currentCalendar.weekdays.length;

		const notes = window.SimpleCalendar.api.getNotes()
			.filter(note => getProperty(note, "flags.foundryvtt-simple-calendar.noteData.categories")?.length)
			.map(note => {
				const flags = getProperty(note, "flags.foundryvtt-simple-calendar.noteData");
				let timestampData = {
					year: flags.startDate.year,
					month: flags.startDate.month,
					day: flags.startDate.day,
					hour: flags.allDay ? 0 : flags.startDate.hour,
					minute: flags.allDay ? 0 : flags.startDate.minute,
					seconds: flags.allDay ? 0 : flags.startDate.seconds,
				};
				switch (flags?.repeats) {
					case window.SimpleCalendar.api.NoteRepeat.Weekly:
						const noteWeekDay = window.SimpleCalendar.api.timestampToDate(window.SimpleCalendar.api.dateToTimestamp(timestampData)).dayOfTheWeek - 1;
						const currentWeekDay = window.SimpleCalendar.api.timestampToDate(newState.timestamp).dayOfTheWeek - 1;
						let weekdayCountDifference = currentWeekDay - noteWeekDay;
						if (weekdayCountDifference < 0) {
							weekdayCountDifference += numWeekdays
						}
						timestampData.year = newState.dateTime.year;
						timestampData.month = newState.dateTime.month;
						timestampData.day = newState.dateTime.day;
						const weekInSeconds = SimpleCalendar.api.timestampPlusInterval(0, { day: 1 }) * weekdayCountDifference;
						const timestamp = window.SimpleCalendar.api.dateToTimestamp(timestampData) - weekInSeconds;
						timestampData.day = window.SimpleCalendar.api.timestampToDate(timestamp).day;
						break;

					case window.SimpleCalendar.api.NoteRepeat.Monthly:
						timestampData.year = newState.dateTime.year;
						timestampData.month = newState.dateTime.month;
						break;

					case window.SimpleCalendar.api.NoteRepeat.Yearly:
						timestampData.year = newState.dateTime.year;
						break;
				}
				return {
					document: note,
					flags,
					dateTime: timestampData,
					timestamp: window.SimpleCalendar.api.dateToTimestamp(timestampData)
				}
			})
			.filter(note => {
				return note.timestamp > previousState.timestamp && note.timestamp <= newState.timestamp;
			});

		const categories = new Set(notes.map(note => note.flags?.categories ?? []).deepFlatten());

		this.hideMerchantTokens();
		this.refreshMerchantInventories(newState, previousState, categories, notes);

		previousState = newState;

	}

	async hideMerchantTokens() {

		const actors = this.actors.filter((actor) => {
			const pileData = PileUtilities.getActorFlagData(actor);
			return pileData.hideTokenWhenClosed && PileUtilities.isMerchantClosed(actor, { pileData });
		});

		const actorTokens = actors.map(actor => actor.getActiveTokens())
			.deepFlatten()
			.reduce((acc, token) => {
				if (!acc[token.parent.id]) acc[token.parent.id] = [];
				acc[token.parent.id].push(token);
				return acc;
			}, {});

		const validTokensOnScenes = this.validTokensOnScenes.filter((token) => {
			const pileData = PileUtilities.getActorFlagData(token);
			return pileData.hideTokenWhenClosed && PileUtilities.isMerchantClosed(token, { pileData });
		});

		for (const [sceneId, tokens] of validTokensOnScenes) {
			const scene = game.scenes.get(sceneId);
			const updates = Object.values(tokens.concat(actorTokens).reduce((acc, token) => {
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
				await scene.updateEmbeddedDocuments("Token", updates);
			}
		}
	}

	async refreshMerchantInventories(newState, previousState, categories, notes) {

		const actors = this.actors.filter((actor) => {
			const flags = PileUtilities.getActorFlagData(actor);
			return merchantRefreshFilter(flags, newState, previousState, categories);
		});

		const validTokensOnScenes = this.validTokensOnScenes.map(([scene, tokens]) => {
			return [scene, tokens.filter(token => {
				const flags = PileUtilities.getActorFlagData(token);
				return merchantRefreshFilter(flags, newState, previousState, categories);
			})]
		}).filter(([_, tokens]) => tokens.length);

		if (actors.length) debug(`Refreshing ${actors.length} merchant inventories`);
		for (const actor of actors) {
			await this.refreshActorItems(actor, notes);
		}

		for (const [sceneId, tokens] of validTokensOnScenes) {
			const scene = game.scenes.get(sceneId);
			if (tokens.length) debug(`Refreshing ${tokens.length} merchant inventories on scene ${scene.name}`);
			for (const token of tokens) {
				await this.refreshActorItems(token.actor, notes);
			}
		}
	}

	async refreshActorItems(actor, notes) {

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

		const result = Hooks.call(CONSTANTS.HOOKS.PILE.PRE_REFRESH_INVENTORY, actor, commit, notes)
		if (result === false) return;

		await actorTransaction.commit();

	}
}

function merchantRefreshFilter(flags, newState, previousState, categories) {

	const openTimesEnabled = flags.openTimes.enabled;

	if (!openTimesEnabled) return false;

	const openTimes = flags.openTimes.open;
	const closeTimes = flags.openTimes.close;

	const openHour = openTimesEnabled ? openTimes.hour : 0;
	const openMinute = openTimesEnabled ? openTimes.minute : 0;
	const closeHour = openTimesEnabled ? closeTimes.hour : 0;
	const closeMinute = openTimesEnabled ? closeTimes.minute : 0;

	const openingTime = Number(openHour.toString() + "." + openMinute.toString());
	const closingTime = Number(closeHour.toString() + "." + closeMinute.toString());

	const wasOpen = openingTime > closingTime
		? (previousState.time >= openingTime || previousState.time <= closingTime)
		: (previousState.time >= openingTime && previousState.time <= closingTime);

	const isOpen = openingTime > closingTime
		? (newState.time >= openingTime || newState.time <= closingTime)
		: (newState.time >= openingTime && newState.time <= closingTime);

	const allWeekdays = window.SimpleCalendar.api.getAllWeekdays();
	const dayLength = SimpleCalendar.api.timestampPlusInterval(0, { day: 1 });

	const daysPassed = Math.floor((newState.timestamp - previousState.timestamp) / dayLength);

	const currentWeekday = newState.weekday;

	const shouldRefreshOnCurrentWeekday = flags.refreshItemsDays.includes(currentWeekday.name);
	const shouldRefreshPastWeekday = flags.refreshItemsDays.length > 0 && daysPassed >= allWeekdays.length;

	const shouldRefresh = (
		flags.refreshItemsOnOpen ||
		shouldRefreshOnCurrentWeekday ||
		shouldRefreshPastWeekday ||
		categories.intersection(new Set(flags.refreshItemsHolidays)).size > 0
	);

	return (!wasOpen && isOpen) && shouldRefresh;

}
