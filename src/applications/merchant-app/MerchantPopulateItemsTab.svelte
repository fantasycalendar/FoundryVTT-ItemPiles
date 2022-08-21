<script>
  import { get, writable } from "svelte/store";

  export let store;

  let tables = Array.from(game.tables);
  let selectedTable = tables?.[0]?.id;
  let timesToRoll = "1d10";
  let timesRolled = "";
  let keepRolled = false;

  let itemStore = store.items;

  let currentItems = [];

  $: {
    currentItems = $itemStore.map(item => ({
      id: item.item.id,
      name: item.item.name,
      quantity: get(item.quantity),
      img: item.item.img
    }));
    currentItems.sort((a, b) => {
      return a.name < b.name ? -1 : 1;
    });
  }

  let itemsRolled = writable([]);

  async function rollItems() {
    const table = game.tables.get(selectedTable);
    if (!table) return;
    const roll = new Roll(timesToRoll ?? 1).evaluate({ async: false });
    if (!keepRolled) {
      itemsRolled.set([]);
    }
    timesRolled = roll.total;
    if (roll.total <= 0) {
      return;
    }
    await table.reset();
    const tableDraw = await table.drawMany(timesRolled, { displayChat: false });
    itemsRolled.update(items => {
      tableDraw.results.forEach(result => {
        const rollData = result.data;
        const existingItem = items.find(item => item.resultId === rollData.resultId);
        if (existingItem) {
          existingItem.quantity++;
        } else {
          items.push({
            ...rollData,
            quantity: 1
          });
        }
      });
      items.sort((a, b) => {
        return a.text < b.text ? -1 : 1;
      });
      return items;
    });
  }

  async function getItem(itemToGet) {
    let item;
    if (itemToGet.collection === "Item") {
      item = game.items.get(itemToGet.resultId);
    } else {
      const compendium = game.packs.get(itemToGet.collection);
      if (compendium) {
        item = await compendium.getDocument(itemToGet.resultId);
      }
    }
    return item;
  }

  async function addItem(itemToAdd) {
    let item = await getItem(itemToAdd);
    if (item) {
      await game.itempiles.addItems(store.actor, [{ item, quantity: itemToAdd.quantity }]);
    }
    removeItem(itemToAdd);
  }

  function removeItem(itemToRemove) {
    itemsRolled.update(items => {
      const existingItemIndex = items.findIndex(item => item.resultId === itemToRemove.resultId);
      items.splice(existingItemIndex, 1);
      return items;
    });
  }

  async function addAllItems() {
    const itemsToAdd = get(itemsRolled);
    const items = [];
    for (const itemToAdd of itemsToAdd) {
      let item = await getItem(itemToAdd);
      items.push({ item, quantity: itemToAdd.quantity });
    }
    await game.itempiles.addItems(store.actor, items);
    itemsRolled.set([]);
  }

</script>

<div>

  <div class="item-piles-flexrow" style="margin-bottom: 1rem;">

    <select bind:value={selectedTable} style="flex: 3; height:30px;">
      {#each tables as table (table.id)}
        <option value={table.id}>{table.name}</option>
      {/each}
      {#if !tables.length}
        <option value="">No roll tables exist, create one to get started</option>
      {/if}
    </select>

    <input type="text" bind:value={timesToRoll} placeholder="2d6+4"
           style="height: 30px; padding: 0 0.5rem; flex:0.5; min-width: 50px; margin-left:0.5rem;"/>

    <button style="flex:0; padding: 0 1rem; margin-left:0.5rem;" on:click={rollItems}>
      Roll
    </button>

  </div>

  <div class="item-piles-flexrow" style="margin-top:1rem;">

    <div style="margin-right:0.5rem;">

      <div style="margin-bottom:0.5rem;">
        {currentItems.length ? "Current items:" : "Merchant has no items"}
      </div>

      {#each currentItems as item (item.id)}
        <div class="item-piles-flexrow item-piles-item-row item-piles-even-color">
          <div class="item-piles-img-container">
            <img class="item-piles-img" src="{item.img}"/>
          </div>
          <div class="item-piles-name">
            <div class="item-piles-name-container">
              {item.name} x{item.quantity}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div>

      <div class="item-piles-flexrow item-piles-roll-header">
        <label>
          {#if timesRolled && $itemsRolled.length}
            Rolled {timesRolled} times:
          {:else}
            Click roll to start
          {/if}
        </label>

        <div class="item-piles-flexrow item-piles-keep-rolled">
          <label>Keep rolled:</label>
          <input type="checkbox" bind:checked={keepRolled}>
        </div>
      </div>


      {#if $itemsRolled.length}
        {#each $itemsRolled as item (item.resultId)}
          <div class="item-piles-flexrow item-piles-item-row item-piles-even-color">
            <button class="item-piles-rolled-item-button" on:click={() => addItem(item)}>
              <i class="fas fa-arrow-left"></i>
            </button>

            <div class="item-piles-img-container">
              <img class="item-piles-img" src="{item.img}"/>
            </div>

            <div class="item-piles-name">
              <div class="item-piles-name-container">
                <p>{item.text}</p>
              </div>
            </div>

            <div class="item-piles-quantity-container">
              <div class="item-piles-quantity-input-container">
                <input class="item-piles-quantity" type="number" min="0" bind:value="{item.quantity}"/>
              </div>
            </div>

            <button class="item-piles-rolled-item-button" style="color:red;" on:click={() => removeItem(item)}>
              <i class="fas fa-times"></i>
            </button>
          </div>
        {/each}

        <button class="item-piles-add-button" on:click={() => addAllItems()}>
          Add all <i class="fas fa-arrow-left"></i>
        </button>

      {/if}

    </div>

  </div>

</div>

<style lang="scss">

  .item-piles-roll-header {
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .item-piles-keep-rolled {
    align-items: center;
    justify-content: flex-end;
    font-size: 0.75rem;
    text-align: right;
    flex: 0 1 auto;

    input {
      height: 14px;
    }
  }

  .item-piles-name {
    flex: 1 0 40%;
  }

  .item-piles-quantity-container {
    flex: 0 1 50px;
  }

  .item-piles-add-button {
    height: 27px;
    line-height: inherit;
    margin-top: 0.5rem;
  }

  .item-piles-rolled-item-button {
    min-height: 22px;
    min-width: 22px;
    margin: 2px;
    font-size: 0.65rem;
    padding: 0.25rem;
    flex: 0;
    line-height: inherit;

    i {
      margin: 0;
    }
  }

</style>