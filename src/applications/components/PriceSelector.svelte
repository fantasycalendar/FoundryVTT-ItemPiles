<script>

  import { writable } from "svelte/store";
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { TJSMenu, TJSToggleLabel } from '@typhonjs-fvtt/svelte-standard/component';

  export let item;
  export let standalone = false;

  let labelText = "";

  const prices = item.prices;
  const itemFlagData = item.itemFlagData;
  const selectedPriceGroup = item.selectedPriceGroup;
  const priceSelector = standalone ? writable("") : item.store.priceSelector;

  $: cantAfford = $prices.length > 0 && !$prices[$selectedPriceGroup]?.maxQuantity && item.store.recipient && !standalone;
  $: cantAffordMultiplePrices = cantAfford && !$prices.filter(group => group.maxQuantity).length;
  $: labelText = (standalone && $prices.length > 1 ? "<i class=\"fas fa-edit\"></i> " : "")
    + ($prices[$selectedPriceGroup]?.free
        ? localize("ITEM-PILES.Merchant.ItemFree")
        : $prices[$selectedPriceGroup]?.basePriceString
    );

</script>

<div class="price-container">
	{#if $prices.length > 1}
		<TJSToggleLabel>
			<div slot=left
					 class:multiple-prices={$prices.length > 1 && !standalone}
					 class:cant-afford={cantAfford}
					 class:cant-afford-multiple-prices={cantAffordMultiplePrices}
					 class:item-piles-clickable-link={$prices.length > 1}>
				<small>{@html labelText}</small>
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
										<small>{price.baseCost + (priceGroup.prices.length === 0 && price.percent ? "%" : "")} {price.name}</small>
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</TJSMenu>
		</TJSToggleLabel>
	{:else}
		<small class:cant-afford={cantAfford}>{@html labelText}</small>
	{/if}
</div>

<style lang="scss">

  .price-container {
    align-items: center;
    position: relative;
    --tjs-label-justify-content: flex-start;
    --tjs-label-overflow: visible;
    --tjs-menu-primary-color: black;
    --tjs-menu-color: black;
    --tjs-menu-border: 1px solid #444;
    --tjs-menu-box-shadow: 0 6px 9px -1px rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    height: 100%;

    small {
      padding-left: 2px;
    }

    span {
      justify-content: flex-start;
    }

    .cant-afford {
      opacity: 0.5;
    }

    .multiple-prices {
      overflow: visible;
    }

    .multiple-prices::before,
    .multiple-prices::after {
      content: '';
      position: absolute;
      top: -0.2rem;
      left: -0.2rem;
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

  }
</style>
