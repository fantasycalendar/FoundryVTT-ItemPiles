<script>

	import { createEventDispatcher } from 'svelte';
  import { get, writable } from 'svelte/store';
	import { calcPosition, snapOnMove, getCollisions } from './grid-utils.js';

	export let item;
	export let options;

  const dispatch = createEventDispatcher();
  let previewItem = item;
	let active = false;

  let itemRef = HTMLElement;
	let left = writable(0);
	let top = writable(0);
	let width = writable(0);
	let height = writable(0);

	$: if (!active) {
		const newPosition = calcPosition(item, {
			gridSize: options.gridSize,
			gap: options.gap
		});
		left.set(newPosition.left);
		top.set(newPosition.top);
		width.set(newPosition.width);
		height.set(newPosition.height);
	}

  let style = "";
  $: style = Object.entries({
    "position": "absolute",
    "left": $left + "px",
    "top": $top + "px",
    "width": $width + "px",
    "height": $height + "px",
    "cursor": movable ? 'move' : 'auto',
    "touch-action": "none",
    "user-select": "none",
  }).map(entry => `${entry[0]}: ${entry[1]};`).join(" ");

	$: previewItem, dispatch('previewchange', { item: previewItem });

	// INTERACTION LOGIC

  let preview = false;
  let collisionPreview = false;
	let pointerShift = { left: 0, top: 0 };

	// MOVE ITEM LOGIC

	$: movable = !options.readOnly && item.movable === undefined && item.movable !== false;

	function moveStart(event) {
		if (!movable) return;
		if (event.button !== 0) return;
		active = true;
		pointerShift = { left: event.clientX - get(left), top: event.clientY - get(top) };
		itemRef.setPointerCapture(event.pointerId);
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', moveEnd);
	}

	function move(event) {
		let _left = event.pageX - pointerShift.left;
		let _top = event.pageY - pointerShift.top;

		if (options.bounds) {
			const parentRect = options.gridContainer.getBoundingClientRect();
      const relativeRect = {
        left: (parentRect.left - parentRect.x),
        top: (parentRect.top - parentRect.y),
        bottom: (parentRect.bottom),
        right: (parentRect.right),
      }
			if (_left < relativeRect.left) {
				_left = relativeRect.left;
			}
			if (_top < relativeRect.top) {
				_top = relativeRect.top;
			}
			if (_left + get(width) > relativeRect.right) {
				_left = relativeRect.right - get(width);
			}
			if (_top + get(height) > relativeRect.bottom) {
				_top = relativeRect.bottom - get(height);
			}
		}

		left.set(_left);
		top.set(_top);

    const { x, y } = snapOnMove(_left, _top, previewItem, options);
    const collisions = getCollisions({ ...previewItem, x, y }, options.items);
    
    previewItem = { ...previewItem, x, y };
    preview = calcPosition(previewItem, {
      gridSize: options.gridSize,
      gap: options.gap
    })

    if (collisions.length) {
      collisionPreview = calcPosition(item, {
        gridSize: options.gridSize,
        gap: options.gap
      });
    }else{
      collisionPreview = false;
    }
	}

	function moveEnd() {
		active = false;
    collisionPreview = false;
		pointerShift = { left: 0, top: 0 };
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', moveEnd);
    const collisionItem = getCollisions(previewItem, options.items);
    if(collisionItem.length){
      collisionItem[0].x = item.x;
      collisionItem[0].y = item.y;
    }
		item.x = previewItem.x;
		item.y = previewItem.y;
		dispatch('itemchange', { items: [item].concat(collisionItem.length ? collisionItem : []) });
	}

</script>

<div
	on:pointerdown={moveStart}
	{style}
  class={active ? options.activeClass : ''}
	bind:this={itemRef}
>
	<slot />
</div>

{#if active}
  {#if preview}
    <div
      style={`position: absolute; left:${preview.left}px; top:${preview.top}px;  
      width: ${preview.width}px; height: ${preview.height}px; z-index: 3;`}
      class={collisionPreview ? options.collisionClass : options.previewClass}
    />
  {/if}
  {#if collisionPreview}
    <div
      style={`position: absolute; left:${collisionPreview.left}px; top:${collisionPreview.top}px;  
      width: ${collisionPreview.width}px; height: ${collisionPreview.height}px; z-index: -10;`}
      class={options.collisionClass}
    />
  {/if}
{/if}