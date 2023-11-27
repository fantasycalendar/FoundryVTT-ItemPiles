<script>

	import * as Helpers from "../../helpers/helpers.js";
	import SETTINGS from "../../constants/settings.js";

	export let store;
	export let data;
	export let editable = true;

	const canPreview = data.id && (Helpers.getSetting(SETTINGS.INSPECT_ITEMS_IN_TRADE) || editable)

	function previewItem() {
		if (!canPreview || !data.id) return;
		const item = store.leftTraderActor.items.get(data.id) ?? store.rightTraderActor.items.get(data.id);
		if (!item) return;
		if (game.user.isGM || item.ownership[game.user.id] === CONST.DOCUMENT_PERMISSION_LEVELS.OWNER) {
			return item.sheet.render(true);
		}
		const cls = item._getSheetClass()
		const sheet = new cls(item, { editable: false })
		return sheet._render(true);
	}

	function onKeyDown(e) {
		if (e.keyCode === 13) {
			updateQuantity();
		}
	}

	function updateQuantity() {
		data.quantity = Math.max(0, Math.min(data.maxQuantity, data.newQuantity));
		if (data.quantity === 0) {
			return store.removeEntry(data);
		}
		data.newQuantity = data.quantity;
		data.editing = false;
	}

</script>

<svelte:window on:click={() => {
  if(data.editing && editable) updateQuantity();
}}/>

<div class="item-piles-flexrow item-piles-item-row item-piles-even-color">

	{#if editable}
		<div style="flex: 0 1 auto; margin: 0 6px;">
			<a class="item-piles-clickable-red" on:click={() => { store.removeEntry(data) }}>
				<i class="fas fa-times"></i>
			</a>
		</div>
	{/if}

	<div class="item-piles-img-container">
		<img class="item-piles-img" src="{data.img}"/>
	</div>

	<div class="item-piles-name item-piles-text">
		<div class="item-piles-name-container">
			<p class:item-piles-clickable-link="{canPreview}" on:click={previewItem}>{data.name}</p>
		</div>
	</div>

	{#if editable}
		<div style="flex: 0 1 17px; margin: 0 5px;">
			{#if data.editing}
				<a class="item-piles-clickable-green item-piles-confirm-quantity" on:click="{updateQuantity}">
					<i class="fas fa-check"></i>
				</a>
			{/if}
		</div>
	{/if}

	<div class="item-piles-text-right" class:item-piles-quantity-container={editable}
	     on:click={(evt) => evt.stopPropagation()}>
		{#if editable}
			<div class="item-piles-quantity-container">
				{#if data.editing}
					<div class="item-piles-quantity-input-container">
						<input
							class="item-piles-quantity"
							type="number"
							bind:value={data.newQuantity}
							on:keydown={onKeyDown}
						/>
					</div>
				{:else}
            <span class="item-piles-quantity-text"
                  on:click="{ () => { data.editing = true } }">
              {data.quantity}
            </span>
				{/if}
			</div>
		{:else}
			<span class="item-piles-text" style="padding-right:0.5rem;">{data.quantity}</span>
		{/if}
	</div>
</div>
