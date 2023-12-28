<script>

	import { createEventDispatcher } from 'svelte';
	import { get, writable } from 'svelte/store';
	import { styleFromObject } from '../../../helpers/helpers.js';
	import {
		calcPosition,
		coordinate2size,
		getCollisions,
		isPlacementValid,
		snapOnMove,
		swapItemTransform
	} from '../../../helpers/grid-utils.js';

	export let item;
	export let options;
	export let items;
	export let gridContainer;

	const dispatch = createEventDispatcher();

	let itemRef = HTMLElement;
	const transformStore = item.transform;
	const previewTransform = writable({});

	$: transform = $transformStore;
	$: gridTransform = calcPosition($transformStore, options);
	$: ghostGridTransform = calcPosition({
		...snapOnMove($previewTransform.left, $previewTransform.top, $previewTransform, options),
		w: $previewTransform.w,
		h: $previewTransform.h,
	}, options);

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
		"left": ghostGridTransform.left + "px",
		"top": ghostGridTransform.top + "px",
		"width": ghostGridTransform.width + "px",
		"height": ghostGridTransform.height + "px",
		"opacity": "0.75",
		"z-index": "5"
	});

	let active = false;
	let splitting = false;
	let validPlacement = false;
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

		if (event.pointerId) {
			itemRef.setPointerCapture(event.pointerId);
		}

		enableMoveEvents(event);

		dispatch("itembegindrag", {
			item,
			target: itemRef,
			x: event.pageX - pointerOffset.internalLeft,
			y: event.pageY - pointerOffset.internalTop
		});

	}

	function splitStart(event) {

		splitting = true;

		enableMoveEvents(event);

	}

	function enableMoveEvents(event) {

		// Get offset for pointer within the grid item
		pointerOffset = {
			left: event.pageX - gridTransform.left,
			top: event.pageY - gridTransform.top,
			internalLeft: event.offsetX,
			internalTop: event.offsetY
		};

		$previewTransform = $transformStore;

		// Setup events for when item is moved and dropped
		window.addEventListener('pointermove', move, { passive: false });
		window.addEventListener('pointerup', moveEnd, { passive: false });
		window.addEventListener('touchmove', move, { passive: false });
		window.addEventListener('touchend', moveEnd, { passive: false });

	}

	let lastMoveEvent = false;

	function move(event) {

		if (!event) event = lastMoveEvent;
		lastMoveEvent = event;

		const { pageX, pageY } = (event.type === "touchmove" ? event.changedTouches[0] : event);

		active = true;

		let outOfBounds = false;

		previewTransform.update(data => {

			const unsnappedData = calcPosition(data, options);

			const { left, top, outOfBounds } = constrainToContainer(
				pageX - pointerOffset.left,
				pageY - pointerOffset.top,
				unsnappedData.width,
				unsnappedData.height
			);

			active = !outOfBounds;

			dispatch("itemmove", {
				x: pageX - pointerOffset.internalLeft,
				y: pageY - pointerOffset.internalTop
			});

			return {
				...data,
				...snapOnMove(left, top, unsnappedData, options),
				left,
				top
			};
		});

		if (!splitting) {
			collisions = getCollisions({ id: item.id, transform: previewTransform }, items);
			validPlacement = !outOfBounds && isPlacementValid({
				id: item.id,
				item: item,
				transform: previewTransform
			}, collisions, items, options);
		}

	}

	function constrainToContainer(left, top, width, height) {

		const parentRect = gridContainer.getBoundingClientRect();
		const relativeRect = {
			left: (parentRect.left - parentRect.x),
			top: (parentRect.top - parentRect.y),
			right: (parentRect.right - parentRect.x),
			bottom: (parentRect.bottom - parentRect.y),
		}

		const outOfBounds = (left < relativeRect.left && left < (relativeRect.left - width / 2))
			|| (top < relativeRect.top && top < (relativeRect.top - height / 2))
			|| ((left + width) > relativeRect.right && (left + width) > (relativeRect.right + width / 2))
			|| ((top + height) > relativeRect.bottom && (top + height) > (relativeRect.bottom + height / 2));

		if (left < relativeRect.left) {
			left = relativeRect.left;
		}
		if (top < relativeRect.top) {
			top = relativeRect.top;
		}
		if ((left + width) > relativeRect.right) {
			left = relativeRect.right - width;
		}
		if ((top + height) > relativeRect.bottom) {
			top = relativeRect.bottom - height;
		}

		return { left, top, outOfBounds };

	}

	function moveEnd(event) {

		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', moveEnd);
		window.removeEventListener('touchmove', move);
		window.removeEventListener('touchend', moveEnd);

		const origItemTransform = get(transformStore);
		const finalTransform = get(previewTransform);

		const { pageX, pageY } = (event.type === "touchmove" ? event.changedTouches[0] : event);

		if (event.button === 2) {
			dispatch("itemstopdrag", { cancelled: true });
			active = false;
		} else {
			dispatch("itemstopdrag", {
				item,
				outOfBounds: !active,
				x: pageX,
				y: pageY,
				gridX: finalTransform.x,
				gridY: finalTransform.y,
				splitting
			})
		}

		if (!active) return;
		active = false;

		if (splitting) {
			splitting = false;
			return;
		}

		if (foundry.utils.isEmpty(finalTransform)
			|| (finalTransform.x === transform.x && finalTransform.y === transform.y && finalTransform.w === transform.w && finalTransform.h === transform.h)
		) {
			return;
		}

		if (!validPlacement) return;

		validPlacement = false;

		if (collisions.length) {

			if (item.item.areItemsSimilar(collisions[0].item) && !globalThis.keyboard.downKeys.has("ControlLeft")) {
				return collisions[0].item.merge(item.item);
			}

			for (const collision of collisions) {
				collision.transform.update(trans => {
					return swapItemTransform(origItemTransform, finalTransform, trans);
				});
			}
		}

		transformStore.update(trans => {
			trans.x = finalTransform.x;
			trans.y = finalTransform.y;
			trans.w = finalTransform.w;
			trans.h = finalTransform.h;
			trans.flipped = finalTransform.flipped;
			return trans;
		});

		dispatch("itemchange", { items: collisions.concat([item]) });

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
			y: event.pageY,
			splitStart,
		});
	}

	$: itemClass = collisions.length ? (validPlacement ? options.collisionClass : options.invalidCollisionClass) : options.previewClass
	$: collisionClass = collisions.length ? (validPlacement ? options.collisionClass : options.invalidCollisionClass) : options.previewClass

	function keydown(event) {
		if (event.key !== "r" || !active || (item.item.w === 1 && item.item.h === 1)) return;
		previewTransform.update(data => {
			const { w, h } = data;
			const width = coordinate2size(Math.floor(h / 2) + 1, options.gridSize, options.gap);
			const height = coordinate2size(Math.floor(w / 2) + 1, options.gridSize, options.gap);
			pointerOffset.top -= (width - height);
			pointerOffset.left -= (height - width);
			dispatch("itemflipped", {
				item,
				target: itemRef,
				h: w,
				w: h,
				flipped: !data.flipped
			});
			return {
				...data,
				w: h,
				h: w,
				flipped: !data.flipped
			}
		});
		move();
	}

</script>

<svelte:window on:keydown={keydown}/>

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
	<div style={ghostStyle} class={collisionClass}></div>

	{#if collisions.length}
		<div style={style} class={itemClass}></div>
	{/if}
{/if}
