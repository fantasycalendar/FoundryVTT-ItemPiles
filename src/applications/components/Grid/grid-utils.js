import { clamp } from "../../../helpers/helpers.js";
import { get } from "svelte/store";

function resolveTransform(t) {
	return t?.subscribe ? get(t) : t;
}

export function isItemColliding(item, otherItem) {
	const transform = resolveTransform(item.transform);
	const otherTransform = resolveTransform(otherItem.transform);
	return (
		item.id !== otherItem.id &&
		transform.x + (transform.w - 1) >= otherTransform.x &&
		transform.y + (transform.h - 1) >= otherTransform.y &&
		transform.x <= otherTransform.x + (otherTransform.w - 1) &&
		transform.y <= otherTransform.y + (otherTransform.h - 1)
	);
}

export function getCollisions(originalItem, items) {
	const movingTransform = resolveTransform(originalItem.transform);
	const moving = { id: originalItem.id, transform: movingTransform };
	return items.filter((item) => {
		return isItemColliding(moving, item)
	});
}

export function coordinate2position(coordinate, cellSize, gap) {
	return coordinate * cellSize + (coordinate + 1) * gap;
}

export function coordinate2size(coordinate, cellSize, gap) {
	return coordinate * cellSize + (coordinate - 1) * gap;
}

export function position2coordinate(position, cellSize, size, gap) {
	return Math.round(position / (cellSize + gap));
}

export function snapOnMove(left, top, transform, options, doClamp = true) {
	const { gridSize, gap, enabledCols, enabledRows } = options;
	const { w, h } = transform;

	const width = w * gridSize;
	const height = h * gridSize;

	const x = position2coordinate(left, gridSize, width, gap);
	const y = position2coordinate(top, gridSize, height, gap);

	return {
		x: doClamp ? clamp(x, 0, enabledCols - w) : x,
		y: doClamp ? clamp(y, 0, enabledRows - h) : y
	};
}

export function calcPosition(transform, options) {
	const { gridSize, gap } = options;
	return {
		...transform,
		left: coordinate2position(transform.x, gridSize, gap),
		top: coordinate2position(transform.y, gridSize, gap),
		width: coordinate2size(transform.w, gridSize, gap),
		height: coordinate2size(transform.h, gridSize, gap)
	};
}

export function swapItemTransform(originalTransform, finalTransform, transform) {

	const newTransform = { ...transform };

	const shouldFlip = originalTransform.flipped !== finalTransform.flipped;
	const delta = {
		x: newTransform.x - finalTransform.x,
		y: newTransform.y - finalTransform.y,
	}
	if (shouldFlip) {

		if (!originalTransform.flipped && finalTransform.flipped) {
			delta.x -= finalTransform.w;
			delta.x += newTransform.w;
			const { x, y } = delta;
			delta.x = y;
			delta.y = x * -1;
		} else if (originalTransform.flipped && !finalTransform.flipped) {
			delta.y -= finalTransform.h;
			delta.y += newTransform.h;
			const { x, y } = delta;
			delta.x = y * -1;
			delta.y = x;
		}

		const { w, h } = newTransform;
		newTransform.w = shouldFlip ? h : w;
		newTransform.h = shouldFlip ? w : h;
		newTransform.flipped = shouldFlip ? !newTransform.flipped : newTransform.flipped;

	}

	newTransform.x = originalTransform.x + delta.x;
	newTransform.y = originalTransform.y + delta.y;

	return newTransform;

}

export function isPlacementValid(item, collisions, items, options) {
	if (!collisions.length) return true;

	const finalTransform = resolveTransform(item.transform);
	const origItemTransform = resolveTransform(item.item.transform);

	const itemWithinBounds = (finalTransform.x + (finalTransform.w - 1)) < options.enabledCols
		&& (finalTransform.y + (finalTransform.h - 1)) < options.enabledRows
		&& (finalTransform.x) >= 0
		&& (finalTransform.y) >= 0;

	if (!itemWithinBounds) return false;

	const assumedCollisionMovement = collisions.map(collision => {
		return {
			id: collision.id,
			transform: swapItemTransform(origItemTransform, finalTransform, resolveTransform(collision.transform))
		};
	});

	if (!assumedCollisionMovement.every(entry => {
		return entry
			&& (entry.transform.x + (entry.transform.w - 1)) < options.enabledCols
			&& (entry.transform.y + (entry.transform.h - 1)) < options.enabledRows
			&& (entry.transform.x) >= 0
			&& (entry.transform.y) >= 0
	})) return false;

	const excludedIds = new Set([item.id]);
	for (const coll of assumedCollisionMovement) excludedIds.add(coll.id);

	const newItemPlacement = { id: item.id, transform: finalTransform };

	for (const movedBox of assumedCollisionMovement) {
		for (const candidate of items) {
			if (excludedIds.has(candidate.id)) continue;
			if (isItemColliding(movedBox, candidate)) return false;
		}
		if (isItemColliding(movedBox, newItemPlacement)) return false;
	}
	return true;
}
