<script>
  import { get } from 'svelte/store';

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  import FilePicker from "../../components/FilePicker.svelte";
  import DropZone from "../../components/DropZone.svelte";
  import * as Helpers from "../../../helpers/helpers.js";
  import * as Utilities from "../../../helpers/utilities.js";

  export let store;

  let itemStore = store.items;

  let hovering = null;
  let dragging = null;

  function itemRemove(index) {
    const newItems = get(itemStore);
    newItems.splice(index, 1)
    itemStore.set(newItems);
  }

  function itemDragStart(event, i) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', i);
    dragging = i;
  }

  function itemDrop(event, target) {
    event.dataTransfer.dropEffect = 'move';
    const start = parseInt(event.dataTransfer.getData("text/plain"));
    const newCurrencies = get(itemStore);

    if (start < target) {
      newCurrencies.splice(target + 1, 0, newCurrencies[start]);
      newCurrencies.splice(start, 1);
    } else {
      newCurrencies.splice(target, 0, newCurrencies[start]);
      newCurrencies.splice(start + 1, 1);
    }

    itemStore.set(newCurrencies);

    hovering = null;
    dragging = null;
  }

  async function dropData(data) {

    if (data.type !== "Item") return;

    let item = await Item.fromDropData(data);

    if (!item) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    item = item.toObject();

    const currentItems = get(itemStore);
    const foundItem = Utilities.findSimilarItem(currentItems, item)
    if (foundItem) return;
    const itemData = Utilities.setSimilarityProperties({
      primary: !get(store.primary),
      exchange: 1
    }, item);
    itemStore.set([...currentItems, itemData]);
    store.primary.set(true);
  }

  function preventDefault(event) {
    event.preventDefault();
  }

</script>

<div>
  <table>
    <tr>
      <th class="small">Primary</th>
      <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Name")}</th>
      <th>Exchange</th>
      <th>{localize("ITEM-PILES.Applications.CurrenciesEditor.Icon")}</th>
      <th></th>
    </tr>
    {#each $itemStore as { primary, name, exchange, img }, index (index)}
      <tr
          class:is-active={hovering === index && dragging !== null}
          class:is-dragging={dragging === index}
          on:dragenter={() => { if(dragging !== null) hovering = index; }}
          on:drop|preventDefault={event => itemDrop(event, index)}
      >
        <td class="small">
          <a class="item-piles-moveable"
             draggable="{true}"
             on:dragstart={event => itemDragStart(event, index)}
             ondragover="return false"
          ><i class="fas fa-bars"></i></a>
          <input type="radio" required name="primaryCurrency" checked={primary}
                 on:change={() => { store.setPrimary(index, true) }}/>
        </td>
        <td><input type="text" required placeholder="Gold Pieces" bind:value="{name}"/></td>
        <td class="small"><input type="number" required step="0.0000000001" bind:value="{exchange}"/></td>
        <td>
          <FilePicker bind:value="{img}" type="imagevideo" placeholder="images/image.png"/>
        </td>
        <td class="small">
          <button type="button" on:click={itemRemove(index)}><i class="fas fa-times"></i></button>
        </td>
      </tr>
    {/each}
  </table>

  <DropZone callback={dropData}>
    <div class="border-highlight">
      <p class="item-piles-text-center">{localize("ITEM-PILES.Applications.CurrenciesEditor.DragDrop")}</p>
    </div>
  </DropZone>

</div>

<style lang="scss">

  .border-highlight {
    padding: 1rem;
    margin: 0.25rem;
    border-radius: 10px;
    border: 2px dashed gray;
    text-align: center;
  }

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