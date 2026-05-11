<script>

	import { createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { styleFromObject } from '../../../helpers/helpers.js';
	import {
		calcPosition,
		coordinate2size,
		getCollisions,
		isPlacementValid,
		snapOnMove,
		swapItemTransform
	} from './grid-utils.js';
	import { hotkeyActionState } from "../../../hotkeys.js";

	export let item;
	export let options;
	export let items;
	export let gridContainer;

	const dispatch = createEventDispatcher();

	let itemRef = null;
	let dragged = false;
	const transformStore = item.transform;
	const previewTransform = item.ghostTransform;
	const activeStore = item.active;

	$: active = $activeStore;
	$: transform = $transformStore;
	$: gridTransform = calcPosition($transformStore, options);

	$: classes = [
		options.hoverClass,
		(options.highlightItems && item.highlight) ? options.highlightClass : "",
		(options.highlightItems && !item.highlight) ? options.dimClass : ""
	].filter(Boolean).join(" ");

	$: ghostGridTransform = (dragged || active)
		? calcPosition({
			...snapOnMove($previewTransform.left, $previewTransform.top, $previewTransform, options, false),
			w: $previewTransform.w,
			h: $previewTransform.h,
		}, options)
		: gridTransform;
	$: {
		if (!$activeStore) collisions = [];
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

	let splitting = false;
	let validPlacement = false;
	let collisions = [];
	let pointerOffset = { left: 0, top: 0 };
	let dragContainerBounds = { width: 0, height: 0 };
	let activeOtherIds = new Set();

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

		dragged = true;

		move(event);

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

		const rect = gridContainer.getBoundingClientRect();
		dragContainerBounds = { width: rect.width, height: rect.height };

		activeOtherIds.clear();

		$previewTransform = $transformStore;

		window.addEventListener('pointermove', move, { passive: true });
		window.addEventListener('pointerup', moveEnd, { passive: true });
		window.addEventListener('touchmove', move, { passive: false });
		window.addEventListener('touchend', moveEnd, { passive: false });

	}

	let lastMoveEvent = false;

	function move(event) {

		if (!event && lastMoveEvent) event = lastMoveEvent;
		if (event) lastMoveEvent = event;
		if (!event) return;

		const { pageX, pageY } = (event.type === "touchmove" ? event.changedTouches[0] : event);

		let outOfBounds = false;
		let newPreview = null;

		previewTransform.update(data => {

			const unsnappedData = calcPosition(data, options);

			const { left, top, outOfBounds: innerOutOfBounds } = constrainToContainer(
				pageX - pointerOffset.left,
				pageY - pointerOffset.top,
				unsnappedData.width,
				unsnappedData.height
			);

			outOfBounds = innerOutOfBounds;
			activeStore.set(!outOfBounds);

			dispatch("itemmove", {
				x: pageX - pointerOffset.internalLeft,
				y: pageY - pointerOffset.internalTop
			});

			newPreview = {
				...data,
				...snapOnMove(left, top, unsnappedData, options),
				left,
				top
			};
			return newPreview;
		});

		collisions = getCollisions({ id: item.id, transform: newPreview }, items);
		if (!splitting) {
			validPlacement = !outOfBounds && isPlacementValid({
				id: item.id,
				item: item,
				transform: newPreview
			}, collisions, items, options);

			const newActiveIds = new Set();
			for (const c of collisions) newActiveIds.add(c.id);

			for (const otherItem of items) {
				if (otherItem.id === item.id) continue;
				const wasActive = activeOtherIds.has(otherItem.id);
				const isActive = newActiveIds.has(otherItem.id);
				if (isActive !== wasActive) {
					otherItem.active.set(isActive);
				}
				if (isActive) {
					const otherTransform = get(otherItem.transform);
					otherItem.ghostTransform.update(() => {
						return calcPosition(swapItemTransform(transform, newPreview, otherTransform), options);
					});
				}
			}
			activeOtherIds = newActiveIds;
		} else {
			activeStore.set(!collisions.length);
		}
	}

	function constrainToContainer(left, top, width, height) {

		const right = dragContainerBounds.width;
		const bottom = dragContainerBounds.height;

		const outOfBounds = (left < 0 && left < (-width / 2))
			|| (top < 0 && top < (-height / 2))
			|| ((left + width) > right && (left + width) > (right + width / 2))
			|| ((top + height) > bottom && (top + height) > (bottom + height / 2));

		if (left < 0) {
			left = 0;
		}
		if (top < 0) {
			top = 0;
		}
		if ((left + width) > right) {
			left = right - width;
		}
		if ((top + height) > bottom) {
			top = bottom - height;
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
			activeStore.set(false);
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

		dragged = false;

		if (!active) return;

		for (const otherItem of items) {
			if (activeOtherIds.has(otherItem.id)) {
				otherItem.active.set(false);
			}
		}
		activeOtherIds.clear();

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

	function keydown(event) {
		if (!active || !dragged || (item.item.w === item.item.h)) return;
		const shouldRotate = hotkeyActionState.shouldRotateVaultItem(event);
		if (!shouldRotate) return;
		previewTransform.update(data => {
			const { w, h } = data;
			dispatch("itemflipped", {
				item,
				target: itemRef,
				h: w,
				w: h,
				flipped: !data.flipped
			});
			const width = coordinate2size(h / 2, options.gridSize, options.gap);
			const height = coordinate2size(w / 2, options.gridSize, options.gap);
			pointerOffset.top -= (width - height);
			pointerOffset.left -= (height - width);
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
	<div style={ghostStyle} class={itemClass}></div>

	{#if collisions.length}
		<div style={style} class={itemClass}></div>
	{/if}
{/if}
