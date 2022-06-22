<script>

  export let callback;

  function dropData(event) {
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }
    callback(data);
  }

</script>

<div on:dragstart|preventDefault on:dragover|preventDefault on:drop|preventDefault={dropData}>
  <slot></slot>
</div>