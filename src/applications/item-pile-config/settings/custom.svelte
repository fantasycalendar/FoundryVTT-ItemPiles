<script>

  import CONSTANTS from "../../../constants/constants.js";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let pileData;

  const flags = Object.entries(CONSTANTS.CUSTOM_PILE_TYPES[pileData.type]);
  for (const [key, data] of flags) {
    if (pileData[key] === undefined) {
      pileData[key] = data.value;
    }
  }

</script>


{#each Object.entries(CONSTANTS.CUSTOM_PILE_TYPES[pileData.type]) as [key, data] (key)}

	<div class="form-group">
		<label style="flex:4;">
			<span>{localize(data.title)}</span>
			{#if data.label}
				<p>{localize(data.label)}</p>
			{/if}
		</label>
		{#if data.type === String}
			<input type="text" bind:value={pileData[key]}/>
		{:else if data.type === Number}
			<input type="number" bind:value={pileData[key]}/>
		{:else if data.type === Boolean}
			<input type="checkbox" bind:checked={pileData[key]}/>
		{/if}

	</div>

{/each}
