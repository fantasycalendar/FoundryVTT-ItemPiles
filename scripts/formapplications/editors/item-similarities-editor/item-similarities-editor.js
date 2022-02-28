import { TJSDialog }          from '@typhonjs-fvtt/runtime/svelte/application';

import ItemSimilaritiesShell from './item-similarities-editor.svelte';
import { CONSTANTS } from "../../../constants";

export default class ItemSimilaritiesEditor extends TJSDialog {

   constructor(options, dialogData = {}) {
      super({
         ...dialogData,
         title: "ITEM-PILES.SimilaritiesEditor.Title",
         zIndex: 102,
         content: {
            class: ItemSimilaritiesShell,
            props: {
               itemSimilarities:  game.settings.get(CONSTANTS.MODULE_NAME, "itemSimilarities")
            }
         },
         buttons: {
            save: {
               icon: 'fas fa-save',
               label: "ITEM-PILES.SimilaritiesEditor.Submit",
               onclick: "requestSubmit"
            },
            no: {
               icon: 'fas fa-times',
               label: 'Cancel',
               onclick: () =>
               {
                  this.close();
               }
            }
         },
         default: 'save',
         autoClose: false, // Don't automatically close on button onclick.
      }, { width: 400, height: "auto", ...options });
   }

   submit(data){
      return game.settings.set(CONSTANTS.MODULE_NAME, "itemSimilarities", data);
   }

   static async show(options = {}, dialogData = {}) {
      return new this(options, dialogData).render(true);
   }
}