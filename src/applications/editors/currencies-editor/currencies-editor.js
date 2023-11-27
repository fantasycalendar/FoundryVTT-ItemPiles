import CurrenciesEditorShell from './currencies-editor-shell.svelte';
import Editor from "../Editor.js";

export class CurrenciesEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Applications.CurrenciesEditor.Title"),
			width: 630,
			svelte: {
				class: CurrenciesEditorShell,
			}
		})
	}
}

export class SecondaryCurrenciesEditor extends CurrenciesEditor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Applications.SecondaryCurrenciesEditor.Title"),
			svelte: {
				props: {
					secondary: true
				}
			}
		})
	}
}
