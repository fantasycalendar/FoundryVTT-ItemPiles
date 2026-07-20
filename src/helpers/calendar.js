import CONSTANTS from "../constants/constants.js";

export function calendarAvailable() {
	return !!game.time?.calendar;
}

export function getCalendarState() {
	const calendar = game.time?.calendar;
	if (!calendar) return null;
	const c = game.time.components;
	return {
		hour: c.hour,
		minute: c.minute,
		second: c.second,
		time: c.hour * 60 + c.minute,
		timestamp: game.time.worldTime,
		weekday: calendar.days.values[c.dayOfWeek]?.name
	};
}

export function getSecondsPerDay() {
	return game.time.calendar.componentsToTime({ day: 1 });
}

export function getWeekdayCount() {
	return game.time.calendar.days.values.length;
}

export function getWeekdays() {
	const calendar = game.time?.calendar;
	if (!calendar) return [];
	return calendar.days.values.map(weekday => ({
		id: weekday.name,
		label: game.i18n.localize(weekday.name),
		abbr: game.i18n.localize(weekday.abbreviation ?? weekday.name)
	}));
}

export function getHolidayDefinitions() {
	const holidays = [];
	Hooks.callAll(CONSTANTS.HOOKS.MERCHANT.GET_HOLIDAYS, holidays);
	const seen = new Set();
	return holidays.filter(holiday => {
		if (!holiday?.id || seen.has(holiday.id)) return false;
		seen.add(holiday.id);
		return true;
	});
}

function getActiveHolidays(start, end) {
	const calendar = game.time?.calendar;
	if (!calendar) return new Set();
	const active = new Set();
	Hooks.callAll(CONSTANTS.HOOKS.MERCHANT.GET_ACTIVE_HOLIDAYS, {
		start,
		end,
		startDate: calendar.timeToComponents(start),
		endDate: calendar.timeToComponents(end)
	}, active);
	return active;
}

export function getHolidaysOnDay(state) {
	const calendar = game.time?.calendar;
	if (!calendar) return new Set();
	const { secondsPerMinute, minutesPerHour } = calendar.days;
	const secondsIntoDay = ((state.hour * minutesPerHour) + state.minute) * secondsPerMinute + state.second;
	const startOfDay = state.timestamp - secondsIntoDay;
	const endOfDay = startOfDay + getSecondsPerDay() - 1;
	return getActiveHolidays(startOfDay, endOfDay);
}

export function getHolidaysInRange(previousState, newState) {
	return getActiveHolidays(previousState.timestamp, newState.timestamp);
}
