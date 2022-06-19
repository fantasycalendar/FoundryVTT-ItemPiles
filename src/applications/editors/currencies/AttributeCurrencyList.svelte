<script>
  import { get } from 'svelte/store';

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  import FilePicker from "../../components/FilePicker.svelte";

  export let store;

  const attributesStore = store.attributes;

  let hovering = null;
  let dragging = null;

  function add() {
    const currentAttributes = get(attributesStore);
    console.log(get(store.primary))
    attributesStore.set([...currentAttributes, {
      primary: !get(store.primary),
      name: "",
      exchange: 1,
      path: "",
      img: ""
    }]);
    store.primary.set(true);
  }

  function attributeRemove(index) {
    const newAttributes = get(attributesStore);
    newAttributes.splice(index, 1)
    attributesStore.set(newAttributes);
  }

  function attributeDragStart(event, i) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', i);
    dragging = i;
    console.log(dragging, i)
  }

  function attributeDrop(event, target) {
    event.dataTransfer.dropEffect = 'move';

    const start = parseInt(event.dataTransfer.getData("text/plain"));
    const newCurrencies = get(attributesStore);

    if (start < target) {
      newCurrencies.splice(target + 1, 0, newCurrencies[start]);
      newCurrencies.splice(start, 1);
    } else {
      newCurrencies.splice(target, 0, newCurrencies[start]);
      newCurrencies.splice(start + 1, 1);
    }

    attributesStore.set(newCurrencies);

    hovering = null;
    dragging = null;
  }

</script>


<table>
  <tr>
    <th class="small">Primary</th>
    <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Name")}</th>
    <th>Exchange</th>
    <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Path")}</th>
    <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Icon")}</th>
    <th class="small"><a on:click={add} class="item-piles-clickable item-piles-add-new-currency"><i
        class="fas fa-plus"></i></a></th>
  </tr>
  {#each $attributesStore as { id, primary, name, exchange, path, img }, index (index)}
    <tr
        class:is-active={hovering === index && dragging !== null}
        class:is-dragging={dragging === index}
        on:dragenter={() => { if(dragging !== null) hovering = index; }}
        on:drop|preventDefault={event => { attributeDrop(event, index) }}
    >
      <td class="small">
        <a class="item-piles-moveable"
           draggable="true"
           on:dragstart={event => { attributeDragStart(event, index) }}
           ondragover="return false"
        ><i class="fas fa-bars"></i></a>
        <input type="radio" required name="primaryCurrency" checked={primary}
               on:change={() => { store.setPrimary(index) }}/>
      </td>
      <td><input type="text" required placeholder="Gold Pieces" bind:value="{name}"/></td>
      <td class="small"><input type="number" required step="0.0000000001" bind:value="{exchange}"/></td>
      <td><input type="text" required placeholder="data.currency.gp" bind:value="{path}"/></td>
      <td>
        <FilePicker bind:value="{img}" type="imagevideo" placeholder="images/image.png"/>
      </td>
      <td class="small">
        <button type="button" on:click={attributeRemove(index)}><i class="fas fa-times"></i></button>
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