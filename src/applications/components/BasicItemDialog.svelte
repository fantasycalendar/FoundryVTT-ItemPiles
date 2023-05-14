<script>

  export let item;

</script>

<form>

	<header class="sheet-header">
		<img data-edit="img" src={item.img}>
		<div class="details">
			<input name="name" placeholder="Name" spellcheck="false" type="text" value={item.name} disabled/>

			<span class="level">
					<span>Item</span>
					<input data-property="system.level.value" type="text" value="?" disabled>
			</span>
			<template class="traits-extra"></template>
			<!-- showTraits true -->
			<tags class="tagify paizo-style tags tagify--noTags tagify--empty" data-name="system.traits.value" disabled=""
						tabindex="-1">
				<select class="tag">
					<option value="common">Unknown</option>
				</select>

				<span aria-autocomplete="both" aria-multiline="false" aria-placeholder="Traits" class="tagify__input"
							data-placeholder="Traits"
							role="textbox" tabindex="0"></span>
				​
			</tags>
			<input class="paizo-style tags" data-dtype="JSON" disabled="" name="system.traits.value" placeholder="Traits"
						 tabindex="-1" value="[]">
		</div>
	</header>

	<span style="padding: 0.5rem;">
		{@html item.system.description.value}
	</span>

</form>

<style lang="scss">

</style>
