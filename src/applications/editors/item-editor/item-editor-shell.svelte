<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as PileUtilities from "../../../helpers/pile-utilities.js";
  import ItemPriceStore from "./ItemPriceStore.js";
  import Tabs from "../../components/Tabs.svelte";
  import PriceList from "../../components/PriceList.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";

  const { application } = getContext('external');

  export let item;
  export let elementRoot;

  let store = ItemPriceStore.make(item);

  const flagDataStore = store.data;
  let price = store.price

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

  function addGroup() {
    itemFlagData.prices = [
      ...itemFlagData.prices,
      []
    ]
  }

  let activeTab = "price";

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

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
              {localize("ITEM-PILES.Applications.ItemEditor.CantBeSoldToMerchants")}<br>
              <p>{localize("ITEM-PILES.Applications.ItemEditor.CantBeSoldToMerchantsExplanation")}</p>
            </label>
            <input type="checkbox" bind:checked={itemFlagData.cantBeSoldToMerchants}/>
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
              {localize("ITEM-PILES.Applications.ItemEditor.BasePrice")}<br>
              <p>{localize("ITEM-PILES.Applications.ItemEditor.BasePriceExplanation")}</p>
            </label>
            <input type="text" bind:value={$price} on:change={() => {
              $price = Math.max(0, Number($price)).toString();
            }}/>
          </div>

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
              {localize("ITEM-PILES.Applications.ItemEditor.PurchaseOptions")}<br>
              <p>{localize("ITEM-PILES.Applications.ItemEditor.PurchaseOptionsExplanation")}</p>
            </label>

            <button type="button" on:click={() => { addGroup() }}>
              <i class="fas fa-plus"></i>
              {localize("ITEM-PILES.Applications.ItemEditor.AddPurchaseOption")}
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

    <footer>
      <button type="button" on:click|once={requestSubmit}>
        <i class="far fa-save"></i> {localize("ITEM-PILES.Applications.ItemEditor.Update")}
      </button>
      <button type="button" on:click|once={() => { application.close(); }}>
        <i class="far fa-times"></i> { localize("Cancel") }
      </button>
    </footer>

  </form>

</ApplicationShell>

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