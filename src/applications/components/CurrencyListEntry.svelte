<script>

  import * as Helpers from "../../helpers/helpers.js"

  export let currency;
  export let options;

  let name = currency.name;
  let img = currency.img;
  let abbreviation = currency.abbreviation;
  let quantity = currency.quantity;

  let text = "";
  $: {
    let number = options.abbreviateNumbers ? Helpers.abbreviateNumbers($quantity) : $quantity;
    if($abbreviation){
      if(options.abbreviations){
        text = $abbreviation.replace("{#}", number);
      }else{
        text = number;
      }
    }else{
      text = `${$name} (x${$quantity})`;
    }
  }

</script>

<div class="item-piles-flexrow{options.reverse ? '-reverse' : ''} item-piles-item-row" style="flex:0 1 auto;" data-tooltip={$name} data-tooltip-activation-speed="0" data-tooltip-deactivation-speed="0">

  <div class="item-piles-img-container" style="min-height: {options.imgSize}px; min-width: {options.imgSize}px; max-width: {options.imgSize}px; max-height: {options.imgSize}px;">
    <img class="item-piles-img" src="{$img}"/>
  </div>

  <div class="item-piles-name item-piles-text" style="flex:0 1 auto; margin: 0 0.25rem;">
    <div class="item-piles-name-container">
      {text}
    </div>
  </div>

</div>
