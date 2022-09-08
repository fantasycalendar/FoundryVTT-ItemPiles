<script>

  export let currency;

  let name = currency.name;
  let img = currency.img;
  let abbreviation = currency.abbreviation;
  let quantity = currency.quantity;

</script>

<div class="item-piles-flexrow item-piles-item-row" style="flex:0 1 auto; margin: 0.5rem 0.25rem;">

  <div class="item-piles-img-container">
    <img class="item-piles-img" src="{$img}"/>
  </div>

  <div class="item-piles-name item-piles-text" style="flex:0 1 auto;">
    <div class="item-piles-name-container">
      {#if abbreviation}
        {abbreviation.replace("{#}", $quantity)}
      {:else}
        {$name} (x{$quantity})
      {/if}
    </div>
  </div>

</div>