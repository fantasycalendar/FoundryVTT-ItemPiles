<script>

	import { createEventDispatcher, getContext, onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
    import { styleFromObject } from '../../../helpers/helpers';
  import { calcPosition } from './grid-utils';
	import GridItem from './GridItem.svelte';

  export let gridContainer = HTMLDivElement;
  export let items = [];
  export let dropGhost = false;
  export let options = {
    cols: null,
    rows: null,
    enabledCols: null,
    enabledRows: null,
    gap: 10,
    gridSize: 50,
    canOrganize: false,
    backgroundGrid: false,
    class: "",
    activeClass: "",
    previewClass: "",
    collisionClass: "",
    hoverClass: "",
    highlightClass: "",
    highlightItems: false
  }

  let containerHeight = writable(0);
  let containerWidth = writable(0);

  const dispatch = createEventDispatcher();

	function itemChangeEvent(event) {
		dispatch('change', { ...event.detail });
	}

  function itemHoverEvent(event){
    dispatch('hover', { ...event.detail });
  }

  function itemHoverLeaveEvent(event){
    dispatch('leave', { ...event.detail });
  }

  function itemRightClickEvent(event){
    dispatch('rightclick', { ...event.detail });
  }

  function itemDoubleClickEvent(event) {
    dispatch('doubleclick', { ...event.detail });
  }

	$: $containerWidth = options.cols * (options.gridSize + options.gap) + options.gap;
	$: $containerHeight = options.rows * (options.gridSize + options.gap) + options.gap;

  $: containerStyle = styleFromObject({
    "width": $containerWidth + "px",
    "height": $containerHeight + "px",
  });

  let backgroundGridStyle = "";
  $: backgroundGridStyle = styleFromObject({
    "grid-template-columns": `repeat(${options.cols}, ${options.gridSize + options.gap/2}px)`,
    "grid-template-rows": `repeat(${options.rows}, ${options.gridSize + options.gap/2}px)`,
    "gap": `${options.gap/2}px`,
    "top": `${options.gap/2}px`
  });

</script>

<svelte:options accessors={true}/>

<div class=item-piles-grid-container>

  <div
    class="item-piles-grid {options.class}"
    bind:this={gridContainer}
    style={containerStyle}
  >
    {#if dropGhost && dropGhost?.active}
      {@const dropElem = calcPosition(dropGhost, options)}
      <div
        style={`position: absolute; left:${dropElem.left}px; top:${dropElem.top}px;
        width: ${dropElem.width}px; height: ${dropElem.height}px;`}
        class={options.previewClass}
      />
    {/if}
    {#each items as item (item.id)}
      <GridItem
        bind:item={item}
        bind:items={items}
        bind:options={options}
        {gridContainer}
        on:itemdoubleclick={itemDoubleClickEvent}
        on:itemchange={itemChangeEvent}
        on:itemhover={itemHoverEvent}
        on:itemhoverleave={itemHoverLeaveEvent}
        on:itemrightclick={itemRightClickEvent}
      >
        <slot {item}/>
      </GridItem>
    {/each}
  </div>

  {#if options.backgroundGrid}

    <div class="item-piles-inner-grid" style={backgroundGridStyle}>
      {#each Array(options.rows) as _, rowIndex (rowIndex)}
        {#each Array(options.cols) as _, colIndex (colIndex)}
          <div class:grid-disabled={colIndex >= options.enabledCols || rowIndex >= options.enabledRows}
               style="width: {options.gridSize + (options.gap/2)}px; height: {options.gridSize + (options.gap/2)}"></div>
        {/each}
      {/each}
    </div>

  {/if}

</div>

<style lang="scss">

  .item-piles-grid-container {
    position: relative;
    display: flex;
    justify-content: center;
  }

	.item-piles-grid {
		position: relative !important;
    margin: -2px;
	}

  .item-piles-inner-grid {
    display: grid;
    border-radius: 0.25rem;
    position:absolute;
    margin: -1px;
    pointer-events: none;
    > div {
      border-radius: 0.25rem;
      border: 1px solid rgba(0,0,0,0.25);

      &.grid-disabled {
        background-color: rgba(0,0,0,0.25);
      }
    }
  }

</style>
