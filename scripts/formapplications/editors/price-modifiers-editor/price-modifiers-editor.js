import { TJSDialog }          from '@typhonjs-fvtt/runtime/svelte/application';

import PriceModifiersShell from './price-modifiers-editor.svelte';

export default class PriceModifiersEditor extends TJSDialog {

   constructor(priceModifiers, options, dialogData = {}) {
      priceModifiers = priceModifiers.map(data => {
         data.actor = game.actors.get(data.actor);
         if(!data.actor) return false;
         return data;
      }).filter(Boolean);
      super({
         ...dialogData,
         title: "ITEM-PILES.PriceModifiersEditor.Title",
         content: {
            class: PriceModifiersShell,
            props: {
               priceModifiers
            }
         },
         buttons: {
            save: {
               icon: 'fas fa-save',
               label: "ITEM-PILES.PriceModifiersEditor.Submit",
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
         close: () => this.options.resolve?.(false)
      }, {
         width: 600,
         height: "auto",
         ...options
      });
   }

   static async show(data = false, options = {}, dialogData = {}) {
      return new Promise((resolve) => {
         options.resolve = resolve;
         new this(data, options, dialogData).render(true);
      })
   }

}