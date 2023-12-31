import { clamp } from "../../../helpers/helpers.js";
import { get } from "svelte/store";

export function isItemColliding(item, otherItem) {
	const transform = item.transform?.subscribe ? get(item.transform) : item.transform;
	const otherTransform = otherItem.transform?.subscribe ? get(otherItem.transform) : otherItem.transform;
	return (
		item.id !== otherItem.id &&
		transform.x + (transform.w - 1) >= otherTransform.x &&
		transform.y + (transform.h - 1) >= otherTransform.y &&
		transform.x <= otherTransform.x + (otherTransform.w - 1) &&
		transform.y <= otherTransform.y + (otherTransform.h - 1)
	);
}

export function getCollisions(originalItem, items) {
	return items.filter((item) => {
		return isItemColliding(originalItem, item)
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

	const finalTransform = foundry.utils.deepClone(get(item.transform));
	const origItemTransform = foundry.utils.deepClone(get(item.item.transform));

	const newItemPlacement = {
		id: item.id,
		transform: finalTransform
	};

	const itemWithinBounds = (finalTransform.x + (finalTransform.w - 1)) < options.cols
		&& (finalTransform.y + (finalTransform.h - 1)) < options.rows
		&& (finalTransform.x) >= 0
		&& (finalTransform.y) >= 0;

	if (!itemWithinBounds) return false;

	const assumedCollisionMovement = collisions.map(collision => {
		const collisionTransform = foundry.utils.deepClone(get(collision.transform));
		return {
			id: collision.id,
			transform: swapItemTransform(origItemTransform, finalTransform, collisionTransform)
		};
	});

	if (!assumedCollisionMovement.every(entry => {
		return entry
			&& (entry.transform.x + (entry.transform.w - 1)) < options.cols
			&& (entry.transform.y + (entry.transform.h - 1)) < options.rows
			&& (entry.transform.x) >= 0
			&& (entry.transform.y) >= 0
	})) return false;

	const itemsSansCollisions = items.filter(i => {
		return i.id !== item.id && !assumedCollisionMovement.some(coll => coll.id === i.id);
	}).concat([newItemPlacement])

	return assumedCollisionMovement.every(movedBox => {
		return !getCollisions(movedBox, itemsSansCollisions).length;
	});
}
