<script>
   import { getContext } from 'svelte';
   import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
   import FilePicker from "../components/FilePicker.svelte";

   const { application } = getContext('external');

   let form;
   let hovering = false;
   let dragging = false;

   export let currencies;
   export let primary_currency;

   function add() {
      currencies.push({ primary: false, name: "", exchange: 1, path: "", img: "" });
      currencies = currencies;
   }

   function remove(index) {
      currencies.splice(index, 1)
      currencies = currencies;
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

      currencies.forEach((currency, index) => {
         currency.primary = index === primary_currency;
      })

      if (start < target) {
         newCurrencies.splice(target + 1, 0, newCurrencies[start]);
         newCurrencies.splice(start, 1);
      } else {
         newCurrencies.splice(target, 0, newCurrencies[start]);
         newCurrencies.splice(start + 1, 1);
      }

      currencies = newCurrencies;

      primary_currency = currencies.indexOf(currencies.find(currency => currency.primary))

      hovering = null;
      dragging = null;
   }

   async function updateSettings() {
      currencies.forEach((currency, index) => {
         currency.primary = index === primary_currency;
      })
      application.options.resolve?.(currencies);
      if(!application.options.resolve){
         application.submit(currencies);
      }
      application.close();
   }

   export function requestSubmit(){
      form.requestSubmit();
   }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-pile-currencies-editor">
   <p>{localize("ITEM-PILES.CurrenciesEditor.Explanation")}</p>

   <table>
      <tr>
         <th class="small">Primary</th>
         <th>{localize("ITEM-PILES.CurrenciesEditor.Name")}</th>
         <th>Exchange</th>
         <th>{localize("ITEM-PILES.CurrenciesEditor.Path")}</th>
         <th>{localize("ITEM-PILES.CurrenciesEditor.Icon")}</th>
         <th class="small"><a on:click={add} class="item-piles-clickable item-piles-add-new-currency"><i class="fas fa-plus"></i></a></th>
      </tr>
      {#each currencies as { primary, name, exchange, path, img }, index (index)}
         <tr
          class:is-active={hovering === index}
          class:is-dragging={dragging === index}
          on:dragenter={() => hovering = index}
          on:drop|preventDefault={event => drop(event, index)}
         >
            <td class="small">
               <a
                class="item-piles-moveable"
                draggable="{true}"
                on:dragstart={event => dragstart(event, index)}
                ondragover="return false"
               ><i class="fas fa-bars"></i></a>
               <input type="radio" bind:group={primary_currency} value={index} required name="primary_currency"/>
            </td>
            <td><input type="text" required placeholder="Gold Pieces" bind:value="{name}"/></td>
            <td class="small"><input type="number" required step="0.0000000001" bind:value="{exchange}" /></td>
            <td><input type="text" required placeholder="data.currency.gp" bind:value="{path}"/></td>
            <td><FilePicker index="{index}" bind:img="{img}" showImg=true/></td>
            <td class="small"><button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button></td>
         </tr>
      {/each}
   </table>

</form>


<style lang="scss">

   table {
      vertical-align:middle;

      tr{
         border-spacing: 15px;

         &.is-active {
            background-color: #3273dc;
            color: #fff;
         }

         &.is-dragging {
            background-color: rgba(50, 220, 132, 0.55);
            color: #fff;
         }
      }

      .small{
         width: 26px;
      }

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

</style>