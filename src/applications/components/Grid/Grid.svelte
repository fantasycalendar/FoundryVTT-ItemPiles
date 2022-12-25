<script>

	import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { calcPosition } from './grid-utils';
	import GridItem from './GridItem.svelte';

  export let items = [];
  export let dropGhost = false;
  export let options = {
    cols: null,
    rows: null,
    enabledCols: null,
    enabledRows: null,
    gap: 10,
    gridSize: 40,
    bounds: false,
    readOnly: false,
    backgroundGrid: false,
    class: "",
    activeClass: "",
    previewClass: "",
    collisionClass: "",
  }

  let gridContainer = HTMLDivElement;
  let containerHeight = writable(0);
  let containerWidth = writable(0);

  const dispatch = createEventDispatcher();

	function itemChangeEvent(event) {
		dispatch('change', { items: event.detail.items });
		items = [...items];
	}

	$: $containerWidth = options.cols * (options.gridSize + options.gap);
	$: $containerHeight = options.rows * (options.gridSize + options.gap);

  $: containerStyle = Object.entries({
    "width": $containerWidth + "px",
    "height": $containerHeight + "px",
  }).map(entry => entry[0] + ': ' + entry[1] + ";").join("");

  
  let backgroundGridStyle = "";
  $: backgroundGridStyle = Object.entries({
    "grid-columns": options.cols,
    "grid-rows": options.rows,
    "grid-half-gap": `${options.gap/2}px`,
    "grid-size-full": `${options.gridSize + options.gap}px`,
    "grid-size-full-half-gap": `${options.gridSize + (options.gap/2)}px`,
  }).map(entry => `--${entry[0]}:${entry[1]};`).join("")
  
</script>

<div class=item-piles-grid-container>

  <div
    class="item-piles-grid {options.class}"
    bind:this={gridContainer}
    style={containerStyle}
  >
    {#each items as item (item.id)}
      <GridItem
        {item}
        options={{
          ...options,
          gridContainer,
          items
        }}
        on:itemchange={itemChangeEvent}
      >
        <slot {item} />
      </GridItem>
    {/each}
    {#if dropGhost && dropGhost?.active}
      {@const dropElem = calcPosition(dropGhost, options)}
      <div
        style={`position: absolute; left:${dropElem.left}px; top:${dropElem.top}px;  
        width: ${dropElem.width}px; height: ${dropElem.height}px; z-index: -10;`}
        class={options.previewClass}
      />
    {/if}
  </div>

  {#if options.backgroundGrid}

    <div class="item-piles-inner-grid" style={backgroundGridStyle}>
      {#each Array(options.rows) as _, rowIndex (rowIndex)}
        {#each Array(options.cols) as _, colIndex (colIndex)}
          <div class:grid-disabled={colIndex >= options.enabledCols || rowIndex >= options.enabledRows}></div>
        {/each}
      {/each}
    </div>

  {/if}

</div>

<style lang="scss">

  .item-piles-grid-container {
    position: relative;
  }

	.item-piles-grid {
		position: relative !important;
    margin: -2px;
	}

  .item-piles-inner-grid {
    display: grid;
    border-radius: 0.25rem;
    position:absolute;
    top: var(--grid-half-gap);
    margin: 1px;
    grid-template-columns: repeat(var(--grid-columns), var(--grid-size-full));
    grid-template-rows: repeat(var(--grid-rows), var(--grid-size-full));
    z-index: -1;
    > div {
      width: var(--grid-size-full-half-gap);
      height: var(--grid-size-full-half-gap);
      border-radius: 0.25rem;
      border: 1px solid rgba(0,0,0,0.25);

      &.grid-disabled {
        background-color: rgba(0,0,0,0.25);
      }
    }
  }

</style>