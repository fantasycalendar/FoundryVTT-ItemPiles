<script>
   import {getContext} from 'svelte';
   import {localize} from '@typhonjs-fvtt/runtime/svelte/helper';
   import FilePicker from "../../components/FilePicker.svelte";
   import SwitchCheckbox from "../../components/SwitchCheckbox.svelte";

   const {application} = getContext('external');

   let form;
   let hovering = null;
   let dragging = null;

   export let data;

   let itemBased = data.itemBased;
   let currencies = data.list;

   let primary_currency = currencies.indexOf(currencies.find(currency => currency.primary));

   function add() {
      currencies.push({primary: false, name: "", exchange: 1, path: "", img: ""});
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

   function drop(event, target) {
      if (dragging !== null) return;
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
      if (!application.options.resolve) {
         application.submit(currencies);
      }
      application.close();
   }

   export function requestSubmit() {
      form.requestSubmit();
   }

   function toggleItemBased() {
      console.log("oh no!")
      currencies = [];
   }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-pile-currencies-editor">

   <p>{localize("ITEM-PILES.CurrenciesEditor.Explanation")}</p>

   <div class="form-group flexcol" style="max-width:300px;">
      <div>
         <SwitchCheckbox
              offText={localize("ITEM-PILES.CurrenciesEditor.AttributeBased")}
              onText={localize("ITEM-PILES.CurrenciesEditor.ItemBased")}
              bind:checked={itemBased}
              on:click={toggleItemBased}
         />
      </div>
      <label>
         <p>{localize("ITEM-PILES.CurrenciesEditor.ItemBasedExplanation")}</p>
      </label>
   </div>

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
                 class:is-active={hovering === index && dragging !== null}
                 class:is-dragging={dragging === index}
                 on:dragenter={() => hovering = index && dragging !== null}
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
            <td><FilePicker bind:value="{img}" type="imagevideo" placeholder="images/image.png"/></td>
            <td class="small"><button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button></td>
         </tr>
      {/each}
   </table>

</form>


<style lang="scss">

   .form-group {
      label {
         p {
            flex: 0;
            line-height: 14px;
            font-size: var(--font-size-12);
            color: var(--color-text-dark-secondary);
            padding-right: 1rem;
            margin-top: 0;
            overflow-y: hidden;
         }
      }
   }

   table {

      td {
         vertical-align: middle;
      }

      tr{

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