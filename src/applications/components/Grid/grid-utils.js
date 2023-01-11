import { clamp } from "../../../helpers/helpers";
import { get } from "svelte/store";

export function isItemColliding(item, otherItem) {
  const transform = get(item.transform);
  const otherTransform = get(otherItem.transform);
  return (
    item.id !== otherItem.id &&
    transform.x <= otherTransform.x + otherTransform.w - 1 &&
    transform.y <= otherTransform.y + otherTransform.h - 1 &&
    transform.x + transform.w - 1 >= otherTransform.x &&
    transform.y + transform.h - 1 >= otherTransform.y
  );
}

export function getCollisions(originalItem, items) {
  return items.filter((item) => isItemColliding(originalItem, item));
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
    left: coordinate2position(transform.x, gridSize, gap),
    top: coordinate2position(transform.y, gridSize, gap),
    width: coordinate2size(transform.w, gridSize, gap),
    height: coordinate2size(transform.h, gridSize, gap)
  };
}
