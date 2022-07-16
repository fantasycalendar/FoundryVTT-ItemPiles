<script>

  import Tabs from "../components/Tabs.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import SliderInput from "../components/SliderInput.svelte";

  export let store;

  const merchantImg = store.img;
  const pileDataStore = store.pileData;

  let activeSidebarTab = "description";

</script>

<div class="merchant-left-pane item-piles-flexcol">

  <div class="merchant-img">
    <img src="{ $merchantImg }">
  </div>

  <div class="item-piles-flexcol item-piles-top-divider">

    <Tabs style="flex: 0 1 auto;" tabs="{[
      { value: 'description', label: 'Description' },
      { value: 'settings', label: 'Settings', hidden: !game.user.isGM },
    ]}" bind:activeTab={activeSidebarTab}/>

    <section class="tab-body item-piles-sections">

      {#if activeSidebarTab === 'description'}
        <div class="tab merchant-description">
          <div>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip
            ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore
            eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            deserunt mollit anim id est laborum.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip
            ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore
            eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            deserunt mollit anim id est laborum.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip
            ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore
            eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            deserunt mollit anim id est laborum.
          </div>
        </div>
      {/if}

      {#if activeSidebarTab === 'settings'}
        <div class="tab merchant-settings">
          <div class="setting-container">

            <div class="form-group slider-group">
              <label style="flex:3;">
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.BuyPriceModifier")}<br>
              </label>
              <SliderInput style="flex:4;" bind:value={$pileDataStore.buyPriceModifier}/>
            </div>

            <div class="form-group slider-group">
              <label style="flex:3;">
                {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}<br>
              </label>
              <SliderInput style="flex:4;" bind:value={$pileDataStore.sellPriceModifier}/>
            </div>

          </div>

          <button type="button" class="update-button" on:click={() => { store.update(); }}>
            <i class="fas fa-download"></i> Update
          </button>
        </div>
      {/if}

    </section>

  </div>

</div>

<style lang="scss">

  .merchant-left-pane {

    flex: 0 1 35%;
    padding-right: 0.25rem;
    margin-right: 0.25rem;
    border-right: 1px solid rgba(0, 0, 0, 0.5);
    max-height: 100%;
    max-width: 300px;
    min-width: 250px;
    overflow-y: hidden;

    section {
      padding: 0.25rem;
    }

    .merchant-img {
      flex: 0 1 auto;
      border-radius: 5px;
      margin-bottom: 5px;

      img {
        width: 100%;
        height: auto;
        border: 0;
        border-radius: 3px;
      }
    }

    .merchant-description {
      position: relative;
      height: 100%;
      padding: 0.25rem;

      div {
        overflow: hidden auto;
        top: 0;
        bottom: 0;
        position: absolute;
        word-break: break-word;
      }
    }

    .merchant-settings {
      position: relative;
      height: 100%;

      .setting-container {
        overflow: hidden auto;
        top: 0;
        bottom: 37px;
        position: absolute;
      }

      .update-button {
        position: absolute;
        bottom: 0;
      }

    }

  }

</style>