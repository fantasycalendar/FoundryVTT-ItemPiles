<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as Helpers from "../../../helpers/helpers.js"

  const { application } = getContext('external');

  let form;

  export let elementRoot;
  export let vaultStyles;

  loadImages();

  function add() {
    vaultStyles = [...vaultStyles, { path: "", value: "", styles: {} }];
    vaultStyles = vaultStyles;
  }

  let images = [];

  async function loadImages() {
    const data = await FilePicker.browse("public", "icons/weapons/swords/*.webp", { wildcard: true });
    images = data.files;
  }

  function remove(index) {
    vaultStyles.splice(index, 1)
    vaultStyles = vaultStyles;
  }

  async function updateSettings() {
    application.options.resolve(vaultStyles);
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }


</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>
    <p>{localize("ITEM-PILES.Applications.VaultStylesEditor.Explanation")}</p>

    <div class="item-piles-table">
      <div>{localize("ITEM-PILES.Applications.VaultStylesEditor.Path")}</div>
      <div>{localize("ITEM-PILES.Applications.VaultStylesEditor.Value")}</div>
      <div></div>
      <div></div>
      <div style="text-align: right;"><a on:click={add} class="item-piles-clickable"><i class="fas fa-plus"></i></a>
      </div>

      {#each vaultStyles as style, index (index)}
        <div><input type="text" required placeholder="system.rarity" bind:value="{style.path}"/></div>
        <div><input type="text" required placeholder="rare" bind:value="{style.value}"/></div>
        <div>
          {#if images[index]}
            <img class="item-piles-item-image-example" src={images[index]}/>
          {/if}
          <div class="img-div" style={Helpers.styleFromObject(style.styling)}></div>
        </div>
        <div>
          <button type="button">
            <i class="fas fa-cog"></i>
          </button>
        </div>
        <div>
          <button type="button" on:click={remove(index)}><i class="fas fa-times"></i></button>
        </div>
      {/each}
    </div>

    <footer>
      <button type="button" on:click|once={requestSubmit}>
        <i class="far fa-save"></i> {localize("Save")}
      </button>
      <button type="button" on:click|once={() => { application.close(); }}>
        <i class="far fa-times"></i> { localize("Cancel") }
      </button>
    </footer>

  </form>
</ApplicationShell>


<style lang="scss">

  .item-piles-table {
    display: grid;
    grid-template-columns: 1fr 1fr 26px 26px 26px;
    padding: 3px;
    gap: 3px;

    div {
      display: flex;
      align-items: center;
      position: relative;

      img, .img-div {
        position: absolute;
        border-radius: 4px;
        min-height: 24px;
        min-width: 24px;
        max-height: 24px;
        max-width: 24px;
      }

      button {
        min-height: 26px;
        max-height: 26px;
        min-width: 26px;
        max-width: 26px;
        padding: 0;
        line-height: inherit;
        text-align: center;

        > i {
          line-height: inherit;
          margin: 0;
        }
      }
    }
  }

</style>
