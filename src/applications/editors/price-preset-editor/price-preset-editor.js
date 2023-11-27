import PricePresetEditorShell from "./price-preset-editor-shell.svelte";
import Editor from "../Editor.js";

export default class PricePresetEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: `item-pile-price-preset-editor-${randomID()}`,
			title: game.i18n.format("ITEM-PILES.Applications.PricePresetEditor.Title"),
			width: 500,
			svelte: {
				class: PricePresetEditorShell,
			}
		})
	}
}
