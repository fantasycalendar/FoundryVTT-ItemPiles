import VaultStylesEditorShell from './vault-styles-editor.svelte';
import Editor from "../Editor.js";

export default class VaultStylesEditor extends Editor {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Applications.VaultStylesEditor.Title"),
			svelte: {
				class: VaultStylesEditorShell,
			}
		})
	}
}
