import { TJSDialog }          from '@typhonjs-fvtt/runtime/svelte/application';

import ItemFiltersShell from './item-filters-editor.svelte';
import { CONSTANTS } from "../../../constants";

export default class ItemFiltersEditor extends TJSDialog {

   constructor(data = false, options, dialogData = {}) {
      const itemFilters = data || game.settings.get(CONSTANTS.MODULE_NAME, "itemFilters")
      super({
         ...dialogData,
         title: "ITEM-PILES.FilterEditor.Title",
         zIndex: 102,
         content: {
            class: ItemFiltersShell,
            props: {
               itemFilters
            }
         },
         buttons: {
            save: {
               icon: 'fas fa-save',
               label: "ITEM-PILES.FilterEditor.Submit",
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
      }, { width: 400, height: "auto", ...options });
   }

   submit(data){
      return game.settings.set(CONSTANTS.MODULE_NAME, "itemFilters", data);
   }

   static async show(data = false, options = {}, dialogData = {}) {
      return new Promise((resolve) => {
         if(data) options.resolve = resolve;
         new this(data, options, dialogData).render(true);
      })
   }
}