import CONSTANTS from "../constants/constants.js";
import ItemPileSocket from "../socket.js";
import SETTINGS from "../constants/settings.js";
import editors from "../applications/editors/index.js";
import API from "../API/api.js";


export const debounceManager = {

	debounces: {},

	setDebounce(id, method) {
		if (this.debounces[id]) {
			return this.debounces[id];
		}
		this.debounces[id] = foundry.utils.debounce(function (...args) {
			delete debounceManager.debounces[id];
			return method(...args);
		}, 250);
		return this.debounces[id];
	}
};

export const hooks = {
	run: true,
	_hooks: {},

	async runWithout(callback) {
		await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.TOGGLE_HOOKS, false);
		await callback();
		await ItemPileSocket.executeForEveryone(ItemPileSocket.HANDLERS.TOGGLE_HOOKS, true);
	},

	call(hook, ...args) {
		if (!this.run) return;
		return Hooks.call(hook, ...args);
	},

	callAll(hook, ...args) {
		if (!this.run) return;
		return Hooks.callAll(hook, ...args);
	},

	on(hook, callback) {
		Hooks.on(hook, (...args) => {
			if (!this.run) return;
			callback(...args);
		});
	}
}

export function getModuleVersion() {
	return game.modules.get(CONSTANTS.MODULE_NAME).version;
}

/**
 *  This function determines if the given parameter is a callable function
 *
 * @param  {function}   inFunc    The function object to be tested
 * @return {boolean}              A boolean whether the function is actually a function
 */
export function isFunction(inFunc) {
	return inFunc && (
		{}.toString.call(inFunc) === '[object Function]'
		||
		{}.toString.call(inFunc) === '[object AsyncFunction]'
	);
}

export function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param key
 * @returns {*}
 */
export function getSetting(key) {
	return game.settings.get(CONSTANTS.MODULE_NAME, key);
}

export function setSetting(key, value) {
	if (value === undefined) {
		throw new Error("setSetting | value must not be undefined!");
	}
	return game.settings.set(CONSTANTS.MODULE_NAME, key, value);
}

export function debug(msg, args = "") {
	if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) {
		console.log(`DEBUG | Item Piles | ${msg}`, args)
	}
}

export function custom_notify(message) {
	message = `Item Piles | ${message}`;
	if (CONSTANTS.IS_V13) {
		ui.notifications.notify(message, "info", { console: false });
	} else {
		ui.notifications.notify(message, { console: false });
	}
	console.log(message.replace("<br>", "\n"));
}

export function custom_warning(warning, notify = false, permanent = false) {
	warning = `Item Piles | ${warning}`;
	if (notify) {
		ui.notifications.warn(warning, { console: false, permanent });
	}
	console.warn(warning.replace("<br>", "\n"));
}

export function custom_error(error, notify = true, permanent = false) {
	error = `Item Piles | ${error}`;
	if (notify) {
		ui.notifications.error(error, { console: false, permanent });
	}
	return new Error(error.replace("<br>", "\n"));
}

export function capitalizeFirstLetter(str) {
	return str.slice(0, 1).toUpperCase() + str.slice(1);
}

export function isRealNumber(inNumber) {
	return !isNaN(inNumber)
		&& typeof inNumber === "number"
		&& isFinite(inNumber);
}

export function isActiveGM(user) {
	return user.active && user.isGM;
}

export function getActiveGMs() {
	return game.users.filter(isActiveGM);
}

export function isResponsibleGM() {
	if (!game.user.isGM) {
		return false;
	}
	return !getActiveGMs().some(other => other.id < game.user.id);
}

export function getResponsibleGM() {
	const activeGMs = getActiveGMs();
	if (!activeGMs.length) return false;
	return activeGMs.sort((a, b) => b.id > a.id)?.[0];
}

export function isGMConnected() {
	return !!Array.from(game.users).find(user => user.isGM && user.active);
}

export function roundToDecimals(num, decimals) {
	if (!decimals) return Math.floor(num);
	return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
}

export function clamp(num, min, max) {
	return Math.max(Math.min(num, max), min);
}

export function getActiveApps(id, single = false) {
	const apps = Object.values(ui.windows).filter(app => app.id.startsWith(id) && app._state > Application.RENDER_STATES.CLOSED);
	if (single) {
		return apps?.[0] ?? false;
	}
	return apps;
}

/**
 *  This function linearly interpolates between p1 and p2 based on a normalized value of t
 *
 * @param  {string}         inFile      The start value
 * @param  {object}         inOptions   The end value
 * @return {array|boolean}              Interpolated value
 */
export async function getFiles(inFile, { applyWildCard = false, softFail = false } = {}) {

	let source = 'data';
	const browseOptions = { wildcard: applyWildCard };

	if (/\.s3\./.test(inFile)) {
		source = 's3'
		const { bucket, keyPrefix } = FilePicker.parseS3URL(inFile);
		if (bucket) {
			browseOptions.bucket = bucket;
			inFile = keyPrefix;
		}
	}

	try {
		return (await FilePicker.browse(source, inFile, browseOptions)).files;
	} catch (err) {
		if (softFail) return false;
		throw custom_error(`Could not get files! | ${err}`);
	}
}

/**
 *  Returns a floating point number between a minimum and maximum value
 *
 * @param  {number}     min                     The minimum value
 * @param  {number}     max                     The maximum value
 * @return {number}                             A random value between the range given
 */
export function random_float_between(min, max) {
	const random = Math.random();
	const _max = Math.max(max, min);
	const _min = Math.min(max, min);
	return random * (_max - _min) + _min;
}

/**
 *  Returns an integer between a minimum and maximum value
 *
 * @param  {number}     min                     The minimum value
 * @param  {number}     max                     The maximum value
 * @return {int}                                A random integer between the range given
 */
export function random_int_between(min, max) {
	return Math.floor(random_float_between(min, max));
}

/**
 *  Returns a random element in the given array
 *
 * @param  {array}   inArray                    An array
 * @param  {boolean} recurse                    Whether to recurse if the randomly chosen element is also an array
 * @return {object}                             A random element from the array
 */
export function random_array_element(inArray, { recurse = false } = {}) {
	let choice = inArray[random_int_between(0, inArray.length)];
	if (recurse && Array.isArray(choice)) {
		return random_array_element(choice, { recurse: true });
	}
	return choice;
}


export function styleFromObject(obj, vars = false) {
	return Object.entries(obj).map(entry => (vars ? "--" : "") + entry[0] + ': ' + entry[1] + ";").join("");
}


export function abbreviateNumbers(number, decPlaces = 2) {

	// 2 decimal places => 100, 3 => 1000, etc
	decPlaces = Math.pow(10, decPlaces)

	// Enumerate number abbreviations
	let abbrev = ['k', 'm', 'b', 't']

	// Go through the array backwards, so we do the largest first
	for (let i = abbrev.length - 1; i >= 0; i--) {

		// Convert array index to "1000", "1000000", etc
		let size = Math.pow(10, (i + 1) * 3)

		// If the number is bigger or equal do the abbreviation
		if (size <= number) {
			// Here, we multiply by decPlaces, round, and then divide by decPlaces.
			// This gives us nice rounding to a particular decimal place.
			number = Math.round((number * decPlaces) / size) / decPlaces

			// Handle special case where we round up to the next abbreviation
			if (number === 1000 && i < abbrev.length - 1) {
				number = 1
				i++
			}

			// Add the letter for the abbreviation
			number += abbrev[i]

			// We are done... stop
			break;
		}
	}

	return number
}


export function timeSince(date) {
	const seconds = Math.floor((new Date() - date) / 1000);
	const intervals = {
		"d": 86400,
		"h": 3600,
		"m": 60
	}

	for (const [key, value] of Object.entries(intervals)) {
		const interval = seconds / value;
		if (interval > 1) {
			return Math.floor(interval) + key;
		}
	}

	return Math.ceil(seconds) + "s";
}


export function getApplicationPositions(application_1, application_2 = false) {

	let midPoint = (window.innerWidth / 2);

	if (!application_2) {
		if (((midPoint - 200) - application_1.position.width - 25) > 0) {
			midPoint -= 200
		}
		return [
			{ left: midPoint - application_1.position.width - 25 },
			{ left: midPoint + 25 }
		]
	}

	const application_1_position = {
		left: application_1.position.left,
		top: application_1.position.top,
		width: application_1.position.width
	};
	const application_2_position = {
		left: application_2.position.left,
		top: application_1.position.top,
		width: application_2.position.width
	};

	application_2_position.left = application_1_position.left - application_2_position.width - 25;
	if (application_2_position.left < 0) {
		application_2_position.left = application_1_position.left + application_1_position.width + 25
	}
	if ((application_2_position.left + application_2_position.width) > window.innerWidth) {
		application_2_position.left = midPoint - application_2_position.width - 25;
		application_1_position.left = midPoint + 25;
	}

	return [
		application_1_position,
		application_2_position
	]

}

export async function openEditor(key, data = false) {

	const setting = SETTINGS.DEFAULTS()[key];

	const editor = editors[setting.application];

	if (!data) {
		data = getSetting(key);
	}

	const result = await editor.show(data, { ...setting.applicationOptions, onchange: setting.onchange } ?? {});

	if (setting.onchange && result) setting.onchange(result);

	return result;

}

export function isCoordinateWithinPosition(x, y, position) {
	return x >= position.left && x < position.left + position.width
		&& y >= position.top && y < position.top + position.height;
}


export function getCanvasMouse() {
	return canvas?.app?.renderer?.plugins?.interaction?.pointer ?? canvas?.app?.renderer?.events?.pointer;
}

export function deprecate(target, method, message) {
	return new Proxy(target, {
		get(target, prop, receiver) {
			if (method === prop) {
				console.warn(message);
			}
			return Reflect.get(target, prop, receiver);
		}
	});
}

export function downloadText(text, filename) {
	const a = document.createElement("a");
	const file = new Blob([text], { type: "text/json" });
	const url = URL.createObjectURL(file)
	a.href = url;
	a.download = filename;
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function uploadJSON() {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';

		input.onchange = e => {

			input.remove();

			// getting a hold of the file reference
			const file = e.target.files[0];

			const reader = new FileReader();
			reader.addEventListener('load', async () => {
				try {
					const loadedData = JSON.parse(reader.result);
					resolve(loadedData)
				} catch (err) {
					console.error(err);
					reject(err);
				}
			});

			reader.readAsText(file);

		}

		input.click();
	})
}