<script>
	import { localize } from '#runtime/util/i18n';
	import PropertyPathInput from "../components/PropertyPathInput.svelte";

	export let key;
	export let data;
	export let disabled = false;
	export let itemAttribute = false;
	export let options = [];

</script>

<div class="item-pile-setting form-scope item-piles-flexrow">

	<div class="label-side">
		<label>{localize(data.name)} <a>
			<i class="fas fa-undo reset-setting" data-fast-tooltip="Reset data"
			   on:click={() => { data.value = data.default; }}></i></a>
		</label>
		<p class="notes">{localize(data.hint)}</p>
	</div>

	<div class="form-fields input-side">

		{#if data.type === Boolean}

			<input type="checkbox" bind:checked={data.value} disabled={disabled}/>

		{:else if data.choices}

			<div class="choice-container">
				<select name={key} bind:value={data.value} disabled={disabled}>
					{#each Object.entries(data.choices) as [key, choice], index (index)}
						{#if data.type === Number}
							<option value="{index}">{localize(choice)}</option>
						{:else}
							<option value="{key}">{localize(choice)}</option>
						{/if}
					{/each}
				</select>
			</div>

		{:else if data.type === Number}

			<input
				type="number"
				disabled={disabled}
				bind:value={data.value}
				class:invalid={!data.value && data.value !== 0}
				step={data.step}
				min={data.min}
				max={data.max}
			/>

		{:else}

			<div class="item-pile-setting-container">

				{#if options.length}
					<select name="{key}" bind:value={data.value} disabled={disabled}>
						{#each options as option}
							<option value={option === "None" ? "" : option}>{option}</option>
						{/each}
					</select>
				{:else}
					{#if itemAttribute}
						<PropertyPathInput bind:value={data.value} disabled={disabled} templateType="Item"/>
					{:else}
						<input type="text" bind:value={data.value} disabled={disabled}/>
					{/if}
					{#if data.localize}
						<input type="text" disabled value={localize(data.value)}/>
					{/if}
				{/if}
			</div>

		{/if}
	</div>

</div>


<style lang="scss">

  .item-pile-setting:not(:last-child) {

    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    margin-bottom: 0.4rem;
    padding-bottom: 0.4rem;

  }

  .item-pile-setting {

    .reset-setting {
      font-size: 0.75rem;
      margin-left: 0.5rem;
      opacity: 0.5;
      transition: opacity 250ms;

      &:hover {
        opacity: 1.0;
      }
    }

    .invalid {
      border: 2px solid #d93131;
    }

    label {
      flex: 1 0 auto;
    }

    .form-fields {
      flex: 0 1 auto;
      align-self: center;
    }

    select {
      min-width: 200px;
    }

    .item-pile-setting-container {
      min-width: 200px;
      display: flex;
      flex-direction: column;

      input:first-child {
        margin-bottom: 0.25rem;
      }
    }

    .label-side {
      flex: 1;
      margin-right: 1rem;
    }

    .choice-container {
      max-width: 400px;
    }

    input[type="number"] {
      min-width: 100px;
    }

  }

</style>
