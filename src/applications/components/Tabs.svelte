<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  export let activeTab;
  export let tabs;
</script>


<div>
  <nav class="tabs" data-group="primary">
    {#each tabs.filter(tab => tab.visible) as tab, index (tab.value)}
      <a on:click={() => { activeTab = tab.value}} class="item flexrow" class:active={activeTab === tab.value}
         data-tab="rest">
        {#if tab.icon} <i class="icon {tab.icon}"></i> {/if}
        {localize(tab.label)}
        {#if tab.highlight}
          <div class="blob"><i class="fas fa-exclamation"></i></div>
        {/if}
      </a>
    {/each}
  </nav>
</div>


<style lang="scss">

  .tabs {
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .item {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .icon {
    margin-right: 0.25rem;
  }

  .blob {
    margin-left: 0.5rem;
    color: white;
    display: grid;
    place-items: center;
    width: 0.8rem;
    height: 0.8rem;
    font-size: 0.5rem;
    box-shadow: 0 0 0 0 rgba(217, 49, 49, 1);
    animation: pulse 1s infinite;
    background-color: rgb(217, 49, 49);
    border-radius: 50%;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(217, 49, 49, 0.7);
    }

    70% {
      box-shadow: 0 0 0 10px rgba(217, 49, 49, 0);
    }

    100% {
      box-shadow: 0 0 0 0 rgba(217, 49, 49, 0);
    }
  }

</style>