<script>

  export let icon = "fas fa-exclamation-triangle";
  export let header = "Item Piles";
  export let content;

</script>


<div>

  {#if icon}
    <p class="header-icon"><i class="{icon}"></i></p>
  {/if}
  {#if header}
    <p class="header"><strong>{header}</strong></p>
  {/if}
  {#if Array.isArray(content)}
    {#each content as part}
      <p>{@html part}</p>
    {/each}
  {:else}
    <p>{@html content}</p>
  {/if}

</div>

<style lang="scss">

  div {

    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    text-align: center;

    .header-icon {
      font-size: 3rem;
      margin: 0;
    }

    .header {
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
    }

  }

</style>
