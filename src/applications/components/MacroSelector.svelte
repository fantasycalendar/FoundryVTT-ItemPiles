<script>

	import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
	import { custom_notify } from "../../helpers/helpers.js";
	import { writable } from "svelte/store";

	export let macro;

	let macros = writable([]);

	const id = foundry.utils.randomID() + "-list";

	function filterMacros() {

		let allResults = Array.from(game.macros)
			.map(m => ({
				id: m.id,
				name: m.name
			}));

		const compendiums = Array.from(game.packs)
			.filter(pack => pack.documentName === "Macro")
			.map(pack => ({
				id: pack.metadata.id,
				name: "Compendium." + pack.metadata.id
			}))

		allResults = allResults.concat(compendiums);

		allResults = allResults.filter(m => {
			return m.name.toLowerCase().includes(macro.toLowerCase()) || !macro
		})

		if (macro.startsWith("Compendium.") && allResults.length === 1) {
			allResults = Array.from(game.packs.get(allResults[0].id).index).map(m => {
				return {
					id: allResults[0].id + "." + m._id,
					name: allResults[0].name + "." + m.name
				}
			});
		}

		macros.set(allResults);

	}

	async function openMacro() {

		// Credit to Otigon, Zhell, Gazkhan and MrVauxs for the code in this section
		if (macro.startsWith("Compendium")) {
			let packArray = macro.split(".");
			let pack = game.packs.get(`${packArray[1]}.${packArray[2]}`);
			if (!pack) {
				custom_notify(`Compendium ${packArray[1]}.${packArray[2]} was not found`);
				return;
			}
			let macroFilter = pack.index.filter((m) => m.name === packArray[3]);
			if (!macroFilter.length) {
				custom_notify(`A macro named ${packArray[3]} was not found in Compendium ${packArray[1]}.${packArray[2]}`);
				return;
			}
			let macroDocument = await pack.getDocument(macroFilter[0]._id);
			macroDocument.sheet.render(true);
		} else {
			if (!macro) {
				return;
			}
			let getTest = game.macros.getName(macro);
			if (!getTest) {
				custom_notify(`Could not find the macro named ${macro}`);
				return;
			}
			game.macros.getName(macro).sheet.render(true);
		}

	}

	filterMacros();

</script>

<div class="item-piles-flexrow">
	<input bind:value={macro}
	       list={id}
	       on:change={() => { filterMacros() }}
	       on:keyup={() => { filterMacros() }}
	       placeholder={localize("ITEM-PILES.Applications.ItemPileConfig.Main.MacroPlaceholder")}
	       style="flex:1; margin-right:5px;"
	       type="text"
	/>
	<datalist id={id}>
		{#each $macros as m (m.id)}
			<option value={m.name}>{m.text ?? ""}</option>
		{/each}
	</datalist>
	<i
		class="fas fa-edit item-piles-clickable-link"
		data-fast-tooltip="Open Macro"
		on:click={() => openMacro()}
		style="margin-top: 5px; font-size: 1rem; flex:0;"
	></i>
</div>
