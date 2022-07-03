<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as PileUtilities from "../../../helpers/pile-utilities.js";
  import ItemPriceStore from "./ItemPriceStore.js";
  import Tabs from "../../components/Tabs.svelte";
  import PriceList from "./PriceList.svelte";

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

  function addGroup(){
    itemFlagData.prices = [
      ...itemFlagData.prices,
      []
    ]
  }

  let activeTab = "price";

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

          {#each itemFlagData.prices as prices, groupIndex (groupIndex)}

            <PriceList bind:prices={prices} remove={() => { store.removeGroup(groupIndex) }}/>

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