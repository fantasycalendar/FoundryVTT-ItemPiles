<script>

	import { localize } from "#runtime/util/i18n";

	export let item;
	export let data;

	const doc = item.itemDocument;

	let text;

	$: value = data.path ? foundry.utils.getProperty($doc, data.path) ?? "" : "";
	$: {
		let localized = localize(`${data.mapping?.[value] ?? value}`);
		text = data.formatting ? data.formatting.replace("{#}", localized) : localized;
	}

</script>

<div>
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
