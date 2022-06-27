<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as PileUtilities from "../../../helpers/pile-utilities.js";
  import Tabs from "../../components/Tabs.svelte";
  import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";
  import CONSTANTS from "../../../constants/constants.js";

  const { application } = getContext('external');

  export let item;
  let form;

  const doc = new TJSDocument(item);

  let itemFlagData = PileUtilities.getItemFlagData(item);
  $: {
    $doc;
    const changes = doc.updateOptions;
    if(hasProperty(changes.data, CONSTANTS.FLAGS.ITEM)){
      const newFlagData = getProperty(changes.data, CONSTANTS.FLAGS.ITEM);
      itemFlagData = foundry.utils.mergeObject(itemFlagData, newFlagData);
    }
  }

  async function updateSettings() {
    application.options.resolve();
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

  let activeTab = "general";

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off class="item-piles-config-container">

  <Tabs style="flex: 0 1 auto;" tabs="{[
    { value: 'general', label: 'General' },
    { value: 'price', label: 'Price' },
  ]}" bind:activeTab={activeTab}/>

  <section class="tab-body item-piles-sections">

    {#if activeTab === 'general'}
      <div class="tab">

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.Hidden")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.HiddenExplanation")}</p>
          </label><br>
          <input type="checkbox" bind:checked={itemFlagData.hidden}/>
        </div>

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.NotForSale")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.NotForSaleExplanation")}</p>
          </label><br>
          <input type="checkbox" bind:checked={itemFlagData.notForSale}/>
        </div>

        <div class="form-group">
          <label style="flex:4;">
            {localize("ITEM-PILES.Applications.ItemEditor.InfiniteQuantity")}<br>
            <p>{localize("ITEM-PILES.Applications.ItemEditor.InfiniteQuantityExplanation")}</p>
          </label><br>
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

    {#if activeTab === "price"}

      <span>{localize("ITEM-PILES.Applications.ItemEditor.PriceExplanation")}</span>

      <div class="form-group">
        <label style="flex:4;">
          {localize("ITEM-PILES.Applications.ItemEditor.Free")}<br>
          <p>{localize("ITEM-PILES.Applications.ItemEditor.FreeExplanation")}</p>
        </label><br>
        <input type="checkbox" bind:checked={itemFlagData.free}/>
      </div>


    {/if}

  </section>

</form>

<style lang="scss">

  table {
    vertical-align: middle;

    tr {
      border-spacing: 15px;
    }

    .custom-small {
      width: 26px;
    }

    button {
      padding: 0.25rem 0.25rem;
      line-height: 1rem;
      text-align: center;
    }

    a {
      text-align: center;
    }
  }

</style>