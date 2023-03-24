<script>

  import { createEventDispatcher } from 'svelte';
  import { get, writable } from 'svelte/store';
  import { styleFromObject } from '../../../helpers/helpers.js';
  import { calcPosition, getCollisions, snapOnMove } from './grid-utils.js';

  export let item;
  export let options;
  export let items;
  export let gridContainer;

  const dispatch = createEventDispatcher();

  let itemRef = HTMLElement;
  const transformStore = item.transform;
  const previewTransform = writable({});
  const tooltip = item.name;

  $: transform = $transformStore;
  $: gridTransform = calcPosition(transform, options);
  $: snappedGridTransform = calcPosition({
    ...snapOnMove($previewTransform.left, $previewTransform.top, transform, options),
    w: transform.w,
    h: transform.h,
  }, options);
  $: {
    if (!active) $previewTransform = $transformStore;
  }

  let classes = "";
  $: {
    classes = "";
    classes += " " + options.hoverClass;
    classes += (options.highlightItems && item.highlight ? " " + options.highlightClass : "")
    classes += (options.highlightItems && !item.highlight ? " " + options.dimClass : "")
  }

  $: style = styleFromObject({
    "position": "absolute",
    "left": gridTransform.left + "px",
    "top": gridTransform.top + "px",
    "width": gridTransform.width + "px",
    "height": gridTransform.height + "px",
    "cursor": 'move'
  });

  $: ghostStyle = styleFromObject({
    "position": "absolute",
    "left": snappedGridTransform.left + "px",
    "top": snappedGridTransform.top + "px",
    "width": snappedGridTransform.width + "px",
    "height": snappedGridTransform.height + "px",
    "opacity": "0.75",
    "z-index": "5"
  });

  let active = false;
  let collisions = [];
  let pointerOffset = { left: 0, top: 0 };

  function doubleClick(event) {
    if (event.button !== 0) return;
    dispatch("itemdoubleclick", { item });
  }

  function moveStart(event) {

    if (event.button === 2) {
      return rightClick(event);
    }

    if (!options.canOrganize) return;

    // If not left mouse, skip
    if (event.button !== 0) return;

    // Get offset for pointer within the grid item
    pointerOffset = {
      left: event.clientX - gridTransform.left,
      top: event.clientY - gridTransform.top,
      internalLeft: event.offsetX,
      internalTop: event.offsetY,
    };
    itemRef.setPointerCapture(event.pointerId);

    dispatch("itembegindrag", {
      item,
      target: itemRef,
      x: event.pageX - pointerOffset.internalLeft,
      y: event.pageY - pointerOffset.internalTop
    });

    // Setup events for when item is moved and dropped
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', moveEnd, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', moveEnd, { passive: false });
  }

  function move(event) {

    const { pageX, pageY } = (event.type === "touchmove" ? event.changedTouches[0] : event);

    active = true;

    const { left, top, outOfBounds } = constrainToContainer(
      pageX - pointerOffset.left,
      pageY - pointerOffset.top
    );
    active = !outOfBounds;
    dispatch("itemmove", {
      x: pageX - pointerOffset.internalLeft,
      y: pageY - pointerOffset.internalTop
    });
    previewTransform.set({
      ...transform,
      ...gridTransform,
      ...snapOnMove(left, top, transform, options),
      left,
      top,
    });
    collisions = getCollisions({ id: item.id, transform: previewTransform }, items);
  }

  function constrainToContainer(left, top) {

    let outOfBounds = false;
    const parentRect = gridContainer.getBoundingClientRect();
    const relativeRect = {
      left: (parentRect.left - parentRect.x),
      top: (parentRect.top - parentRect.y),
      right: (parentRect.right - parentRect.x),
      bottom: (parentRect.bottom - parentRect.y),
    }
    if (left < relativeRect.left) {
      if (left < (relativeRect.left - gridTransform.width / 2)) {
        outOfBounds = true;
      }
      left = relativeRect.left;
    }
    if (top < relativeRect.top) {
      if (top < (relativeRect.top - gridTransform.height / 2)) {
        outOfBounds = true;
      }
      top = relativeRect.top;
    }
    if ((left + gridTransform.width) > relativeRect.right) {
      if ((left + gridTransform.width) > (relativeRect.right + gridTransform.width / 2)) {
        outOfBounds = true;
      }
      left = relativeRect.right - gridTransform.width;
    }
    if ((top + gridTransform.height) > relativeRect.bottom) {
      if ((top + gridTransform.height) > (relativeRect.bottom + gridTransform.height / 2)) {
        outOfBounds = true;
      }
      top = relativeRect.bottom - gridTransform.height;
    }

    return { left, top, outOfBounds };

  }

  function moveEnd(event) {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', moveEnd);
    window.removeEventListener('touchmove', move);
    window.removeEventListener('touchend', moveEnd);

    const finalTransform = get(previewTransform);

    const { pageX, pageY } = (event.type === "touchmove" ? event.changedTouches[0] : event);

    dispatch("itemstopdrag", {
      item,
      outOfBounds: !active,
      x: pageX - pointerOffset.internalLeft,
      y: pageY - pointerOffset.internalTop
    })

    if (!active) {
      return;
    }

    active = false;

    if (foundry.utils.isEmpty(finalTransform)
      || (finalTransform.x === transform.x && finalTransform.y === transform.y)
    ) {
      return;
    }

    if (collisions.length) {
      const offset = collisions.reduce((acc, collision) => {
        const trans = get(collision.transform);
        if (trans.x < acc.x) acc.x = trans.x;
        if (trans.y < acc.y) acc.y = trans.y;
        return acc;
      }, { x: finalTransform.x, y: finalTransform.y });
      for (const collision of collisions) {
        collision.transform.update(trans => {
          trans.x = transform.x + (trans.x - offset.x);
          trans.y = transform.y + (trans.y - offset.y);
          return trans;
        });
      }
    }

    transformStore.update(trans => {
      trans.x = finalTransform.x;
      trans.y = finalTransform.y;
      return trans;
    });

    dispatch("itemchange", { items: collisions.concat(item) });

  }

  function hoverOver() {
    const { x, y } = itemRef.getBoundingClientRect();
    dispatch("itemhover", {
      item,
      target: itemRef,
      x: x + Math.floor(options.gridSize / 2),
      y: y + Math.floor(options.gridSize / 2)
    });
  }

  function hoverLeave() {
    const { x, y } = itemRef.getBoundingClientRect();
    dispatch("itemhoverleave", {
      item,
      target: itemRef,
      x: x + Math.floor(options.gridSize / 2),
      y: y + Math.floor(options.gridSize / 2)
    });
  }

  function rightClick(event) {
    dispatch("itemrightclick", {
      item,
      target: itemRef,
      x: event.pageX,
      y: event.pageY
    });
  }

</script>

<div
	bind:this={itemRef}
	class={classes}
	on:dblclick={doubleClick}
	on:dragover|preventDefault
	on:pointerdown={moveStart}
	on:pointerleave={hoverLeave}
	on:pointerover={hoverOver}
	on:touchstart={moveStart}
	style={style}
>
	<slot/>
</div>

{#if active}
	<div style={ghostStyle} class={collisions.length ? options.collisionClass : options.previewClass}></div>

	{#if collisions.length}
		<div style={style} class={collisions.length ? options.collisionClass : options.previewClass}></div>
	{/if}
{/if}
