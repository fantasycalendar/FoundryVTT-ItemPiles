<script>
  import FilePicker from "../../components/FilePicker.svelte";
  import DropZone from "../../components/DropZone.svelte";
  import * as Helpers from "../../../helpers/helpers.js";

  export let store;

  const currenciesStore = store.currencies;
  let isHovering = false;

  $: currencies = $currenciesStore;

  async function dropData(data) {

    if (!data.type) {
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    if (data.type !== "Item") {
      throw Helpers.custom_error("You must drop an item, not " + data.type.toLowerCase() + "!")
    }

    store.addItem(data);

  }

</script>

<DropZone callback={dropData} bind:isHovering={isHovering}>
  <div class="item-piles-sortable-list-columns header">
    <div style="justify-content:flex-start;">Primary</div>
    <div>Name</div>
    <div>Exchange</div>
    <div>Short</div>
    <div>Icon</div>
    <div>Data</div>
    <div><a on:click={() => store.addAttribute()}><i class="fas fa-plus"></i></a></div>
  </div>
  <div class="table-container">
    {#if isHovering}
      <div class="drop-to-add">Drop to add</div>
    {/if}
    {#if !currencies.length}
      <div class="item-piles-sortable-list-columns ">
        <div class="full-span" class:invisible={isHovering}>
          Drop an item or click the plus button to get started!
        </div>
      </div>
    {/if}
    {#each currencies as item, index (item.id)}
      <div class="item-piles-sortable-list-columns">
        <div><input type="checkbox" checked={item.primary} on:change={() => store.setPrimary(index)}/></div>
        <div><input type="text" bind:value={item.name}/></div>
        <div><input type="number" step="0.000000001" bind:value={item.exchangeRate}/></div>
        <div><input type="text" bind:value={item.abbreviation}/></div>
        <div>
          <FilePicker type="imagevideo" showImage={true} showInput={false} bind:value={item.img}/>
        </div>
        <div>
          {#if item.type === "attribute"}
            <input type="text" bind:value={item.data.path} placeholder="system.attributes.hp.value"/>
          {:else}
            <button type="button" on:click={() => store.editItem(index)}>
              <i class="fas fa-eye"></i> View item
            </button>
          {/if}
        </div>
        <div>
          <button type="button" class="delete-button" on:click={() => store.removeEntry(index)}>
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    {/each}
  </div>
</DropZone>

<style lang="scss">

  .item-piles-sortable-list-columns {
    grid-template-columns: 28px 1.25fr 60px 0.5fr 60px 1fr 28px;

    .full-span {
      padding: 2rem 1rem;
      grid-column: 1/-1;
      font-size: 1.5rem;
      border-radius: 5px;
      border: 2px dashed rgba(0, 0, 0, 0.35);
    }
  }

  .invisible {
    opacity: 0;
  }

  .table-container {
    position: relative;
  }

  .drop-to-add {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    border-radius: 5px;
    box-shadow: inset 0 0 15px 5px rgb(0, 0, 0, 0.5);
    background-color: rgba(255, 255, 255, 0.75);
    z-index: 100000;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
  }

</style>
