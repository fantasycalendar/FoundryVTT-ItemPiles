import VaultAccessEditorShell from './vault-access-editor-shell.svelte';
import Editor from "../Editor.js";

export default class VaultAccessEditor extends Editor {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 600,
      svelte: {
        class: VaultAccessEditorShell
      }
    })
  }
}
