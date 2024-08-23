<script>
	import { localize } from '#runtime/svelte/helper';
	import { getContext } from "svelte";
	import { ApplicationShell } from "#runtime/svelte/component/core";
	import { get } from "svelte/store";
	import * as PileUtilities from "../../../helpers/pile-utilities.js";
	import PriceSelector from "../../components/PriceSelector.svelte";

	const { application } = getContext('#external');

	export let item;
	export let seller;
	export let buyer;
	export let settings;
	export let elementRoot;
	export let store = item.store;

	const itemNameStore = item.name;
	const itemImg = item.img;
	const itemInfiniteQuantity = item.infiniteQuantity;
	const itemRarityColor = item.rarityColor;
	const itemFlagData = item.itemFlagData;
	const quantityToBuy = item.quantityToBuy;
	const itemMaxQuantityStore = item.quantity;
	const itemQuantityForPriceStore = item.quantityForPrice;
	const prices = item.prices;

	const sellerPileData = store.pileData;
	const buyerPileData = store.recipientPileData;

	let maxItemPurchaseQuantity;
	let currentQuantityToBuy;

	const selectedPriceGroup = item.selectedPriceGroup;
	$: {
		$selectedPriceGroup;
		currentQuantityToBuy = 1;
		$quantityToBuy = 1;
	}

	let paymentData = {};
	$: {
		paymentData = PileUtilities.getPaymentData({
			purchaseData: [{
				item: item.item,
				quantity: $quantityToBuy,
				paymentIndex: $selectedPriceGroup
			}],
			seller,
			buyer,
			sellerFlagData: $sellerPileData,
			buyerFlagData: $buyerPileData,
		});
	}

	$: maxSellerItemQuantity = $itemInfiniteQuantity ? Infinity : Math.ceil($itemMaxQuantityStore / $itemQuantityForPriceStore);
	$: maxItemQuantity = $prices[$selectedPriceGroup]?.maxQuantity ?? Infinity;
	$: maxItemPurchaseQuantity = Math.min(maxItemQuantity, maxSellerItemQuantity);
	$: itemName = localize($itemNameStore) + ($itemQuantityForPriceStore > 1 ? ` (${$itemQuantityForPriceStore})` : "");

	let submitted = false;
	async function submit() {
		if(submitted) return;
		submitted = true;
		const result = await game.itempiles.API.tradeItems(seller, buyer, [{
			item: item.item,
			paymentIndex: get(selectedPriceGroup),
			quantity: get(quantityToBuy),
		}], {
			interactionId: store.interactionId
		});
		if(!result){
			submitted = false;
			return;
		}
		application.options.resolve();
		application.close();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<div>

		<div style="display: grid; grid-template-columns: 1fr 0.75fr; margin-bottom: 0.5rem;">
			<div style="display:flex; align-items: center; font-size:1rem; grid-row: 1;">
				<div class="item-piles-img-container" style="margin-right: 0.25rem;">
					<img class="item-piles-img" src={$itemImg}/>
				</div>
				<span style="color: {$itemRarityColor || 'inherit'};">{itemName}</span>
			</div>

			<div
				style="display:flex; justify-content:flex-end; align-items: center; text-align: right;">
				{#if paymentData.canBuy}
					<div style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 0.5rem;">
						<small>{localize("ITEM-PILES.Applications.TradeMerchantItem.Quantity")}</small>
						<small style="font-style:italic;">
							({localize("ITEM-PILES.Applications.TradeMerchantItem.MaxQuantity", {
							quantity: maxItemPurchaseQuantity
						})})
						</small>
					</div>
					<input style="max-width: 40px; max-height: 24px;" type="number" bind:value={currentQuantityToBuy} on:change={(evt) => {
            $quantityToBuy = Math.max(1, Math.min(currentQuantityToBuy, maxItemPurchaseQuantity));
            currentQuantityToBuy = $quantityToBuy;
          }}/>
				{:else}
					<small>
						{localize(...paymentData.reason)}
					</small>
				{/if}
			</div>
			<div style="margin-top: 0.25rem; display: flex; align-items: flex-start;">
				<PriceSelector {item} standalone/>
			</div>
			<div style="margin-right: 0.25rem; text-align: right;">
				{#if paymentData.canBuy && $quantityToBuy > 1 && paymentData.primary}
					<small>{paymentData.basePriceString}</small>
					<!-- `ITEM-PILES.Applications.TradeMerchantItem.${settings.selling ? "They" : "You"}CantAfford` -->
				{/if}
			</div>
		</div>

		<div class="item-piles-bottom-divider" style="display: grid; grid-template-columns: auto auto;">

			<strong class="item-piles-bottom-divider" style="margin-bottom:0.25rem; padding-bottom:0.25rem;">
				{localize("ITEM-PILES.Applications.TradeMerchantItem." + (settings.selling ? "YouReceive" : "YouPay"))}:
			</strong>

			<strong class="item-piles-bottom-divider item-piles-text-right"
			        style="margin-bottom:0.25rem; padding-bottom:0.25rem;">
				{localize("ITEM-PILES.Applications.TradeMerchantItem." + (settings.selling ? "TheyReceive" : "YouReceive"))}:
			</strong>

			<div>
				{#each paymentData.finalPrices as price}
					{#if price.quantity}
						<div style="display:flex; align-items: center;">
							<div class="item-piles-img-container" style="margin-right: 0.25rem;">
								<img class="item-piles-img" src={price.img}/>
							</div>
							<span>{price.quantity} {localize(price.name)}</span>
						</div>
					{/if}
				{/each}
			</div>

			<div style="display:flex; flex-direction: column; align-items: flex-end;">
				{#each paymentData.buyerReceive as price}
					<div style="display:flex; align-items: center;">
						<span>{price.quantity > 1 ? price.quantity + " " : ""}{price.name}</span>
						<div class="item-piles-img-container" style="margin-left: 0.25rem;">
							<img class="item-piles-img" src={price.img}/>
						</div>
					</div>
				{/each}
				{#if paymentData.buyerChange.length}
          <span class="item-piles-small-text item-piles-text-right" style="margin-right: 0.25rem; margin-top: 0.5rem;">
            {localize("ITEM-PILES.Applications.TradeMerchantItem.Change")}:
          </span>
					{#each paymentData.buyerChange as change}
						{#if change.quantity}
							<div style="display:flex; align-items: center;">
								<span>{change.quantity} {localize(change.name)}</span>
								<div class="item-piles-img-container" style="margin-left: 0.25rem;">
									<img class="item-piles-img" src={change.img}/>
								</div>
							</div>
						{/if}
					{/each}
				{/if}
			</div>

		</div>

		<footer class="sheet-footer item-piles-flexrow">
			<button disabled={!paymentData.canBuy} on:click={ () => { submit() } } type="button">
				{#if settings.selling}
					<i class="fas fa-hand-holding-usd"></i> {localize("ITEM-PILES.Applications.TradeMerchantItem.SellItem")}
				{:else}
					<i class="fas fa-shopping-cart"></i> {localize("ITEM-PILES.Applications.TradeMerchantItem.BuyItem")}
				{/if}
			</button>

			<button on:click|once={() => { application.close() }} type="button">
				<i class="fas fa-times"></i>
				{localize("Cancel")}
			</button>
		</footer>

	</div>

</ApplicationShell>

<style lang="scss">

  .highlight {
    box-shadow: inset 0 0 13px 5px rgba(255, 117, 0, 0.73);
  }

</style>
