<script>

  import { TJSMenu } from "@typhonjs-fvtt/svelte-standard/component";

  export let entry;

  const item = entry.item;

  const name = item.name;
  const img = item.img;
  const quantity = item.quantity;
  const canStack = item.canStack;

</script>

<div class="grid-item">
  <img title={$name} src={$img} alt={$name}/>
  {#if canStack && $quantity > 1}
    <span>{$quantity}</span>
  {/if}
</div>

<style lang="scss">

  div {
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
  }

</style>