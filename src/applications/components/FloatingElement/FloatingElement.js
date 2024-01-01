import FloatingElementImpl from "./FloatingElementImpl.svelte";
import { writable } from "svelte/store";

export class FloatingElement {

	static id = void 0;
	static element = void 0;
	static positionStore = writable(false);
	static styleStore = writable({});

	static create({ id, x, y, zIndex = Number.MAX_SAFE_INTEGER - 100, style = {}, context = {}, component, componentData } = {}) {

		if (this.element) return this.element;

		this.positionStore.set({ x, y })
		this.styleStore.set(style);
		this.id = id;

		this.element = new FloatingElementImpl({
			target: document.body,
			props: {
				position: this.positionStore,
				style: this.styleStore,
				zIndex,
				component,
				componentData,
				context
			}
		});

	}

	static destroy() {
		this.element.$destroy();
		this.element = void 0;
		this.id = void 0;
		this.positionStore.set(false);
		this.styleStore.set({});
	}


}
