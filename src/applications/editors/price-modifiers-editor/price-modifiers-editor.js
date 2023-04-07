import PriceModifiersEditorShell from './price-modifiers-editor-shell.svelte';
import Editor from "../Editor.js";

export default class PriceModifiersEditor extends Editor {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.PriceModifiersEditor.Title"),
      width: 600,
      svelte: {
        class: PriceModifiersEditorShell
      }
    })
  }
}
