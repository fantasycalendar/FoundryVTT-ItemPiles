<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import SliderInput from "../../components/SliderInput.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getSourceActorFromDropData, getUuid } from "../../../helpers/utilities.js";

  const { application } = getContext('external');

  let form;

  export let priceModifiers;
  export let elementRoot;

  function remove(index) {
    priceModifiers.splice(index, 1)
    priceModifiers = priceModifiers;
  }

  async function updateSettings() {
    priceModifiers.forEach(data => {
      data.actorUuid = getUuid(data.actor);
    })
    application.options.resolve?.(priceModifiers);
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

  async function dropData(event) {

    event.preventDefault();

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }

    if (data.type !== "Actor") return;

    const actor = getSourceActorFromDropData(data);

    if (!actor) return;

    if (priceModifiers.find(data => data.actor === actor)) return;

    priceModifiers.push({
      override: false,
      actor: actor,
      buyPriceModifier: 1,
      sellPriceModifier: 0.5
    });

    priceModifiers = priceModifiers;
  }

  function preventDefault(event) {
    event.preventDefault();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>

    <p>{localize("ITEM-PILES.Applications.PriceModifiersEditor.Explanation")}</p>

    <div on:dragstart={preventDefault} on:drop={dropData} on:dragover={preventDefault}
         class:border-highlight={!priceModifiers.length}>

      {#if priceModifiers.length}
        <table>
          <tr>
            <th style="width:5%;">{localize("ITEM-PILES.Applications.PriceModifiersEditor.Override")}</th>
            <th style="width:25%;">{localize("ITEM-PILES.Applications.PriceModifiersEditor.Actor")}</th>
            <th style="width:35%;">{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.BuyPriceModifier")}</th>
            <th style="width:35%;">{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}</th>
            <th style="width:5%;"></th>
          </tr>
          {#each priceModifiers as priceData, index (index)}
            <tr>
              <td>
                <div class="form-group">
                  <input type="checkbox" bind:checked={priceData.override}>
                </div>
              </td>
              <td>
                <a class="item-piles-actor-name-clickable"
                   on:click={(priceData.actor.sheet.render(true))}>{priceData.actor.name}</a>
              </td>
              <td>
                <div class="item-piles-flexrow" style="margin: 0 0.25rem">
                  <SliderInput bind:value={priceData.buyPriceModifier}/>
                </div>
              </td>
              <td>
                <div class="item-piles-flexrow" style="margin: 0 0.25rem">
                  <SliderInput bind:value={priceData.sellPriceModifier}/>
                </div>
              </td>
              <td class="small">
                <button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
              </td>
            </tr>
          {/each}
        </table>
      {/if}

      <p class="item-piles-text-center">{localize("ITEM-PILES.Applications.PriceModifiersEditor.DragDrop")}</p>

    </div>

    <footer>
      <button type="button" on:click|once={requestSubmit}>
        <i class="far fa-save"></i> {localize("Save")}
      </button>
      <button type="button" on:click|once={() => { application.close(); }}>
        <i class="far fa-times"></i> { localize("Cancel") }
      </button>
    </footer>

  </form>

</ApplicationShell>


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
