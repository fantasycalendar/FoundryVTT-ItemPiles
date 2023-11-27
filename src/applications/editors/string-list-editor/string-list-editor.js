import StringListEditorShell from './string-list-editor.svelte';
import Editor from "../Editor.js";

export default class StringListEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			svelte: {
				class: StringListEditorShell
			}
		})
	}
}
