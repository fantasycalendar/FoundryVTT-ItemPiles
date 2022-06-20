<script>
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  export let activeTab;
  export let tabs;

</script>

<nav class="tabs" data-group="primary">
  {#each tabs.filter(tab => !tab.hidden) as tab, index (tab.value)}
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

</style>