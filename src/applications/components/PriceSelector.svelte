<script>

  import { writable } from "svelte/store";

  export let item;
  export let standalone = false;

  const prices = item.prices;
  const itemFlagData = item.itemFlagData;
  const selectedPriceGroup = item.selectedPriceGroup;
  const priceSelector = standalone ? writable("") : item.store.priceSelector;

</script>

<div class="flexrow price-container" on:click|stopPropagation>
  {#if itemFlagData.free}
    <small>Free</small>
  {:else}
    <small
        class:item-piles-clickable-link={$prices.length > 1}
        class:multiple-prices={$prices.length > 1 && !standalone}
        class:cant-afford-multiple-prices={$prices.length > 1 && !standalone && !$prices.filter(group => group.maxQuantity).length}
        class:cant-afford={!$prices[$selectedPriceGroup].maxQuantity && item.store.recipient && !standalone}
        on:click={() => {
          $priceSelector = $priceSelector === item.id ? "" : item.id;
        }}
    >
      {#if standalone}
        <i class="fas fa-edit"></i>
      {/if}
      {$prices[$selectedPriceGroup].basePriceString}
    </small>
    {#if $priceSelector === item.id}
      <div class="price-list">
        {#each $prices as priceGroup, index (index)}
          <div class="price-group" class:selected={$selectedPriceGroup === index}>
            {#each priceGroup.prices.filter(price => price.cost) as price (price.id)}
              <div class="price-group-container"
                   on:click={() => {
                     $selectedPriceGroup = index;
                     $priceSelector = "";
                   }}
                   class:cant-afford={!priceGroup.maxQuantity && item.store.recipient}>
                <div class="item-piles-img-container"
                     class:not-for-sale={!priceGroup.maxQuantity && item.store.recipient}>
                  <img class="item-piles-img" src="{price.img}"/>
                </div>
                <div class="item-piles-name item-piles-text">
                  {price.baseCost} {price.name}
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">


  .price-container {
    flex: 0 1 100px;
    align-items: center;
    position: relative;

    .cant-afford {
      opacity: 0.5;
    }

    .multiple-prices::before,
    .multiple-prices::after {
      content: '';
      position: absolute;
      top: -0.5rem;
      left: -0.65rem;
      border-color: transparent;
      border-style: solid;
    }

    .multiple-prices::after {
      border-width: 0.4rem;
      border-right-color: #3ead2c;
      transform: rotate(45deg);
    }

    .cant-afford-multiple-prices::after {
      border-right-color: #cf5234;
    }

    .price-list {
      top: 25px;
      left: -5px;
      position: absolute;
      z-index: 900;
      font-size: 0.75rem;
      border: 1px solid rgba(0, 0, 0, 0.5);
      border-radius: 5px;
      overflow: hidden;
      background-color: #e6e6d5;
      box-shadow: 0 6px 9px -1px rgba(0, 0, 0, 0.5);

      .price-group {

        cursor: pointer;
        user-select: none;

        &.selected {
          background-color: #f2f2e1;
        }

        &:hover {
          background-color: #ffffed;
        }

        .price-group-container {
          display: flex;
          align-items: center;

          padding: 0 4px 0 2px;

          &:first-child {
            padding-top: 2px;
          }

          &:last-child {
            padding-bottom: 2px;
          }

          .item-piles-img-container {
            min-height: 18px;
            min-width: 18px;
            max-width: 18px;
            max-height: 18px;
            margin: 1px;
          }
        }

        &:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.5);
        }
      }
    }
  }

</style>