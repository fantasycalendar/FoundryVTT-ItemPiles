import UnstackableItemTypesEditorShell from './unstackable-item-types-editor.svelte';
import Editor from "../Editor.js";

export default class UnstackableItemTypesEditor extends Editor {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.UnstackableItemTypesEditor.Title"),
      width: 300,
      svelte: {
        class: UnstackableItemTypesEditorShell,
      },
    })
  }
}
