import ItemTypePriceModifiersShell from './item-type-price-modifiers-editor.svelte';
import Editor from "../Editor.js";

export default class ItemTypePriceModifiersEditor extends Editor {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.Title"),
      width: 600,
      svelte: {
        class: ItemTypePriceModifiersShell,
      }
    })
  }
}
