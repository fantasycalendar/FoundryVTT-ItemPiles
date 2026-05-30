import ItemPriceModifiersEditorShell from './item-price-modifiers-editor.svelte';
import Editor from "../Editor.js";

export default class ItemPriceModifiersEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Applications.ItemPriceModifiersEditor.Title"),
			width: 600,
			svelte: {
				class: ItemPriceModifiersEditorShell
			}
		})
	}
}
