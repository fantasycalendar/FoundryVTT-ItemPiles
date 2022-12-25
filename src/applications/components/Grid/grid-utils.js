import { clamp } from "../../../helpers/helpers";

export function isItemColliding(item, otherItem) {
	return (
		item.id !== otherItem.id &&
		item.x <= otherItem.x + otherItem.w - 1 &&
		item.y <= otherItem.y + otherItem.h - 1 &&
		item.x + item.w - 1 >= otherItem.x &&
		item.y + item.h - 1 >= otherItem.y
	);
}

export function getCollisions(currentItem, items) {
	return items.filter((item) => isItemColliding(currentItem, item));
}

export function hasCollisions(currentItem, items) {
	return items.some((item) => isItemColliding(currentItem, item));
}

export function getGridDimensions(items) {
	const cols = Math.max(...items.map((item) => item.x + item.w), 1);
	const rows = Math.max(...items.map((item) => item.y + item.h), 1);
	return { cols, rows };
}

export function coordinate2position(coordinate, cellSize, gap) {
	return coordinate * cellSize + (coordinate + 1) * gap;
}

export function coordinate2size(coordinate, cellSize, gap) {
	return coordinate * cellSize + (coordinate - 1) * gap;
}

export function position2coordinate(position, cellSize, gap) {
	return Math.round(position / (cellSize + gap));
}

export function size2coordinate(size, cellSize, gap) {
	return position2coordinate(size + gap * 2, cellSize, gap);
}

export function snapOnMove(left, top, item, options) {
	const { gridSize, gap } = options;
	const { w, h } = item;

	let x = position2coordinate(left, gridSize, gap);
	let y = position2coordinate(top, gridSize, gap);

	x = clamp(x, 0, Math.min(options.cols, options.enabledCols) - w);
	y = clamp(y, 0, Math.min(options.rows, options.enabledRows) - h);

	return { x, y };
}

export function calcPosition(item, options) {
	const { gridSize, gap } = options;
	return {
		left: coordinate2position(item.x, gridSize, gap),
		top: coordinate2position(item.y, gridSize, gap),
		width: coordinate2size(item.w, gridSize, gap),
		height: coordinate2size(item.h, gridSize, gap)
	};
}