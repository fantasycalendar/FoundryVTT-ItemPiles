<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import { TJSDialog } from "@typhonjs-fvtt/runtime/_dist/svelte/application/index.js";
  import CustomDialog from "../../components/CustomDialog.svelte";
  import * as SharingUtilities from "../../../helpers/sharing-utilities.js";

  export let pileData;
  export let pileActor;

  async function resetSharingData() {
    const doThing = await TJSDialog.confirm({
      id: `sharing-dialog-item-pile-config-${pileActor.id}`,
      title: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
      content: {
        class: CustomDialog,
        props: {
          header: "Item Piles - " + game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Title"),
          content: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Content")
        },
      },
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSharingData.Confirm"),
        }
      },
      modal: true
    });
    if (!doThing) return;
    return SharingUtilities.clearItemPileSharingData(pileActor);
  }

</script>

<details class="item-piles-collapsible item-piles-clickable">

  <summary>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.Title")}</summary>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabled")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareItemsEnabledExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.shareItemsEnabled}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabled")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ShareCurrenciesEnabledExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.shareCurrenciesEnabled}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabled")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.TakeAllEnabledExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.takeAllEnabled}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabled")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.SplitAllEnabledExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.splitAllEnabled}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayers")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.InactivePlayersExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.activePlayers}/>
  </div>

  <div class="form-group">
    <label style="flex:4;">
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingDataExplanation")}</p>
    </label>
  </div>

  <div class="form-group">
    <button type="button" class="item-piles-config-reset-sharing-data" style="flex:4;"
            on:click={() => { resetSharingData() }}>
      {localize("ITEM-PILES.Applications.ItemPileConfig.Sharing.ResetSharingData")}
    </button>
  </div>

</details>
