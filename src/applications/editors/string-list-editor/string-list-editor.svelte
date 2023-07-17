<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { get, writable } from "svelte/store";

  const { application } = getContext('#external');

  let form;

  export let elementRoot;
  export let data;

  const keyValuePair = application.options?.keyValuePair ?? false;
  const stringListStore = writable(data);

  function add() {
    stringListStore.update(val => {
      if (keyValuePair) {
        val.push(["", ""]);
      } else {
        val.push("");
      }
      return val;
    })
  }

  function remove(index) {
    stringListStore.update(val => {
      val.splice(index, 1);
      return val;
    })
  }

  async function updateSettings() {
    application.options.resolve(get(stringListStore));
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<form autocomplete=off bind:this={form} on:submit|preventDefault={updateSettings}>

		{#if application.options.content}
			<p>{localize(application.options.content)}</p>
		{/if}

		<table>
			<tr>
				{#if keyValuePair}
					<th>{localize(application.options?.columnKey)}</th>
				{/if}
				<th>{localize(application.options?.column)}</th>
				<th class="small"><a class="item-piles-clickable" on:click={add}><i class="fas fa-plus"></i></a></th>
			</tr>
			{#if keyValuePair}
				{#each $stringListStore as [key, path], index (index)}
					<tr>
						<td><input type="text" required bind:value="{key}"/></td>
						<td><input type="text" bind:value="{path}"/></td>
						<td class="small">
							<button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
						</td>
					</tr>
				{/each}
			{:else}
				{#each $stringListStore as path, index (index)}
					<tr>
						<td><input type="text" required bind:value="{path}"/></td>
						<td class="small">
							<button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
						</td>
					</tr>
				{/each}
			{/if}
		</table>

		<footer>
			<button on:click|once={requestSubmit} type="button">
				<i class="far fa-save"></i> {localize("Save")}
			</button>
			<button on:click|once={() => { application.close(); }} type="button">
				<i class="far fa-times"></i> { localize("Cancel") }
			</button>
		</footer>

	</form>
</ApplicationShell>


<style lang="scss">

  table {
    vertical-align: middle;

    tr {
      border-spacing: 15px;
    }

    .small {
      width: 26px;
    }

    button {
      padding: 0.25rem 0.25rem;
      line-height: 1rem;
      flex: 0;
      text-align: center;
    }

    a {
      text-align: center;
    }
  }

</style>
