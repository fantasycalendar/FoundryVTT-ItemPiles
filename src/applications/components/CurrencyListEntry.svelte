<script>

  export let currency;
  export let options = {
    reverse: false,
    imgSize: 24
  };

  let name = currency.name;
  let img = currency.img;
  let abbreviation = currency.abbreviation;
  let quantity = currency.quantity;

  $: text = abbreviation
    ? (options.abbreviation ? abbreviation.replace("{#}", $quantity) : $quantity)
    : `${$name} (x${$quantity})`;

</script>

<div class="item-piles-flexrow{options.reverse ? '-reverse' : ''} item-piles-item-row" style="flex:0 1 auto;">

  <div class="item-piles-img-container"
       style="min-height: {options.imgSize}px; min-width: {options.imgSize}px; max-width: {options.imgSize}px; max-height: {options.imgSize}px;">
    <img class="item-piles-img" src="{$img}" alt={$name}/>
  </div>

  <div class="item-piles-name item-piles-text" style="flex:0 1 auto; margin: 0 0.25rem;">
    <div class="item-piles-name-container">
      {text}
    </div>
  </div>

</div>
