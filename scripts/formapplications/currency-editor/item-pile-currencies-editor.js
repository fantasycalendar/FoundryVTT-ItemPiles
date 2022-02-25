
import { TJSDialog }          from '@typhonjs-fvtt/runtime/svelte/application';

import ItemPileCurrenciesEditorShell from './item-pile-currencies-editor.svelte';
import CONSTANTS from "../../constants";

export default class ItemPileCurrenciesEditor extends TJSDialog {

   constructor(data = false, options, dialogData = {}) {
      super({
         ...dialogData,
         title: game.i18n.localize("ITEM-PILES.CurrenciesEditor.Title"),
         zIndex: 50,
         content: {
            class: ItemPileCurrenciesEditorShell,
            props: {
               currencies: data || game.settings.get(CONSTANTS.MODULE_NAME, "currencies")
            }
         },
         buttons: {
            save: {
               icon: 'fas fa-save',
               label: "ITEM-PILES.CurrenciesEditor.Submit",
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

   submit(data){
      return game.settings.set(CONSTANTS.MODULE_NAME, "currencies", data);
   }

   static async show(data = false, options = {}, dialogData = {}) {
      return new Promise((resolve) => {
         options.resolve = resolve;
         new this(data, options, dialogData);
      })
   }
}