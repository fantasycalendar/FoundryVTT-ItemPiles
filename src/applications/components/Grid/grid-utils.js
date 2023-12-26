import { clamp } from "../../../helpers/helpers";
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

export function snapOnMove(left, top, transform, options) {
	const { gridSize, gap, cols, enabledCols, rows, enabledRows } = options;
	const { w, h } = transform;

	const width = w * gridSize;
	const height = h * gridSize;

	let x = position2coordinate(left, gridSize, width, gap);
	let y = position2coordinate(top, gridSize, height, gap);

	x = clamp(x, 0, Math.min(cols, enabledCols) - w);
	y = clamp(y, 0, Math.min(rows, enabledRows) - h);

	return { x, y };
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

export function isPlacementValid(item, collisions, items, options) {
	if (!collisions.length) return true;

	const finalTransform = get(item.transform);
	const origItemTransform = get(item.item.transform);

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

		const collisionTransform = get(collision.transform);

		if(finalTransform.w !== collisionTransform.w || finalTransform.h !== collisionTransform.h){
			return false;
		}

		return {
			id: collision.id,
			transform: {
				...collisionTransform,
				x: origItemTransform.x,
				y: origItemTransform.y,
			}
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
