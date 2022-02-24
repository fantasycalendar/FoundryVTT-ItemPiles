<script>
   import { getContext }         from 'svelte';
   import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
   import FilePicker from "../components/FilePicker.svelte"

   let form;
   export let currencies;

   const foundryApp = getContext('external').foundryApp;

   async function updateSettings() {
      console.log("updateSettings called")
   }

   function add() {
      currencies.push({ name: "", path: "", img: "" });
      currencies = currencies;
   }

   function remove(index) {
      currencies.splice(index, 1)
      currencies = currencies;
   }

   export function requestSubmit(){
      console.log("requestSubmit called")
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
         <div class="flexrow item-piles-currency-row" data-currency-index="{index}">
            <div><input type="text" required name="{index}.name" placeholder="Gold Pieces" value="{name}"/></div>
            <div><input type="text" required name="{index}.path" placeholder="data.currency.gp" value="{path}"/></div>
            <FilePicker index="{index}" img="{img}"/>
            <div style="flex:0 1 auto; align-self: center;">
               <a on:click={remove(index)}><i class="fas fa-times"></i></a>
            </div>
         </div>
         {/each}
      </div>
   </div>
</form>


<style lang="scss">

   .item-piles-currency-row{

      margin-bottom:0.5rem;

      & > div, > FilePicker{
         margin-left:5px;
         display: inline-flex;
         flex-direction: row;
      }
   }

</style>