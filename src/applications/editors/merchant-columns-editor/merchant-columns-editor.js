import MerchantColumnsEditorShell from "./merchant-columns-editor-shell.svelte";
import Editor from "../Editor.js";

export default class MerchantColumnsEditor extends Editor {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: "ITEM-PILES.Applications.MerchantColumnsEditor.Title",
      width: 600,
      svelte: {
        class: MerchantColumnsEditorShell
      }
    })
  }
}
