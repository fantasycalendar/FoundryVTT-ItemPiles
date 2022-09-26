<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { getContext } from "svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { TJSProseMirror } from '@typhonjs-fvtt/svelte-standard/component';
  import { get, writable } from "svelte/store";

  const { application } = getContext('external');

  export let text;
  export let elementRoot;

  const originalText = text;

  let form;

  function requestSubmit() {
    form.requestSubmit();
  }

  function submit() {
    application.options.resolve(text);
    application.close();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <form class="item-piles-flexcol" bind:this={form} on:submit|once|preventDefault={submit} style="padding:0.5rem;"
        autocomplete="off">

    <TJSProseMirror
      bind:content={text}
    />

    <footer class="sheet-footer item-piles-flexrow" style="margin-top: 1rem; flex: 0;">
      <button type="button" disabled={originalText === text} on:click|once={requestSubmit}>
        <i class="fas fa-download"></i>
        {localize("Submit")}
      </button>
      <button type="button" on:click={() => { application.close() }}>
        <i class="fas fa-times"></i>
        {localize("Cancel")}
      </button>
    </footer>

  </form>

</ApplicationShell>