<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { getContext } from 'svelte';
  import editors from "../editors/index.js";

  const { application } = getContext('external');

  export let data;
  let editor = editors[data.application];

  function showEditor() {
    if (editor) {
      editor.show();
      application.options.zLevel = 100;
    }
  }

</script>

<div class="setting form-scope flexrow">

  <div class="label-side">
    <label>{localize(data.name)} <a><i title="Reset data" class="fas fa-undo reset-setting"
                                       on:click={() => { data.value = data.default; }}></i></a></label>
    <p class="notes">{localize(data.hint)}</p>
  </div>

  <div class="form-fields input-side">
    <div class="button-container">
      <button type="button" on:click={showEditor}>
        <i class="{data.icon}"></i>
        {localize(data.label)}
      </button>
    </div>
  </div>

</div>


<style lang="scss">

  .setting:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }

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
  }

  .setting-container {
    display: flex;
    flex-direction: column;
  }

  .label-side {
    flex: 1;
    margin-right: 1rem;
  }

  .button-container {
    min-width: 220px;
    max-width: 220px;
    height: 100%;
    display: flex;
    align-items: center;
  }

  button {
    flex: 1;
  }

</style>