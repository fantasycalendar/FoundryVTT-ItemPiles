<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { fade } from 'svelte/transition';

  export let store;
  export let item;

  const pileData = store.pileData;
  const prices = item.prices;

  function previewItem(item) {
    item = store.source.items.get(item.id);
    if (game.user.isGM || item.data.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass()
    const sheet = new cls(item, { editable: false })
    return sheet._render(true);
  }

</script>

<div class="flexrow item-piles-item-row item-piles-odd-color" transition:fade={{duration: 250}}
     style="flex: 1 0 auto;">

  <div class="item-piles-img-container"><img class="item-piles-img" src="{item.img}"/></div>

  <div class="item-piles-name item-piles-text">
    <div class="item-piles-name-container">
      {#if $pileData.canInspectItems || game.user.isGM}
        <a class="item-piles-clickable" on:click={previewItem(item)}>{item.name}</a>
      {:else}
        {item.name}
      {/if}
    </div>
  </div>

  {#if $prices.length === 1}
    <div class="flexrow" style="flex-direction:row; flex: 0 1 100px; align-items: center;">
      <img src="{$prices[0].img}" title="{localize($prices[0].name)}"
           style=" border-radius: 4px; max-height:20px; max-width: 20px; margin-right: 5px;">
      <small>{$prices[0].cost}</small>
    </div>
  {/if}

  <div class="flexrow" style="flex: 0 1 50px; align-items: center;">
    <a class="item-piles-buy-button" on:click={() => {}}><i class="fas fa-shopping-cart"></i>
      Buy</a>
  </div>

</div>


<style lang="scss">

  .item-piles-item-row {

    margin: 0;

    .item-piles-text {
      font-size: inherit;
      padding-left: 0.25rem;
    }

    .item-piles-img-container {
      min-width: 20px;
      max-height: 20px;
      margin: 2px;
      flex: 1 0 auto;

      overflow: hidden;
      border-radius: 4px;
      border: 1px solid black;
      align-self: center;

      .item-piles-img {
        border: 0;
        width: auto;
        height: 100%;
        transition: transform 150ms;

        &:hover {
          transform: scale(1.125, 1.125);
        }
      }
    }

    .item-piles-name-container {
      line-height: 1.6;
    }

    .item-piles-disabled {
      background-color: var(--color-bg-btn-minor-inactive, #c9c7b8)
    }

  }

</style>