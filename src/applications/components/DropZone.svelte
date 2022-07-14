<script>

  export let callback;
  export let isHovering;
  export let active = true;

  function dropData(event) {
    if (!active) return;
    counter = 0;
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }
    callback(data);
  }

  let counter = 0;

  function enter() {
    if (!active) return;
    counter++;
  }

  function leave() {
    if (!active) return;
    counter--;
  }

  $: isHovering = counter > 0;

</script>

<div
    on:dragenter={enter}
    on:dragleave={leave}
    on:dragstart|preventDefault
    on:dragover|preventDefault
    on:drop|preventDefault={dropData}
    style={$$props.style}
>
  <slot></slot>
</div>