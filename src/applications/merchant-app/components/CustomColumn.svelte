<script>

	import { localize } from "#runtime/util/i18n";

	export let item;
	export let data;

	const doc = item.itemDocument;

	let text = "";
	let value = "";
	let title = ""

	$: {
		if (data.condition && foundry.utils.getProperty($doc, data.condition.path) === data.condition.value) {
			value = data.condition.placeholder ?? "";
			text = data.condition.placeholder ? localize(value) : "";

			if (game.user.isGM) {
				let hidden_value = data.path ? foundry.utils.getProperty($doc, data.path) ?? "" : "";
				let localized = localize(`${data.mapping?.[hidden_value] ?? hidden_value}`);
				title = data.formatting ? data.formatting.replace("{#}", localized) : localized;
				if (hidden_value) {
					text += "*"
				}
			}
		} else {
			value = data.path ? foundry.utils.getProperty($doc, data.path) ?? "" : "";
			let localized = localize(`${data.mapping?.[value] ?? value}`);
			text = data.formatting ? data.formatting.replace("{#}", localized) : localized;
			title = "";
		}
	}

</script>

<div title="{title}">
	<span>{@html text}</span>
</div>

<style lang="scss">

  div {
    padding: 0 10px;
    text-align: center;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    font-size: smaller;
  }

</style>
