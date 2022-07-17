<script>

  import { writable } from "svelte/store";
  import { TJSMenu, TJSToggleLabel } from '@typhonjs-fvtt/svelte-standard/component';

  export let item;
  export let standalone = false;

  const label = {
    text: ''
  };

  const prices = item.prices;
  const itemFlagData = item.itemFlagData;
  const selectedPriceGroup = item.selectedPriceGroup;
  const priceSelector = standalone ? writable("") : item.store.priceSelector;

  $: cantAfford = !$prices[$selectedPriceGroup].maxQuantity && item.store.recipient && !standalone;
  $: cantAffordMultiplePrices = cantAfford && !$prices.filter(group => group.maxQuantity).length;
  $: label.text = (standalone && $prices.length > 1 ? "<i class=\"fas fa-edit\"></i> " : "") + $prices[$selectedPriceGroup].basePriceString;

</script>

<div class="price-container">
  {#if $prices.length > 1}
    <TJSToggleLabel {label}>
      <div slot=left
           class:multiple-prices={$prices.length > 1 && !standalone}
           class:cant-afford={cantAfford}
           class:cant-afford-multiple-prices={cantAffordMultiplePrices}>
      </div>
      <TJSMenu offset={{y: 4}}>
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
                       class:not-for-sale={!price.maxQuantity && item.store.recipient}>
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
      </TJSMenu>
    </TJSToggleLabel>
  {:else}
    <small class:cant-afford={cantAfford}>{ label.text }</small>
  {/if}
</div>

<style lang="scss">

  .price-container {
    flex: 0 1 100px;
    align-items: center;
    position: relative;
    --tjs-label-justify-content: flex-start;
    --tjs-label-font-size: smaller;
    --tjs-label-overflow: visible;
    --tjs-menu-color: black;
    --tjs-menu-border: 1px solid #444;
    --tjs-menu-box-shadow: 0 6px 9px -1px rgba(0, 0, 0, 0.5);

    small {
      padding-left: 2px;
    }

    span {
      justify-content: flex-start;
    }

    .cant-afford {
      opacity: 0.5;
    }

    .multiple-prices::before,
    .multiple-prices::after {
      content: '';
      position: absolute;
      top: -0.4rem;
      left: -0.55rem;
      border-color: transparent;
      border-style: solid;
    }

    .multiple-prices::after {
      border-width: 0.3rem;
      border-right-color: #3ead2c;
      transform: rotate(45deg);
    }

    .cant-afford-multiple-prices::after {
      border-right-color: #cf5234;
    }

    .price-list {
      z-index: 900;
      font-size: 0.75rem;
      border-radius: 5px;
      overflow: hidden;
      background-color: #ccccbe;

      .price-group {

        cursor: pointer;
        user-select: none;

        &.selected {
          background-color: #e6e6d5;
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