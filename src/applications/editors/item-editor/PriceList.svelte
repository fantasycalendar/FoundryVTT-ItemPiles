<script>
    import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
    import FilePicker from "../../components/FilePicker.svelte";
    import { flip } from "svelte/animate";
    import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
    import DropZone from "../../components/DropZone.svelte";
    import * as Helpers from "../../../helpers/helpers.js";
    import * as Utilities from "../../../helpers/utilities.js";
    import CONSTANTS from "../../../constants/constants.js";

    export let prices;
    export let remove;

    let isHovering = false;
    let flipDurationMs = 200;
    let dragDisabled = true;

    function removeEntry(index) {
        prices.splice(index, 1);
        prices = prices;
    }

    function addAttribute() {
        prices = [...prices, {
            id: randomID(),
            type: "attribute",
            name: "New Attribute",
            img: "",
            abbreviation: "{#}N",
            data: {
                path: ""
            },
            quantity: 1,
            fixed: true
        }];
    }

    async function dropData(data) {

        if (!data.type) {
            throw Helpers.custom_error("Something went wrong when dropping this item!")
        }

        if (data.type !== "Item") {
            throw Helpers.custom_error("You must drop an item, not " + data.type.toLowerCase() + "!")
        }

        let uuid = false;
        if (data.pack) {
            uuid = "Compendium" + data.pack + "." + data.id;
        }

        let item = await Item.implementation.fromDropData(data);
        let itemData = item.toObject();

        if (!itemData) {
            console.error(data);
            throw Helpers.custom_error("Something went wrong when dropping this item!")
        }

        const itemCurrencies = prices.map(entry => entry.data?.item ?? {});
        const foundItem = Utilities.findSimilarItem(itemCurrencies, itemData);

        if (foundItem) {
            const index = itemCurrencies.indexOf(foundItem);
            prices[index].data = {
                uuid,
                item: itemData
            }
            Helpers.custom_notify(`Updated item data for ${localize(prices[index].name)} (item name ${itemData.name})`)
        } else {
            prices = [...prices, {
                id: randomID(),
                type: "item",
                name: itemData.name,
                img: itemData.img,
                abbreviation: "{#} " + itemData.name,
                data: {
                    uuid,
                    item: itemData
                },
                quantity: 1,
                fixed: true
            }];
        }
    }

    async function editItem(index) {
        const data = prices[index].data;
        let item;
        if (data.uuid) {
            item = await fromUuid(data.uuid);
        } else {
            let itemData = data.item;
            if (itemData._id) delete itemData._id;
            if (itemData.permission) delete itemData._id;
            const items = Array.from(game.items);
            item = Utilities.findSimilarItem(items, itemData);
            if (!item) {
                setProperty(itemData, CONSTANTS.FLAGS.TEMPORARY_ITEM, true);
                item = await Item.implementation.create(itemData);
                Helpers.custom_notify(`An item has been created for ${item.name} - drag and drop it into the list to update the stored item data`)
            }
        }
        item.sheet.render(true);
    }

    function handleConsider(e) {
        const { items: newItems, info: { source, trigger } } = e.detail;
        prices = newItems;
        // Ensure dragging is stopped on drag finish via keyboard
        if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
            dragDisabled = true;
        }
    }

    function handleFinalize(e) {
        const { items: newItems, info: { source } } = e.detail;
        prices = newItems;
        // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
        if (source === SOURCES.POINTER) {
            dragDisabled = true;
        }
    }

    function startDrag(e) {
        // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
        e.preventDefault();
        dragDisabled = false;
    }

    function handleKeyDown(e) {
        if ((e.key === "Enter" || e.key === " ") && dragDisabled) dragDisabled = false;
    }

</script>


<DropZone callback={dropData} bind:isHovering={isHovering}>
  <div class="table-container item-piles-top-divider">
    <div class="item-piles-sortable-list-columns header">
      <div></div>
      <div>Name</div>
      <div>Cost</div>
      <div>Fixed</div>
      <div>Short</div>
      <div>Icon</div>
      <div>Data</div>
      <div><a class="item-piles-clickable-red" on:click={() => remove()}><i class="fas fa-times"></i></a></div>
    </div>
    <section
        use:dndzone="{{ items: prices, dragDisabled, flipDurationMs }}"
        on:consider="{handleConsider}"
        on:finalize="{handleFinalize}"
    >
      {#if isHovering}
        <div class="drop-to-add">Drop to add</div>
      {/if}
      {#each prices as price, index (price.id)}
        <div class="item-piles-sortable-list-columns item-piles-sortable-list-entry item-piles-even-color"
             animate:flip="{{ duration: flipDurationMs }}">
          <div tabIndex={dragDisabled? 0 : -1}
               aria-label="drag-handle"
               style={dragDisabled ? 'cursor: grab' : 'cursor: grabbing'}
               on:mousedown={startDrag}
               on:touchstart={startDrag}
               on:keydown={handleKeyDown}
          ><i class="fas fa-bars"></i></div>
          <div><input type="text" bind:value={price.name}/></div>
          <div><input type="number" bind:value={price.quantity}/></div>
          <div><input type="checkbox" bind:checked={price.fixed}/></div>
          <div><input type="text" bind:value={price.abbreviation}/></div>
          <div>
            <FilePicker type="imagevideo" showImage={true} showInput={false} bind:value={price.img}/>
          </div>
          <div>
            {#if price.type === "attribute"}
              <input type="text" bind:value={price.data.path} placeholder="data.attributes.hp.value"/>
            {:else}
              <button type="button" on:click={() => editItem(index)}>
                <i class="fas fa-eye"></i> View item
              </button>
            {/if}
          </div>
          <div>
            <button type="button" on:click={() => removeEntry(index)}><i class="fas fa-times"></i></button>
          </div>
        </div>
      {/each}
      <div class="item-piles-sortable-list-columns">
        <div class="full-span">
          <a on:click={() => addAttribute()} class:invisible={isHovering}>
            {localize("ITEM-PILES.Applications.ItemEditor.DropMeClickMe")}
          </a>
        </div>
      </div>
    </section>
  </div>
</DropZone>

<style lang="scss">

  .item-piles-sortable-list-columns {
    grid-template-columns: 28px 1.25fr 28px 35px 0.5fr 60px 1fr 28px;
    min-height: 30px;
  }

  .item-piles-sortable-list-entry {
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .item-piles-even-color {
    &:nth-child(even) {
      background-color: #e5e5d6;
    }

    &:nth-child(odd) {
      background-color: #f8f8e7;
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
    font-size: 1.5rem;
    overflow: hidden;
  }

  .full-span {
    grid-column: 1/-1;
  }

</style>