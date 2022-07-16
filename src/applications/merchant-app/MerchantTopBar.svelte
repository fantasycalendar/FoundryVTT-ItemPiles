<script>

  export let store;

  const pileDataStore = store.pileData;
  const merchantName = store.name;

  let openTimeText = "";

  $: {
    let open = $pileDataStore.openTimes.open;
    let close = $pileDataStore.openTimes.close;
    let openText = `${open.hour.toString().padStart(2, "0")}:${open.minute.toString().padStart(2, "0")}`;
    let closeText = `${close.hour.toString().padStart(2, "0")}:${close.minute.toString().padStart(2, "0")}`;
    openTimeText = `${openText} - ${closeText}`;
  }

</script>

<div class="flexrow merchant-top-bar item-piles-bottom-divider">
  <div class="merchant-name">{$merchantName}</div>
  {#if $pileDataStore.openTimes.enabled}
    <div class="opening-hours flexcol">
      <span>Opening hours</span>
      <span style="font-style: italic;">{openTimeText}</span>
    </div>
  {/if}
</div>

<style lang="scss">

  .merchant-top-bar {

    flex: 0 1 auto;

    .opening-hours {
      text-align: right;
      flex: 0 1 auto;
    }

    .merchant-name {
      font-size: 2em;
    }

  }

</style>