<script>

  export let store;
  export let entry;
  export let removeCallback;

</script>

<div class="flexrow item-piles-item-row">

  <div style="flex: 0 1 auto; margin: 0 6px;">
    <a class="item-piles-clickable-red" on:click={removeCallback}>
      <i class="fas fa-times"></i>
    </a>
  </div>

  <div class="item-piles-img-container">
    <img class="item-piles-img" src="{entry.img}"/>
  </div>

  <div class="item-piles-name item-piles-text">
    <div class="item-piles-name-container">
      <a class="item-piles-clickable">{entry.name}</a>
    </div>
  </div>

  {#if entry.editing}
    <div style="flex: 0 1 auto; margin: 0 5px;">
      <a class="item-piles-clickable-green item-piles-confirm-quantity">
        <i class="fas fa-check"></i>
      </a>
    </div>
  {/if}

  <div style="flex:1;">
    {#if entry.editing}
      <div style="flex-direction: row;" class="item-piles-quantity-container">
        <input
            class="item-piles-quantity"
            type="number"
            min="0"
            value="{entry.quantity}"
            max="{entry.maxQuantity}"
            on:change="{() => {
              entry.quantity = Math.max(1, Math.min(entry.maxQuantity, Number(event.target.value)));
              entry.editing = false;
            }}"
        />
      </div>
    {:else}
        <span class="item-piles-text-right item-piles-quantity-text" on:click="{() => { entry.editing = true }}">
          {entry.quantity}
        </span>
    {/if}
  </div>
</div>