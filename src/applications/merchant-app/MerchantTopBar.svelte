<script>

	import { localize } from "#runtime/svelte/helper";

	export let store;

	const pileDataStore = store.pileData;
	const merchantName = store.name;
	const closed = store.closed;

	let openTimeText = "";

	const aboutTimeEnabled = game.modules.get('foundryvtt-simple-calendar')?.active || false;

	$: open = $pileDataStore.openTimes.enabled ? $pileDataStore.openTimes?.open : false;
	$: close = $pileDataStore.openTimes.enabled ? $pileDataStore.openTimes?.close : false;

	$: {
		if ($pileDataStore.openTimes.enabled) {
			let openText = `${open.hour.toString().padStart(2, "0")}:${open.minute.toString().padStart(2, "0")}`;
			let closeText = `${close.hour.toString().padStart(2, "0")}:${close.minute.toString().padStart(2, "0")}`;
			openTimeText = `${openText} - ${closeText}`;
		}
	}

</script>

<div class="item-piles-flexrow merchant-top-bar item-piles-bottom-divider">
	<div class="merchant-name">{$merchantName}</div>
	<div class="opening-hours item-piles-flexcol">
		{#if $pileDataStore.openTimes.enabled}
      <span>
        {localize("ITEM-PILES.Merchant.OpenTimes")}
      </span>
			<span style="font-style: italic;">
        {#if game.user.isGM}
          {#if aboutTimeEnabled && $pileDataStore.openTimes.status !== "auto"}
          <a class="item-piles-right-divider" on:click={() => { store.setOpenStatus("auto"); }}>
            <i class="fas fa-clock"></i>
	          {localize(`ITEM-PILES.Merchant.OpenCloseAuto`)}
          </a>
          {/if}
	        <a class="item-piles-right-divider" on:click={() => { store.setOpenStatus($closed ? "open" : "closed"); }}>
            <i class="fas" class:fa-door-open={!$closed} class:fa-door-closed={$closed}></i>
		        {localize(`ITEM-PILES.Merchant.${!$closed ? "Open" : "Closed"}`)}
          </a>
        {/if}
				{openTimeText}
      </span>
		{:else if game.user.isGM}
			<a style="flex:0;" on:click={() => { store.setOpenStatus($closed ? "open" : "closed"); }}>
				<i class="fas" class:fa-door-open={!$closed} class:fa-door-closed={$closed}></i>
				{localize(`ITEM-PILES.Merchant.${!$closed ? "Open" : "Closed"}`)}
			</a>
		{/if}
	</div>
</div>

<style lang="scss">

  .merchant-top-bar {

    flex: 0 1 auto;

    .opening-hours {
      text-align: right;
      flex: 0 1 auto;
      justify-content: center;

      .item-piles-right-divider {
        margin-right: 0.25rem;
        padding-right: 0.5rem;
        border-right: 1px solid rgba(0, 0, 0, 0.5);
      }
    }

    .merchant-name {
      font-size: 2em;
    }

  }

</style>
