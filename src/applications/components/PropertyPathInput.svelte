<script>

	export let value = "";
	export let templateType;
	export let required = false;

	const id = "property-list-" + randomID();

	const templates = Object.values(CONFIG?.[templateType]?.dataModels ?? []).length
		? {
			...Object.fromEntries(Object.entries(CONFIG?.[templateType]?.dataModels).map(model => {
				return [model[0], model[1].schema.initial()]
			})),
			types: Object.keys(CONFIG?.[templateType]?.dataModels),
		}
		: foundry.utils.deepClone(game.system.template[templateType]);
	const templateObject = {
		name: "",
		type: "",
		system: templates.types
			.map(type => {
				let obj = templates[type];
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
		let options = getProperty(templateObject, trimmedValue);
		if (!options) {
			trimmedValue = trimmedValue.split(".").slice(0, -1).join(".")
			options = getProperty(templateObject, trimmedValue);
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
