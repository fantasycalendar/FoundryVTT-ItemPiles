import StylesEditorShell from './styles-editor.svelte';
import Editor from "../Editor.js";

export default class StylesEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Applications.StylesEditor.Title"),
			svelte: {
				class: StylesEditorShell,
			}
		})
	}
}
