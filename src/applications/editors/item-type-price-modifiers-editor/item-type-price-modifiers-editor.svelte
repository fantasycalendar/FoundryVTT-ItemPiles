<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import SliderInput from "../../components/SliderInput.svelte";

  const { application } = getContext('external');

  let form;

  export let itemTypePriceModifiers = [];

  let unusedTypes;
  let systemTypes = Object.entries(CONFIG.Item.typeLabels);

  $: {
    unusedTypes = Object.keys(CONFIG.Item.typeLabels).filter(type => !itemTypePriceModifiers.find(priceData => priceData.type === type));
  }

  function add() {
    if (!unusedTypes.length) return;
    itemTypePriceModifiers.push({
      type: unusedTypes[0],
      override: false,
      priceModifier: 1,
      sellModifier: 0.5
    });
    itemTypePriceModifiers = itemTypePriceModifiers;
  }

  function remove(index) {
    itemTypePriceModifiers.splice(index, 1);
    itemTypePriceModifiers = itemTypePriceModifiers;
  }

  async function updateSettings() {
    application.options.resolve?.(itemTypePriceModifiers);
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>

  <p>{localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.Explanation")}</p>

  <div>

    <table>
      <tr>
        <th style="width:5%;">{localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.Override")}</th>
        <th style="width:20%;">{localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.ItemType")}</th>
        <th style="width:35%;">{localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.PriceModifier")}</th>
        <th style="width:35%;">{localize("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.SellModifier")}</th>
        <th style="width:5%;">
          <span on:click={add} class:item-piles-clickable-link={unusedTypes.length}>
            <i class="fas fa-plus"></i>
          </span>
        </th>
      </tr>
      {#each itemTypePriceModifiers as priceData, index (index)}
        <tr>
          <td>
            <div class="form-group">
              <input type="checkbox" bind:checked={priceData.override}>
            </div>
          </td>
          <td>
            <div class="form-group">
              <select bind:value={priceData.type}>
                {#each systemTypes as [itemType, label] (itemType)}
                  <option value="{itemType}"
                          disabled="{itemType !== priceData.type && !unusedTypes.includes(itemType)}">
                    {localize(label)}
                  </option>
                {/each}
              </select>
            </div>
          </td>
          <td>
            <div class="flexrow" style="margin: 0 0.25rem">
              <SliderInput style="flex:4;" bind:value={priceData.priceModifier}/>
            </div>
          </td>
          <td>
            <div class="flexrow" style="margin: 0 0.25rem">
              <SliderInput style="flex:4;" bind:value={priceData.sellModifier}/>
            </div>
          </td>
          <td class="small">
            <button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
          </td>
        </tr>
      {/each}
    </table>

  </div>

</form>


<style lang="scss">

  .border-highlight {
    padding: 1rem;
    margin: 0.25rem;
    border-radius: 10px;
    border: 2px dashed gray;
  }

  table {
    vertical-align: middle;

    tr {
      border-spacing: 15px;
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