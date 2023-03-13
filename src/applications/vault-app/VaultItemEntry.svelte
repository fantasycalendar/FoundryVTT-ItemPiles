<script>

  import * as Helpers from "../../helpers/helpers.js";

  export let entry;

  const item = entry.item;

  const name = item.name;
  const img = item.img;
  const rarityColor = item.rarityColor;
  const quantity = item.quantity;
  const canStack = item.canStack;
  const style = item.style;

  let styling = "";
  $: {
    if ($rarityColor) {
      styling = `box-shadow: inset 0px 0px 7px 0px ${$rarityColor};`;
    } else {
      styling = Helpers.styleFromObject({ ...$style })
    }
  }
  ;

</script>

<div class="grid-item" data-tooltip={$name}
		 data-tooltip-activation-speed="0" data-tooltip-deactivation-speed="0">
	{#if $img}
		<img src={$img} alt={$name}/>
	{/if}
	{#if styling}
		<div class="grid-item-ghost" style={styling}></div>
	{/if}
	{#if canStack && $quantity > 1}
		<span>{$quantity}</span>
	{/if}
</div>

<style lang="scss">

  .grid-item {
    width: 100%;
    height: 100%;
    background-color: rgb(56, 56, 56);
    transition: transform 2s, top 2s, left 2s;
    border-radius: 0.25rem;
    position: relative;

    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border: 1px solid black;

    img {
      position: absolute;
      flex-shrink: 0;
      min-width: 100%;
      min-height: 100%;
      object-fit: cover;
      transition: transform 2s, opacity 2s;
      border: 0;
    }

    span {
      position: absolute;
      bottom: 0;
      right: 3px;
      text-align: right;
      color: white;
      text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
      pointer-events: none;
    }

    .grid-item-ghost {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }

</style>
