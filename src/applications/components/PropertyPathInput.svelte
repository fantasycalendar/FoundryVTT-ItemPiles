<script>

	import { getDocumentTemplates } from "../../helpers/utilities.js";

	export let value = "";
	export let templateType;
	export let required = false;

	const id = "property-list-" + foundry.utils.randomID();

	const templates = getDocumentTemplates(templateType);

	const templateObject = {
		name: "",
		type: "",
		system: Object.values(templates)
			.map(obj => {
				if (obj['templates']) {
					for (const template of obj['templates']) {
						obj = foundry.utils.mergeObject(obj, templates["templates"][template]);
					}
					delete obj['templates'];
				}
				return obj;
			})
			.reduce((acc, obj) => {
				return foundry.utils.mergeObject(acc, obj);
			}, {})
	};

	let suggestions = [];
	$: {
		let trimmedValue = value.trim();
		let options = foundry.utils.getProperty(templateObject, trimmedValue);
		if (!options) {
			trimmedValue = trimmedValue.split(".").slice(0, -1).join(".")
			options = foundry.utils.getProperty(templateObject, trimmedValue);
		}
		suggestions = options ? Object.keys(options).map(t => trimmedValue + "." + t).sort() : Object.keys(templateObject);
	}

</script>

<input bind:value list={id} required={required} type="text"/>
<datalist id={id}>
	{#each suggestions as suggestion}
		<option>{suggestion}</option>
	{/each}
</datalist>
