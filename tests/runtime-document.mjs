export class TJSDocument {
	constructor(document) {
		this.document = document;
	}

	subscribe(callback) {
		callback?.(this.document, { data: {} });
		return () => undefined;
	}

	set(document) {
		this.document = document;
	}
}
