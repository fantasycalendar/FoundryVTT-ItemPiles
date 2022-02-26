import { TJSDialog }          from '@typhonjs-fvtt/runtime/svelte/application';

import PriceModifiersShell from './price-modifiers-editor.svelte';

export default class PriceModifiersEditor extends TJSDialog {

   constructor(priceModifiers, options, dialogData = {}) {
      super({
         ...dialogData,
         title: "ITEM-PILES.PriceModifiersEditor.Title",
         zIndex: 50,
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
         close: () => this.options.resolve?.(null)
      }, { width: 630, height: "auto", ...options });
   }

   static async show(data = false, options = {}, dialogData = {}) {
      return new Promise((resolve) => {
         options.resolve = resolve;
         new this(data, options, dialogData).render(true);
      })
   }
}