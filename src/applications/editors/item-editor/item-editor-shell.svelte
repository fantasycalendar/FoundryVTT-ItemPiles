<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as PileUtilities from "../../../helpers/pile-utilities.js";
  import ItemPriceStore from "./PriceGroupStore.js";
  import Tabs from "../../components/Tabs.svelte";
  import FilePicker from "../../components/FilePicker.svelte";
  import DropZone from "../../components/DropZone.svelte";
  import * as Helpers from "../../../helpers/helpers.js";
  import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";

  const { application } = getContext('external');

  export let item;

  let store = ItemPriceStore.make(item);

  const flagDataStore = store.data;

  $: itemFlagData = $flagDataStore;

  let form;

  async function updateSettings() {
    await PileUtilities.updateItemData(item, store.export());
    application.options.resolve();
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

  let dragging = null;
  let hovering = null;

  function addGroup() {
    itemFlagData.prices = [...itemFlagData.prices, []];
  }

  function removeGroup(groupIndex) {
    const prices = itemFlagData.prices;
    prices.splice(groupIndex, 1);
    itemFlagData.prices = prices;
  }

  function addAttribute(groupIndex) {
    itemFlagData.prices[groupIndex] = [...itemFlagData.prices[groupIndex], {
      type: "attribute",
      name: "Custom Attribute",
      img: "icons/svg/cowled.svg",
      cost: 1,
      data: ""
    }]
  }

  async function addItem(groupIndex, data) {

    if (data.type !== "Item") return;

    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    itemFlagData.prices[groupIndex] = [...itemFlagData.prices[groupIndex], {
      type: "item",
      name: itemData.name,
      img: itemData.img,
      cost: 1,
      data: itemData
    }]

  }

  async function editItem(groupIndex, index){

    const itemData = itemFlagData.prices[groupIndex][index].data;

    const tempItem = await Item.implementation.create(itemData, { temporary: true });
    const doc = new TJSDocument(tempItem);

    doc.subscribe((...args) => {
      console.log(args)
      // if(changes.action !== "subscribe"){
      //   const data = tempItem.toObject();
      //   itemFlagData.prices[groupIndex][index].name = data.name;
      //   itemFlagData.prices[groupIndex][index].img = data.img;
      //   itemFlagData.prices[groupIndex][index].data = data;
      // }
    });

    tempItem.sheet.render(true)

  }

  function removeGroupItem(groupIndex, index) {
    const groups = itemFlagData.prices[groupIndex];
    groups.splice(index, 1);
    itemFlagData.prices[groupIndex] = groups;
  }

  function dragStart(event, groupIndex, index) {
    dragging = groupIndex + "-" + index;
    event.dataTransfer.setData('text/plain', JSON.stringify({ type: "move", groupIndex, index }));
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
  }

  function drop(event, dropGroupIndex) {

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }

    if (data.type !== "move") {
      return addItem(dropGroupIndex, data);
    }

    if(!hovering) return;

    let dropIndex = Number(hovering.split("-")[1]);

    dragging = null;
    hovering = null;

    event.dataTransfer.dropEffect = 'move';

    const { groupIndex, index } = data;

    if (dropGroupIndex === groupIndex && dropIndex === index) return;

    const group = itemFlagData.prices[groupIndex];
    const dataToMove = itemFlagData.prices[groupIndex].splice(index, 1)[0];

    if (dropGroupIndex !== groupIndex) {
      const dropGroup = itemFlagData.prices[dropGroupIndex];
      dropGroup.splice(dropIndex + 1, 0, dataToMove);
      itemFlagData.prices[dropGroupIndex] = dropGroup;
    } else {
      if (dropIndex === index - 1) {
        group.splice(dropIndex, 0, dataToMove);
      } else if (dropIndex === index + 1) {
        group.splice(dropIndex + 1, 0, dataToMove);
      } else {
        group.splice(dropIndex > index ? dropIndex : dropIndex + 1, 0, dataToMove);
      }
    }

    itemFlagData.prices[groupIndex] = group;

  }

  let activeTab = "general";

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-piles-config-container">

  <Tabs bind:activeTab tabs={[
    { value: "general", label: localize("ITEM-PILES.Applications.ItemEditor.General") },
    { value: "price", label: localize("ITEM-PILES.Applications.ItemEditor.Price") },
  ]}/>

  <section class="tab-body">

    {#if activeTab === 'general'}

      <div class="tab flex">

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.Hidden")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.HiddenExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={itemFlagData.hidden}/>
        </div>

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.NotForSale")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.NotForSaleExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={itemFlagData.notForSale}/>
        </div>

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.InfiniteQuantity")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.InfiniteQuantityExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={itemFlagData.infiniteQuantity}/>
        </div>

        <div class="form-group">
          <label>
            {localize("ITEM-PILES.Applications.ItemEditor.DisplayQuantity")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.DisplayQuantityExplanation")}</p>
          </label>
          <select style="flex: 0 1 auto;" bind:value={itemFlagData.displayQuantity}>
            <option value="default">
              {localize("ITEM-PILES.Applications.ItemEditor.DisplayQuantityDefault")}
            </option>
            <option value="yes">
              {localize("ITEM-PILES.Applications.ItemEditor.DisplayQuantityYes")}
            </option>
            <option value="no">
              {localize("ITEM-PILES.Applications.ItemEditor.DisplayQuantityNo")}
            </option>
          </select>
        </div>

      </div>

    {/if}

    {#if activeTab === 'price'}

      <div class="tab flex">

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.Free")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.FreeExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={itemFlagData.free}/>
        </div>

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.DisableNormalCost")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.DisableNormalCostExplanation")}</p>
          </label>
          <input type="checkbox" bind:checked={itemFlagData.disableNormalCost}/>
        </div>

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.PriceGroups")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.PriceGroupsExplanation")}</p>
          </label>

          <button type="button" on:click={() => { addGroup() }}>
            <i class="fas fa-plus"></i>
            {localize("ITEM-PILES.Applications.ItemEditor.AddPriceGroup")}
          </button>
        </div>

        {#if itemFlagData.prices.length}

          {#each itemFlagData.prices as group, groupIndex (groupIndex)}
            <table
                on:drop={event => drop(event, groupIndex)}
            >
              <tr>
                <th><i class="fas fa-times item-piles-clickable-link" on:click={() => { removeGroup(groupIndex) }}></i>
                </th>
                <th>Name</th>
                <th>Cost</th>
                <th>Icon</th>
                <th>Path</th>
                <th><i class="fas fa-plus item-piles-clickable-link" on:click={() => { addAttribute(groupIndex) }}></i>
                </th>
              </tr>
              {#each group as price, index (index)}
                <tr
                    class:is-active={hovering === groupIndex + "-" + index && dragging !== null}
                    class:is-dragging={dragging === groupIndex + "-" + index}
                    on:dragenter={() => { if(dragging !== null) hovering = groupIndex + "-" + index; }}
                    on:dragover|preventDefault
                >
                  <td class="small">
                    <a class="item-piles-moveable"
                       draggable="true"
                       on:dragstart={event => dragStart(event, groupIndex, index)}
                    ><i class="fas fa-bars"></i></a>
                  </td>
                  <td>
                    <input type="text" required bind:value={price.name}/>
                  </td>
                  <td class="small">
                    <input type="number" required bind:value={price.cost}/>
                  </td>
                  <td>
                    <FilePicker type="imagevideo" showImage={true} showInput={false} bind:value={price.img}/>
                  </td>
                  <td>
                    {#if price.type === "attribute"}
                      <input type="text" required bind:value={price.data}/>
                    {:else}
                      <a on:click={() => { editItem(groupIndex, index)}}><i class="fas fa-edit"></i> Edit item</a>
                    {/if}
                  </td>
                  <td class="small">
                    <button type="button" on:click={() => { removeGroupItem(groupIndex, index) }}>
                      <i class="fas fa-times"></i>
                    </button>
                  </td>
                </tr>
              {/each}
              {#if !group.length}
                <tr
                    class:is-active={hovering === groupIndex + "-" + 0 && dragging !== null}
                    class:is-dragging={dragging === groupIndex + "-" + 0}
                    on:dragenter={() => { if(dragging !== null) hovering = groupIndex + "-" + 0; }}
                    on:dragover|preventDefault
                >
                  <td colspan="6">
                    <span>Click on the plus to add an attribute price, or drag and drop an item to add it.</span>
                  </td>
                </tr>
              {/if}
            </table>

            {#if itemFlagData.prices.length > 1 && groupIndex !== itemFlagData.prices.length - 1}
              <span style="padding: 1rem 0; font-size: 1.25rem;">OR THEY CAN PAY</span>
            {/if}
          {/each}

        {/if}

      </div>

    {/if}

  </section>

</form>

<style lang="scss">

  .tab {
    max-height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
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
      display: flex;
      align-items: center;
      justify-content: center;
    }

    a {
      text-align: center;
    }
  }

</style>