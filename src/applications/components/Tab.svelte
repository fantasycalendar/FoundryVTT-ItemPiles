<script>

  export let activeTab;
  export let tab;
  export let classes = {};

</script>

<div class={$$props.class} class:hidden={activeTab !== tab}>
  <slot></slot>
</div>


<style lang="scss">

  .hidden {
    display: none;
  }

</style>