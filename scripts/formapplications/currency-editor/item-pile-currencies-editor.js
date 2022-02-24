
import { TJSDialog }          from '@typhonjs-fvtt/runtime/svelte/application';

import ItemPileCurrenciesEditorShell from './item-pile-currencies-editor.svelte';
import CONSTANTS from "../../constants";

export default class ItemPileCurrenciesEditor extends TJSDialog {

   constructor(pileCurrencies = false, options, dialogData = {}) {
      super({
         ...dialogData,
         title: game.i18n.localize("ITEM-PILES.CurrenciesEditor.Title"),
         zIndex: 50,
         content: {
            class: ItemPileCurrenciesEditorShell,
            props: {
               currencies: pileCurrencies || game.settings.get(CONSTANTS.MODULE_NAME, "currencies")
            }
         },
         buttons: {
            save: {
               icon: 'fas fa-save',
               label: game.i18n.localize("ITEM-PILES.CurrenciesEditor.Submit"),
               onclick: "requestSubmit"
            },
            no: {
               icon: 'fas fa-times',
               label: 'Cancel',
               onclick: () =>
               {
                  this.options.resolve?.(false);
                  this.close();
               }
            }
         },
         default: 'save',
         autoClose: false, // Don't automatically close on button onclick.
         close: () => this.options.resolve?.(null)
      }, { width: 630, height: "auto", ...options });
   }

   static async show(pileCurrencies, options = {}, dialogData = {}) {
      return new Promise((resolve) => {
         options.resolve = resolve;
         new ItemPileCurrenciesEditor(pileCurrencies, options, dialogData);
      })
   }
}