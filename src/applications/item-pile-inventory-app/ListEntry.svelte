<script>

  import { fade } from 'svelte/transition';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  export let store;
  export let data;

  function previewItem() {
    if (!canPreview) return;
    const item = store.pileActor.items.get(data.id);
    if (game.user.isGM || item.data.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass()
    const sheet = new cls(item, { editable: false })
    return sheet._render(true);
  }

  const editQuantitiesStore = store.editQuantities;

  const canPreview = data.id && store.pileData.canInspectItems;

</script>

<div class="flexrow item-piles-item-row item-piles-even-color" transition:fade={{duration: 250}}
     class:item-piles-disabled={!$editQuantitiesStore && !data.shareLeft}>

  <div class="item-piles-img-container">
    <!--<img class="item-piles-img"
         src="{data.img}"
         on:mouseenter={mouseEnterImage}
         on:mouseleave={mouseLeaveImage}
    />-->
    <img class="item-piles-img" src="{data.img}"/>
  </div>

  <div class="item-piles-name">
    <div class="item-piles-name-container">
      <p class:item-piles-clickable-link="{canPreview}" on:click={previewItem}>{data.name}</p>
      {#if !$editQuantitiesStore}
        <span class="item-piles-small-text">(x{data.quantity})</span>
      {/if}
    </div>
  </div>

  <div class="item-piles-quantity-container" style="flex:2.5;">

    {#if $editQuantitiesStore}

      <div class="item-piles-quantity-input-container">
        <input class="item-piles-quantity" type="number" min="0" bind:value="{data.quantity}"/>
      </div>

    {:else}

      {#if data.shareLeft}
        <div class="item-piles-quantity-input-container">
          <input class="item-piles-quantity" type="number" min="1" bind:value="{data.currentQuantity}"
                 max="{data.quantity}" disabled="{!data.quantity}"/>

          <span class="item-piles-input-divider" class:item-piles-text-right={!store.recipientActor}>
             / {data.shareLeft}
          </span>
        </div>
      {:else}
        <span>
          {localize(`ITEM-PILES.Inspect.${data.toShare ? "NoShareLeft" : "NoneLeft"}`)}
        </span>
      {/if}
    {/if}

  </div>

  {#if !$editQuantitiesStore}

    <button
        on:click={store.take(data)}
        class="item-piles-item-take-button"
        type="button"
        disabled={!data.shareLeft}>
      {localize("ITEM-PILES.Inspect.Take")}
    </button>

  {/if}

</div>

<style lang="scss">

</style>