<script>
  import { get } from 'svelte/store';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import FilePicker from "../../components/FilePicker.svelte";

  export let store;

  const currenciesStore = store.currencies;

  let hovering = null;
  let dragging = null;

  function add() {
    const currencies = get(currenciesStore);
    currenciesStore.set([...currencies, {
      primary: !currencies.length,
      name: "",
      img: "",
      abbreviation: "{#}",
      exchange: 1,
      data: { path: "" },
    }]);
  }

  function removeEntry(index) {
    const newAttributes = get(currenciesStore);
    newAttributes.splice(index, 1)
    currenciesStore.set(newAttributes);
  }

  function dragStart(event, i) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', i);
    dragging = i;
  }

  function drop(event, target) {
    event.dataTransfer.dropEffect = 'move';

    const start = parseInt(event.dataTransfer.getData("text/plain"));
    const newCurrencies = get(currenciesStore);

    if (start < target) {
      newCurrencies.splice(target + 1, 0, newCurrencies[start]);
      newCurrencies.splice(start, 1);
    } else {
      newCurrencies.splice(target, 0, newCurrencies[start]);
      newCurrencies.splice(start + 1, 1);
    }

    currenciesStore.set(newCurrencies);

    hovering = null;
    dragging = null;
  }

</script>


<table>
  <tr>
    <th class="small">Primary</th>
    <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Name")}</th>
    <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Exchange")}</th>
    <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Icon")}</th>
    <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Path")}</th>
    <th class="small">
      <a on:click={add}><i class="fas fa-plus"></i></a>
    </th>
  </tr>
  {#each $currenciesStore as { id, primary, name, exchange, path, img }, index (index)}
    <tr
        class:is-active={hovering === index && dragging !== null}
        class:is-dragging={dragging === index}
        on:dragenter={() => { if(dragging !== null) hovering = index; }}
        on:drop|preventDefault={event => { drop(event, index) }}
    >
      <td class="small">
        <a class="item-piles-moveable"
           draggable="true"
           on:dragstart={event => { dragStart(event, index) }}
           ondragover="return false"
        ><i class="fas fa-bars"></i></a>
        <input type="radio" required name="primaryCurrency" checked={primary}
               on:change={() => { store.setPrimary(index) }}/>
      </td>
      <td><input type="text" required placeholder="Gold Pieces" bind:value="{name}"/></td>
      <td class="small"><input type="number" required step="0.0000000001" bind:value="{exchange}"/></td>
      <td><FilePicker bind:value="{img}" type="imagevideo" placeholder="images/image.png"/></td>
      <td><input type="text" required placeholder="data.currency.gp" bind:value="{path}"/></td>
      <td class="small">
        <button type="button" on:click={removeEntry(index)}><i class="fas fa-times"></i></button>
      </td>
    </tr>
  {/each}
</table>

<style lang="scss">

  table {

    td {
      vertical-align: middle;
    }

    tr {

      &.is-active {
        background-color: #3273dc;
        color: #fff;
      }

      &.is-dragging {
        background-color: rgba(50, 220, 132, 0.55);
        color: #fff;
      }
    }

    .small {
      width: 26px;
    }

    button {
      padding: 0.25rem 0.25rem;
      line-height: 1rem;
      flex: 0;
      text-align: center;
    }

    a {
      text-align: center;
    }
  }

</style>