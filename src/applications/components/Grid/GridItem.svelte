<script>

	import { createEventDispatcher, getContext } from 'svelte';
  import { get, writable } from 'svelte/store';
  import { styleFromObject } from '../../../helpers/helpers.js';
	import { calcPosition, snapOnMove, getCollisions } from './grid-utils.js';

	export let item;
	export let gridContainer;

  const options = getContext('gridOptions');
  const items = getContext('items');

  const dispatch = createEventDispatcher();
  let previewItem = item;
	let active = false;

  let itemRef = HTMLElement;
  let transform = writable({});
  let oldTransform = writable({});

	$: if (!active) {
    transform.set(calcPosition(item, options));
	}

  let style = "";
  $: style = styleFromObject({
    "position": "absolute",
    "left": $transform.left + "px",
    "top": $transform.top + "px",
    "width": $transform.width + "px",
    "height": $transform.height + "px",
    "cursor": movable ? 'move' : 'auto',
    "touch-action": "none",
    "user-select": "none",
  });

  let oldStyle = "";
  $: oldStyle = styleFromObject({
    "position": "absolute",
    "left": $oldTransform.left + "px",
    "top": $oldTransform.top + "px",
    "width": $oldTransform.width + "px",
    "height": $oldTransform.height + "px",
    "cursor": movable ? 'move' : 'auto',
    "background-color": colliding ? "rgb(33, 202, 33)" : "transparent",
    "opacity": "0.75",
    "touch-action": "none",
    "user-select": "none",
  });

	$: previewItem, dispatch('previewchange', { item: previewItem });
	$: movable = !options.readOnly && item.movable === undefined && item.movable !== false;

  let preview = false;
  let colliding = false;
	let pointerShift = { left: 0, top: 0 };

	function moveStart(event) {
		if (!movable) return;
		if (event.button !== 0) return;

    const prevTransform = get(transform);
    oldTransform.set(prevTransform);

		pointerShift = { left: event.clientX - prevTransform.left, top: event.clientY - prevTransform.top };

		itemRef.setPointerCapture(event.pointerId);

		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', moveEnd);

		active = true;
	}

	function move(event) {
		let _left = event.pageX - pointerShift.left;
		let _top = event.pageY - pointerShift.top;
    let _transform = get(transform);

		if (options.bounds) {
			const parentRect = gridContainer.getBoundingClientRect();
      const relativeRect = {
        left: (parentRect.left - parentRect.x),
        top: (parentRect.top - parentRect.y),
        right: (parentRect.right - parentRect.x),
        bottom: (parentRect.bottom - parentRect.y),
      }
			if (_left < relativeRect.left) {
				_left = relativeRect.left;
			}
			if (_top < relativeRect.top) {
				_top = relativeRect.top;
			}
			if ((_left + _transform.width) > relativeRect.right) {
				_left = relativeRect.right - _transform.width;
			}
			if ((_top + _transform.height) > relativeRect.bottom) {
				_top = relativeRect.bottom - _transform.height;
			}
		}

    transform.set({
      ..._transform,
      left: _left,
      top: _top
    });

    const { x, y } = snapOnMove(_left, _top, previewItem, options);
    const collisions = getCollisions({ ...previewItem, x, y }, items);
    
    previewItem = { ...previewItem, x, y };
    preview = calcPosition(previewItem, options)

    colliding = !!collisions.length;
	}

	function moveEnd() {
		active = false;
    colliding = false;
		pointerShift = { left: 0, top: 0 };
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', moveEnd);
    const collisionItem = getCollisions(previewItem, items);
    if(collisionItem.length){
      collisionItem[0].x = item.x;
      collisionItem[0].y = item.y;
    }
		item.x = previewItem.x;
		item.y = previewItem.y;
    preview = calcPosition(item, options)
		dispatch('itemchange', { items: [item].concat(collisionItem.length ? collisionItem : []) });
	}

</script>

<div
  bind:this={itemRef}
	on:pointerdown={moveStart}
  on:hover={() => { dispatch('itemhover', { item }); }}
  class={active ? options.activeClass : ''}
	{style}
>
	<slot/>
</div>

{#if active}
  <div style={oldStyle}>
    <slot/>
  </div>

  <div
    style={`position: absolute; left:${preview.left}px; top:${preview.top}px;  
    width: ${preview.width}px; height: ${preview.height}px; z-index: 10;`}
    class={colliding ? options.collisionClass : options.previewClass}
  />
{/if}