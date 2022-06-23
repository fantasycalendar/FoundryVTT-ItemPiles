<script>

  export let value;
  export let min = 0;
  export let max = 200;
  export let maxInput = Infinity;
  export let step = 1;
  export let divideBy = 100;

  let displayValue = value * divideBy;

  $: {
    value = displayValue / divideBy;
  }

</script>

<div class="slider-group" style={$$props.style}>
  <input type="range" {min} {step} {max} bind:value="{displayValue}"/>
  <input type="number" {min} {step} {maxInput} required bind:value="{displayValue}"/>
</div>

<style lang="scss">

  .slider-group {
    display: flex;
    align-items: center;
    flex: 3;

    input[type="range"] {
      flex: 3;
    }

    input[type="number"] {
      flex: 0 1 40px;
      margin-left: 1rem;
      height: 20px;
      font-size: 0.8rem;
    }
  }

</style>