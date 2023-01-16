<script>

  import { get, writable } from "svelte/store";
  import { getContext } from "svelte";
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";

  const { application } = getContext('external');

  export let styles;
  export let elementRoot;

  let form;

  const options = application.options;

  const styleValues = styles?.subscribe ? styles : writable(styles);

  const styleStore = Object.entries(get(styleValues));
  let values = writable(styleStore.length ? styleStore : [["", ""]])

  function add() {
    values.update(arr => {
      return [...arr, ["", ""]];
    })
  }

  function remove(index) {
    values.update(arr => {
      arr.splice(index, 1);
      return arr;
    })
  }

  $: {
    const data = Object.fromEntries($values
      .map(entry => [entry[0].trim(), entry[1].trim()])
      .filter(entry => entry[0].length && entry[1].length)
    );
    styleValues.set(data);
    if (options.onchange) {
      options.onchange(data);
    }
  }

  async function updateSettings() {
    application.options.resolve(Object.fromEntries(get(values)));
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>

    <div style="display: grid; grid-template-columns: 1.25fr 2fr {options.readOnly ? '' : 'auto'}; gap: 5px;"
         class="item-piles-bottom-divider">
      <span>{localize("ITEM-PILES.Applications.StylesEditor." + (options.variables ? "Variable" : "Style"))}</span>
      <span>{localize("ITEM-PILES.Applications.StylesEditor.Value")}</span>
      {#if !options.readOnly}
        <a class="item-piles-flexrow align-center-row item-piles-clickable-green" style="text-align: center;"
           on:click={() => add()}>
          <i class="fas fa-plus"></i>
        </a>
      {/if}

      {#each $values as [key, value], index (index)}
        <input autocomplete="false" type="text" bind:value={key}/>
        <input autocomplete="false" type="text" bind:value={value}/>
        {#if !options.readOnly}
          <a class="item-piles-flexrow align-center-row" style="text-align: center;" on:click={() => remove(index)}>
            <i class="fas fa-times item-piles-clickable-red"></i>
          </a>
        {/if}
      {/each}

    </div>

    <footer>
      <button type="button" on:click|once={requestSubmit}>
        <i class="far fa-save"></i> {localize("Save")}
      </button>
      <button type="button" on:click|once={() => { application.options.resolve(null); application.close(); }}>
        <i class="far fa-times"></i> { localize("Cancel") }
      </button>
    </footer>

  </form>

</ApplicationShell>
