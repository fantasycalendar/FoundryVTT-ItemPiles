<script>
  export let item;

  const itemName = item.name;
  const itemImage = item.img;

  const store = item.store;
  const pileData = store.pileData;
  const displayQuantityStore = item.displayQuantity;
  const quantityStore = item.quantity;
  const itemFlagDataStore = item.itemFlagData;

  $: itemFlagData = $itemFlagDataStore;
  $: displayQuantity = $displayQuantityStore;
  $: quantity = $quantityStore;
  $: editQuantity = $quantityStore;
  let showEditQuantity = false;

  const displayControlButtons = store.actor.isOwner;
  const displayBuyButton = !!store.recipient;

  function previewItem(item) {
    item = store.actor.items.get(item.id);
    if (game.user.isGM || item.data.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass();
    const sheet = new cls(item, { editable: false });
    return sheet._render(true);
  }
</script>

<div
  class="item-piles-img-container"
  class:not-for-sale={itemFlagData.notForSale || !quantity}
>
  <img class="item-piles-img" src={$itemImage} />
</div>

<div class="item-piles-name item-piles-text">
  <div class="item-piles-name-container">
    {#if $pileData.canInspectItems || game.user.isGM}
      <a class="item-piles-clickable" on:click={previewItem(item)}
        >{$itemName}</a
      >
    {:else}
      {$itemName}
    {/if}
    {#if displayQuantity}
      {#if itemFlagData.infiniteQuantity}
        <span class="item-piles-small-text">(∞)</span>
      {:else if !showEditQuantity}
        <span
          class="item-piles-small-text"
          class:item-piles-clickable-link={game.user.isGM}
          on:click={() => {
            if (game.user.isGM) showEditQuantity = true;
          }}>(x{quantity})</span
        >
      {/if}
    {/if}
    {#if showEditQuantity}
      <div class="item-piles-quantity-container" style="flex:0 1 50px;">
        <div class="item-piles-quantity-input-container">
          <input
            class="item-piles-quantity"
            type="text"
            bind:value={editQuantity}
            autofocus
            on:change={() => {
              showEditQuantity = false;
              item.updateQuantity(editQuantity);
            }}
            on:keydown={(evt) => {
              if (evt.key === "Enter") showEditQuantity = false;
            }}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<slot name="right" />

