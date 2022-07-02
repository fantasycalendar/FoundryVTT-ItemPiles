<script>
  import FilePicker from "../../components/FilePicker.svelte";

  export let store;

  const currenciesStore = store.currencies;

  $: currencies = $currenciesStore;

</script>

<div class="sortable-list-columns header">
  <div style="justify-content:flex-start;">Primary</div>
  <div>Name</div>
  <div>Exchange</div>
  <div>Short</div>
  <div>Icon</div>
  <div>Data</div>
  <div></div>
</div>
{#each currencies as item, index (item.id)}
  <div class="sortable-list-columns">
    <div><input type="checkbox" checked={item.primary} on:change={() => store.setPrimary(index)}/></div>
    <div><input type="text" bind:value={item.name}/></div>
    <div><input type="number" step="0.000000001" bind:value={item.exchangeRate} on:change={() => store.sortCurrencies()}/></div>
    <div><input type="text" bind:value={item.abbreviation}/></div>
    <div><FilePicker type="imagevideo" showImage={true} showInput={false} bind:value={item.img}/></div>
    <div>
      {#if item.type === "attribute"}
        <input type="text" bind:value={item.data.path}/>
      {:else}
        <a on:click={() => store.editItem(index)}>
          <i class="fas fa-edit"></i> Edit item
        </a>
      {/if}
    </div>
    <div><button type="button"><i class="fas fa-times"></i></button></div>
  </div>
{/each}

<style lang="scss">

  .sortable-list-columns {
    position: relative;
    display: grid;
    grid-template-columns: 25px 1.5fr 60px 0.5fr 60px 1fr 25px;
    margin: 0.2em 0;
    z-index:99999 !important;
    vertical-align: middle;

    &.header{
      text-align: center;
      font-style: italic;
    }

    div {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    button {
      padding: 0.25rem 0.25rem;
      line-height: 1rem;
      flex: 0;
      text-align: center;
    }

  }

</style>