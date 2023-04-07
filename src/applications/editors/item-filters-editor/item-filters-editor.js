import ItemFiltersShell from './item-filters-editor.svelte';
import Editor from "../Editor.js";

export default class ItemFiltersEditor extends Editor {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: "ITEM-PILES.Applications.FilterEditor.Title",
      svelte: {
        class: ItemFiltersShell,
      }
    })
  }
}
