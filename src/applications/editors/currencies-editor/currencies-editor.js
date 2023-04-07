import CurrenciesEditorShell from './currencies-editor-shell.svelte';
import Editor from "../Editor.js";

export default class CurrenciesEditor extends Editor {
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
