<script>
   import { getContext } from 'svelte';
   import {flip} from 'svelte/animate';
   import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
   import FilePicker from "../components/FilePicker.svelte";

   let form;
   let hovering = false;
   let dragging = false;

   export let currencies;

   const { application } = getContext('external');

   function add() {
      currencies.push({ name: "", path: "", img: "" });
      currencies = currencies;
   }

   function remove(index) {
      currencies.splice(index, 1)
      currencies = currencies;
   }

   async function updateSettings() {
      application.options.resolve?.(currencies);
      if(!application.options.resolve){
         application.submit(currencies);
      }
      application.close();
   }

   function dragstart(event, i) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';
      event.dataTransfer.setData('text/plain', i);
      dragging = i;
   }

   function drop(event, target){
      event.dataTransfer.dropEffect = 'move';
      const start = parseInt(event.dataTransfer.getData("text/plain"));
      const newCurrencies = currencies;

      if (start < target) {
         newCurrencies.splice(target + 1, 0, newCurrencies[start]);
         newCurrencies.splice(start, 1);
      } else {
         newCurrencies.splice(target, 0, newCurrencies[start]);
         newCurrencies.splice(start + 1, 1);
      }

      currencies = newCurrencies;
      hovering = null;
      dragging = null;
   }

   export function requestSubmit(){
      form.requestSubmit();
   }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-pile-currencies-editor">
   <p>{localize("ITEM-PILES.CurrenciesEditor.Explanation")}</p>

   <div>
      <div class="flexrow item-piles-currency-row">
         <div class="item-piles-text-center" style="flex:2;">{localize("ITEM-PILES.CurrenciesEditor.Name")}</div>
         <div class="item-piles-text-center" style="flex:2.5;">{localize("ITEM-PILES.CurrenciesEditor.Path")}</div>
         <div class="item-piles-text-center" style="flex:4;">{localize("ITEM-PILES.CurrenciesEditor.Icon")}</div>
         <a style="flex:0 1 50px;" on:click={add} class="item-piles-clickable item-piles-add-new-currency"><i class="fas fa-plus"></i> Add</a>
      </div>
      <hr>
      <div class="item-piles-currency-rows">
         {#each currencies as { name, path, img }, index (index)}
         <div
          class="flexrow item-piles-currency-row"
          animate:flip
          class:is-active={hovering === index}
          class:is-dragging={dragging === index}
          on:dragenter={() => hovering = index}
          on:drop|preventDefault={event => drop(event, index)}
         >
            <div style="flex:0 1 20px; flex-direction: column; align-self: center;">
               <a
                class="item-piles-moveable"
                draggable="{true}"
                on:dragstart={event => dragstart(event, index)}
                ondragover="return false"
               ><i class="fas fa-bars"></i></a>
            </div>
            <div><input type="text" required placeholder="Gold Pieces" bind:value="{name}"/></div>
            <div><input type="text" required placeholder="data.currency.gp" bind:value="{path}"/></div>
            <div><FilePicker index="{index}" bind:img="{img}" showImg=true/></div>
            <div style="flex:0 1 17px; flex-direction: column; align-self: center;">
               <button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
            </div>
         </div>
         {/each}
      </div>
   </div>
</form>


<style lang="scss">

   .item-piles-currency-row{

      padding:0.15rem;

      & > div:not(:first-child) {
         margin-left:5px;
      }

      & > div {
         display: inline-flex;
         flex-direction: row;
         flex:1 0 auto;
         align-self: center;

         button {
            padding: 0.25rem 0.25rem;
            line-height: 1rem;
            flex:0;
            text-align: center;
         }

         a {
            text-align: center;
         }
      }

      &.is-active {
         background-color: #3273dc;
         color: #fff;
      }

      &.is-dragging {
         background-color: rgba(50, 220, 132, 0.55);
         color: #fff;
      }
   }

</style>