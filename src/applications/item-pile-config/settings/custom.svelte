<script>

	import CONSTANTS from "../../../constants/constants.js";
	import { localize } from "#runtime/svelte/helper";
	import DropZone from "../../components/DropZone.svelte";

	export let pileData;

	const flags = Object.entries(CONSTANTS.CUSTOM_PILE_TYPES[pileData.type]);
	for (const [key, data] of flags) {
		if (pileData[key] === undefined) {
			pileData[key] = data.value;
		}
	}

	async function handleDropData(dropData, key, data) {
		if (!data.type.implementation) {
			return;
		}
		const doc = await data.type.implementation.fromDropData(dropData);
		pileData[key] = {
			data: doc.toObject(),
			uuid: dropData.uuid
		}
	}

	async function previewDocument(key) {
		if (!pileData[key].uuid) return;
		const doc = fromUuidSync(pileData[key].uuid);
		if (!doc) return;
		doc.sheet.render(true);
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
			{#if data.options}
				<select bind:value={pileData[key]}>
					{#each Object.entries(data.options) as [key, value]}
						<option value={key}>{localize(value)}</option>
					{/each}
				</select>
			{:else}
				<input type="text" bind:value={pileData[key]}/>
			{/if}
		{:else if data.type === Item || data.type === Actor}
			<DropZone callback={(dropData) => handleDropData(dropData, key, data)}>
				<div class="drop-item">
					<img
						src={pileData[key]?.data?.img ?? data.type === Actor ? "icons/svg/cowled.svg.svg" : "icons/svg/coins.svg"}
						class="drop-document-custom-image"/>
					<span class:item-piles-clickable-link={!!pileData[key]?.data}
					      on:click={() => { previewDocument(key); }}>
						{pileData[key]?.data?.name ?? `Drop ${data.type.prototype.constructor.name.toLowerCase()} to add`}
					</span>
					<i
						on:click|stopPropagation={() => {
                            delete pileData[key];
                            pileData[key] = false;
                        }}
						class="fas fa-times drop-item-remove item-piles-clickable-red item-piles-clickable-link"
					></i>
				</div>
			</DropZone>
		{:else if data.type === Number}
			<input type="number" bind:value={pileData[key]}/>
		{:else if data.type === Boolean}
			<input type="checkbox" bind:checked={pileData[key]}/>
		{/if}

	</div>

{/each}

<style lang="scss">

  .drop-item {
    display: flex;
    align-items: center;
    border: 1px solid rgba(0, 0, 0, 0.4);
    border-radius: 5px;
    padding: 0.25rem;
    font-size: 0.75rem;
    word-break: break-word;

    span {
      flex: 1;
    }

    .drop-document-custom-image {
      max-width: 35px;
      min-width: 35px;
      border: 1px solid rgba(0, 0, 0, 0.4);
      border-radius: 5px;
      margin-right: 0.5rem;
    }

    .drop-item-remove {
      margin-right: 0.15rem;
    }
  }
</style>
