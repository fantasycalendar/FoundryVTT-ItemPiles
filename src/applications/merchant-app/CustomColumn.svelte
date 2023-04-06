<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let item;
  export let data;

  const doc = item.itemDocument;

  $: value = data.path ? getProperty($doc, data.path) : data.path;
  $: text = localize(data.mapping?.[value] ?? value);

</script>

<div>
	<span>{text}</span>
</div>

<style lang="scss">

  div {
    padding: 0 10px;
    text-align: center;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

</style>
