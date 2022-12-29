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

  $: transform = $transformStore;
  $: gridTransform = calcPosition(transform, options);
  $: snappedGridTransform = calcPosition({
    ...snapOnMove($previewTransform.left, $previewTransform.top, transform, options),
    w: transform.w,
    h: transform.h,
  }, options);

  $: style = styleFromObject({
    "position": "absolute",
    "left": gridTransform.left + "px",
    "top": gridTransform.top + "px",
    "width": gridTransform.width + "px",
    "height": gridTransform.height + "px",
    "cursor": 'move'
  });

  $: previewStyle = styleFromObject({
    "position": "absolute",
    "left": ($previewTransform.left ?? 0) + "px",
    "top": ($previewTransform.top ?? 0) + "px",
    "width": ($previewTransform.width ?? 0) + "px",
    "height": ($previewTransform.height ?? 0) + "px",
    "opacity": "0.75",
    "touch-action": "none",
    "user-select": "none",
    "z-index": "10"
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

  function moveStart(event) {
    // If not left mouse, skip
    if (event.button !== 0) return;

    // Get offset for pointer within the grid item
    pointerOffset = {
      left: event.clientX - gridTransform.left,
      top: event.clientY - gridTransform.top
    };
    itemRef.setPointerCapture(event.pointerId);

    // Setup events for when item is moved and dropped
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', moveEnd);
  }

  function move(event) {
    active = true;
    const { left, top } = constrainToContainer(
      event.pageX - pointerOffset.left,
      event.pageY - pointerOffset.top
    );
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

    const parentRect = gridContainer.getBoundingClientRect();
    const relativeRect = {
      left: (parentRect.left - parentRect.x),
      top: (parentRect.top - parentRect.y),
      right: (parentRect.right - parentRect.x),
      bottom: (parentRect.bottom - parentRect.y),
    }
    if (left < relativeRect.left) {
      left = relativeRect.left;
    }
    if (top < relativeRect.top) {
      top = relativeRect.top;
    }
    if ((left + gridTransform.width) > relativeRect.right) {
      left = relativeRect.right - gridTransform.width;
    }
    if ((top + gridTransform.height) > relativeRect.bottom) {
      top = relativeRect.bottom - gridTransform.height;
    }

    return { left, top };

  }

  function moveEnd() {
    active = false;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', moveEnd);

    const finalTransform = get(previewTransform);
    if (collisions.length) {
      const offset = collisions.reduce((acc, item) => {
        const trans = get(item.transform);
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

    previewTransform.set(transform)

    dispatch("itemchange", { items: collisions.concat(item) })

  }

</script>

<div
  bind:this={itemRef}
  on:pointerdown={moveStart}
  on:dragover|preventDefault
  style={style}
>
  <slot/>
</div>

{#if active}
  <div style={previewStyle} class={options.activeClass}>
    <slot/>
  </div>

  <div style={ghostStyle} class={collisions.length ? options.collisionClass : options.previewClass}/>

  {#if collisions.length}
    <div style={style} class={collisions.length ? options.collisionClass : options.previewClass}/>
  {/if}
{/if}
