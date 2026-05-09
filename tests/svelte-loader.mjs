import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const stubs = {
	'#runtime/svelte/store/fvtt/document': './tests/runtime-document.mjs',
	'#runtime/svelte/application': './tests/runtime-application.mjs',
	'#runtime/util/i18n': './tests/runtime-i18n.mjs'
};

export async function resolve(specifier, context, defaultResolve) {
	if (stubs[specifier]) {
		return {
			shortCircuit: true,
			url: pathToFileURL(stubs[specifier]).href
		};
	}
	if ((specifier.startsWith('./') || specifier.startsWith('../')) && !specifier.match(/\.[cm]?js$|\.svelte$/)) {
		const resolved = new URL(specifier, context.parentURL);
		if (existsSync(resolved.pathname + '.js')) {
			return {
				shortCircuit: true,
				url: resolved.href + '.js'
			};
		}
	}
	return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
	if (url.endsWith('.svelte')) {
		return {
			format: 'module',
			shortCircuit: true,
			source: 'export default class MockSvelteComponent {}'
		};
	}
	return defaultLoad(url, context, defaultLoad);
}
