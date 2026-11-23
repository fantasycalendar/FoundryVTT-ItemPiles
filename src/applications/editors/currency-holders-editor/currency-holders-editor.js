import CurrencyHoldersEditorShell from './currency-holders-editor.svelte';
import Editor from "../Editor.js";

export default class CurrencyHoldersEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: "ITEM-PILES.Applications.CurrencyHoldersEditor.Title",
			width: 640,
			svelte: {
				class: CurrencyHoldersEditorShell,
			}
		})
	}
}
