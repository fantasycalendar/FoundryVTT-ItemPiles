import FloatingElementImpl from "./FloatingElementImpl.svelte";
import { writable } from "svelte/store";

export class FloatingElement {

  static id = void 0;
  static element = void 0;
  static positionStore = writable(false);

  static create({ id, x, y, zIndex = Number.MAX_SAFE_INTEGER - 100, style = {}, component, componentData } = {}) {

    if (this.element) return this.element;

    this.positionStore.set({ x, y })
    this.id = id;

    // Create the new context menu with the last click x / y point.
    this.element = new FloatingElementImpl({
      target: document.body,
      props: {
        position: this.positionStore,
        zIndex,
        style,
        component,
        componentData
      }
    });

  }

  static destroy() {
    this.element.$destroy();
    this.element = void 0;
    this.id = void 0;
    this.positionStore.set(false);
  }


}
