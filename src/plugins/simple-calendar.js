import BasePlugin from "./base-plugin.js";
import ItemPileStore from "../stores/item-pile-store.js";
import * as PileUtilities from "../helpers/pile-utilities.js";
import CONSTANTS from "../constants/constants.js";
import Transaction from "../helpers/transaction.js";

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
    Hooks.on(window.SimpleCalendar.Hooks.DateTimeChange, () => {
      ItemPileStore.notifyAllOfChanges("updateOpenCloseStatus");
      this.handleTimePassed();
    });
  }

  async handleTimePassed() {

    const newState = {
      dateTime: window.SimpleCalendar.api.currentDateTime(),
      weekday: window.SimpleCalendar.api.getCurrentWeekday(),
      timestamp: window.SimpleCalendar.api.dateToTimestamp({})
    }

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

    const actors = PileUtilities.getItemPileActors((actor) => {
      const flags = PileUtilities.getActorFlagData(actor, getProperty(actor, CONSTANTS.FLAGS.PILE));
      if (flags.type !== CONSTANTS.PILE_TYPES.MERCHANT) return false;
      return merchantRefreshFilter(flags, newState, previousState, categories);
    });

    const { validTokensOnScenes } = PileUtilities.getItemPileTokens((token) => {
      const flags = PileUtilities.getActorFlagData(token, getProperty(token, CONSTANTS.FLAGS.PILE));
      if (flags.type !== CONSTANTS.PILE_TYPES.MERCHANT) return false;
      return merchantRefreshFilter(flags, newState, previousState, categories);
    });

    previousState = newState;

    for (const actor of actors) {
      await this.refreshActorItems(actor, notes);
    }

    for (const [_, tokens] of validTokensOnScenes) {
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
  const previousTime = Number(previousState.dateTime.hour.toString() + "." + previousState.dateTime.minute.toString());
  const currentTime = Number(newState.dateTime.hour.toString() + "." + newState.dateTime.minute.toString());

  const wasOpen = openingTime > closingTime
    ? (previousTime >= openingTime || previousTime <= closingTime)
    : (previousTime >= openingTime && previousTime <= closingTime);

  const isOpen = openingTime > closingTime
    ? (currentTime >= openingTime || currentTime <= closingTime)
    : (currentTime >= openingTime && currentTime <= closingTime);

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
